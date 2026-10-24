(function () {
  "use strict";
  var SITE = window.SITE || { name: "RONA" };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Brand name: one source of truth */
  document.querySelectorAll("[data-brand]").forEach(function (el) { el.textContent = SITE.name; });
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = SITE.year; });

  /* Mobile nav */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* Waitlist: no form provider yet. The forms are disabled in the HTML ("Waitlist opens soon"). */

  /* Motion: GSAP when present, and only when the user allows motion.
     The [data-reveal] animation is in sections.js (IntersectionObserver + CSS). */
  if (window.gsap && !reduceMotion) {
    if (window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
    gsap.utils.toArray("[data-float]").forEach(function (el, i) {
      gsap.to(el, {
        y: (i % 2 ? -1 : 1) * (8 + (i % 3) * 4),
        rotation: (i % 2 ? 6 : -6),
        duration: 3 + (i % 4),
        ease: "sine.inOut", yoyo: true, repeat: -1
      });
    });
  }
})();
