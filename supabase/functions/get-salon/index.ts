import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, handleCors } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const url = new URL(req.url);
    const salonId = url.searchParams.get("id");

    if (!salonId) {
      return new Response(
        JSON.stringify({ error: "Salon ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get salon with its services and staff
    const { data: salon, error: salonError } = await supabase
      .from("salon_profiles")
      .select(`
        *,
        services (*),
        staff (*)
      `)
      .eq("id", salonId)
      .eq("is_verified", true)
      .single();

    if (salonError) {
      if (salonError.code === "PGRST116") {
        return new Response(
          JSON.stringify({ error: "Salon not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw salonError;
    }

    console.log("Salon retrieved successfully:", salonId);

    return new Response(JSON.stringify({ salon }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error retrieving salon:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});