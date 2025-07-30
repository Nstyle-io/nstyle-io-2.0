import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StaffRequest {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
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

    if (method === "GET") {
      // Get all staff members
      const { data: staff, error: staffError } = await supabase
        .from("staff")
        .select("*")
        .eq("salon_id", salon.id)
        .order("name", { ascending: true });

      if (staffError) throw staffError;

      return new Response(JSON.stringify({ staff }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "POST") {
      // Create new staff member
      const staffData: StaffRequest = await req.json();
      
      const { data: newStaff, error: createError } = await supabase
        .from("staff")
        .insert({
          ...staffData,
          salon_id: salon.id,
        })
        .select()
        .single();

      if (createError) throw createError;

      console.log("Staff member created successfully:", newStaff.id);
      return new Response(JSON.stringify({ staff: newStaff }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "PUT") {
      // Update staff member
      const staffId = url.searchParams.get("id");
      if (!staffId) {
        return new Response(
          JSON.stringify({ error: "Staff ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const staffData: Partial<StaffRequest> = await req.json();
      
      const { data: updatedStaff, error: updateError } = await supabase
        .from("staff")
        .update(staffData)
        .eq("id", staffId)
        .eq("salon_id", salon.id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log("Staff member updated successfully:", staffId);
      return new Response(JSON.stringify({ staff: updatedStaff }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE") {
      // Delete staff member
      const staffId = url.searchParams.get("id");
      if (!staffId) {
        return new Response(
          JSON.stringify({ error: "Staff ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } = await supabase
        .from("staff")
        .delete()
        .eq("id", staffId)
        .eq("salon_id", salon.id);

      if (deleteError) throw deleteError;

      console.log("Staff member deleted successfully:", staffId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error managing staff:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});