/** @module keyboard */

/** The four modifiers a `KeyboardEvent` tracks, and the whole set exclusivity is checked over. */
const MODIFIERS = ['Meta', 'Control', 'Alt', 'Shift']

/** `event.key` values for the modifiers themselves, which arrive as keydowns of their own. */
const MODIFIER_KEYS = new Set(MODIFIERS)

/**
 * Spellings a shortcut may use for each modifier, `mod` excepted - that one is resolved per
 * platform and so cannot be a constant.
 *
 * `cmd` and `ctrl` stay literal, which is the whole reason `mod` exists. Making them mean
 * "whichever this machine calls primary" reads nicer for the nine bindings out of ten that
 * want it, and takes away the only way to say the tenth: macOS keeps the Emacs bindings
 * (`Ctrl+A`, `Ctrl+E`, `Ctrl+K`) live inside every text field, so an editor binding literal
 * Control on a Mac is an ordinary thing to want and would become unsayable.
 */
const ALIASES = {
  meta: 'Meta', cmd: 'Meta', command: 'Meta', super: 'Meta', win: 'Meta',
  ctrl: 'Control', control: 'Control',
  alt: 'Alt', option: 'Alt', opt: 'Alt',
  shift: 'Shift'
}

/** The konami code as ten shortcut specs, the arcade original minus Start and Select. */
const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a'
]

/**
 * Selector for the places a person types, for the `when` and `except` options.
 *
 * `[contenteditable]` is matched with `closest`, so the `<b>` inside an editable `<div>`
 * counts as being in one. `<select>` is in the list because a focused one runs its own
 * type-ahead on plain letters.
 *
 * @type {string}
 * @example
 * bindShortcut('mod+k', focusSearch, { except: EDITABLE }) // not while typing
 * bindShortcut('mod+b', bold, { when: '#editor' })         // only while typing, over there
 */
export const EDITABLE = 'input, textarea, select, [contenteditable]'

/**
 * Whether this machine is one where `mod` means the Command key.
 *
 * Read per call rather than at import: several helpers here run in a page before anything is
 * known about it, and a module that touches `navigator` on the way in cannot be imported
 * under Node at all. `userAgentData` first because `navigator.platform` is deprecated;
 * neither is guessed at from the user-agent string, which reports `AppleWebKit` on machines
 * that are not Apple's.
 */
function isApplePlatform() {
  if (typeof navigator !== 'object' || !navigator) return false
  const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || ''
  return /mac|iphone|ipad|ipod/i.test(platform)
}

/**
 * A shortcut spec split into the modifiers it demands and the key it ends on.
 *
 * The key is the last `+`-separated part, which leaves one ambiguity worth spelling out:
 * `mod++` is Command and the plus key, `mod+` is a spec that names no key at all. They are
 * told apart by how many empty parts the split leaves behind - two for the first, one for
 * the second - and the second throws. A lookbehind would say this in one regex and is not
 * used: an unsupported regex literal is a `SyntaxError` at parse time, which takes down the
 * whole module rather than the one call, and this library ships to whatever browser a
 * consumer still supports.
 *
 * An unknown modifier throws rather than resolving to nothing. Silently, `mdo+k` is a
 * shortcut that can never fire and gives no reason.
 */
function parseShortcut(spec) {
  if (typeof spec !== 'string' || !spec.trim()) {
    throw new TypeError(`Shortcut must be a non-empty string, got ${JSON.stringify(spec)}`)
  }
  const parts = spec.trim().split('+')
  let key = parts.pop()
  if (key === '') {
    if (parts.length && parts[parts.length - 1] === '') {
      parts.pop()
      key = '+'
    } else {
      throw new TypeError(`Shortcut "${spec}" names no key`)
    }
  }

  const required = new Set()
  for (const part of parts) {
    const name = part.trim().toLowerCase()
    const modifier = name === 'mod' ? (isApplePlatform() ? 'Meta' : 'Control') : ALIASES[name]
    if (!modifier) throw new TypeError(`Shortcut "${spec}" names an unknown modifier: "${part}"`)
    required.add(modifier)
  }
  return { required, key }
}

/** The element a keydown came from, reaching inside a shadow root, or null if it has none. */
function eventOrigin(event) {
  const path = typeof event.composedPath === 'function' ? event.composedPath() : null
  const node = (path && path[0]) || event.target
  return node && typeof node.closest === 'function' ? node : null
}

/** Whether a keydown is allowed to act, given a binding's `when`/`except` selectors. */
function inScope(event, when, except) {
  if (!when && !except) return true
  const origin = eventOrigin(event)
  if (when && !(origin && origin.closest(when))) return false
  if (except && origin && origin.closest(except)) return false
  return true
}

/**
 * Whether a keydown is the shortcut a spec describes.
 *
 * The spec is modifiers and a key joined by `+` - `mod+k`, `shift+alt+ArrowUp`, `Escape`.
 * `mod` is Command on Apple platforms and Control everywhere else; `cmd`, `ctrl`, `alt` and
 * `shift` mean themselves. Case does not matter to the key, so `mod+K` and `mod+k` are the
 * same shortcut and neither demands Shift - to demand it, say `mod+shift+k`.
 *
 * **Modifiers not named must be up.** `mod+k` does not match `Ctrl+Shift+K`, which is a
 * devtools shortcut in two browsers, and the same rule is what keeps `alt+k` off `k`. This
 * is the part hand-written checks get wrong, because it takes a test per modifier rather
 * than per modifier you thought of.
 *
 * The key is matched against `event.key` without case *or* against `event.code` exactly, so
 * a layout where a modifier rewrites the character still has a way to be named: `alt+k` on
 * macOS arrives as `˚`, and `alt+KeyK` matches it.
 *
 * Says nothing about where the keydown came from - a shortcut that must not fire while
 * someone is typing pairs this with {@link EDITABLE}, or uses {@link bindShortcut}, which
 * has the option. A lone modifier (`shift` with no key) is not a shortcut this can express.
 *
 * @param {KeyboardEvent} event
 * @param {string} spec Modifiers and a key, joined by `+`
 * @returns {boolean}
 * @throws {TypeError} If the spec names no key, or a modifier that is not a modifier
 * @example
 * // on Windows, with Ctrl+K pressed
 * matchesShortcut(event, 'mod+k') // => true
 * // with Ctrl+Shift+K pressed
 * matchesShortcut(event, 'mod+k') // => false, Shift was not asked for
 */
export function matchesShortcut(event, spec) {
  const { required, key } = parseShortcut(spec)
  if (!event || typeof event.getModifierState !== 'function') return false
  for (const modifier of MODIFIERS) {
    if (event.getModifierState(modifier) !== required.has(modifier)) return false
  }
  const pressed = typeof event.key === 'string' ? event.key : ''
  return pressed.toLowerCase() === key.toLowerCase() || event.code === key
}

/**
 * Runs a handler when a shortcut is pressed, and returns the function that stops it.
 *
 * Where it may fire is the point of `when` and `except`, and the reason they are selectors
 * rather than a boolean: the same page can want one shortcut everywhere, one only inside an
 * editor, and one everywhere *but* an editor, and all three are then a setting rather than
 * three code paths.
 *
 * Ignores a keydown that is a key repeating unless `allowRepeat` says otherwise, and always
 * ignores one arriving mid-composition - an IME sends keydowns for the keys building a
 * character, and they are not the person pressing a shortcut.
 *
 * The spec is parsed on the way in, so a typo throws where it was written rather than
 * silently never firing.
 *
 * @param {string} spec Modifiers and a key, joined by `+` - see {@link matchesShortcut}
 * @param {Function} handler Called with the event
 * @param {object} [options]
 * @param {EventTarget} [options.target=document] What to listen on
 * @param {string} [options.when] Fire only when the keydown comes from inside a match
 * @param {string} [options.except] Never fire when the keydown comes from inside a match
 * @param {boolean} [options.preventDefault=true] Whether a match takes the key off the browser
 * @param {boolean} [options.allowRepeat=false] Whether a held key fires more than once
 * @returns {Function} Unbind
 * @throws {TypeError} If the spec is malformed
 * @example
 * const unbind = bindShortcut('mod+k', () => input.focus())
 * bindShortcut('mod+b', bold, { when: '#editor' })
 * bindShortcut('/', search, { except: EDITABLE })
 * unbind()
 */
export function bindShortcut(spec, handler, options = {}) {
  const {
    target = typeof document !== 'undefined' ? document : null,
    when = null,
    except = null,
    preventDefault = true,
    allowRepeat = false
  } = options
  parseShortcut(spec)
  if (!target || typeof target.addEventListener !== 'function') return () => {}

  const listener = (event) => {
    if (event.isComposing || (event.repeat && !allowRepeat)) return
    if (!matchesShortcut(event, spec)) return
    if (!inScope(event, when, except)) return
    if (preventDefault) event.preventDefault()
    handler(event)
  }
  target.addEventListener('keydown', listener)
  return () => target.removeEventListener('keydown', listener)
}

/**
 * Runs a handler when a list of shortcuts is pressed in order, and returns the function that
 * stops it. A cheat code, or the `g` `i` pair a keyboard-first app uses to go somewhere.
 *
 * Forgets itself `timeout` milliseconds after each step, so a half-typed sequence does not
 * wait around to be completed by an unrelated keypress an hour later. A wrong key restarts
 * it - and is then tried against the first step, so `↑ ↑ ↑ ↓` still gets to step three
 * rather than throwing away the `↑` that was also a fresh start.
 *
 * Keydowns for the modifiers themselves pass through without disturbing the count: `mod+k`
 * as a step arrives as a keydown for Meta and then one for `k`, and a sequence that reset on
 * the first of those could never contain a shortcut with a modifier in it.
 *
 * `preventDefault` is **off** here, unlike {@link bindShortcut}. A step matches long before
 * the sequence does, and the konami code opens on an arrow key - preventing that default
 * would stop the page scrolling for everyone who never finishes the sequence, which is
 * everyone.
 *
 * @param {string[]} specs The shortcuts, in order - see {@link matchesShortcut}
 * @param {Function} handler Called with the event that completed the sequence
 * @param {object} [options]
 * @param {EventTarget} [options.target=document] What to listen on
 * @param {number} [options.timeout=1000] Milliseconds a partial sequence survives
 * @param {string} [options.when] Fire only when the keydown comes from inside a match
 * @param {string} [options.except] Never fire when the keydown comes from inside a match
 * @param {boolean} [options.preventDefault=false] Whether a matched step is taken off the browser
 * @returns {Function} Unbind
 * @throws {TypeError} If the list is empty, or a spec is malformed
 * @example
 * bindSequence(['g', 'i'], () => go('/inbox'))
 * bindSequence(['ArrowUp', 'ArrowUp', 'b', 'a'], cheat, { timeout: 2000 })
 */
export function bindSequence(specs, handler, options = {}) {
  if (!Array.isArray(specs) || !specs.length) {
    throw new TypeError('A sequence needs at least one shortcut')
  }
  const {
    target = typeof document !== 'undefined' ? document : null,
    timeout = 1000,
    when = null,
    except = null,
    preventDefault = false
  } = options
  specs.forEach((spec) => parseShortcut(spec))
  if (!target || typeof target.addEventListener !== 'function') return () => {}

  let at = 0
  let timer = null
  const reset = () => {
    at = 0
    if (timer) timer = clearTimeout(timer)
  }

  const listener = (event) => {
    if (event.isComposing || event.repeat || MODIFIER_KEYS.has(event.key)) return
    if (!inScope(event, when, except)) return

    if (matchesShortcut(event, specs[at])) {
      at += 1
    } else {
      // The key that broke the run may be the one that starts a new one, and only from a
      // run that had started - otherwise this re-tests the first step against itself.
      const restarts = at > 0 && matchesShortcut(event, specs[0])
      reset()
      if (!restarts) return
      at = 1
    }

    if (preventDefault) event.preventDefault()
    if (at < specs.length) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(reset, timeout)
      return
    }
    reset()
    handler(event)
  }
  target.addEventListener('keydown', listener)
  return () => {
    if (timer) timer = clearTimeout(timer)
    target.removeEventListener('keydown', listener)
  }
}

/**
 * Runs a handler on the konami code - ↑ ↑ ↓ ↓ ← → ← → B A.
 *
 * The arcade original ends on Start, which no keyboard has; the web has settled on the ten
 * keys before it. Takes no sequence of its own: a different sequence is
 * {@link bindSequence}, and an option here would only be that function wearing this name.
 *
 * @param {Function} handler Called with the event that completed the sequence
 * @param {object} [options] As {@link bindSequence}
 * @returns {Function} Unbind
 * @example
 * konamiCode(() => document.body.classList.add('rainbow'))
 */
export function konamiCode(handler, options = {}) {
  return bindSequence(KONAMI, handler, options)
}

/** Whether the last input the page saw was a key rather than a pointer. */
let keyboardIntent = false

/** Documents already watched, so repeat calls from many components cost nothing. */
const intentWatched = new WeakSet()

/**
 * Starts tracking whether the person is driving the page with a keyboard or with a
 * pointer, so `isKeyboardIntent` can be asked later.
 *
 * This is the part `:focus-visible` cannot give you. That pseudo-class matches a text
 * input or a `contenteditable` even when it was clicked into, because a browser assumes
 * anything taking text input wants its focus ring — right for a ring, wrong for deciding
 * whether to show a keyboard hint or move focus somewhere a mouse user did not ask for.
 *
 * Listeners go on in capture, because a `pointerdown` handler somewhere in the page that
 * calls `stopPropagation` (drag implementations do, routinely) would otherwise hide the
 * switch to pointer. `pointerdown` rather than `mousedown` so a pen and a touch count
 * without waiting for emulated mouse events.
 *
 * Call it once, early — before any focus you intend to judge, since the keypress that
 * moves focus lands on whatever had focus *before* the element you are asking about. It
 * is safe to call from every component that needs it: the document is only watched once.
 * There is no unwatch; two capture listeners for the life of the page is the whole cost.
 *
 * @see {@link isKeyboardIntent}
 * @param {Document} [doc=document] The document to watch — pass an iframe's own document to watch inside it
 * @returns {void}
 * @example
 * watchInputIntent()
 *
 * element.addEventListener('focusin', () => {
 *   element.classList.toggle('is-key-focus', isKeyboardIntent())
 * })
 */
export function watchInputIntent(doc = document) {
  if (!doc || intentWatched.has(doc)) return
  intentWatched.add(doc)
  doc.addEventListener('keydown', () => { keyboardIntent = true }, true)
  doc.addEventListener('pointerdown', () => { keyboardIntent = false }, true)
}

/**
 * Whether the last input the page saw was a key rather than a pointer.
 *
 * Pointer until proven otherwise: before anyone has touched anything this is `false`, so
 * focus that arrives on load — an `autofocus`, a restored scroll position — is not
 * mistaken for someone tabbing. Requires {@link watchInputIntent} to have been called;
 * without it this is always `false`.
 *
 * @see {@link watchInputIntent}
 * @returns {boolean} `true` if the last input was a keypress
 * @example
 * watchInputIntent()
 * // after the person presses Tab
 * isKeyboardIntent() // => true
 * // after the person clicks
 * isKeyboardIntent() // => false
 */
export function isKeyboardIntent() {
  return keyboardIntent
}
