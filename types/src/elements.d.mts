/** @module elements */
/**
 * `HTMLElement` when there is one, a plain class when there is not (e.g. Node under
 * test), so custom element modules stay importable outside the browser.
 *
 * @example
 * class MyElement extends ElementBase {}
 */
export declare const ElementBase: {
    new (): {};
};
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
export declare function define(tag: string, ctor: Function): void;
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
export declare function nextIndex(current: number, key: string, length: number): number | null;
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
export declare function stepIndex(current: number, key: string, length: number): number | null;
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
export declare function typeAheadIndex(labels: string[], current: number, buffer: string): number | null;
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
export declare function fits(at: number, size: number, limit: number): boolean;
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
export declare function placeFlyout(trigger: DOMRect | object, panel: {
    width: number;
    height: number;
}, viewport: {
    width: number;
    height: number;
}, rtl: boolean): {
    side: string;
    align: string;
};
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
export declare function placeSubmenu(item: DOMRect | object, panel: {
    width: number;
    height: number;
}, viewport: {
    width: number;
    height: number;
}, rtl: boolean): {
    side: string;
    align: string;
};
