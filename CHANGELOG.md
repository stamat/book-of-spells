# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**How to use it:** land changes under `## [Unreleased]`, grouped under _Added_, _Changed_,
_Deprecated_, _Removed_, _Fixed_ or _Security_. Releasing is `script/publish`: it runs
`script/changelog`, which renames that heading to the version and date, starts a fresh
`[Unreleased]`, and hands the entry to the GitHub release as its body. Write entries
for the person upgrading, not for the person who wrote the code — say what changed and why it
matters, and link the function so they can find it.

Versions before 1.2.0 predate this file; see the [git tags](https://github.com/stamat/book-of-spells/tags).

## [Unreleased]

### Added

- **`keyboard`, a new subject module** — shortcuts, sequences, and the input-intent pair that
  used to live in `dom`.

  Every project that binds a shortcut writes the same handler, and writes it slightly wrong.
  The check is `event.key === 'k' && (event.metaKey || event.ctrlKey)`, which also fires on
  `Ctrl+Shift+K` — the web console, in two browsers — because the modifiers nobody named were
  never tested. Getting it right takes a test per modifier rather than per modifier you
  remembered, and then the same again for where it is allowed to fire.

  - **`matchesShortcut(event, spec)`** — whether a keydown is the shortcut a string
    describes. `mod+k`, `shift+alt+ArrowUp`, `Escape`. Pure, so a caller keeps its own
    listener; **modifiers the spec did not name must be up**, which is the part that makes
    the console shortcut unreachable. The key is compared to `event.key` without case *or* to
    `event.code` exactly — `alt+k` on macOS arrives as `˚`, and `alt+KeyK` is how to say it.
    An unknown modifier or a spec with no key throws, because a shortcut that silently never
    fires gives no reason.

  - **`bindShortcut(spec, handler, options)`** — the listener, returning its own unbind.
    `when` and `except` are selectors rather than a boolean, so one page can hold a shortcut
    that works everywhere, one that works only inside an editor, and one that works everywhere
    *but* an editor, as a setting instead of three code paths. Repeats and IME composition are
    ignored; `preventDefault` is on.

  - **`bindSequence(specs, handler, options)`** and **`konamiCode(handler, options)`** — a run
    of shortcuts in order, forgotten `timeout` ms after each step. A wrong key restarts the
    run and is then tried as its first step, so `↑ ↑ ↑ ↓` still reaches step three. Modifier
    keydowns pass through, without which no step could contain a modifier. `preventDefault` is
    **off** here: a step matches long before the sequence does, and preventing every `ArrowUp`
    would stop the page scrolling for everyone who never finishes.

  - **`EDITABLE`** — the selector for the places a person types, for `except`.

  On aliases: `mod` is Command on Apple platforms and Control everywhere else, and `cmd` and
  `ctrl` mean *themselves*. Folding those two into "whichever this machine calls primary"
  reads better for the nine bindings in ten that want it and takes away the only way to say
  the tenth — macOS keeps the Emacs bindings (`Ctrl+A`, `Ctrl+E`, `Ctrl+K`) live inside every
  text field, so an editor binding literal Control on a Mac is ordinary and would become
  unsayable. `meta`/`cmd`/`command`/`super`/`win`, `ctrl`/`control`, `alt`/`option`/`opt` and
  `shift` are the spellings; anything else throws.

  Shaped after [tinykeys](https://github.com/jamiebuilds/tinykeys), which settled the `$mod`
  token and the exclusivity check over
  [`KeyboardEvent.getModifierState()`](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState).
  What is different: no listener registry, and no key-sequence syntax inside the string — a
  spec here is one press, and a run of them is an array.

### Changed

- **`watchInputIntent` and `isKeyboardIntent` moved from `dom` to `keyboard`.** Importing from
  the package root is unaffected; a deep import of `book-of-spells/src/dom.mjs` for either of
  these has to change to `src/keyboard.mjs`.

- **`swipe(element, callback, threshold, timeThreshold)`** in `dom` reads pointer events —
  `pointerdown`, `pointerup`, `pointercancel` — instead of a `touchstart`/`touchend` pair with
  `mousedown`/`mouseup` beside it. One code path whatever the hand is holding: a pen swipes
  without waiting on emulated mouse events, a gesture the browser takes back mid-scroll is
  dropped instead of finishing as a swipe when the finger lifts, and a second finger abandons
  the gesture rather than answering it with the first finger's numbers, which are noise from
  the moment a pinch starts.

  Two behaviour changes come with it:

  | | before | now |
  |---|---|---|
  | a diagonal | both axes reported, `direction` an array | the axis it travelled furthest along, `direction` always a string — equal travel is no swipe |
  | the click after a swipe | fires, and a link under the finger navigates | swallowed in capture when a swipe committed, `detail` letting Enter on a link through |

  A gesture as far down as across says nothing about which was meant, and reporting both left
  the caller to pick anyway. The click is the one that bites in the field: a browser stops
  synthesising it past a slop most thresholds clear — most, not all, and the one that still
  fires navigates away from a page the reader was only swiping through.

  `mouse: false` in the options object refuses the mouse, because reading a drag from a
  desktop pointer costs the page its text selection, its image dragging and its link clicks —
  right for a carousel of linked slides, wrong where the drag *is* the interaction. It stays
  on by default, so a mouse swipe keeps working where it already did. Thresholds are
  untouched: 150px, 0ms.

### Fixed

- **`swipe`** dispatched its `swipe` event only when a callback was passed, so the
  listener-only usage its own `@example` shows — `element.addEventListener('swipe', ...)` —
  never fired. The event now fires whenever the gesture qualifies, callback or not.

- **`swipe`** marked the element with a `swipe-enabled` attribute and refused to bind an
  element twice, returning `undefined` rather than a handle — and `destroy()` never cleared
  the attribute, so an element that had been unbound could never be bound again. The attribute
  is gone; each call returns its own `destroy` and the caller owns it. Without an element it
  returns `null` now, as its `@returns` always said.

## [1.6.0] - 2026-08-06

### Added

- **`deepEqual(a, b)`** in `helpers` — structural equality for data: property order,
  reference identity and prototype don't matter, contents do. Needed by the
  [jules](https://github.com/stamat/jules) rewrite, where `enum` and `uniqueItems`
  compare JSON values and the 2013 code faked it with CRC32 hashes — equal hashes
  don't prove equal values.

  Revisits [JavaScript object comparison](https://stamat.wordpress.com/2013/06/22/javascript-object-comparison/)
  (2013) and settles what that post left open: cycles terminate now (a WeakMap
  tracks pairs under comparison), NaN equals NaN, and Map, Set, typed arrays and
  symbol keys — none of which existed then — compare by content. Functions still
  compare by reference only: functions are not data. Node has
  `util.isDeepStrictEqual`; browsers have nothing, which is why it earns a place
  here.

  Host objects that stringify themselves — URL, Error and kin — compare by
  their string form: an own-property walk would see two empty objects and call
  any pair of them equal. Cross-realm values (iframe, `node:vm`) compare
  correctly because dispatch never touches realm-bound constructors.

  Probed against the field (fast-deep-equal 3.1.3, dequal 2.0.3, lodash.isequal
  4.5.0, Node 25, 2026-08): the only one of the five passing all fifteen
  correctness probes — the others variously overflow on cycles, silently ignore
  symbol keys, or miss invalid-date and typed-array-NaN equality. The price is
  modest: the cycle guard is depth-gated so shallow acyclic data never pays for
  it — ~7.1M ops/s on small flat objects where fast-deep-equal does ~10M, and
  within ~15% of it on nested documents, at ~1KB min+gzip. The remaining flat
  gap is the symbol-key pass the faster libraries skip. The function's JSDoc
  carries the full comparison table.

- **`dedupe(arr)`** in `helpers` — structural dedup of an array: `deepEqual`
  decides what a duplicate is, the first occurrence wins, the input stays
  untouched. The other half of the jules rewrite: `uniqueItems` asks "have I
  seen this value" across thousands of JSON documents, where pairwise
  `deepEqual` is O(N²) and a reference-keyed `Set` sees no duplicates at all.

  The internals are [HashCache](https://stamat.wordpress.com/2013/07/03/javascript-quickly-find-very-large-objects-in-a-large-array/)
  (2013) grown up: hash into buckets, let deep equality settle matters only
  inside a bucket. What changed since 2013 is the hash — values fold to a
  32-bit FNV-1a during one walk of the live data, so no canonical string and
  no CRC table. Measured on 11,351 real GitHub event objects with 10% seeded
  duplicates (Node 25, 2026-08): the fold dedupes in ~91ms, hashing a
  canonical string instead takes ~274ms, a table-driven JS CRC32 over that
  string ~369ms, and pairwise `deepEqual` 7.3s. On a generated mixed-shape
  corpus it holds near-linear to a million: 3.1s for 1.1M documents, against
  11.4s for the canonical-string key — and the folk `JSON.stringify`-as-key
  dedup both misses ~99% of key-order-shuffled duplicates and still loses on
  time past half a million. The hash stays deliberately
  coarse where deepEqual is subtle — Sets and Maps fold by size, Errors by
  tag — because a hash finer than `deepEqual` would split real duplicates
  into separate buckets and miss them, while a shared bucket only costs one
  comparison; correctness never rests on the hash.

- **`bench/`** — benchmarks as a convention beside the tests: `script/bench`
  runs every `bench/*.bench.mjs`, each a plain node script over a
  deterministic generated corpus, and each asserts its contenders' output is
  correct before timing it — a bench that times wrong code measures nothing.
  First occupant: `dedupe` against its 2013 ancestor HashCache (CRC32 over
  the ordered stringify, buckets, deep-compare in the bucket), a
  canonical-string key, the (unsound) `JSON.stringify` key, and pairwise
  `deepEqual`. Not shipped in the package.

## [1.5.0] - 2026-07-31

### Added

- **`watchInputIntent(doc)`** and **`isKeyboardIntent()`** in `dom` — is the person driving
  the page with a keyboard or with a pointer. Pulled out of
  [code-preview-element](https://github.com/stamat/code-preview-element), where an editable
  code block shows a `Press Esc, then Tab, to leave the editor` hint that is advice for
  someone who tabbed in and noise for someone who clicked in and can click back out.

  `:focus-visible` does not answer this. It matches a text input or a `contenteditable` on a
  mouse click too, because a browser assumes anything taking text input wants its focus ring
  — right for a ring, wrong for deciding whether to show a hint or move focus somewhere a
  mouse user never asked to go.

  ```javascript
  watchInputIntent(); // once, early — before any focus you mean to judge

  element.addEventListener('focusin', () => {
    element.classList.toggle('is-key-focus', isKeyboardIntent());
  });
  ```

  Listeners are attached in capture, so a `pointerdown` handler that calls
  `stopPropagation` — drag implementations do, routinely — cannot hide the switch to
  pointer. `pointerdown` rather than `mousedown`, so a pen and a touch count without waiting
  on emulated mouse events. Pointer until proven otherwise, so focus arriving on load is not
  mistaken for a Tab. A document is watched once however many components ask, and takes a
  `doc` argument for watching inside an iframe.

  This supersedes [focus-outline](https://github.com/stamat/focus-outline), whose other half
  — hiding the outline on click — is `:focus-visible` now.

- **`elements` module**, exported from the package root like the rest. The parts of a custom
  element that are arithmetic rather than DOM: where a key moves focus, and where a panel
  fits. They take numbers and strings and give back an index or a placement — no element is
  touched, nothing is measured — so a menu, a tablist and an accordion can share one keyboard
  implementation, and all of it is testable without a browser.

  - **`nextIndex(current, key, length)`** — the key map every wrapping list of widgets uses:
    Down/Up step and wrap, Home/End go to the ends, anything else is `null` so the caller
    knows to leave the event alone. Nothing focused (`-1`) plus Up lands on the last item,
    which is where a menu button opened with Up is meant to go.

  - **`stepIndex(current, key, length)`** — the same map for a list with ends, where running
    off one is how you get back to the rest of the page. Answers to both axes, so a toolbar
    and a vertical stack share it, and returns `null` at the ends instead of wrapping.

  - **`typeAheadIndex(labels, current, buffer)`** — where a type-ahead lands. Two rules that
    look like edge cases and are not: a repeated letter cycles the items starting with it,
    because `aaa` is someone pressing `a` three times looking for the next "Archive"; and a
    one-character search starts *after* the focused item while a longer buffer starts *at* it,
    so pressing a letter again moves on but typing more narrows onto where the reader already
    is.

  - **`placeFlyout(trigger, panel, viewport, rtl)`** and
    **`placeSubmenu(item, panel, viewport, rtl)`** — which side a floating panel opens to, one
    decision per axis, returned as logical `side`/`align` strings for the CSS to place. The
    preferred placement wins ties and wins when neither side fits, so a panel with nowhere
    good to go still lands where the reader expects. `rtl` picks which physical edge counts as
    the inline start.

    ```javascript
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    placeFlyout(button.getBoundingClientRect(), { width: 200, height: 300 }, viewport, false)
    // => { side: 'block-end', align: 'start' } with room below
    // => { side: 'block-start', align: 'end' } near the bottom right corner
    ```

  - **`fits(at, size, limit)`** — whether a box of `size` starting at `at` is inside `limit`,
    checking both ends, since a panel running off the top is as unreachable as one running off
    the bottom. What the two placement functions are built out of, exported because a third
    placement is always coming.

  - **`define(tag, ctor)`** and **`ElementBase`** — register a custom element in the browser
    only, and only once, so a module is safe to import twice or under Node; and extend
    `HTMLElement` where there is one, a plain class where there is not, so a custom element
    module still imports under test.

- **`decodeFragment(hash)`** in `browser` — the id a `#fragment` names, out of an `href` or out
  of `location.hash`, both of which arrive with the `#` still attached.

  ```javascript
  decodeFragment('#caf%C3%A9') // => 'café'
  decodeFragment('#100%') //      => '100%', kept as written
  ```

  Decoded, because `id="café"` is reached by `href="#caf%C3%A9"` and the two have to meet
  somewhere. A fragment that will not decode is taken as written rather than thrown over: a
  stray `%` is a typo in one link, not a reason for the caller to stop working.

### Notes

- `elements` arrives with 28 tests, plus one for `decodeFragment`: 195 passing.

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
