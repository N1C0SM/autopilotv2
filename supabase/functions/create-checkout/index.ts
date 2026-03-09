import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LIVE_PRICE_ID = "price_1T8o5WJttvYKlxWaKGiSG26L";
const TEST_PRICE_ID = "price_1T8xazJttvYKlxWaK8EfKELu";
const REFERRAL_COUPON_ID = "veaugRi2";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    let referralCode = "";
    try {
      const body = await req.json();
      referralCode = body.referral_code || "";
    } catch { /* no body */ }

    // Get payment mode
    const { data: settings } = await supabaseClient.from("settings").select("payment_mode").limit(1).single();
    const paymentMode = settings?.payment_mode || "test";

    const stripeKey = paymentMode === "live"
      ? Deno.env.get("STRIPE_LIVE_SECRET_KEY")
      : Deno.env.get("STRIPE_TEST_SECRET_KEY");
    if (!stripeKey) throw new Error(`Stripe ${paymentMode} secret key not configured`);

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://autopilotv2.lovable.app";

    const discounts: Array<{ coupon: string }> = [];
    if (referralCode) {
      const { data: referrerProfile } = await supabaseClient
        .from("profiles")
        .select("user_id")
        .eq("referral_code", referralCode)
        .single();

      if (referrerProfile && referrerProfile.user_id !== user.id) {
        discounts.push({ coupon: REFERRAL_COUPON_ID });
        await supabaseClient.from("referrals").insert({
          referrer_user_id: referrerProfile.user_id,
          referral_code: referralCode,
          referred_email: user.email,
          referred_user_id: user.id,
          status: "completed",
        });
      }
    }

    const priceId = paymentMode === "live" ? LIVE_PRICE_ID : TEST_PRICE_ID;

    const sessionParams: any = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${origin}/payment-success`,
      cancel_url: `${origin}/signup`,
      metadata: { user_id: user.id, tier: "personal" },
      subscription_data: {
        trial_period_days: 7,
        metadata: { user_id: user.id, tier: "personal" },
      },
    };

    if (discounts.length > 0) {
      sessionParams.discounts = discounts;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await supabaseClient
      .from("profiles")
      .update({ subscription_tier: "personal" })
      .eq("user_id", user.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
