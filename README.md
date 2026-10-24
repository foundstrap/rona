# RONA marketing site · master

This is the master marketing site (decided 2026-10-18). Version A is archived in `../archive/website-a/`.

Style: cyberbougie (sleek, tech Memphis), bento tiles, Swiss 12-column grid, texture on shapes and surfaces. Dark only. Sharp corners. Fonts: Funnel Display, Atkinson Hyperlegible Next, Atkinson Hyperlegible Mono (labels and data only).

Static site. HTML, CSS and vanilla JS. No build step.

| File                                                                                                                       | What                                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                                                                                                               | Landing page (option 2, approved 2026-10-13): Scene hero and all landing sections                                                                                                                               |
| `how-it-works.html`, `features.html`, `roadmap.html`, `faq.html`, `about.html`, `contact.html`, `privacy.html`, `404.html` | Inner pages. `features.html` has 7 feature groups (6 for the first release, 1 roadmap). `404.html` is `noindex`                                                                                                 |
| `styleguide.html`                                                                                                          | Internal: sitemap, design system, UI kit. `noindex`                                                                                                                                                             |
| `archive/index-option1.html`, `archive/problem-preview.html`                                                               | Internal archive: landing option 1 and the Problem approval page. `noindex`. Not linked from the live pages                                                                                                     |
| `assets/css/tokens.css`                                                                                                    | All tokens: near-black base, Outer Space tiles, accents Pulsar (brand), Plasma, Ion, Flare, gradients, grain, grid                                                                                              |
| `assets/css/base.css`                                                                                                      | Reset, type, `.cols` 12-column grid, `.label` mono labels                                                                                                                                                       |
| `assets/css/components.css`                                                                                                | Buttons, fields, waitlist, tags, `.bento` + `.tile` variants, segmented, accordion, header, footer                                                                                                              |
| `assets/css/styleguide.css`                                                                                                | UI kit page only                                                                                                                                                                                                |
| `assets/css/sections-v2.css`                                                                                               | Option 2 rhythm (`body.rhythm-2`, on the live pages): calmer section heads, Problem head left and collage right, numbered step boxes and arrows, Trust 2×2                                                      |
| `assets/css/hero.css`, `assets/js/hero.js`                                                                                 | Scene hero: moodboard → Generate → design system (GSAP timeline, replay button)                                                                                                                                 |
| `assets/css/sections.css`, `assets/js/sections.js`                                                                         | Landing sections: Problem collage, pinned How it works, bento Features, Who, Export, Roadmap, Trust, FAQ, CTA. `sections.js` also runs the `[data-reveal]` animation on every page (IntersectionObserver + CSS) |
| `assets/css/pages.css`, `assets/js/pages.js`                                                                               | Inner pages: page head, feature groups, plans, roadmap vote, FAQ filter, about, contact, privacy                                                                                                                |
| `assets/js/main.js`, `assets/js/site.config.js`                                                                            | Brand name and year (`[data-brand]`, `[data-year]`), mobile nav, GSAP float motion                                                                                                                              |
| `assets/vendor/gsap.min.js`, `assets/vendor/ScrollTrigger.min.js`                                                          | GSAP 3.12.5, self-hosted (from the npm package `gsap@3.12.5`, GreenSock standard license)                                                                                                                       |
| `assets/favicon.svg`                                                                                                       | Favicon, from the `logo-mark` symbol                                                                                                                                                                            |
| `partials/sprite.svg`                                                                                                      | The only SVG sprite: `b-*` shapes (gradient + grain filter built in), icons, logo. Pages use `<use href="partials/sprite.svg#id">`. The sprite uses width/height 0, not `display:none`, so gradients render     |

## Notes for the builder

- **Serve over http.** The pages use the external sprite. Chromium does not load an external `<use>` file over `file://`, so icons and shapes do not show when you open a file directly. Use a local server, for example `python3 -m http.server`.
- **No JS.** Each page head sets `html.js`. Without JS, all content shows: no reveal animation, the hero replay button stays hidden, and How it works shows all 4 steps and their visuals one after the other.
- **Forms.** No waitlist or contact provider is chosen. The waitlist forms are disabled and say "Waitlist opens soon." The contact page says "Contact opens soon." Add the provider and the form code when the owner decides.
- **Roadmap vote.** The pick is saved in this browser only (`localStorage` key `roadmap-vote`). It is not sent anywhere.
- **SEO.** Each live page has a meta description, Open Graph (`og:title`, `og:description`, `og:type`), `twitter:card` and a favicon. There is no `canonical` link, no `og:url` and no `og:image`, because the domain is Open. Add them when the domain is known.
- **Home links** use `index.html` (not `./`), so they also work from `file://`.

## Open items

These facts are Open in `knowledge-base/general/05-open-facts.md`. The live pages do not show placeholders for them. Add them when the owner decides.

| Item                                                                             | Where it goes                                                      |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Domain                                                                           | `canonical`, `og:url`, `og:image` in each page head                |
| Company or legal entity name and address                                         | Footer copyright (now "© 2026" only), privacy page contact section |
| Contact email                                                                    | Contact page, footer                                               |
| Social channels                                                                  | Contact page, footer                                               |
| Waitlist provider and waitlist benefit                                           | Waitlist forms, final call to action                               |
| Contact form provider                                                            | Contact page                                                       |
| AI model provider                                                                | Privacy page, "AI and images"                                      |
| List of service providers                                                        | Privacy page, "Who we share data with"                             |
| Analytics and cookies (now: none on this site)                                   | Privacy page, "What we collect" and "This website"                 |
| Legal basis, retention periods, rights under the law that applies (legal review) | Privacy page, "Your choices and rights"                            |
| Team and founder story                                                           | About page (the founder section was removed on 2026-10-18)         |

Milestones: B1 design system and UI kit · B2 hero · B3 landing page · B4 inner pages · 2026-10-18 audit fixes (see `../audit/changelog-website.md`).
