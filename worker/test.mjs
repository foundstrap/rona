/* Local logic test with mocked Turnstile and Brevo. Run: node worker/test.mjs
   It does not call the real services. */
import worker from "./src/index.js";
import assert from "node:assert/strict";

const env = {
  SENDER_EMAIL: "noreply@foundstrap.com",
  SENDER_NAME: "Foundstrap forms",
  RECIPIENT_EMAIL: "foundstrap@gmail.com",
  ALLOWED_ORIGINS: "https://foundstrap.com",
  BREVO_API_KEY: "k",
  TURNSTILE_SECRET_KEY: "s",
};
let sent = [];
let turnstileOk = true;
globalThis.fetch = async (url, init) => {
  if (String(url).includes("turnstile")) {
    return new Response(JSON.stringify({ success: turnstileOk }));
  }
  sent.push({ url: String(url), headers: init.headers, body: JSON.parse(init.body) });
  return new Response("{}", { status: 201 });
};
const call = (body, extra = {}) =>
  worker.fetch(
    new Request("https://foundstrap.com/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json", Origin: "https://foundstrap.com", ...extra },
      body: JSON.stringify(body),
    }),
    env,
  );

const good = {
  type: "contact",
  name: "Ann\nBob",
  email: "a@b.co",
  message: "Hello <b>there</b>!",
  turnstileToken: "t",
};
let r = await call(good);
assert.equal(r.status, 200);
assert.equal(sent.length, 1);
assert.equal(sent[0].url, "https://api.brevo.com/v3/smtp/email");
assert.equal(sent[0].headers["api-key"], "k");
assert.equal(sent[0].body.replyTo.email, "a@b.co");
assert.equal(sent[0].body.subject, "[Contact form] Ann Bob");
assert.ok(sent[0].body.htmlContent.includes("&lt;b&gt;"));

sent = [];
r = await call({ type: "waitlist", email: "w@x.io", turnstileToken: "t" });
assert.equal(r.status, 200);
assert.equal(sent[0].body.subject, "[Waitlist] w@x.io");

sent = [];
assert.equal((await call({ ...good, email: "bad" })).status, 400);
assert.equal((await call({ ...good, message: "short" })).status, 400);
assert.equal((await call({ ...good, turnstileToken: "" })).status, 400);
assert.equal((await call({ ...good, type: "x" })).status, 400);
assert.equal((await call({ ...good, website: "spam" })).status, 200);
assert.equal((await call(good, { Origin: "https://evil.example" })).status, 403);
turnstileOk = false;
assert.equal((await call(good)).status, 403);
assert.equal(sent.length, 0);
console.log("all ok");
