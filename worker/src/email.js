/* Email templates for RONA. Table layout and inline CSS only, so they work in Gmail, Apple Mail
   and Outlook. Every dynamic value goes through esc() before it reaches HTML. */

const C = {
  void: "#0b1012",
  surface: "#1d282b",
  line: "#2e3d41",
  paper: "#f4f0e8",
  muted: "#a3b2b4",
  faint: "#748689",
  pulsar: "#7b93ff",
  plasma: "#e07bff",
  onAccent: "#0b1012",
};
const FONT = "'Atkinson Hyperlegible Next',-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "'Atkinson Hyperlegible Mono',ui-monospace,Menlo,Consolas,monospace";

export function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTime(date) {
  const d = date.toISOString();
  return `${d.slice(0, 10)} ${d.slice(11, 16)} UTC`;
}

function label(text) {
  return `<p style="margin:0 0 6px;font-family:${MONO};font-size:12px;line-height:16px;letter-spacing:1px;text-transform:uppercase;color:${C.faint};">${esc(text)}</p>`;
}

function field(name, valueHtml) {
  return `<tr><td style="padding:0 0 20px;">${label(name)}<p style="margin:0;font-family:${FONT};font-size:16px;line-height:24px;color:${C.paper};">${valueHtml}</p></td></tr>`;
}

function button(href, text) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="${C.pulsar}" style="background-color:${C.pulsar};"><a href="${esc(href)}" style="display:inline-block;padding:14px 24px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:${C.onAccent};text-decoration:none;">${esc(text)}</a></td></tr></table>`;
}

function heading(text) {
  return `<h1 style="margin:0 0 16px;font-family:${FONT};font-size:28px;line-height:34px;font-weight:700;letter-spacing:-0.5px;color:${C.paper};">${esc(text)}</h1>`;
}

function paragraph(text) {
  return `<p style="margin:0 0 20px;font-family:${FONT};font-size:16px;line-height:26px;color:${C.muted};">${esc(text)}</p>`;
}

/* Page frame: dark ground, one 560px card, wordmark on top, small footer. */
function layout({ brand, preheader, bodyHtml, footer }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(brand)}</title>
<style>
@media only screen and (max-width:600px){
  .px{padding-left:20px !important;padding-right:20px !important;}
  .card-body{padding:24px 20px !important;}
}
</style>
</head>
<body style="margin:0;padding:0;background-color:${C.void};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.void};">${esc(preheader)}</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${C.void}" style="background-color:${C.void};">
<tr><td align="center" class="px" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
<tr><td style="padding:0 0 20px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
<td width="14" height="14" bgcolor="${C.pulsar}" style="width:14px;height:14px;background-color:${C.pulsar};font-size:0;line-height:0;">&nbsp;</td>
<td width="10" style="width:10px;font-size:0;line-height:0;">&nbsp;</td>
<td style="font-family:${FONT};font-size:18px;line-height:20px;font-weight:700;letter-spacing:2px;color:${C.paper};">${esc(brand)}</td>
</tr></table>
</td></tr>
<tr><td bgcolor="${C.surface}" style="background-color:${C.surface};border:1px solid ${C.line};border-top:3px solid ${C.pulsar};">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td class="card-body" style="padding:32px;">
${bodyHtml}
</td></tr></table>
</td></tr>
<tr><td style="padding:20px 0 0;font-family:${FONT};font-size:13px;line-height:20px;color:${C.faint};">${footer}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function rows(inner) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${inner}</table>`;
}

export function adminContact({ brand, name, email, message, now = new Date() }) {
  const mailto = `mailto:${encodeURIComponent(email).replace(/%40/g, "@")}?subject=${encodeURIComponent("Re: your message to " + brand)}`;
  const messageHtml = esc(message).replace(/\r?\n/g, "<br>");
  const bodyHtml =
    heading("New contact message") +
    rows(
      field("Name", esc(name)) +
        field(
          "Email",
          `<a href="mailto:${esc(email)}" style="color:${C.pulsar};text-decoration:none;">${esc(email)}</a>`,
        ) +
        field("Received", esc(formatTime(now))) +
        `<tr><td style="padding:0 0 28px;">${label("Message")}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-left:2px solid ${C.plasma};padding:4px 0 4px 16px;font-family:${FONT};font-size:16px;line-height:26px;color:${C.paper};">${messageHtml}</td></tr></table></td></tr>`,
    ) +
    button(mailto, `Reply to ${name}`);
  const html = layout({
    brand,
    preheader: `${name} wrote via the contact form.`,
    bodyHtml,
    footer: `Sent by the ${esc(brand)} contact form. Replying to this email also reaches ${esc(name)}.`,
  });
  const text = [
    `New contact message`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    `Received: ${formatTime(now)}`,
    ``,
    `Message:`,
    message,
    ``,
    `Reply to this email to answer ${name}.`,
  ].join("\n");
  return { html, text };
}

export function adminWaitlist({ brand, email, now = new Date() }) {
  const mailto = `mailto:${email}`;
  const bodyHtml =
    heading("New waitlist signup") +
    rows(
      field(
        "Email",
        `<a href="mailto:${esc(email)}" style="color:${C.pulsar};text-decoration:none;">${esc(email)}</a>`,
      ) + field("Received", esc(formatTime(now))),
    ) +
    button(mailto, "Write to this address");
  const html = layout({
    brand,
    preheader: `${email} joined the waitlist.`,
    bodyHtml,
    footer: `Sent by the ${esc(brand)} waitlist form.`,
  });
  const text = [`New waitlist signup`, ``, `Email: ${email}`, `Received: ${formatTime(now)}`].join(
    "\n",
  );
  return { html, text };
}

function visitorFooter(brand, siteUrl) {
  const host = siteUrl.replace(/^https?:\/\//, "");
  return `You got this email because this address was entered in a form on <a href="${esc(siteUrl)}" style="color:${C.faint};text-decoration:underline;">${esc(host)}</a>. If that was not you, ignore this email.<br>${esc(brand)} · From moodboard to design system.`;
}

export function confirmContact({ brand, name, siteUrl }) {
  const bodyHtml =
    heading("We got your message.") +
    paragraph(`Hi ${name},`) +
    paragraph(`Thanks for writing to ${brand}. We will reply to this email address.`) +
    paragraph("In the meantime, many answers are on the FAQ page.") +
    button(`${siteUrl}/faq.html`, "Read the FAQ");
  const html = layout({
    brand,
    preheader: `Thanks for writing to ${brand}. We will reply by email.`,
    bodyHtml,
    footer: visitorFooter(brand, siteUrl),
  });
  const text = [
    `We got your message.`,
    ``,
    `Hi ${name},`,
    ``,
    `Thanks for writing to ${brand}. We will reply to this email address.`,
    ``,
    `In the meantime, many answers are on the FAQ page: ${siteUrl}/faq.html`,
    ``,
    `You got this email because this address was entered in a form on ${siteUrl.replace(/^https?:\/\//, "")}. If that was not you, ignore this email.`,
    brand,
  ].join("\n");
  return { html, text };
}

export function confirmWaitlist({ brand, siteUrl }) {
  const bodyHtml =
    heading("You are on the list.") +
    paragraph(
      `Thanks for your interest in ${brand}. We have your email and will write to you when there is news.`,
    ) +
    paragraph(
      `${brand} turns a moodboard of images, colors, fonts and ideas into a complete design system and brand guideline.`,
    ) +
    button(`${siteUrl}/how-it-works.html`, "See how it works");
  const html = layout({
    brand,
    preheader: `You joined the ${brand} waitlist.`,
    bodyHtml,
    footer: visitorFooter(brand, siteUrl),
  });
  const text = [
    `You are on the list.`,
    ``,
    `Thanks for your interest in ${brand}. We have your email and will write to you when there is news.`,
    ``,
    `${brand} turns a moodboard of images, colors, fonts and ideas into a complete design system and brand guideline.`,
    `See how it works: ${siteUrl}/how-it-works.html`,
    ``,
    `You got this email because this address was entered in a form on ${siteUrl.replace(/^https?:\/\//, "")}. If that was not you, ignore this email.`,
    brand,
  ].join("\n");
  return { html, text };
}
