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

## [2.8.0] - 2026-08-24

### Added

- **[`drag`](https://stamat.github.io/book-of-spells/module-dom.html#.drag) takes `axis`: the axis
  the flick and the glide run along.** A glide is two-dimensional and over once both velocities
  have decayed, and a slider reads one of them: a flick along a horizontal track carries some
  velocity across it too, and that one can outlive the one along the track by most of a second —
  the handle sat still at the wall, `draginertiaend` not yet said, and whatever the caller
  reports as *settled* waiting on movement nobody could see. Named `'x'` or `'y'`, the other
  axis reads `0` in every `velocityX`/`velocityY` and carries nothing, so the glide is over when
  this one is. Anything else is both, which is what it was.

  Extracted from [compare-images-slider](https://github.com/stamat/compare-images-slider), which
  moved its glide onto `drag`'s and found `change` waiting on the axis it does not read.

- **`drag` caps the flick in per cent when told to: `maxVelocity: '0.5%'`.** A number is pixels
  per millisecond, as before. A string ending in `%` is per cent of `within` per millisecond —
  width for x, height for y — which is the unit the percentages are already in, and the one that
  keeps the same flick reading the same on a narrow track and a wide one: in pixels, a cap that
  fits a 1000px track lets a flick carry five times as far, relative to the track, on a 200px one.
  The sum was the one thing compare-images-slider still did itself, measuring at each press the
  box `drag` had just measured. A cap that does not parse as a number is now the default, where it
  was a `NaN` that `clamp` read as no cap at all.

### Fixed

- **`destroy()` from inside a glide frame now stops the glide.** The next frame was booked after
  the callback and the `draginertia` event, so a caller ending the gesture from either cancelled
  the frame already spent and the glide carried on as if nothing had been said. The frame is
  booked first now.

## [2.7.0] - 2026-08-24

### Added

- **`clamp(value, min, max)`** — hold a number inside an inclusive range. `NaN` comes back as
  `NaN` rather than as a bound, because neither comparison is true of it and a range check that
  quietly answered `0` would be the wrong number wearing a right one's clothes. Capping a
  magnitude while keeping its sign is `clamp(v, -max, max)`, which is what `drag`'s
  `maxVelocity` now is.

- **`sampleVelocity(samples, windowMs)`** — how fast a gesture is moving, out of the samples it
  has left behind, measured over a window of time rather than between the last two. A
  single-frame delta spikes on a quick flick — one large jump between two events sends whatever
  reads it straight to an extreme — and averaging the displacement over the last `windowMs`
  smooths those spikes out.

  Every numeric field except `t` is measured, so the answer wears the shape of the samples:
  `{ t, x, y }` comes back as `{ x, y }`, `{ t, position }` as `{ position }`. One pass whatever
  the number of dimensions. Fewer than two samples is not a speed and reads zero for the keys
  the samples do carry — not an empty object a caller reads `undefined` out of and multiplies
  into a `NaN` that outlives the gesture — and two samples stamped the same millisecond are a
  question with no answer rather than an infinite speed.

  Both were `drag`'s own, written twice: once here and once in
  [compare-images-slider](https://github.com/stamat/compare-images-slider), which samples its
  gesture in per cent where this one samples pixels. Two copies of one sum is the reason it is a
  helper.

### Changed

- **`drag` takes `within`: the box the percentages are about.** `relativeX`/`relativeY` and
  `xPercentage`/`yPercentage` are measured against the element being dragged, which is the right
  answer right up until the thing being dragged is a handle running along a track. A grip is a
  few pixels of the track it slides on, so `xPercentage` off it answers a question about the
  grip, and every caller wanting *how far along the track is this* did the sum itself. Name the
  track and it is that number directly, held to `0`–`100` at the ends — a slider, a splitter or
  a before-and-after comparison in one read. Inertia bounces off the same box.

  Nothing moved for callers that do not pass it: the default is the element being dragged, and
  anything that is not an element falls back to that default.

  ```javascript
  drag(handle, { within: track, callback: (d) => setPosition(d.xPercentage) })
  ```

## [2.6.0] - 2026-08-24

### Changed

- **`drag` runs on pointer events now, and captures the pointer.** It listened for
  `mousedown`/`touchstart`: two code paths, and a pen answered by neither. One path now covers
  mouse, touch **and pen**. The pointer is captured on the way in — touch and pen the browser
  captures implicitly, the mouse it never did — so a mouse drag keeps reporting after it has
  left the element, and whatever the pointer crosses on the way hears nothing of it. The moves
  are still heard on the document for as long as the gesture lasts, as `mousemove` was, because
  that is the one thing capture does not survive: the moment the captured element is
  disconnected the
  [spec hands the capture to the document](https://w3c.github.io/pointerevents/#implicit-release-of-pointer-capture),
  and `insertBefore` on a connected node disconnects it first. A list that reorders itself by
  moving the dragged row hits that on the first crossing. Everything this needs — pointer
  events, pointer capture, `touch-action: none` — is in Safari 13 and
  [iOS 13.2](https://caniuse.com/pointer); below that the listener attaches and nothing arrives.

  Nothing in the contract moved: the same options, the same `callback`, the same `dragstart` /
  `drag` / `dragend` / `draginertia` / `draginertiaend` events, the same `detail` fields, the
  same `{ destroy }`. Existing callers need no change.

### Added

- **`drag` takes a `pointerdown` as well as an element**, starting that one gesture there and
  then and taking its listeners away when the pointer is let go. That is what a caller with a
  single *delegated* listener has, and the only shape that works over a list whose rows come and
  go: attaching per row is a listener per row and a re-attach every time the list grows one.
  `opts.target` says where to capture and dispatch when the listener is on a container and the
  gesture belongs to a handle inside it. Started this way nothing is written into the element —
  no `drag-enabled`, no `dragging`, no `touch-action` — because it is an element the caller
  already owns, and `touch-action` is decided long before a `pointerdown` is dispatched.
- **`dragcancel`, for a gesture the platform took away** — a touch it decided was a scroll, a
  call arriving. There was no `pointercancel` or `touchcancel` path before, so a taken gesture
  left `dragging` true for good: a lifted card that never came down. It fires instead of
  `dragend`, never coasts into inertia, and drops the velocity it was carrying, because a
  cancelled drag is not a drag anybody finished.
- **`clientX` and `clientY` on the detail**, beside the page coordinates already there. They are
  the ones `getBoundingClientRect` answers in, so anything comparing a drag against element
  boxes stops converting by hand.
- **`pointerType` on the detail** — `mouse`, `touch` or `pen`, for a caller that treats one
  differently.

### Fixed

- **A `pointermove` that moved nowhere no longer reports one.** A pen changing pressure or tilt
  sends one, and a `drag` carrying a delta of zero tells the caller nothing it can act on while
  costing it a full handler. Both coordinate pairs are compared, because they come apart: a page
  scrolling under a stationary pointer changes `pageY` and leaves `clientY` where it was, and a
  caller reading page coordinates is owed that one.
- **`drag` reported the previous gesture's coordinates as the new one's `prevX`/`prevY`.** The
  first `drag` event after a fresh `pointerdown` carried a delta from wherever the last drag
  ended, which on a second grab across the page is a jump nobody made.
- **A drag held still before letting go no longer coasts.** The flick was measured up to the
  last move rather than the release, so stopping the pointer and then lifting it still threw the
  element wherever it had last been heading. The velocity window ends at the release now.
- **`preventDefaultTouch` now takes the touch gesture with `touch-action: none` on the element**,
  restored by `destroy`. Preventing the default on the events could not do it: by the time a
  move arrives the browser has already decided the gesture is a scroll. Same option name, same
  default, and it finally does what it says on a touchscreen.

  Known and not changed: the events are named `dragstart`, `drag` and `dragend`, which are also
  the native HTML drag and drop event names, so a page listening for the native ones on the same
  element hears these too. Renaming them is a breaking change; `callback` is the way around it
  for now.

## [2.5.0] - 2026-08-22

### Added

- **`userActivity` — whether anyone is still reading.** Calls back with `false` once `timeout`
  milliseconds pass with no interaction, and `true` the moment the user comes back, so a video
  can pause itself, a poll can stop polling, or a session can end where it should. Only the
  changes are reported: a reader scrolling steadily gets one `true` at the end of their pause,
  not one per event, and the page starting out active is not reported at all, being the state
  every caller already has. The native `IdleDetector` is no substitute — Chromium-only, gated
  behind the `idle-detection` permission, and answering whether the machine is idle or its
  screen locked rather than whether this page is being read. The deadline is checked against
  the clock rather than trusted to the timer that woke it: a timer clamped by a background tab,
  frozen outright, or held up by a long task wakes late, and waking late is taken as proof the
  user is idle instead of a reason to doubt it — a tab returning from hidden checks its deadline
  on `visibilitychange` for the same reason, since nothing may have run while it was away. That
  clock is `performance.now()`, so an NTP correction or a daylight-saving change cannot take the
  deadline with it. A pointer reporting the coordinates it reported last time is ignored, so
  content moving under a parked cursor cannot pass for someone reading — scrolling is the one
  self-movement that still can, `scroll` staying in the defaults for the scrollbar drag some
  browsers fire no pointer events for, so a page that scrolls itself should pass `events`
  without it. Listening happens on
  `window`, in the capturing phase: a widget that stops its own events from propagating cannot
  read as the user having left, and the events only `window` ever receives arrive too — `resize`
  is one of the defaults, the user being the one dragging the window. Answers for this tab alone
  unless `channel` names a `BroadcastChannel`, in which case every tab of the origin using that
  name agrees: activity in any of them counts in all of them — provided they share a `timeout`,
  since what travels is the activity and never the verdict, each tab judging idle against its
  own deadline. That is what a session deadline
  wants — three tabs open and work happening in the third should not log the first two out — and
  what a pausing video does not, a user reading elsewhere being exactly when this tab should
  stop playing, so it is a name to opt into rather than a default. What goes out is throttled, a
  message per `pointermove` being sixty a second to every other tab, and nothing is sent about
  going idle: each tab derives that from the same activity and arrives there on its own. Where
  `BroadcastChannel` is missing, each tab falls back to answering for itself. `destroy()` removes
  every listener and leaves the channel.

- **`whyNotSticky` — why a sticky element is not sticking.** `position: sticky` fails silently:
  no error, no warning, an element that simply never moves. The usual cause is an ancestor with
  `overflow: hidden`, `scroll`, `auto` or `overlay`, which makes it the scrollport the element
  sticks inside — and when that ancestor never scrolls, the element can never move. Call it with
  a selector, an element, a list of either, or nothing at all to sweep the page, and each finding names the culprit
  element, the problem and the fix: `overflow-y: clip` clips the same and creates no scrollport.
  No DevTools will tell you: neither engine's inactive-CSS pass has a rule for sticky — both only
  grey out `top`/`left` on a `static` box — and the `scroll` badges mark containers that really do
  scroll, while the one that breaks stickiness is a box that never scrolls at all. Also
  reported: insets all left at `auto`, a containing block with no room to travel, and an ancestor
  the element legitimately sticks inside rather than to the viewport. What it cannot see is
  `contain` and `content-visibility` on an ancestor, and `html`/`body` overflow, whose value
  propagates to the viewport — so an empty result means nothing was visible from here, never that
  the element sticks. A detached element is named `detached` rather than diagnosed: a real
  browser computes its every style to nothing, and reading that as `position` missing would
  prescribe what the element may already declare.

- **`waitFor` — for the value that arrives without telling anyone.** A third-party script that
  defines its global whenever it finishes, a widget that flips a flag, a player that becomes
  ready: no event, no callback, nothing to listen to. The usual answer is a `setInterval` and a
  `clearInterval` somebody forgets, so this is that loop with the forgetting designed out. Give it
  a condition, get a promise back, and it resolves with whatever the condition returned — not a
  bare `true`, so `await waitFor(() => window.dataLayer)` hands you the thing you were waiting
  for. This is not the function for an element appearing in the DOM; `on` is,
  because a MutationObserver reacts where polling only notices on its next tick.
  It waits ten seconds by default rather than forever, an unbounded poll being a timer nobody
  ever clears — `timeout: 0` waits as long as it takes and takes that leak back on. The deadline is
  measured against `performance.now()` and the last sleep is cut short to land on it exactly, so
  a background tab clamping `setTimeout` to a second cannot turn a two-second wait into a
  three-second one, and a condition that comes true on the deadline is still caught rather than
  overshot and reported as a timeout. An `AbortSignal` stops it where the caller went away, an
  async condition is awaited before it counts — though a promise still pending at the deadline is
  abandoned, rejecting on time rather than holding the wait open — and a condition that throws
  rejects rather than being retried — a broken check is a bug, not a reason to keep asking. What it cannot do is beat
  an observer: the answer is never fresher than the last `interval`, and 100ms is the default —
  `interval: 0` asks again every tick, for the caller who knows the wait is short.

## [2.4.0] - 2026-08-21

### Added

- **`scrollSpy` — which section the reader is actually in.** Give it the headings and it calls
  back with the current one whenever that changes, so a table of contents can mark its place.
  The current section is the last one whose top has passed the reading line, `offset` pixels
  below the top of the viewport — not the topmost one on screen, which is a different section
  as soon as a heading scrolls out of sight. `offset` takes a number or a function read every
  frame, so a header that collapses mid-scroll keeps the line where the reader's eyes are. Two cases the usual `IntersectionObserver`
  scrollspy gets wrong are handled: a final section shorter than the screen becomes current at
  the foot of the page rather than never, and scrolling between two headings that share one
  screen changes nothing in an observer's eyes but moves this one. Above the first section it
  reports `null`, leaving that decision where it belongs. Section positions are measured once
  and cached — a scrolled frame costs one document-height check, not a read per section — and
  the cache rebuilds on window resize, on the body changing size, on the document changing
  height — which covers a body pinned to 100% height whose box never grows — and when an
  `IntersectionObserver` probe sees a section cross a viewport edge with a rectangle that
  disagrees with the map, which catches shifts that changed no height at all. What none of
  those can see answers stale until `update()` is called, and that trade is stated in the
  docs rather than hidden. Follows the window's scroll only.

### Fixed

- `announcer`'s return type is a documented `Announcer` typedef rather than an inline record
  written in TypeScript syntax, which JSDoc could not parse - the docs build failed on it, and
  the emitted declaration had `say` as a bare `Function`. Editors now see
  `(message: string) => void` again.

## [2.3.0] - 2026-08-17

### Added

- **`announcer` — a live region, and the one way of putting something in it that a screen
  reader actually reads.** Two things go wrong with live regions and both are silent, which
  is why this is a helper rather than four lines at each call site. A region only announces
  text that arrives in one **already in the document**, so creating the element and filling
  it in the same breath announces nothing at all; and a region announces a *change*, so
  setting the same sentence twice is silent — the second copy, the second failed save, the
  second press of a toggle. Clearing first and setting in a later task is what makes the
  second one a change.

  `announcer(host, { className, role, delay })` returns `{ node, say, clear, destroy }`.
  Called when there is nothing to say, so the region exists before the first message; `say`
  is the clear-then-set; `destroy` drops a message still in the air when the element goes. A
  region already under the same class is adopted rather than a second one added, so calling
  it twice is safe.

  `delay` defaults to `0` — the next task, enough for two mutations to be recorded where one
  would otherwise be. It is an option rather than a constant because ARIA calls live region
  behaviour a strong suggestion that browsers, assistive technologies and users may override,
  so a page whose pairing needs longer can say so without patching this. The number has not
  been measured against NVDA, JAWS or VoiceOver and is not presented as tuned.

  Extracted rather than invented: three elements in
  [book-of-elementals](https://github.com/stamat/book-of-elementals) had written it out
  byte-for-byte.

## [2.2.0] - 2026-08-15

### Added

- **[`DeepSet`](https://stamat.info/book-of-spells/DeepSet.html) — a `Set` that decides
  membership by structure instead of by reference**, so `has` answers the question
  `new Set()` cannot: is a value like this one already in here?
  [`deepEqual`](https://stamat.info/book-of-spells/global.html#deepEqual) defines "like",
  and the fold buckets candidates first, exactly as
  [`dedupe`](https://stamat.info/book-of-spells/global.html#dedupe) does — a `DeepSet` is
  that pass kept rather than thrown away. `dedupe(arr)` is now literally
  `[...new DeepSet(arr)]`, one bucket loop in the library where there were about to be two.

  **Reach for it only when the same unchanging pile is asked about repeatedly.**
  `arr.some(x => deepEqual(x, value))` wins a single lookup outright and always will: a
  fold must read the whole value before it can say a word, where `deepEqual` abandons most
  candidates after a key or two. The index pays back from around thirty queries, and that
  figure barely moves between a thousand values and a hundred thousand.
  `bench/dedupe/membership.bench.mjs` is where the number comes from.

  Two limits are documented rather than designed away. **A value must not be mutated while
  it is in the set** — membership is decided by contents, so changing one strands it in the
  wrong bucket and it becomes unfindable, by structure and by its own reference. And **two
  `DeepSet`s are never `deepEqual`**: their members sit in private fields a structural walk
  cannot reach, so `deepEqual` refuses them by name the way it already refuses a `WeakMap`,
  rather than walking two objects with no own properties and calling them equal. Compare
  `[...a]` and `[...b]`.

  `delete` and `clear` are both there, and they do not cost the same. `clear` drops the
  index and the insertion order whole, for nothing. `delete` is linear in the size of the
  set where a native `Set` is O(1): insertion order is an array — which is what keeps `-0`
  from being handed back as `0`, as a native `Set` would — so the value has to be found in
  it and spliced out. Occasional removal is fine; dropping many at once is cheaper as a
  rebuild from a filtered iteration. Both take structure, not references, so
  `seen.delete({ a: 1 })` removes an equal object the caller never held. A member mutated
  while it is in the set cannot be deleted, for the same reason `has` stops finding it.

- **`bench/clone/capability.bench.mjs`** — what eight implementations actually copy, which
  no speed table shows: the cheapest clone of all is the one that drops what it does not
  understand. [`clone`](https://stamat.info/book-of-spells/global.html#clone) against
  `structuredClone`, a JSON round-trip, rfdc in both its tiers, lodash and es-toolkit
  `cloneDeep`, and ramda `clone`, over 18 copies that are either faithful or not.

  The table on `clone`'s JSDoc existed first as one session's hand-probing, checkable by
  nobody, myself included. This is that table with a command under it. `clone` scores 17 of
  18, and the row it loses is honest: 20,000 levels of nesting is a `RangeError` in seven of
  the eight, this library included. A JSON round-trip is the only column that survives it,
  having lost thirteen rows to get there. A second table reports where libraries
  legitimately disagree — a function shared or refused, a class instance kept or flattened,
  a frozen object thawed by all eight alike — and scores none of them.

  It needs no child processes, unlike its `deepEqual` counterpart: the dangerous inputs here
  are a cycle and deep nesting, and a walk that survives neither exhausts the stack and
  throws, which is catchable in the process it happens in.

- **`bench/clone/ecosystem.bench.mjs`** — the speed half, over plain objects, arrays,
  numbers and strings only, because those are the shapes all eight copy alike and a fair
  race needs a common denominator.

  It overturned a sentence already written above it. The JSDoc said to prefer
  `structuredClone` where it applies because it is native — which reads as "and therefore
  faster". It is not: a structured clone is a serialise and a deserialise rather than a
  walk, and it runs 1.5–5× behind on objects, 775k ops/s against 4.0M on a flat eight-key
  object. The advice stands and its reason changed. Reach for it because it ships with the
  platform, not because it is quick.

  It also found the shape `clone` is worst at, which no amount of re-reading the code was
  going to surface: **an array of 10,000 numbers, where es-toolkit does 14k ops/s against
  3k here and `structuredClone` 6k.** A long flat run of primitives is exactly what a
  per-key walk loses at, and the JSDoc says so now rather than quoting only the object
  shapes, where rfdc leads by 1.1–2.9× and this one is second.

  A second table runs the shapes they disagree on, marking `unsound` rather than timing a
  lost copy, and every cell there has to pass both structural equality and a
  no-shared-references walk — a "clone" that returns its argument is structurally equal to
  it and is not a clone.

- **`bench/dedupe/membership.bench.mjs`** — "is this document already in that pile?", the
  question [`dedupe`](https://stamat.info/book-of-spells/global.html#dedupe) does not
  answer. It is the bench that decided
  [`DeepSet`](https://stamat.info/book-of-spells/DeepSet.html) should exist, and it now
  guards the one number that class's documentation quotes:
  `arr.some(x => deepEqual(x, probe))` against `DeepSet` against a `JSON.stringify` key
  set.

  **The index pays from about 30 lookups, and that number barely moves between a thousand
  documents and a hundred thousand** — build and scan both scale with the pile, so their
  ratio does not. Against a probe that is absent it pays from about 13. One lookup is a
  scan every time: hashing must read the whole document, where `deepEqual` leaves most
  candidates after a key or two.

  The `JSON.stringify` row is the honest one. It is the fastest thing here against a
  document that is genuinely absent, and it is `unsound` against a document that is
  present with its keys in a different order — which is the case anyone reaches for it to
  handle.

- **`bench/deepEqual/capability.bench.mjs`** — what seven rival implementations can
  actually answer, which no speed table shows: skipping a shape is faster than reading
  it, so timing alone rewards whoever does the least.
  [`deepEqual`](https://stamat.info/book-of-spells/global.html#deepEqual) against
  fast-deep-equal in both its tiers, deep-eql, lodash, es-toolkit, ramda, and node's
  `util.isDeepStrictEqual`, over 29 pairs that are objectively equal or objectively not.

  It scores 28 of 29, tied with deep-eql and `isDeepStrictEqual` and not alone at the
  top. The one it loses, everyone loses: 20,000 levels of nesting is a `RangeError` in
  all eight. A second table reports the rows where libraries legitimately disagree —
  class instance against its plain twin, `-0` against `0`, a sparse hole against an
  explicit `undefined` — and scores none of them, because those are positions rather
  than defects.

  Every cell runs in a child process, which is not caution: fast-deep-equal's es6 build
  neither returns nor throws on a pair of equal `DataView`s. A hang cannot be caught in
  the process it happens in, so the boundary is what turns "the suite never finished"
  into a row naming the cell.

- **`bench/deepEqual/ecosystem.bench.mjs`** — the speed half, over plain objects,
  arrays, numbers and strings only, because those are the shapes all eight answer alike
  and a fair race needs a common denominator. Four scenarios rather than one number:
  `deepEqual` is roughly 7× faster than fast-deep-equal when the difference sits in the
  first key and loses to it on a fully-walked equal pair, and quoting either half alone
  misleads.

  A second table runs the shapes they disagree on, marking `unsound` instead of timing
  a wrong answer — and it gates on an equal *and* an unequal pair, because
  fast-deep-equal walks a Set's own enumerable properties, finds none, and calls every
  pair of Sets equal. On an equal pair alone that reads as a correct answer arriving ten
  times faster than anyone else's. It is not fast at Sets; it does not look at them.
  Node's `isDeepStrictEqual` genuinely wins the 10,000-byte `Uint8Array` row by ~20×.

- **`bench/dedupe/ecosystem.bench.mjs`** — [`dedupe`](https://stamat.info/book-of-spells/global.html#dedupe)
  against what people install for this job instead: lodash and es-toolkit
  `uniqWith(isEqual)`, ramda `uniq`, and object-hash used as a Map key. Same corpus and
  same correctness oracle as the scale bench, so the two tables read side by side, and
  every contender's output is asserted against the oracle before its time is reported.

  That table existed before as one session's hand-measured numbers, reproducible by
  nobody, myself included. With the rivals absent it prints the setup line and skips,
  so it never fails a run that did not ask for it.

- **`ecosystem.bench.mjs --collections`** — Sets and Maps of equal size, plus Dates as the
  control, which is the corpus that found the fold flaw fixed below and now guards it. The
  run existed to lose: the docs claimed a rival won this shape, and a claim with no number
  under it is an argument, not a measurement. It had one within a minute — 5.0 s against
  object-hash's 36 ms — and the fold changed the same day.

- **`--corpus <file>` on the dedupe benches**, taking a JSON array or NDJSON in place of
  the generated pile, so the numbers can be checked against data nobody designed for
  them. `npm run setup` downloads one hour of [GH Archive](https://www.gharchive.org/)
  events for it — the same 11,351 GitHub events the 2.0.0 numbers used, back as something
  you can rerun rather than a sentence claiming I did. Real events carry no duplicates at
  all, which is the fold's worst case: every document pays for a hash and none of them
  saves a comparison.

- **`bench/results/*.md`, committed** — every bench already printed markdown tables, so the
  harness now tees each run's stdout into a file rather than leaving it in a scrollback
  nobody diffs. A number under review is a number that gets checked; one you have to run the
  bench to see is one you take on faith.

  Each file closes with what the terminal never said: a legend giving the unit, what it
  measures and whether lower or higher is better, and the node version, CPU and exact
  command behind the numbers — a timing without the machine that produced it is not a claim
  anyone can check. Only the units a run actually printed are listed, so a capability bench
  answering in ✅ and ❌ carries no row about milliseconds. A bench that skipped for missing
  rivals writes nothing at all, which is what keeps a fresh checkout from blanking a result
  someone committed from a run that had them.

### Changed

- **[`clone`](https://stamat.info/book-of-spells/global.html#clone) keeps prototypes.** A
  class instance clones into an instance of its class, methods and all — where it used to
  flatten to a plain object, and where `structuredClone` still does. The constructor is not
  re-run, so anything held in a closure or a private field does not come along.

  One smaller shift alongside it: an own enumerable **symbol key** is copied where it used
  to be dropped — `structuredClone` still drops those.

- **[`dedupe`](https://stamat.info/book-of-spells/global.html#dedupe) separates Sets and
  Maps now instead of piling them into one bucket.** Their members fold too, commutatively
  — each hashed from the seed, the results summed — so insertion order still cannot reach
  the hash and two equal collections still meet in the same bucket.

  Before, a Set or a Map folded on `size` alone, so a pile of equal-size ones shared a
  single bucket and the in-bucket comparisons became the O(N²) scan the fold exists to
  delete: **4,000 equal-size Sets took 5.0 s, where object-hash did the same pile in 36 ms.
  Now 4 ms.** Maps, 1.7 s → 4 ms.

  The bill is a walk per member on every collection, whether or not it saves anything, so
  a pile of large Sets folds dearer than a pile of small documents — and one pair of them
  is still a [`deepEqual`](https://stamat.info/book-of-spells/global.html#deepEqual) job,
  not a `dedupe` one. Values without Sets or Maps in them fold exactly as before.

  Not a correctness change in either direction: the old hash was coarse, never wrong, and
  `deepEqual` decided every answer then as now.

- **Benchmarks are per function now** — `bench/<function>/*.bench.mjs` instead of a flat
  `bench/`, `bench/harness.mjs` still shared, everything else a bench needs sitting next
  to it. `script/bench` walks the directories, so running them is unchanged.

  The move buys the one thing a flat directory could not: a bench can carry its own
  `package.json`, which is where a race against third-party rivals belongs. `npm run setup`
  there installs them at pinned versions, `npm run bench` runs that directory,
  `npm run teardown` removes them. The library's own manifest stays dependency-free and a
  checkout that never runs setup never downloads a rival.

- **The harness warms up, and reads what every contender returns.** `time` ran its first
  pass cold. A median of three hides that by discarding the slowest, and a median of one or
  two cannot — at `runs` of 1 or 2 the cold pass is the one it picks. It now takes one
  untimed pass first, which is what `opsPerSec` already did.

  The second half is the one that could have published a lie. Nothing read what a contender
  returned, and a call whose result is never observed is a call an optimiser may delete
  outright — a deleted body times as impossibly fast, which reads as a win rather than as
  the measurement failure it is. Every result now lands in a sink the harness reads
  afterwards, in a branch that cannot fire.

  Timings in `bench/results/` are the run after both, and are not comparable to numbers
  quoted from before them.

### Fixed

- **[`clone`](https://stamat.info/book-of-spells/global.html#clone) destroyed every value
  that was not a plain object or an array, and said nothing.** `clone(new Date())` returned
  `{}`. So did a `Map`, a `Set`, a `RegExp`; a `Uint8Array` came back as
  `{"0":1,"1":2,"2":3}`; a cycle overflowed the stack. It walked `Object.keys` of anything
  `typeof 'object'`, and a `Date` has none — the wrong answer that looks right, which is the
  bug this library exists not to ship.

  It now reproduces what [`deepEqual`](https://stamat.info/book-of-spells/global.html#deepEqual)
  reads as data, so `deepEqual(clone(x), x)` holds: plain and null-prototype objects, class
  instances, arrays with their holes, `Date`, `RegExp` with its `lastIndex`, `Map`, `Set`,
  `Error` with its non-enumerable `message` and `stack`, boxed primitives, `ArrayBuffer`,
  `DataView` and typed arrays — views over one buffer clone into views over one buffer.
  Cycles terminate, and a value referenced twice stays one object in the copy.

  **If you clone pure data — no functions, no DOM nodes — reach for `structuredClone`
  instead.** It is native, it has been Baseline since March 2022, and cloning is its whole
  job. What it cannot do is the reason this one still exists: it raises `DataCloneError` on
  a function, a DOM node, a `Promise`, a `WeakMap`, which is most of the objects a page
  actually holds. `clone` shares those by reference rather than half-copying them, so it
  never throws.

## [2.1.1] - 2026-08-11

### Fixed

- **`deepEqual`** called any two `SharedArrayBuffer`s equal, regardless of
  contents: the tag never joined `ArrayBuffer`'s byte compare, so both sides
  fell through to a walk of their zero own properties. The bytes are
  observable through a `Uint8Array` view and now they are compared, exactly
  as `ArrayBuffer`'s already were.

- **`deepEqual`** returned false on Maps that are structurally equal. A value
  mismatch on a SameValueZero-shared key was treated as final, but the
  matching value can sit under a distinct deep-equal key:
  `Map{X→1, {x:1}→2}` against `Map{X→2, {x:1}→1}` — X shared, every key the
  same shape — has a valid pairing and got `false`. The mismatch now defers
  to the pairwise phase. Object keys only: a primitive key deep-equals
  nothing but its SameValueZero self, so its value mismatch stays final and
  the common primitive-keyed path keeps its early exit.

- **`deepEqual`** let `toString` speak alone for self-stringifying hosts, so
  two Errors differing only in an assigned `.code` — the shape every Node
  error ships — compared equal, because the string form never shows it.
  `toString` still gates, and the own-property walk now runs behind it.

- **`deepEqual`** called two boxed symbols with the same description equal:
  `Object(Symbol('a'))` twice stringifies to `Symbol(a)` twice. Boxed
  symbols now unwrap and equal by reference only — the rule their
  primitives always had.

## [2.1.0] - 2026-08-09

### Added

- **`placeFlyout(trigger, panel, viewport, rtl, centred)`** takes a fifth argument and can
  answer `align: 'center'`. A panel aligned to one of its trigger's edges is not pointing at
  it — a tooltip on a button wider than the bubble ends up beside the words rather than under
  them — so `centred` asks for the trigger's middle instead.

  It is a preference and not an instruction: a trigger near the viewport edge cannot be
  centred on without the panel hanging off it, so the answer falls back to whichever edge
  fits, exactly as before. Only the inline axis is affected — which side of the trigger the
  panel goes on is a separate question and its answer is unchanged.

  **Existing calls are untouched.** The argument defaults to off, because `align` is spent as
  a CSS keyword and a caller whose stylesheet answers only `start` and `end` must not be
  handed a third value it has no rule for. Opt in and that stylesheet needs a `center` case.

  It answers with the CSS spelling, `center`, rather than `centre`: that is where the value
  is spent, and a keyword translated on the way out is a keyword that gets translated wrong
  once.

## [2.0.0] - 2026-08-09

### Added

- **`matchesSearch(label, search)`** in `helpers` — the match a filtering list needs: whether
  a label contains what has been typed, with both sides accent-folded and lower-cased, and an
  empty search matching everything so an unfiltered list is the same code path as a filtered
  one. Written for [`<combobox-elemental>`](https://github.com/stamat/book-of-elementals) and
  moved down here now that a second filtering list wants it.

  Contains rather than starts-with, because the reader looking through a list of cities for
  `york` knows New York is not spelled that way. Not `slugify`, which starts the same way and
  then keeps going: that one is for URLs, so it drops everything outside `[\w0-9-]` and
  leaves `Београд` and `北京` as empty strings — a search box that cannot find a Cyrillic city
  on a Serbian site is not a smaller bug than one that cannot fold an accent.

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

- **`removeAccents`** left a letter alone whenever the mark is written *through* the glyph
  instead of above it — `Đ Ł Ø Ħ Ŧ Ǥ Þ ẞ Ŋ ı` and their lower cases. NFKD has nothing to
  separate off them, so `removeAccents('Đorđe')` returned `Đorđe` unchanged while
  `removeAccents('Crème')` worked, and the same string could come out half-folded:
  `removeAccents('Łódź')` was `Łodz`. They are mapped by hand now, beside `Æ`, `Œ` and `ß`,
  which were already handled that way.

  `slugify` is where this drew blood, because the `[^\w0-9-]` pass it runs afterwards does
  not leave an unfolded letter alone — it deletes it. `Đorđe Balašević` slugified to
  `ore-balasevic`, `Łódź` to `odz`, `Nørrebro` to `nrrebro`: the letter vanished from the URL
  rather than losing its stroke. Nothing in `slugify` changed; it inherits the fix.

  `ẞ` was the same bug wearing a hat — `ß` had spelled out to `ss` since this function was
  written, so a word folded differently in caps than in lower case.

  Where the fold stops: the IPA and Africanist letters — `Ɔ`, `Ɛ`, `Ʃ`, `Ʒ`, the click
  letters — come through whole, because in the texts those appear in the letter is the
  content and folding it to `O`, `E`, `S`, `3` destroys the word. Cyrillic, Greek, Arabic and
  CJK likewise: mapping those to Latin is transliteration, which is answered per language and
  not per character, and is not this function's job.

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
  duplicates (Node 25, 2026-08): the fold dedupes in ~140ms, hashing a
  canonical string instead takes ~274ms, a table-driven JS CRC32 over that
  string ~369ms, and pairwise `deepEqual` 7.3s. On a generated mixed-shape
  corpus it holds near-linear to a million: 2.7s for 1.1M documents, against
  20.1s for the canonical-string key — and the folk `JSON.stringify`-as-key
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
