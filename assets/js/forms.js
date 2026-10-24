/* Contact form and waitlist form. Both post JSON to SITE.formsEndpoint.
   Forms with .is-soon stay disabled and get no Turnstile widget. */
(function () {
  "use strict";
  var SITE = window.SITE || {};
  var forms = document.querySelectorAll("form[data-form-type]:not(.is-soon)");
  if (!forms.length) return;

  function whenTurnstile(cb) {
    if (window.turnstile) return cb();
    var tries = 0;
    var t = setInterval(function () {
      tries += 1;
      if (window.turnstile) {
        clearInterval(t);
        cb();
      } else if (tries > 100) {
        clearInterval(t);
      }
    }, 100);
  }

  forms.forEach(function (form) {
    var type = form.dataset.formType;
    var box = form.querySelector("[data-turnstile]");
    var status = form.querySelector("[data-form-status]");
    var button = form.querySelector('button[type="submit"]');
    var widgetId = null;

    function say(msg, isError) {
      if (!status) return;
      status.textContent = msg;
      status.hidden = !msg;
      status.dataset.state = isError ? "error" : "ok";
    }

    if (box) {
      whenTurnstile(function () {
        widgetId = window.turnstile.render(box, { sitekey: SITE.turnstileSiteKey });
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var token = widgetId !== null ? window.turnstile.getResponse(widgetId) : "";
      if (!token) return say("Complete the spam check first.", true);

      var payload = {
        type: type,
        email: String(data.get("email") || "").trim(),
        website: String(data.get("website") || ""),
        turnstileToken: token,
      };
      if (type === "contact") {
        payload.name = String(data.get("name") || "").trim();
        payload.message = String(data.get("message") || "").trim();
      }

      button.disabled = true;
      button.classList.add("is-loading");
      say("", false);
      fetch(SITE.formsEndpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(
            function (body) {
              return { ok: res.ok, body: body };
            },
            function () {
              return { ok: false, body: {} };
            },
          );
        })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            say(
              type === "contact" ? "Thanks. We got your message." : "You are on the list.",
              false,
            );
          } else {
            say(r.body.error || "Something went wrong. Try again.", true);
          }
        })
        .catch(function () {
          say("Network error. Try again.", true);
        })
        .then(function () {
          button.disabled = false;
          button.classList.remove("is-loading");
          if (widgetId !== null) window.turnstile.reset(widgetId);
        });
    });
  });
})();
