import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
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

    const url = new URL(req.url);
    const salonId = url.searchParams.get("salon_id");
    const date = url.searchParams.get("date");
    const serviceId = url.searchParams.get("service_id");

    if (!salonId || !date) {
      return new Response(
        JSON.stringify({ error: "Salon ID and date are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get salon business hours
    const { data: salon, error: salonError } = await supabase
      .from("salon_profiles")
      .select("business_hours")
      .eq("id", salonId)
      .single();

    if (salonError || !salon) {
      return new Response(
        JSON.stringify({ error: "Salon not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get service duration if specified
    let serviceDuration = 60; // Default 1 hour
    if (serviceId) {
      const { data: service } = await supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", serviceId)
        .single();
      
      if (service) {
        serviceDuration = service.duration_minutes;
      }
    }

    // Get existing appointments for the date
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select("start_time, end_time")
      .eq("salon_id", salonId)
      .eq("appointment_date", date)
      .eq("status", "scheduled");

    if (appointmentsError) throw appointmentsError;

    // Generate time slots based on business hours
    const dayOfWeek = new Date(date).toLocaleLowerCase('en-US', { weekday: 'long' });
    const businessHours = salon.business_hours || {};
    const dayHours = businessHours[dayOfWeek];

    if (!dayHours || !dayHours.open) {
      return new Response(JSON.stringify({ 
        available_slots: [],
        message: "Salon is closed on this day"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openTime = dayHours.open;
    const closeTime = dayHours.close;
    const timeSlots: TimeSlot[] = [];

    // Generate 30-minute intervals
    let currentTime = openTime;
    while (currentTime < closeTime) {
      const endTime = addMinutes(currentTime, serviceDuration);
      
      if (endTime <= closeTime) {
        const isAvailable = !appointments.some(apt => 
          (currentTime >= apt.start_time && currentTime < apt.end_time) ||
          (endTime > apt.start_time && endTime <= apt.end_time) ||
          (currentTime <= apt.start_time && endTime >= apt.end_time)
        );

        timeSlots.push({
          start_time: currentTime,
          end_time: endTime,
          available: isAvailable
        });
      }
      
      currentTime = addMinutes(currentTime, 30); // 30-minute intervals
    }

    console.log(`Availability check completed for salon ${salonId} on ${date}`);

    return new Response(JSON.stringify({ 
      available_slots: timeSlots,
      salon_id: salonId,
      date,
      service_duration_minutes: serviceDuration
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting availability:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}