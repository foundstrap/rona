/* Version B · How it works tabs (pinned scroll on desktop) and the [data-reveal] animation. */
(function () {
  "use strict";
  var how = document.querySelector("[data-how]");
  if (!how) return;
  var tabs = Array.prototype.slice.call(how.querySelectorAll("[data-step]"));
  var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute("aria-controls")); });
  var bar = how.querySelector("[data-how-progress]");
  var count = how.querySelector("[data-how-count]");
  var current = 0;

  function show(i, focus) {
    if (i === current && !focus) return;
    current = i;
    tabs.forEach(function (t, n) {
      var on = n === i;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      panels[n].classList.toggle("is-active", on);
    });
    if (bar) bar.style.width = ((i + 1) / tabs.length * 100) + "%";
    if (count) count.textContent = (i + 1 < 10 ? "0" : "") + (i + 1);
    if (focus) tabs[i].focus();
  }

  /* Pinned mode: scroll moves through the steps */
  var st = null;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var wide = window.matchMedia("(min-width: 60rem) and (min-height: 40rem)");
  function setupPin() {
    if (st) { st.kill(); st = null; }
    if (!window.gsap || !window.ScrollTrigger || reduceMotion || !wide.matches) return;
    st = ScrollTrigger.create({
      trigger: how,
      start: "top top",
      end: "+=" + (tabs.length * 70) + "%",
      pin: true,
      anticipatePin: 1,
      onUpdate: function (self) {
        show(Math.min(tabs.length - 1, Math.floor(self.progress * tabs.length * 0.999)));
      }
    });
  }

  function go(i) {
    i = (i + tabs.length) % tabs.length;
    if (st) {
      /* In pinned mode, scroll to the part of the pin for this step */
      var y = st.start + (st.end - st.start) * ((i + 0.5) / tabs.length);
      window.scrollTo({ top: y, behavior: reduceMotion ? "auto" : "smooth" });
    } else {
      show(i);
    }
  }

  /* Arrows and swipe on the stage */
  var prev = how.querySelector("[data-how-prev]"), next = how.querySelector("[data-how-next]");
  if (prev) prev.addEventListener("click", function () { go(current - 1); });
  if (next) next.addEventListener("click", function () { go(current + 1); });
  var stage = how.querySelector(".how__stage"), x0 = null, y0 = null;
  if (stage) {
    stage.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });
  }

  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { go(i); });
    t.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowDown" || k === "ArrowRight") n = (i + 1) % tabs.length;
      if (k === "ArrowUp" || k === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
      if (k === "Home") n = 0;
      if (k === "End") n = tabs.length - 1;
      if (n !== null) { e.preventDefault(); show(n, true); }
    });
  });

  setupPin();
  if (wide.addEventListener) wide.addEventListener("change", setupPin);
  /* Layout above the pin can change after load (fonts, images).
     Measure again, so the pin does not start too early and skip the Problem section. */
  function remeasure() { if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }
  window.addEventListener("load", remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
})();

/* Reveal: content fades and moves up when it comes into view.
   CSS transitions on the compositor (opacity, transform) only. Items that come into
   view together get a short stagger. Without JS, or with reduced motion, all content shows. */
(function () {
  "use strict";
  var items = document.querySelectorAll("[data-reveal]");
  if (!items.length || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root = document.documentElement;
  var io = new IntersectionObserver(function (entries) {
    var batch = entries.filter(function (e) { return e.isIntersecting; }).map(function (e) { return e.target; });
    batch.sort(function (a, b) {
      var ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return (ra.top - rb.top) || (ra.left - rb.left);
    });
    batch.forEach(function (el, n) {
      io.unobserve(el);
      el.style.transitionDelay = Math.min(n, 5) * 80 + "ms";
      el.classList.add("is-in");
      el.addEventListener("transitionend", function done() { el.style.transitionDelay = ""; el.removeEventListener("transitionend", done); });
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
  /* Content already on screen at load shows at once, with no movement */
  var vh = window.innerHeight;
  Array.prototype.forEach.call(items, function (el) {
    if (el.getBoundingClientRect().top < vh * 0.9) el.classList.add("is-in", "is-now");
    else io.observe(el);
  });
  root.classList.add("reveal-on");
})();
