// Sends a single sale email for an existing sale_notifications row.
//
// Security model:
// - The only accepted input is `notification_id` (UUID). Recipient, game title and
//   prices are NEVER taken from the request; they are loaded server-side.
// - Each notification can be emailed at most once, and only within 1 hour of
//   creation, via an atomic DB claim (claim_sale_notification_email). Replays and
//   spoofed calls cannot target arbitrary users or inject content.
// - The recipient's sale-email preference is re-checked.
// - All dynamic values are HTML-escaped.
// verify_jwt stays false because the database trigger calls this without a user JWT.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (s: string) =>
  s.replace(/[&<>"'`]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" })[c]!,
  );

// Strip control chars / newlines (header injection) and bound length for the subject line.
const safeSubjectText = (s: string) => s.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 120);

const money = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : "0.00");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!resendKey || !supabaseUrl || !serviceKey) {
    console.error("send-sale-notification-email: missing configuration");
    return json({ error: "Service unavailable" }, 503);
  }

  const raw = await req.text();
  if (raw.length > 1024) return json({ error: "Payload too large" }, 413);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const notificationId = (body as { notification_id?: unknown })?.notification_id;
  if (typeof notificationId !== "string" || !UUID_RE.test(notificationId)) {
    return json({ error: "notification_id must be a UUID" }, 400);
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    // Atomic claim: returns a row only once, only for recent unsent notifications.
    const { data: claimed, error: claimError } = await admin.rpc("claim_sale_notification_email", {
      _notification_id: notificationId,
    });
    if (claimError) {
      console.error("claim failed:", claimError.message);
      return json({ error: "Could not process notification" }, 500);
    }
    const row = Array.isArray(claimed) ? claimed[0] : null;
    if (!row) {
      // Unknown, already sent, or expired — respond generically (no enumeration signal).
      return json({ success: true, sent: false }, 202);
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("sale_email_notifications")
      .eq("user_id", row.user_id)
      .maybeSingle();
    if (profile && profile.sale_email_notifications === false) {
      return json({ success: true, sent: false }, 202);
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(row.user_id);
    const email = userData?.user?.email;
    if (userError || !email) {
      console.error("recipient lookup failed");
      return json({ success: true, sent: false }, 202);
    }

    const original = Number(row.original_price);
    const sale = Number(row.sale_price);
    if (!(original > 0) || !(sale >= 0) || sale >= original) {
      return json({ success: true, sent: false }, 202);
    }
    const discount = Math.round(((original - sale) / original) * 100);
    const titleRaw = String(row.game_title ?? "A wishlisted game");
    const title = escapeHtml(titleRaw.slice(0, 200));

    const html = `<!DOCTYPE html><html><body style="font-family:Segoe UI,Tahoma,sans-serif;background:#0a0a0b;color:#fff;margin:0;padding:0">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
  <div style="text-align:center;font-size:28px;font-weight:bold;color:#a855f7;margin-bottom:30px">GameVault</div>
  <div style="background:#1a1a2e;border-radius:16px;padding:30px;border:1px solid #2a2a4a">
    <div style="display:inline-block;background:#16a34a;color:#fff;padding:8px 16px;border-radius:20px;font-weight:bold;font-size:18px;margin-bottom:20px">${discount}% OFF</div>
    <div style="font-size:24px;font-weight:bold;margin-bottom:10px">${title}</div>
    <p style="color:#aaa">A game on your wishlist is now on sale!</p>
    <p><span style="text-decoration:line-through;color:#888;font-size:20px">$${money(original)}</span>
       <span style="color:#22c55e;font-size:28px;font-weight:bold;margin-left:12px">$${money(sale)}</span></p>
    <p style="color:#888;font-size:14px">You save: $${money(original - sale)}</p>
  </div>
  <p style="text-align:center;color:#666;font-size:12px;margin-top:30px">You received this email because ${title} is on your wishlist and sale emails are enabled in your settings.</p>
</div></body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "GameVault <onboarding@resend.dev>",
        to: [email],
        subject: `${safeSubjectText(titleRaw)} is ${discount}% off!`,
        html,
      }),
    });
    if (!res.ok) {
      console.error("email provider error:", res.status);
      return json({ error: "Email delivery failed" }, 502);
    }

    return json({ success: true, sent: true });
  } catch (err) {
    console.error("send-sale-notification-email error:", err instanceof Error ? err.message : err);
    return json({ error: "Internal error" }, 500);
  }
});
