/* Inner pages: roadmap vote (saved in this browser only) and FAQ filter. Front-end only. */
(function () {
  "use strict";

  /* Roadmap vote: kept in this browser only */
  var voteForm = document.querySelector("[data-vote]");
  if (voteForm) {
    var out = document.querySelector("[data-vote-result]");
    var KEY = "roadmap-vote";
    function render(value) {
      if (!out) return;
      var input = value && voteForm.querySelector('input[value="' + value + '"]');
      out.hidden = !input;
      if (input) out.querySelector("[data-vote-name]").textContent = input.dataset.label;
    }
    voteForm.addEventListener("change", function (e) {
      if (e.target.name !== "preview") return;
      try {
        localStorage.setItem(KEY, e.target.value);
      } catch (err) {}
      render(e.target.value);
    });
    var saved = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch (err) {}
    if (saved) {
      var el = voteForm.querySelector('input[value="' + saved + '"]');
      if (el) {
        el.checked = true;
        render(saved);
      }
    }
  }

  /* FAQ filter */
  var search = document.querySelector("[data-faq-search]");
  if (search) {
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-faq] details"));
    var groups = Array.prototype.slice.call(document.querySelectorAll("[data-faq] .faq-group"));
    var empty = document.querySelector("[data-faq-empty]");
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (d) {
        var hit = !q || d.textContent.toLowerCase().indexOf(q) !== -1;
        d.hidden = !hit;
        if (hit) shown++;
        if (q && hit) d.open = true;
      });
      groups.forEach(function (g) {
        g.hidden = !g.querySelector("details:not([hidden])");
      });
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* Contact form: no provider yet. contact.html shows "Contact opens soon." */
})();
