import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Read payment_mode from settings
    const { data: settings } = await supabaseAdmin.from("settings").select("payment_mode").limit(1).single();
    const paymentMode = settings?.payment_mode || "test";

    const stripeKey = paymentMode === "live"
      ? Deno.env.get("STRIPE_LIVE_SECRET_KEY")
      : Deno.env.get("STRIPE_TEST_SECRET_KEY");

    if (!stripeKey) throw new Error(`Stripe ${paymentMode} secret key not configured`);

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // If webhook secret is configured, verify signature
    const webhookSecret = paymentMode === "live"
      ? Deno.env.get("STRIPE_LIVE_WEBHOOK_SECRET")
      : Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log(`Received Stripe event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (customerEmail) {
        // Match user by email in profiles
        const { error } = await supabaseAdmin
          .from("profiles")
          .update({
            payment_status: "paid",
            plan_status: "onboarding",
            stripe_payment_id: session.payment_intent as string,
          })
          .eq("email", customerEmail);

        if (error) {
          console.error("Error updating profile:", error);
          throw new Error(`Failed to update profile: ${error.message}`);
        }

        console.log(`Payment completed for ${customerEmail}`);
      } else {
        console.warn("No customer email in session");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
