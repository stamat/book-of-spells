/** @module elements */

/**
 * `HTMLElement` when there is one, a plain class when there is not (e.g. Node under
 * test), so custom element modules stay importable outside the browser.
 *
 * @example
 * class MyElement extends ElementBase {}
 */
export const ElementBase = typeof HTMLElement !== 'undefined' ? HTMLElement : class {}

/**
 * Registers a custom element - in the browser only, and only once, so the module is
 * safe to import twice or to import under Node.
 *
 * @param {string} tag
 * @param {Function} ctor
 * @example
 * define('my-element', MyElement)
 * define('my-element', MyElement) // second call is a no-op
 */
export function define(tag, ctor) {
  if (typeof customElements === 'undefined' || customElements.get(tag)) return
  customElements.define(tag, ctor)
}

/**
 * Where an arrow, Home or End key moves focus in a wrapping list of widgets - the key
 * map the APG patterns with a roving tabindex (menu, tablist, accordion headers) share.
 *
 * @param {number} current Index of the currently focused item, `-1` for none
 * @param {string} key KeyboardEvent.key value
 * @param {number} length Number of items in the list
 * @returns {number|null} Target index, or null if the key is unhandled
 * @example
 * nextIndex(0, 'ArrowDown', 3) // => 1
 * nextIndex(2, 'ArrowDown', 3) // => 0, wraps
 * nextIndex(0, 'End', 3) // => 2
 * nextIndex(0, 'Tab', 3) // => null
 */
export function nextIndex(current, key, length) {
  if (length === 0) return null
  switch (key) {
    case 'ArrowDown':
      return (current + 1) % length
    case 'ArrowUp':
      // `<= 0` rather than a modulo, so both ways of being at the top land on the last
      // item: the first item wrapping round, and nothing focused at all - which is the
      // documented `-1`, and where Up on a closed menu button opens onto.
      return current <= 0 ? length - 1 : current - 1
    case 'Home':
      return 0
    case 'End':
      return length - 1
    default:
      return null
  }
}

/**
 * Where an arrow, Home or End key moves focus in a list with ends - the non-wrapping
 * counterpart of `nextIndex`, for sets where running off one end is how you get back to
 * the rest of the page (the APG disclosure navigation, a toolbar).
 *
 * Answers to both axes, so a horizontal bar and a vertical stack share it.
 *
 * @param {number} current Index of the focused item, `-1` for none
 * @param {string} key KeyboardEvent.key value
 * @param {number} length Number of items in the set
 * @returns {number|null} Target index, or null if the key is unhandled or there is
 *   nowhere to go
 * @example
 * stepIndex(0, 'ArrowRight', 4) // => 1
 * stepIndex(3, 'ArrowRight', 4) // => null, the ends do not wrap
 * stepIndex(2, 'Home', 4) // => 0
 */
export function stepIndex(current, key, length) {
  if (length === 0) return null
  const to = key === 'ArrowDown' || key === 'ArrowRight' ? current + 1
    : key === 'ArrowUp' || key === 'ArrowLeft' ? current - 1
      : key === 'Home' ? 0
        : key === 'End' ? length - 1
          : null
  if (to === null || to < 0 || to >= length) return null
  return to
}

/**
 * Where a type-ahead lands in a list, given what has been typed so far.
 *
 * Two rules that look like edge cases and are not. Holding or repeating one letter
 * cycles the items starting with it - `aaa` is someone pressing `a` three times looking
 * for the next "Archive", not an item named "aaa". And a search that is one character
 * long starts *after* the focused item, so pressing that letter again moves on, while a
 * buffer still being typed starts *at* it, so the match narrows onto the item the
 * reader is already on instead of skipping past it.
 *
 * @param {string[]} labels The items' text, in list order
 * @param {number} current Index of the focused item, `-1` for none
 * @param {string} buffer What has been typed inside the type-ahead window
 * @returns {number|null} Target index, or null if nothing matches
 * @example
 * const labels = ['Profile', 'Preferences', 'Archive']
 * typeAheadIndex(labels, 0, 'a') // => 2
 * typeAheadIndex(labels, 0, 'p') // => 1, starts after the focused item
 * typeAheadIndex(labels, 1, 'pre') // => 1, a buffer narrows onto it
 */
export function typeAheadIndex(labels, current, buffer) {
  if (!buffer) return null
  const query = buffer.toLowerCase()
  const repeated = query.length > 1 && query.split('').every((c) => c === query[0])
  const prefix = repeated ? query[0] : query
  const from = prefix.length === 1 ? current + 1 : current

  for (let i = 0; i < labels.length; i++) {
    const at = (from + i + labels.length) % labels.length
    if (labels[at].trim().toLowerCase().startsWith(prefix)) return at
  }
  return null
}

/**
 * Whether a box of `size` starting at `at` is inside a viewport of `limit`.
 *
 * Both ends, because a panel that runs off the top is as unreachable as one that runs
 * off the bottom.
 *
 * @param {number} at Where the box starts, in viewport coordinates
 * @param {number} size
 * @param {number} limit The viewport's extent on the same axis
 * @returns {boolean}
 * @example
 * fits(700, 300, 800) // => false, runs off the bottom
 * fits(100, 300, 800) // => true
 */
export function fits(at, size, limit) {
  return at >= 0 && at + size <= limit
}

/**
 * Where a floating panel goes relative to its trigger: under it, or over it when there
 * is no room under; and running from the trigger's inline start, or back the other way
 * when that would take it off the edge.
 *
 * The preferred placement wins ties and wins when neither fits, because a panel with
 * nowhere good to go should at least land where the reader expects it.
 *
 * @param {DOMRect|object} trigger Rect of the trigger, in viewport coordinates
 * @param {{width: number, height: number}} panel Size of the panel
 * @param {{width: number, height: number}} viewport
 * @param {boolean} rtl Whether the layout runs right to left
 * @returns {{side: string, align: string}} `side` is `block-end`/`block-start`,
 *   `align` is `start`/`end`
 * @example
 * const viewport = { width: 1000, height: 800 }
 * placeFlyout(button.getBoundingClientRect(), { width: 200, height: 300 }, viewport, false)
 * // => { side: 'block-end', align: 'start' } when there is room below
 */
export function placeFlyout(trigger, panel, viewport, rtl) {
  const below = fits(trigger.bottom, panel.height, viewport.height)
  const above = fits(trigger.top - panel.height, panel.height, viewport.height)

  // Aligned to the trigger's inline start means its left edge in LTR and its right in
  // RTL, so the sums are written in physical terms and the direction picks the edge.
  const start = rtl ? trigger.right - panel.width : trigger.left
  const end = rtl ? trigger.left : trigger.right - panel.width

  return {
    side: below || !above ? 'block-end' : 'block-start',
    align: fits(start, panel.width, viewport.width) || !fits(end, panel.width, viewport.width)
      ? 'start'
      : 'end'
  }
}

/**
 * Where a nested panel goes: beside the item that opens it, on the inline end unless
 * the edge is there, and running down from the item unless the bottom is.
 *
 * Which is how a submenu near the bottom right corner ends up opening up and to the
 * left - one decision per axis rather than a list of corners.
 *
 * @param {DOMRect|object} item Rect of the item that opens it, in viewport coordinates
 * @param {{width: number, height: number}} panel
 * @param {{width: number, height: number}} viewport
 * @param {boolean} rtl Whether the layout runs right to left
 * @returns {{side: string, align: string}} `side` is `inline-end`/`inline-start`,
 *   `align` is `start`/`end`
 * @example
 * placeSubmenu(item.getBoundingClientRect(), { width: 200, height: 300 }, viewport, false)
 * // => { side: 'inline-end', align: 'start' } when there is room beside it
 */
export function placeSubmenu(item, panel, viewport, rtl) {
  const inlineEnd = rtl ? item.left - panel.width : item.right
  const inlineStart = rtl ? item.right : item.left - panel.width

  const down = fits(item.top, panel.height, viewport.height)
  const up = fits(item.bottom - panel.height, panel.height, viewport.height)

  return {
    side: fits(inlineEnd, panel.width, viewport.width) || !fits(inlineStart, panel.width, viewport.width)
      ? 'inline-end'
      : 'inline-start',
    align: down || !up ? 'start' : 'end'
  }
}
