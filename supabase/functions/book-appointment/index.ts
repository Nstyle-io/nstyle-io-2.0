import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const bookingData: BookingRequest = await req.json();

    // Validate service exists and get pricing
    const { data: service, error: serviceError } = await supabase
      .from("services")
      .select("price_cents, duration_minutes, salon_id")
      .eq("id", bookingData.service_id)
      .eq("is_active", true)
      .single();

    if (serviceError || !service) {
      return new Response(
        JSON.stringify({ error: "Service not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // TODO: Send confirmation email/SMS
    // This would be handled by the send-notification function

    return new Response(JSON.stringify({ appointment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});