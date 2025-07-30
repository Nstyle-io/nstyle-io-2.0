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
    const query = url.searchParams.get("q") || "";
    const city = url.searchParams.get("city");
    const state = url.searchParams.get("state");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let salonQuery = supabase
      .from("salon_profiles")
      .select(`
        *,
        services (
          id,
          name,
          price_cents,
          duration_minutes,
          category
        )
      `)
      .eq("is_verified", true);

    // Add search filters
    if (query) {
      salonQuery = salonQuery.or(`salon_name.ilike.%${query}%,description.ilike.%${query}%`);
    }

    if (city) {
      salonQuery = salonQuery.eq("city", city);
    }

    if (state) {
      salonQuery = salonQuery.eq("state", state);
    }

    const { data: salons, error: salonsError } = await salonQuery
      .order("salon_name", { ascending: true })
      .range(offset, offset + limit - 1);

    if (salonsError) throw salonsError;

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("salon_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_verified", true);

    if (countError) throw countError;

    console.log(`Search completed: ${salons.length} salons found`);

    return new Response(JSON.stringify({ 
      salons,
      total: count,
      offset,
      limit
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error searching salons:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});