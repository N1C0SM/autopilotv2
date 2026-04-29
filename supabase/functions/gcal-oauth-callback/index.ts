import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const stateRaw = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) return htmlResponse(`<h2>❌ Error</h2><p>${error}</p>`);
    if (!code || !stateRaw) return htmlResponse("<h2>❌ Missing code/state</h2>");

    let state: { uid: string; return_to?: string };
    try { state = JSON.parse(atob(stateRaw)); } catch { return htmlResponse("<h2>❌ Bad state</h2>"); }

    const clientId = Deno.env.get("GOOGLE_OAUTH_CLIENT_ID")!;
    const clientSecret = Deno.env.get("GOOGLE_OAUTH_CLIENT_SECRET")!;
    const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gcal-oauth-callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return htmlResponse(`<h2>❌ Token exchange failed</h2><pre>${JSON.stringify(tokenData)}</pre>`);

    const { access_token, refresh_token, expires_in, scope } = tokenData;
    if (!refresh_token) return htmlResponse(`<h2>❌ No refresh_token</h2><p>Revoca el acceso en tu cuenta Google y reintenta.</p>`);

    const expiry = new Date(Date.now() + (expires_in - 60) * 1000).toISOString();

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: dbErr } = await admin.from("google_calendar_tokens").upsert({
      user_id: state.uid,
      access_token,
      refresh_token,
      expiry_at: expiry,
      scope,
      calendar_id: "primary",
    }, { onConflict: "user_id" });

    if (dbErr) return htmlResponse(`<h2>❌ DB error</h2><pre>${dbErr.message}</pre>`);

    const returnTo = state.return_to || "/dashboard";
    return htmlResponse(`
      <h2>✅ Conectado a Google Calendar</h2>
      <p>Volviendo a la app...</p>
      <script>setTimeout(() => { window.location.href = ${JSON.stringify(returnTo)}; }, 1500);</script>
    `);
  } catch (e) {
    return htmlResponse(`<h2>❌ Error</h2><pre>${String(e)}</pre>`);
  }
});

function htmlResponse(body: string) {
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><title>Google Calendar</title><style>body{font-family:system-ui;max-width:500px;margin:80px auto;padding:24px;text-align:center;}</style></head><body>${body}</body></html>`, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}