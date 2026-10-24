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
  TURNSTILE_WAITLIST_SECRET_KEY: "w",
};
let sent = [];
let turnstileOk = true;
let secrets = [];
globalThis.fetch = async (url, init) => {
  if (String(url).includes("turnstile")) {
    secrets.push(init.body.get("secret"));
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
assert.equal(sent.length, 2);
assert.equal(sent[0].url, "https://api.brevo.com/v3/smtp/email");
assert.equal(sent[0].headers["api-key"], "k");
assert.equal(sent[0].body.replyTo.email, "a@b.co");
assert.equal(sent[0].body.subject, "[Contact form] Ann Bob");
assert.ok(sent[0].body.htmlContent.includes("&lt;b&gt;"));
assert.ok(!sent[0].body.htmlContent.includes("<b>there"));
assert.ok(sent[0].body.htmlContent.includes("New contact message"));
assert.ok(sent[0].body.textContent.includes("Hello <b>there</b>!"));
assert.ok(sent[0].body.textContent.includes("a@b.co"));

assert.deepEqual(sent[1].body.to, [{ email: "a@b.co" }]);
assert.ok(!sent[1].body.textContent.includes("Hello"));
assert.ok(!sent[1].body.htmlContent.includes("Hello"));
assert.ok(sent[1].body.htmlContent.includes("We got your message."));
assert.ok(!sent[1].body.htmlContent.includes("A person reads"));
assert.ok(!sent[1].body.textContent.includes("A person reads"));
assert.ok(sent[1].body.htmlContent.includes("Hi Ann Bob"));

sent = [];
secrets = [];
r = await call({ type: "waitlist", email: "w@x.io", turnstileToken: "t" });
assert.deepEqual(secrets, ["w"]);
assert.equal(r.status, 200);
assert.equal(sent[0].body.subject, "[Waitlist] w@x.io");
assert.ok(sent[0].body.htmlContent.includes("New waitlist signup"));
assert.ok(sent[0].body.textContent.includes("w@x.io"));
assert.ok(sent[1].body.htmlContent.includes("You are on the list."));
assert.ok(
  sent[1].body.textContent.includes("We have your email and will write to you when there is news."),
);
assert.equal(sent.length, 2);
assert.deepEqual(sent[1].body.to, [{ email: "w@x.io" }]);

sent = [];
assert.equal((await call({ ...good, email: "bad" })).status, 400);
assert.equal((await call({ ...good, message: "short" })).status, 400);
assert.equal((await call({ ...good, turnstileToken: "" })).status, 400);
assert.equal(
  (
    await call(
      { type: "waitlist", email: "w@x.io", turnstileToken: "t" },
      { Origin: "https://evil.example" },
    )
  ).status,
  403,
);
assert.equal((await call({ ...good, type: "x" })).status, 400);
assert.equal((await call({ type: "waitlist", email: "w@x.io" })).status, 400);
assert.equal((await call({ type: "waitlist", email: "w@x.io", turnstileToken: "" })).status, 400);
assert.equal((await call({ ...good, website: "spam" })).status, 200);
assert.equal((await call(good, { Origin: "https://evil.example" })).status, 403);
turnstileOk = false;
assert.equal((await call(good)).status, 403);
assert.equal((await call({ type: "waitlist", email: "w@x.io", turnstileToken: "t" })).status, 403);
assert.equal(sent.length, 0);
turnstileOk = true;
assert.equal(
  (
    await worker.fetch(
      new Request("https://foundstrap.com/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", Origin: "https://foundstrap.com" },
        body: JSON.stringify({ type: "waitlist", email: "w@x.io", turnstileToken: "t" }),
      }),
      { ...env, TURNSTILE_WAITLIST_SECRET_KEY: undefined },
    )
  ).status,
  500,
);
assert.equal(sent.length, 0);
// Hostile input stays inert in every template.
{
  const { buildEmail, buildConfirmation } = await import("./src/index.js");
  const evil = {
    type: "contact",
    name: '"><img src=x onerror=1>',
    email: "a@b.co",
    message: "<script>alert(1)</script>",
  };
  for (const m of [buildEmail(evil, env), buildConfirmation(evil, env)]) {
    assert.ok(!m.htmlContent.includes("<script>"));
    assert.ok(!m.htmlContent.includes("<img src=x"));
  }
}
console.log("all ok");
