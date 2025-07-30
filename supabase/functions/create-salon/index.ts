import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateSalonRequest {
  salon_name: string;
  business_email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  description?: string;
  website_url?: string;
  instagram_handle?: string;
  facebook_url?: string;
  business_hours?: Record<string, any>;
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

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const salonData: CreateSalonRequest = await req.json();

    // Check if user already has a salon
    const { data: existingSalon } = await supabase
      .from("salon_profiles")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (existingSalon) {
      return new Response(
        JSON.stringify({ error: "User already has a salon profile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new salon
    const { data: salon, error: createError } = await supabase
      .from("salon_profiles")
      .insert({
        ...salonData,
        owner_id: user.id,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    console.log("Salon created successfully:", salon.id);

    return new Response(JSON.stringify({ salon }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating salon:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});