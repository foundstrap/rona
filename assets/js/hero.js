/* Version B · Hero (Scene): moodboard → Generate → design system.
   Content never starts hidden: it only moves into place. */
(function () {
  var stage = document.querySelector("[data-stage]");
  if (!stage) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var replay = stage.querySelector("[data-replay]");
  var tl = null, floats = [];

  function startFloats(g) {
    floats.forEach(function (t) { t.kill(); });
    floats = [];
    stage.querySelectorAll(".float").forEach(function (el, i) {
      floats.push(g.to(el, {
        y: (i % 2 ? 1 : -1) * (6 + (i % 3) * 3),
        rotation: (i % 3 - 1) * 1.5,
        duration: 2.8 + (i % 4) * 0.5, ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.12
      }));
    });
  }

  function play() {
    var g = window.gsap;
    if (!g || reduce) return;
    if (tl) tl.kill();
    floats.forEach(function (t) { t.kill(); });
    g.set(stage.querySelectorAll(".float, [data-mi], [data-sp-item], [data-ramp], [data-go], [data-sp]"), { clearProps: "transform,opacity" });

    var items = stage.querySelectorAll("[data-mi]");
    tl = g.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".hs__copy > *", { y: 24, opacity: 0.2, duration: 0.7, stagger: 0.08, clearProps: "transform,opacity" }, 0)
      /* 1. The mess arrives from all sides */
      .from(items, {
        x: function (i) { return (i % 2 ? 1 : -1) * (40 + i * 6); },
        y: function (i) { return -30 - (i % 3) * 20; },
        rotation: function (i) { return (i % 2 ? 1 : -1) * 18; },
        opacity: 0.2, duration: 0.8, stagger: 0.07, ease: "back.out(1.3)", clearProps: "transform,opacity"
      }, 0.15)
      .from(".st__deco", { scale: 0.6, opacity: 0.2, duration: 0.9, stagger: 0.1, clearProps: "opacity" }, 0.2)
      /* 2. Generate: scan the board, pulse the gem and the button */
      .fromTo("[data-scan]", { top: "2%", opacity: 1 }, { top: "68%", duration: 0.9, ease: "sine.inOut" }, 1.1)
      .to("[data-scan]", { opacity: 0, duration: 0.2 }, 2.0)
      .from(".st__gem", { scale: 0.5, rotation: -40, duration: 0.7, ease: "back.out(2)" }, 1.2)
      .from("[data-go]", { scale: 0.7, opacity: 0.2, duration: 0.5, ease: "back.out(2)", clearProps: "transform,opacity" }, 1.4)
      .from(".st__beam", { opacity: 0, duration: 0.6 }, 1.5)
      /* 3. The ordered system builds up */
      .from("[data-sp]", { y: 30, opacity: 0.2, duration: 0.7, clearProps: "transform,opacity" }, 1.8)
      .from("[data-ramp]", { scaleY: 0, duration: 0.4, stagger: 0.03, clearProps: "transform" }, 2.1)
      .from("[data-sp-item]", { y: 14, opacity: 0.2, duration: 0.5, stagger: 0.1, clearProps: "transform,opacity" }, 2.3)
      .from(".hs__facts .tile", { y: 20, opacity: 0.2, duration: 0.6, stagger: 0.07, clearProps: "transform,opacity" }, 0.6)
      .add(function () { startFloats(g); }, 3.0);
  }

  if (replay) {
    /* The button is hidden in the HTML; show it only when the animation can run */
    replay.hidden = !window.gsap || reduce;
    replay.addEventListener("click", play);
  }
  window.addEventListener("load", play);
})();
