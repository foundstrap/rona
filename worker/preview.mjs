/* Writes the four email templates to worker/previews/ so you can open them in a browser.
   Run: node worker/preview.mjs */
import { mkdirSync, writeFileSync } from "node:fs";
import { adminContact, adminWaitlist, confirmContact, confirmWaitlist } from "./src/email.js";

const brand = "RONA";
const siteUrl = "https://rona.foundstrap.com";
const out = new URL("./previews/", import.meta.url);
mkdirSync(out, { recursive: true });
const sets = {
  "admin-contact": adminContact({
    brand,
    name: "Dana Whitfield",
    email: "dana@example.com",
    message:
      "Hi team,\n\nWe are an agency with six designers. Do you plan team seats?\n\nThanks, Dana",
  }),
  "admin-waitlist": adminWaitlist({ brand, email: "dana@example.com" }),
  "confirm-contact": confirmContact({ brand, name: "Dana", siteUrl }),
  "confirm-waitlist": confirmWaitlist({ brand, siteUrl }),
};
for (const [name, { html, text }] of Object.entries(sets)) {
  writeFileSync(new URL(`${name}.html`, out), html);
  writeFileSync(new URL(`${name}.txt`, out), text);
}
console.log("wrote", Object.keys(sets).length, "templates to worker/previews/");
