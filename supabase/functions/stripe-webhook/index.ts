import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const { data: settings } = await supabaseAdmin
      .from("settings")
      .select("payment_mode, webhook_secret_test, webhook_secret_live")
      .limit(1)
      .single();

    const paymentMode = settings?.payment_mode || "test";

    const stripeKey = paymentMode === "live"
      ? Deno.env.get("STRIPE_LIVE_SECRET_KEY")
      : Deno.env.get("STRIPE_TEST_SECRET_KEY");
    if (!stripeKey) throw new Error(`Stripe ${paymentMode} secret key not configured`);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    const webhookSecret = paymentMode === "live"
      ? (settings?.webhook_secret_live || Deno.env.get("STRIPE_LIVE_WEBHOOK_SECRET"))
      : (settings?.webhook_secret_test || Deno.env.get("STRIPE_TEST_WEBHOOK_SECRET"));

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(
        body, signature, webhookSecret, undefined,
        Stripe.createSubtleCryptoProvider()
      );
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    console.log(`Received Stripe event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerEmail = session.customer_details?.email || session.customer_email;

      if (customerEmail) {
        const { data: existingProfile } = await supabaseAdmin
          .from("profiles")
          .select("plan_status")
          .eq("email", customerEmail)
          .single();

        const updates: any = {
          payment_status: "paid",
        };

        if (existingProfile?.plan_status !== "plan_ready") {
          updates.plan_status = "plan_pending";
        }

        if (session.mode === "subscription") {
          updates.subscription_status = "active";
          updates.stripe_customer_id = session.customer as string;
          updates.subscription_tier = session.metadata?.tier || "personal";
        } else {
          updates.stripe_payment_id = session.payment_intent as string;
        }

        await supabaseAdmin.from("profiles").update(updates).eq("email", customerEmail);
        console.log(`Checkout completed for ${customerEmail}, mode: ${session.mode}`);
      }
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
      if (customer.email) {
        const isActive = subscription.status === "active" || subscription.status === "trialing";

        await supabaseAdmin.from("profiles").update({
          subscription_status: isActive ? "active" : "inactive",
          subscription_end: isActive ? new Date(subscription.current_period_end * 1000).toISOString() : null,
          payment_status: isActive ? "paid" : "unpaid",
        }).eq("email", customer.email);

        console.log(`Subscription ${subscription.status} for ${customer.email}`);
      }
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const customerEmail = invoice.customer_email;
      if (customerEmail) {
        console.log(`Payment failed for ${customerEmail}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
