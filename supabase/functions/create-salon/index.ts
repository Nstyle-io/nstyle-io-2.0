import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { SalonValidator, SecurityUtils } from "../_shared/validation.ts";

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
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Basic rate limiting check
    const clientId = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (SecurityUtils.isRateLimited(clientId, 3, 300000)) { // Very strict rate limit for salon creation (3 per 5 minutes)
      SecurityUtils.logSecurityEvent("Salon creation rate limit exceeded", { clientId }, "high");
      return new Response(
        JSON.stringify({ error: "Too many salon creation requests" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user - REQUIRED for salon creation
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      SecurityUtils.logSecurityEvent("Unauthorized salon creation attempt - no auth header", { clientId }, "medium");
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      SecurityUtils.logSecurityEvent("Unauthorized salon creation attempt - invalid token", { 
        authError: authError?.message,
        clientId 
      }, "medium");
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse and validate request body
    let rawSalonData: any;
    try {
      rawSalonData = await req.json();
    } catch (error) {
      SecurityUtils.logSecurityEvent("Invalid JSON in salon creation request", { 
        error: error.message, 
        clientId,
        userId: user.id 
      }, "medium");
      return new Response(
        JSON.stringify({ error: "Invalid JSON format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Comprehensive input validation
    const validation = SalonValidator.validateCreateSalonRequest(rawSalonData);
    if (!validation.isValid) {
      SecurityUtils.logSecurityEvent("Salon validation failed", { 
        errors: validation.errors, 
        clientId,
        userId: user.id 
      }, "medium");
      return new Response(
        JSON.stringify({ 
          error: "Validation failed", 
          details: validation.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const salonData: CreateSalonRequest = validation.sanitizedValue;

    // Check if user already has a salon
    const { data: existingSalon } = await supabase
      .from("salon_profiles")
      .select("id, salon_name")
      .eq("owner_id", user.id)
      .single();

    if (existingSalon) {
      SecurityUtils.logSecurityEvent("Duplicate salon creation attempt", { 
        userId: user.id,
        existingSalonId: existingSalon.id,
        existingSalonName: existingSalon.salon_name,
        requestedSalonName: salonData.salon_name,
        clientId 
      }, "medium");
      return new Response(
        JSON.stringify({ error: "User already has a salon profile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate salon name (business rule)
    const { data: salonNameCheck } = await supabase
      .from("salon_profiles")
      .select("id, salon_name")
      .ilike("salon_name", salonData.salon_name)
      .limit(1);

    if (salonNameCheck && salonNameCheck.length > 0) {
      SecurityUtils.logSecurityEvent("Duplicate salon name attempt", { 
        requestedName: salonData.salon_name,
        existingId: salonNameCheck[0].id,
        userId: user.id,
        clientId 
      }, "low");
      return new Response(
        JSON.stringify({ error: "A salon with this name already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create new salon with sanitized data
    const salonInsertData = {
      ...salonData,
      owner_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: salon, error: createError } = await supabase
      .from("salon_profiles")
      .insert(salonInsertData)
      .select()
      .single();

    if (createError) {
      SecurityUtils.logSecurityEvent("Salon creation database error", { 
        error: createError.message,
        userId: user.id,
        salonName: salonData.salon_name,
        clientId 
      }, "high");
      throw createError;
    }

    console.log("Salon created successfully:", salon.id);
    SecurityUtils.logSecurityEvent("Salon created successfully", { 
      salonId: salon.id,
      salonName: salon.salon_name,
      userId: user.id,
      clientId 
    }, "low");

    return new Response(JSON.stringify({ salon }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating salon:", error);
    
    const clientId = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    SecurityUtils.logSecurityEvent("Salon creation error", { 
      error: error.message,
      stack: error.stack,
      clientId 
    }, "high");
    
    return new Response(
      JSON.stringify({ error: "Salon creation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});