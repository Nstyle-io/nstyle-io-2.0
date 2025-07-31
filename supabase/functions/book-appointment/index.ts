import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { BookingValidator, SecurityUtils } from "../_shared/validation.ts";

interface BookingRequest {
  salon_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  notes?: string;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Basic rate limiting check
    const clientId = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (SecurityUtils.isRateLimited(clientId, 10, 60000)) {
      SecurityUtils.logSecurityEvent("Rate limit exceeded", { clientId }, "medium");
      return new Response(
        JSON.stringify({ error: "Too many requests" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user (optional for guest bookings)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      user = userData.user;
    }

    // Parse and validate request body
    let rawBookingData: any;
    try {
      rawBookingData = await req.json();
    } catch (error) {
      SecurityUtils.logSecurityEvent("Invalid JSON in booking request", { error: error.message, clientId }, "low");
      return new Response(
        JSON.stringify({ error: "Invalid JSON format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Comprehensive input validation
    const validation = BookingValidator.validateBookingRequest(rawBookingData);
    if (!validation.isValid) {
      SecurityUtils.logSecurityEvent("Booking validation failed", { 
        errors: validation.errors, 
        clientId,
        userId: user?.id 
      }, "medium");
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validation.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bookingData: BookingRequest = validation.sanitizedValue;

    // Validate service exists and get pricing
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("price_cents, duration_minutes, salon_id")
      .eq("id", bookingData.service_id)
      .eq("is_active", true)
      .single();

    if (serviceError || !service) {
      SecurityUtils.logSecurityEvent("Invalid service_id in booking", { 
        serviceId: bookingData.service_id, 
        clientId,
        userId: user?.id 
      }, "medium");
      return new Response(
        JSON.stringify({ error: "Service not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify service belongs to the specified salon
    if (service.salon_id !== bookingData.salon_id) {
      SecurityUtils.logSecurityEvent("Service/salon mismatch in booking", { 
        serviceId: bookingData.service_id,
        serviceSalonId: service.salon_id,
        requestedSalonId: bookingData.salon_id,
        clientId,
        userId: user?.id 
      }, "high");
      return new Response(
        JSON.stringify({ error: "Service not available at this salon" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for time slot conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("salon_id", bookingData.salon_id)
      .eq("appointment_date", bookingData.appointment_date)
      .eq("status", "scheduled")
      .or(`start_time.lte.${bookingData.start_time},end_time.gte.${bookingData.end_time}`)
      .or(`start_time.gte.${bookingData.start_time},start_time.lt.${bookingData.end_time}`);

    if (conflictError) throw conflictError;

    if (conflicts && conflicts.length > 0) {
      SecurityUtils.logSecurityEvent("Booking conflict detected", { 
        salonId: bookingData.salon_id,
        appointmentDate: bookingData.appointment_date,
        startTime: bookingData.start_time,
        endTime: bookingData.end_time,
        conflictCount: conflicts.length,
        clientId,
        userId: user?.id 
      }, "low");
      return new Response(
        JSON.stringify({ error: "Time slot not available" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create appointment
    const appointmentData = {
      ...bookingData,
      client_id: user?.id || null,
      total_price_cents: service.price_cents,
      status: "scheduled"
    };

    const { data: appointment, error: createError } = await supabase
      .from("appointments")
      .insert(appointmentData)
      .select(`
        *,
        services (*),
        salon_profiles (salon_name, phone, address)
      `)
      .single();

    if (createError) throw createError;

    console.log("Appointment booked successfully:", appointment.id);
    SecurityUtils.logSecurityEvent("Appointment booked successfully", { 
      appointmentId: appointment.id,
      salonId: bookingData.salon_id,
      serviceId: bookingData.service_id,
      clientId,
      userId: user?.id 
    }, "low");

    // TODO: Send confirmation email/SMS
    // This would be handled by the send-notification function

    return new Response(JSON.stringify({ appointment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    
    const clientId = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    SecurityUtils.logSecurityEvent("Booking appointment error", { 
      error: error.message,
      stack: error.stack,
      clientId 
    }, "high");
    
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});