/* Contact form and waitlist form. Both post JSON to SITE.formsEndpoint.
   Forms with .is-soon stay disabled.
   Contact: visible Turnstile widget, token read on submit.
   Waitlist: invisible Turnstile widget, run on submit, one fresh token per attempt. */
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
    var invisible = type === "waitlist";
    var pending = null;

    function say(msg, isError) {
      if (!status) return;
      status.textContent = msg;
      status.hidden = !msg;
      status.dataset.state = isError ? "error" : "ok";
    }

    function settle(token, err) {
      var p = pending;
      pending = null;
      if (!p) return;
      clearTimeout(p.timer);
      if (token) p.resolve(token);
      else p.reject(err || new Error("spam-check"));
    }

    if (box) {
      whenTurnstile(function () {
        var opts = { sitekey: invisible ? SITE.waitlistTurnstileSiteKey : SITE.turnstileSiteKey };
        if (invisible) {
          opts.execution = "execute";
          opts.callback = function (t) {
            settle(t);
          };
          opts["error-callback"] = function () {
            settle(null);
            return true;
          };
          opts["expired-callback"] = function () {
            settle(null);
          };
          opts["timeout-callback"] = function () {
            settle(null);
          };
        }
        widgetId = window.turnstile.render(box, opts);
      });
    }

    /* Resolves with a fresh token, or rejects. */
    function getToken() {
      if (widgetId === null) return Promise.reject(new Error("not-ready"));
      if (!invisible) {
        var t = window.turnstile.getResponse(widgetId);
        return t ? Promise.resolve(t) : Promise.reject(new Error("no-token"));
      }
      return new Promise(function (resolve, reject) {
        pending = {
          resolve: resolve,
          reject: reject,
          timer: setTimeout(function () {
            settle(null, new Error("timeout"));
          }, 20000),
        };
        window.turnstile.reset(widgetId);
        window.turnstile.execute(widgetId);
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (button.disabled) return;
      var data = new FormData(form);
      button.disabled = true;
      button.classList.add("is-loading");
      say("", false);

      getToken()
        .then(function (token) {
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
          return fetch(SITE.formsEndpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          }).then(function (res) {
            return res.json().then(
              function (body) {
                return { ok: res.ok, body: body };
              },
              function () {
                return { ok: false, body: {} };
              },
            );
          });
        })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            say(
              type === "contact"
                ? "Thanks. We got your message. Check your inbox for a confirmation."
                : "You are on the list. Check your inbox for a confirmation.",
              false,
            );
          } else {
            say(r.body.error || "Something went wrong. Try again.", true);
          }
        })
        .catch(function (err) {
          if (err && err.message === "no-token") say("Complete the spam check first.", true);
          else if (err && err.message === "network") say("Network error. Try again.", true);
          else if (
            err &&
            (err.message === "spam-check" ||
              err.message === "timeout" ||
              err.message === "not-ready")
          )
            say("Spam check failed. Reload the page and try again.", true);
          else say("Network error. Try again.", true);
        })
        .then(function () {
          button.disabled = false;
          button.classList.remove("is-loading");
          /* Tokens are single use. Always start the next attempt clean. */
          if (widgetId !== null) window.turnstile.reset(widgetId);
        });
    });
  });
})();
