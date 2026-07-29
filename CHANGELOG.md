# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to use it:** land changes under `## [Unreleased]`, grouped under _Added_, _Changed_,
_Deprecated_, _Removed_, _Fixed_ or _Security_. Releasing means renaming that heading to the
version and date, running `npm version`, and starting a fresh `[Unreleased]`. Write entries
for the person upgrading, not for the person who wrote the code — say what changed and why it
matters, and link the function so they can find it.

Versions before 1.2.0 predate this file; see the [git tags](https://github.com/stamat/book-of-spells/tags).

## [Unreleased]

## [1.4.0] - 2026-07-29

Four additions, pulled out of building the animated accordion in
[book-of-elementals](https://github.com/stamat/book-of-elementals). Everything here is new
surface — no existing function changed behavior.

### Added

- **`slide(element, from, open, callback)`** in `animations` — animates an element's height
  to or from its content height **without touching `display`**. The counterpart to
  `slideUp()`/`slideDown()` for elements whose visibility something else already owns: a
  `<details>` panel, a popover, a dialog. Those hide their own contents, so a slide that also
  sets `display` fights them — on `<details>` the inline `display: none` that `slideUp()`
  leaves behind survives the close and then keeps the body hidden even after the browser
  reopens it for find-in-page.

  The starting height is a parameter, which is what makes an interrupted slide recoverable:
  hand it the element's current height and it resumes from there instead of jumping.

  ```javascript
  details.open = true;
  slide(content, 0, true); // open

  slide(content, content.offsetHeight, false, () => {
    // close, then latch shut
    details.open = false;
  });
  ```

  Reduced motion, or no height transition in the CSS, finishes immediately and still calls
  back. The timer outlasts the transition by 10ms so it cannot land a frame early and tear the
  inline height off mid-animation, which shows as a snap at the end of an otherwise smooth slide.

- **`prefersReducedMotion(callback)`** in `browser` — whether the user has asked the system to
  minimize non-essential motion. An accessibility setting, not a preference. Built on
  `mediaMatcher`, so it both reads and listens, and returns `false` where `matchMedia` does not
  exist, making it safe to call outside a browser.

  ```javascript
  if (prefersReducedMotion()) duration = 0;

  prefersReducedMotion((reduced) =>
    document.body.classList.toggle("is-still", reduced),
  );
  ```

- **`getTransitionDuration(element, property)`** in `dom` — the duration a single property will
  actually transition with, in milliseconds. Unlike reading `getTransitionDurations()` by key,
  it resolves the `all` keyword: a `transition: all 1s` animates height too, it just isn't
  listed under that name.

  ```javascript
  getTransitionDuration(element, "height"); // 1000 with `transition: height 1s`
  getTransitionDuration(element, "height"); //  300 with `transition: all 0.3s`
  getTransitionDuration(element, "height"); //    0 with `transition: opacity 1s`
  ```

  An untransitioned property reads as `0`, which is also what `transition: none` computes to —
  so a reduced-motion media query switching the transition off reads as "no animation", and a
  timer driven off this value collapses to instant on its own.

- **`readOptions(element, schema)`** in `dom` — reads a set of typed options off an element's
  attributes, accepting the bare, kebab-case and `data-*` spellings, with `data-*` winning when
  both are present.

  ```javascript
  // <div data-page-step="25" exclusive label="FAQ">
  readOptions(element, {
    pageStep: "number",
    exclusive: "boolean",
    label: "string",
    muted: "boolean",
  });
  // => { pageStep: 25, exclusive: true, label: 'FAQ' }
  ```

  Only the options actually present come back, so the result merges cleanly over whatever
  defaults the caller holds. Booleans follow HTML rather than JavaScript — a bare attribute
  parses as an empty string and means "on", and only `false` and `0` mean off. Numbers go
  through `stringToNumber`, so values that do not fully parse are dropped rather than returned
  as `NaN`.

### Fixed

- `types/` regenerated, picking up the `RE_VIDEO` documentation change that shipped in 1.3.1
  without a matching declaration rebuild.

### Notes

- `animations` had no test file before this release. It has one now: 18 new tests, 166 passing.

## [1.3.1] - 2026-07-29

### Fixed

- `RE_VIDEO` now matches QuickTime containers, and video URLs carrying a query string or hash.

## [1.3.0] - 2026-07-26

### Changed

- **Breaking:** `drag()` reports velocity in different units. Velocity is now sampled over a
  window of pointer positions rather than the last two, and inertia is scaled by frame delta so
  it behaves the same on any refresh rate.

### Added

- Velocity sampling options, state and helpers on `drag()`.

## [1.2.0] - 2026-07-16

### Added

- `entities` module, split out of `parsers` — `encodeHtmlEntities` and `decodeHtmlEntities` stay
  re-exported from `parsers` for backwards compatibility.
- `delegateEvent()`, which handles non-bubbling DOM events and can be cleanly torn down.
- `humanize()` helper.

### Fixed

- Prototype pollution in `shallowMerge`/`deepMerge`.
- Bugs in the fade animations, `reject*`, the cookie helpers and the crypto helpers.
- `random()` returned `[0, 1]` where it should have been `[0, 1)`.
- `stringToType('0')` returned the string `'0'` instead of the number `0`, and `stringToNumber('0')`
  returned nothing.

[Unreleased]: https://github.com/stamat/book-of-spells/compare/v1.4.0...HEAD
[1.4.0]: https://github.com/stamat/book-of-spells/compare/v1.3.1...v1.4.0
[1.3.1]: https://github.com/stamat/book-of-spells/compare/v1.3.0...v1.3.1
[1.3.0]: https://github.com/stamat/book-of-spells/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/stamat/book-of-spells/compare/v1.1.1...v1.2.0
