/**
 * Club Copy — transactional email (Resend REST API, no SDK).
 *
 * Optional. If RESEND_API_KEY is unset, sendMail() is a documented no-op so
 * signup / checkout keep working without a mail provider configured.
 *
 * Env:
 *   RESEND_API_KEY — required to actually send
 *   MAIL_FROM      — optional, defaults to "Club Copy <club@clubcopy.ca>"
 */

function mailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

async function sendMail({ to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { sent: false, reason: "MAIL_NOT_CONFIGURED" };
  if (!to) return { sent: false, reason: "NO_RECIPIENT" };

  const from = process.env.MAIL_FROM || "Club Copy <club@clubcopy.ca>";
  const payload = {
    from,
    to: [to],
    subject,
    html,
    text: text || undefined,
  };
  if (replyTo) payload.reply_to = replyTo;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        sent: false,
        reason: (data && (data.message || data.name)) || `MAIL_ERROR_${res.status}`,
      };
    }
    return { sent: true, id: data && data.id };
  } catch (err) {
    return { sent: false, reason: err.message || "MAIL_REQUEST_FAILED" };
  }
}

function layerForLevel(level) {
  if (level === "premium") return "DIGITAL + PHYSICAL";
  if (level === "club") return "DIGITAL";
  return "CATALOG";
}

function levelLabel(level) {
  if (level === "premium") return "Premium";
  if (level === "club") return "Club";
  return "Free";
}

/**
 * Welcome / membership confirmation email — mirrors the member card shown
 * on the site (thank-you page + /account).
 */
function welcomeEmail({ email, displayName, level, memberNumber, creditCents }) {
  const name = displayName || email;
  const label = levelLabel(level);
  const layer = layerForLevel(level);
  const siteUrl = "https://www.clubcopy.ca";
  const perk =
    level === "premium"
      ? "50% off all music, plus Club Credit toward cassettes and pressings you choose."
      : level === "club"
      ? "30% off all music in the library. Renews yearly."
      : "Release alerts and first listens. You can upgrade to Club or Premium any time.";
  const creditLine =
    creditCents > 0
      ? `<p style="margin:0 0 16px;color:#5F636B;font-size:14px;line-height:1.55;">You've been credited <strong>$${(
          creditCents / 100
        ).toFixed(2)}</strong> Club Credit toward your next cassette or vinyl order.</p>`
      : "";

  const subject =
    level === "free"
      ? "You're on the list — Club Copy"
      : `Welcome to Club Copy ${label}`;

  const html = `
  <div style="font-family:'Space Grotesk',Helvetica,Arial,sans-serif;background:#F7F5F1;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid rgba(17,17,17,.08);">
      <div style="padding:28px 28px 0;">
        <p style="margin:0 0 4px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#727780;font-weight:600;">Club Copy</p>
        <h1 style="margin:0 0 14px;font-size:24px;letter-spacing:-.02em;color:#111;">Hey ${escapeHtml(name)}, you're in.</h1>
        <p style="margin:0 0 16px;color:#5F636B;font-size:14px;line-height:1.55;">${perk}</p>
        ${creditLine}
      </div>
      <div style="margin:0 20px 24px;padding:20px;border-radius:12px;background:linear-gradient(145deg,#2a303a,#12151a);color:#fff;">
        <div style="display:flex;justify-content:space-between;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.6);margin-bottom:12px;">
          <span>Club Copy</span><strong style="color:#fff;">${label.toUpperCase()}</strong>
        </div>
        <p style="margin:0 0 8px;font-family:'IBM Plex Mono',monospace;font-size:18px;letter-spacing:.1em;text-transform:uppercase;">${escapeHtml(name)}</p>
        <p style="margin:0;font-size:12px;color:rgba(255,255,255,.55);line-height:1.5;">MEMBER <strong style="color:#fff;">${memberNumber}</strong><br/>${layer} · PACIFIC NORTHWEST</p>
      </div>
      <div style="padding:0 28px 28px;">
        <a href="${siteUrl}/account" style="display:inline-block;background:#111;color:#fff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 20px;border-radius:980px;">View your account</a>
      </div>
    </div>
  </div>`;

  const text = `Hey ${name}, you're in.\n\n${perk}\n\nMember ${memberNumber} — ${label} (${layer})\n\nView your account: ${siteUrl}/account`;

  return { subject, html, text };
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

module.exports = {
  mailConfigured,
  sendMail,
  welcomeEmail,
};
