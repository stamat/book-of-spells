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
 * `centred` asks for the panel to sit on the trigger's middle - what a tooltip wants, where
 * an edge-aligned bubble points at nothing. It is a preference and not an instruction: a
 * trigger near the edge cannot be centred on without the panel hanging off it, so the
 * answer falls back to the edge that fits. Off by default, because `align` is spent as a
 * CSS keyword and a caller whose stylesheet answers only `start` and `end` must not be
 * handed a third value it has no rule for.
 *
 * Only the inline axis: which side of the trigger the panel goes on is a separate question,
 * and this does not change its answer.
 *
 * @param {DOMRect|object} trigger Rect of the trigger, in viewport coordinates
 * @param {{width: number, height: number}} panel Size of the panel
 * @param {{width: number, height: number}} viewport
 * @param {boolean} rtl Whether the layout runs right to left
 * @param {boolean} [centred=false] Prefer the trigger's middle over either of its edges
 * @returns {{side: string, align: string}} `side` is `block-end`/`block-start`,
 *   `align` is `start`/`end`, or `center` when `centred` was asked for and there was room -
 *   the CSS spelling, since that is where the value is spent
 * @example
 * const viewport = { width: 1000, height: 800 }
 * placeFlyout(button.getBoundingClientRect(), { width: 200, height: 300 }, viewport, false)
 * // => { side: 'block-end', align: 'start' } when there is room below
 * @example
 * placeFlyout(rect, { width: 200, height: 300 }, viewport, false, true)
 * // => { side: 'block-end', align: 'center' } when the middle has room for it
 */
export declare function placeFlyout(trigger: DOMRect | object, panel: {
    width: number;
    height: number;
}, viewport: {
    width: number;
    height: number;
}, rtl: boolean, centred?: boolean): {
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
export type AnnouncerSay = (message: string) => void;
export type AnnouncerAction = () => void;
export type Announcer = {
    /**
     * The live region itself
     */
    node: Element;
    /**
     * Announces, and announces again for a repeated message
     */
    say: AnnouncerSay;
    /**
     * Empties the region at once
     */
    clear: AnnouncerAction;
    /**
     * Drops a message still in the air and removes the node
     */
    destroy: AnnouncerAction;
};
/**
 * @callback AnnouncerSay
 * @param {string} message What is read out
 * @returns {void}
 */
/**
 * @callback AnnouncerAction
 * @returns {void}
 */
/**
 * @typedef {object} Announcer
 * @property {Element} node The live region itself
 * @property {AnnouncerSay} say Announces, and announces again for a repeated message
 * @property {AnnouncerAction} clear Empties the region at once
 * @property {AnnouncerAction} destroy Drops a message still in the air and removes the node
 */
/**
 * A live region, and the one way of putting something in it that a screen reader reads.
 *
 * Two things go wrong with live regions, both silently, which is what makes them worth a
 * helper rather than four lines at each call site.
 *
 * **A region announces text that arrives in one already in the document.** Creating the
 * element and filling it in the same breath announces nothing at all - there was no live
 * region in the accessibility tree yet for the change to happen in. So this is called when
 * there is nothing to say, and the saying comes later.
 *
 * **A region announces a *change*.** Setting the same sentence twice is not one, so the
 * second copy, the second failed save and the second press of a toggle are all silent.
 * Clearing first and setting in a later task is what makes the second one a change.
 *
 * `delay` is how much later. `0` - the next task - is enough for two mutations to be recorded
 * where one would otherwise be, and is what this has always used. It is an option rather than
 * a constant because live region behaviour is, in ARIA's own words, a strong suggestion that
 * may be overridden by the browser, the assistive technology or the user: a page that finds
 * its own pairing needs longer can say so without patching this. The number has not been
 * measured against NVDA, JAWS or VoiceOver, and is not presented as tuned.
 *
 * The node is a `<span>` the caller names, because where it sits and how it is hidden are the
 * caller's business. Hide it by clipping - `display: none` and `visibility: hidden` both take
 * it out of the accessibility tree, and a region nothing can read is the whole point undone.
 *
 * @param {Element} host Element the region is appended to. One already there under the same
 *   class is adopted rather than a second one added, so calling this twice is safe.
 * @param {object} [options]
 * @param {string} [options.className=live-region] The class the node carries, and how it is found again
 * @param {string} [options.role=status] `status` waits for a gap in what is being read, `alert` interrupts. Answering something the reader just did is `status` - they are not being interrupted with the result of their own action
 * @param {number} [options.delay=0] Milliseconds between clearing the region and setting it
 * @returns {Announcer}
 * @example
 * const status = announcer(el, { className: 'copy-status' })
 * status.say('Copied') // and again later, and it is read again
 * status.destroy() // when the element goes
 */
export declare function announcer(host: Element, options?: {
    className?: string;
    role?: string;
    delay?: number;
}): Announcer;
