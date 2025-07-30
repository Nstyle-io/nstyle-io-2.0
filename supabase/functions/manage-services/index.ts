import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServiceRequest {
  name: string;
  description?: string;
  price_cents: number;
  duration_minutes: number;
  category?: string;
  is_active?: boolean;
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

    // Get user's salon
    const { data: salon, error: salonError } = await supabase
      .from("salon_profiles")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (salonError || !salon) {
      return new Response(
        JSON.stringify({ error: "Salon not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    if (method === "POST") {
      // Create new service
      const serviceData: ServiceRequest = await req.json();
      
      const { data: service, error: createError } = await supabase
        .from("services")
        .insert({
          ...serviceData,
          salon_id: salon.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log("Service created successfully:", service.id);
      return new Response(JSON.stringify({ service }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "PUT") {
      // Update service
      const serviceId = url.searchParams.get("id");
      if (!serviceId) {
        return new Response(
          JSON.stringify({ error: "Service ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const serviceData: Partial<ServiceRequest> = await req.json();
      
      const { data: service, error: updateError } = await supabase
        .from("services")
        .update(serviceData)
        .eq("id", serviceId)
        .eq("salon_id", salon.id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log("Service updated successfully:", serviceId);
      return new Response(JSON.stringify({ service }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE") {
      // Delete service
      const serviceId = url.searchParams.get("id");
      if (!serviceId) {
        return new Response(
          JSON.stringify({ error: "Service ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } = await supabase
        .from("services")
        .delete()
        .eq("id", serviceId)
        .eq("salon_id", salon.id);

      if (deleteError) throw deleteError;

      console.log("Service deleted successfully:", serviceId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "GET") {
      // Get salon services
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("salon_id", salon.id)
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (servicesError) throw servicesError;

      return new Response(JSON.stringify({ services }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error managing services:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});