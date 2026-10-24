/* Receives the contact form and the waitlist form. Verifies Turnstile, then sends
   one email through the Brevo transactional API. Nothing is stored. */

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const TURNSTILE_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const MAX_BODY_BYTES = 16 * 1024;

const SUBJECT_PREFIX = { contact: "[Contact form]", waitlist: "[Waitlist]" };

function json(status, body, origin) {
  const headers = { "content-type": "application/json", "cache-control": "no-store" };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["vary"] = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function clean(value, max) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/* Returns { error } or { data }. */
export function validate(input) {
  if (!input || typeof input !== "object") return { error: "Invalid request." };
  const type = input.type;
  if (type !== "contact" && type !== "waitlist") return { error: "Unknown form type." };

  const email = clean(input.email, 254);
  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };

  const token = typeof input.turnstileToken === "string" ? input.turnstileToken : "";
  if (!token || token.length > 2048) return { error: "Spam check missing." };

  const data = { type, email, token, name: "", message: "" };
  if (type === "contact") {
    data.name = clean(input.name, 100);
    // Keep line breaks in the message, drop control characters.
    data.message =
      typeof input.message === "string"
        ? input.message
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
            .trim()
            .slice(0, 5000)
        : "";
    if (!data.name) return { error: "Enter your name." };
    if (data.message.length < 10) return { error: "Write a message of at least 10 characters." };
  }
  return { data };
}

async function verifyTurnstile(token, secret, ip) {
  const body = new FormData();
  body.append("secret", secret);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  const res = await fetch(TURNSTILE_URL, { method: "POST", body });
  if (!res.ok) return false;
  const result = await res.json();
  return result.success === true;
}

export function buildEmail(data, env) {
  const isContact = data.type === "contact";
  const subject = isContact
    ? `${SUBJECT_PREFIX.contact} ${data.name}`
    : `${SUBJECT_PREFIX.waitlist} ${data.email}`;
  const lines = isContact
    ? [`Form: contact`, `Name: ${data.name}`, `Email: ${data.email}`, ``, data.message]
    : [`Form: waitlist`, `Email: ${data.email}`];
  const text = lines.join("\n");
  const html = `<p>${escapeHtml(text).replace(/\n/g, "<br>")}</p>`;
  return {
    sender: { email: env.SENDER_EMAIL, name: env.SENDER_NAME || "Forms" },
    to: [{ email: env.RECIPIENT_EMAIL }],
    replyTo: { email: data.email, ...(isContact ? { name: data.name } : {}) },
    subject: subject.slice(0, 200),
    textContent: text,
    htmlContent: html,
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim());
    const corsOrigin = origin && allowed.includes(origin) ? origin : null;

    if (request.method === "OPTIONS") {
      if (!corsOrigin) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": corsOrigin,
          "access-control-allow-methods": "POST, OPTIONS",
          "access-control-allow-headers": "content-type",
          "access-control-max-age": "86400",
          vary: "Origin",
        },
      });
    }
    if (request.method !== "POST") return json(405, { error: "Method not allowed." });
    if (origin && !corsOrigin) return json(403, { error: "Origin not allowed." });
    if (!(request.headers.get("content-type") || "").includes("application/json")) {
      return json(415, { error: "Send JSON." }, corsOrigin);
    }

    let raw;
    try {
      raw = await request.text();
      if (raw.length > MAX_BODY_BYTES)
        return json(413, { error: "Request too large." }, corsOrigin);
    } catch {
      return json(400, { error: "Invalid request." }, corsOrigin);
    }
    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      return json(400, { error: "Invalid request." }, corsOrigin);
    }

    // Honeypot: bots fill hidden fields. Pretend success, send nothing.
    if (input && typeof input.website === "string" && input.website !== "") {
      return json(200, { ok: true }, corsOrigin);
    }

    const { data, error } = validate(input);
    if (error) return json(400, { error }, corsOrigin);

    const ip = request.headers.get("CF-Connecting-IP");
    let human = false;
    try {
      human = await verifyTurnstile(data.token, env.TURNSTILE_SECRET_KEY, ip);
    } catch {
      return json(502, { error: "Spam check unavailable. Try again later." }, corsOrigin);
    }
    if (!human) return json(403, { error: "Spam check failed. Reload and try again." }, corsOrigin);

    let res;
    try {
      res = await fetch(BREVO_URL, {
        method: "POST",
        headers: {
          "api-key": env.BREVO_API_KEY,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(buildEmail(data, env)),
      });
    } catch {
      return json(502, { error: "Could not send. Try again later." }, corsOrigin);
    }
    if (!res.ok) {
      console.error("Brevo error", res.status, await res.text());
      return json(502, { error: "Could not send. Try again later." }, corsOrigin);
    }
    return json(200, { ok: true }, corsOrigin);
  },
};
