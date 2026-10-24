/* One place for site facts. Change the name here when it is decided.
   Every element with [data-brand] shows SITE.name. */
window.SITE = {
  name: "RONA",
  year: new Date().getFullYear(),
  /* Forms Worker route (same origin). */
  formsEndpoint: "https://api.foundstrap.com/api/contact",
  /* Public Turnstile site key. Replace before deploy. This is not a secret. */
  turnstileSiteKey: "0x4AAAAAAFj3j6skiVsHjZUu",
};
