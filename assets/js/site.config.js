/* One place for site facts. Change the name here when it is decided.
   Every element with [data-brand] shows SITE.name. */
window.SITE = {
  name: "RONA",
  year: new Date().getFullYear(),
  /* Forms Worker route (same origin). */
  formsEndpoint: "https://api.foundstrap.com/api/contact",
  /* Public Turnstile site keys. They are not secrets. */
  /* Contact form: visible widget. */
  turnstileSiteKey: "0x4AAAAAAFj3j6skiVsHjZUu",
  /* Waitlist forms: invisible widget. */
  waitlistTurnstileSiteKey: "0x4AAAAAAFj8VTRC-41VPSv5",
};
