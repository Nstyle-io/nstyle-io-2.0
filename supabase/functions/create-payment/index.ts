import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { PaymentValidator, SecurityUtils } from "../_shared/validation.ts";

interface PaymentRequest {
  appointment_id?: string;
  amount_cents: number;
  description: string;
  currency?: string;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Basic rate limiting check for payments
    const clientId = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (SecurityUtils.isRateLimited(clientId, 5, 60000)) { // Stricter rate limit for payments
      SecurityUtils.logSecurityEvent("Payment rate limit exceeded", { clientId }, "high");
      return new Response(
        JSON.stringify({ error: "Too many payment requests" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user (optional for guest payments)
    let user = null;
    let userEmail = "guest@example.com";
    
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      user = userData.user;
      userEmail = user?.email || userEmail;
    }

    // Parse and validate request body
    let rawPaymentData: any;
    try {
      rawPaymentData = await req.json();
    } catch (error) {
      SecurityUtils.logSecurityEvent("Invalid JSON in payment request", { 
        error: error.message, 
        clientId 
      }, "medium");
      return new Response(
        JSON.stringify({ error: "Invalid JSON format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Comprehensive input validation
    const validation = PaymentValidator.validatePaymentRequest(rawPaymentData);
    if (!validation.isValid) {
      SecurityUtils.logSecurityEvent("Payment validation failed", { 
        errors: validation.errors, 
        clientId,
        userId: user?.id 
      }, "high");
      return new Response(
        JSON.stringify({ 
          error: "Payment validation failed", 
          details: validation.errors 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { appointment_id, amount_cents, description, currency }: PaymentRequest = validation.sanitizedValue;

    // Validate Stripe configuration
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      SecurityUtils.logSecurityEvent("Missing Stripe secret key", { clientId }, "critical");
      return new Response(
        JSON.stringify({ error: "Payment system configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Additional validation for appointment_id if provided
    if (appointment_id) {
      const { data: appointment, error: appointmentError } = await supabase
        .from("appointments")
        .select("id, client_id, total_price_cents, status")
        .eq("id", appointment_id)
        .single();

      if (appointmentError || !appointment) {
        SecurityUtils.logSecurityEvent("Invalid appointment_id in payment", { 
          appointmentId: appointment_id, 
          clientId,
          userId: user?.id 
        }, "high");
        return new Response(
          JSON.stringify({ error: "Appointment not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify appointment belongs to user (if authenticated)
      if (user && appointment.client_id && appointment.client_id !== user.id) {
        SecurityUtils.logSecurityEvent("Unauthorized payment attempt", { 
          appointmentId: appointment_id,
          appointmentClientId: appointment.client_id,
          requestUserId: user.id,
          clientId 
        }, "high");
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify amount matches appointment total (allow slight variance for fees)
      if (appointment.total_price_cents && Math.abs(amount_cents - appointment.total_price_cents) > 50) {
        SecurityUtils.logSecurityEvent("Payment amount mismatch", { 
          appointmentId: appointment_id,
          expectedAmount: appointment.total_price_cents,
          requestedAmount: amount_cents,
          clientId,
          userId: user?.id 
        }, "high");
        return new Response(
          JSON.stringify({ error: "Payment amount does not match appointment" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check if Stripe customer exists
    let customerId;
    try {
      const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    } catch (error) {
      SecurityUtils.logSecurityEvent("Stripe customer lookup failed", { 
        error: error.message,
        userEmail,
        clientId 
      }, "medium");
      // Continue without customer ID
    }

    // Validate origin for security
    const origin = req.headers.get("origin");
    const allowedOrigins = [
      Deno.env.get("FRONTEND_URL"),
      "http://localhost:8080",
      "http://localhost:3000",
      "https://nstyle.io"
    ].filter(Boolean);

    if (!origin || !allowedOrigins.some(allowed => origin === allowed)) {
      SecurityUtils.logSecurityEvent("Invalid origin in payment request", { 
        origin,
        allowedOrigins,
        clientId 
      }, "high");
      return new Response(
        JSON.stringify({ error: "Invalid request origin" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create checkout session for one-time payment
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : userEmail,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: { name: description },
              unit_amount: amount_cents,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/payment-canceled`,
        metadata: {
          appointment_id: appointment_id || "",
          user_id: user?.id || "",
          client_id: clientId,
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes expiry
      });
    } catch (error) {
      SecurityUtils.logSecurityEvent("Stripe session creation failed", { 
        error: error.message,
        amount_cents,
        currency,
        clientId,
        userId: user?.id 
      }, "high");
      return new Response(
        JSON.stringify({ error: "Failed to create payment session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Optional: Update appointment with payment session ID
    if (appointment_id && user) {
      await supabase
        .from("appointments")
        .update({ 
          notes: `Payment session: ${session.id}`,
          updated_at: new Date().toISOString() 
        })
        .eq("id", appointment_id)
        .eq("client_id", user.id);
    }

    console.log("Payment session created successfully:", session.id);
    SecurityUtils.logSecurityEvent("Payment session created", { 
      sessionId: session.id,
      appointmentId: appointment_id,
      amount_cents,
      currency,
      clientId,
      userId: user?.id 
    }, "low");

    return new Response(JSON.stringify({ 
      url: session.url,
      session_id: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    
    const clientId = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    SecurityUtils.logSecurityEvent("Payment creation error", { 
      error: error.message,
      stack: error.stack,
      clientId 
    }, "high");
    
    return new Response(
      JSON.stringify({ error: "Payment processing error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});