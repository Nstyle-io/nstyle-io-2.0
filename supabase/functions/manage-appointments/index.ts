import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const url = new URL(req.url);
    const method = req.method;

    if (method === "GET") {
      // Get appointments for salon owner or client
      const role = url.searchParams.get("role") || "client";
      const startDate = url.searchParams.get("start_date");
      const endDate = url.searchParams.get("end_date");

      let query = supabase
        .from("appointments")
        .select(`
          *,
          services (name, duration_minutes, price_cents),
          salon_profiles (salon_name, phone, address)
        `);

      if (role === "salon") {
        // Get salon owner's appointments
        const { data: salon } = await supabase
          .from("salon_profiles")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!salon) {
          return new Response(
            JSON.stringify({ error: "Salon not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        query = query.eq("salon_id", salon.id);
      } else {
        // Get client's appointments
        query = query.eq("client_id", user.id);
      }

      if (startDate) query = query.gte("appointment_date", startDate);
      if (endDate) query = query.lte("appointment_date", endDate);

      const { data: appointments, error } = await query
        .order("appointment_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) throw error;

      return new Response(JSON.stringify({ appointments }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "PUT") {
      // Update appointment status
      const appointmentId = url.searchParams.get("id");
      const { status, notes } = await req.json();

      if (!appointmentId) {
        return new Response(
          JSON.stringify({ error: "Appointment ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user can modify this appointment
      const { data: appointment, error: checkError } = await supabase
        .from("appointments")
        .select("client_id, salon_id, salon_profiles!inner(owner_id)")
        .eq("id", appointmentId)
        .single();

      if (checkError || !appointment) {
        return new Response(
          JSON.stringify({ error: "Appointment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const canModify = appointment.client_id === user.id || 
                       appointment.salon_profiles.owner_id === user.id;

      if (!canModify) {
        return new Response(
          JSON.stringify({ error: "Unauthorized to modify this appointment" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: updatedAppointment, error: updateError } = await supabase
        .from("appointments")
        .update({ status, notes, updated_at: new Date().toISOString() })
        .eq("id", appointmentId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log("Appointment updated successfully:", appointmentId);

      return new Response(JSON.stringify({ appointment: updatedAppointment }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE") {
      // Cancel appointment
      const appointmentId = url.searchParams.get("id");

      if (!appointmentId) {
        return new Response(
          JSON.stringify({ error: "Appointment ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user can cancel this appointment
      const { data: appointment, error: checkError } = await supabase
        .from("appointments")
        .select("client_id, salon_id, salon_profiles!inner(owner_id)")
        .eq("id", appointmentId)
        .single();

      if (checkError || !appointment) {
        return new Response(
          JSON.stringify({ error: "Appointment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const canCancel = appointment.client_id === user.id || 
                       appointment.salon_profiles.owner_id === user.id;

      if (!canCancel) {
        return new Response(
          JSON.stringify({ error: "Unauthorized to cancel this appointment" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabase
        .from("appointments")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", appointmentId);

      if (updateError) throw updateError;

      console.log("Appointment cancelled successfully:", appointmentId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error managing appointments:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});