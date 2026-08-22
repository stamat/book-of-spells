/** @module browser */
export declare function isUserAgentIOS(str: any): boolean;
export declare function isUserAgentMobile(str: any): boolean;
export declare function isUserAgentSafari(str: any): boolean;
/**
 * Check if the device is an iOS device
 *
 * @returns boolean True if the device is an iOS device, false otherwise
 */
export declare function isIOS(): boolean;
/**
 * Check if the device is a mobile device
 *
 * @returns boolean True if the device is a mobile device, false otherwise
 */
export declare function isMobile(): boolean;
/**
 * Check if the browser is Safari
 *
 * @returns boolean True if the browser is Safari, false otherwise
 */
export declare function isSafari(): boolean;
/**
 * Check if the browser is Safari on iOS
 *
 * @returns boolean True if the browser is Safari on iOS, false otherwise
 */
export declare function isIOSSafari(): boolean;
/**
 * A wrapper for the matchMedia function, cause with `matchMedia` you can only either add a listener or check the media query
 * this function does both.
 *
 * @param {string} query The media query to check
 * @param {function} [callback] The callback function to call when the media query changes
 * @returns {boolean} The result of the media query
 *
 * @example
 * mediaMatcher('(min-width: 768px)', (matches) => {
 *  if (matches) {
 *    // Do something
 *  } else {
 *    // Do something else
 *  }
 * })
 *
 * // Or
 *
 * const isDesktop = mediaMatcher('(min-width: 768px)')
 */
export declare function mediaMatcher(query: string, callback?: Function): boolean;
/**
 * Checks whether the user has asked the system to minimize non-essential motion.
 *
 * Animations should be skipped or reduced when this is true - it is an accessibility
 * setting, not a preference, and for some users motion causes nausea or worse.
 * Returns false where `matchMedia` does not exist, so it is safe to call outside a
 * browser: no preference expressed, no motion suppressed.
 *
 * @param {function} [callback] The callback function to call when the preference changes
 * @returns {boolean} True if the user prefers reduced motion
 *
 * @example
 * if (prefersReducedMotion()) duration = 0
 *
 * // Or, to react to the user changing it while the page is open
 *
 * prefersReducedMotion((reduced) => {
 *  document.body.classList.toggle('is-still', reduced)
 * })
 */
export declare function prefersReducedMotion(callback?: Function): boolean;
/**
 * Get the scrollbar width
 *
 * When preventing scroll with html overflow hidden the scroll bar will disappear and the whole page will shift (if the scroll bar is visible that is).
 * To substitute for the scrollbar width we can add a padding to the body element.
 *
 * @returns {number} The scrollbar width
 *
 * @example
 * const scrollbarWidth = getScrollbarWidth() // 15 (on MacOS X Safari)
 */
export declare function getScrollbarWidth(): number;
/**
 * Check if the vertical scrollbar is visible
 *
 * @param {number} [scrollbarWidth] The width of the scrollbar, defaults to getScrollbarWidth()
 * @returns {boolean} True if the vertical scrollbar is visible, false otherwise
 */
export declare function hasVerticalScrollbarVisible(scrollbarWidth?: number): boolean;
/**
 * Check if the horizontal scrollbar is visible
 *
 * @param {number} [scrollbarWidth] The width of the scrollbar, defaults to getScrollbarWidth()
 * @returns {boolean} True if the horizontal scrollbar is visible, false otherwise
 */
export declare function hasHorizontalScrollbarVisible(scrollbarWidth?: number): boolean;
/**
 * Disable the scroll on the page.
 *
 * @param {number} [shift=0] If greater than 0 the body will be shifted to the left by the width of the scrollbar, getScrollbarWidth() is used to provide this value
 */
export declare function disableScroll(shift?: number): void;
/**
 * Enable the scroll on the page.
 *
 * @param {boolean} [shift=0] If greater than 0 the body will be shifted back to the left by the width of the scrollbar, getScrollbarWidth() is used to provide this value
 */
export declare function enableScroll(shift?: boolean): void;
/**
 * Parses a string of url query parameters into an object of key value pairs. Converts the values to the correct type.
 *
 * @param {string} [entryQuery] - Optional query string to parse, without the starting ?, defaults to window.location.search without the starting ?
 * @returns {object} of key value pairs
 * @example
 * // url: https://example.com/?test&foo=bar&baz=qux
 * getQueryProperties() // { test: undefined, foo: 'bar', baz: 'qux' }
 */
export declare function getQueryProperties(entryQuery?: string): object;
/**
 * Parses a string of url hash parameters into an object of key value pairs. Converts the values to the correct type.
 *
 * @param {string} [entryHash] - Optional hash string to parse, without the starting #, defaults to window.location.hash without the starting #
 * @returns {object} of key value pairs
 * @example
 * // url: https://example.com/#test&foo=bar&baz=qux
 * getHashProperties() // { test: undefined, foo: 'bar', baz: 'qux' }
 */
export declare function getHashProperties(entryHash?: string): object;
/**
 * The id a `#fragment` names - out of an `href` or out of `location.hash`, both of
 * which arrive with the `#` still on.
 *
 * Decoded, because `id="café"` is reached by `href="#caf%C3%A9"` and the two have to
 * meet somewhere. Taken as written when decoding fails: a stray `%` in a fragment is a
 * typo, and a typo in one link is not a reason for the caller to stop working.
 *
 * @param {string} hash The fragment, with or without the leading `#`
 * @returns {string} The decoded id, `''` for an empty fragment
 * @example
 * decodeFragment('#caf%C3%A9') // => 'café'
 * decodeFragment(window.location.hash) // => the id the url points at
 * decodeFragment('#100%') // => '100%', kept as written
 */
export declare function decodeFragment(hash: string): string;
/**
 * Add a callback function to the hash change event
 *
 * @param {function} callback - The callback function to call when the hash changes
 * @param {string} [single] - Optional string to make sure the listener is initialized only once, defaults to window[single] which is set to true after the first call
 * @example
 * hashChange((hash) => {
 * // Do something with the hash
 * })
 */
export declare function hashChange(callback: Function, single?: string): void;
/**
 * Reports when the user has stopped interacting with the page, and when they come back.
 *
 * Idle means no interaction for `timeout` milliseconds — the callback gets `false` once that
 * runs out and `true` the moment the user comes back, so a video can pause itself, a poll can
 * stop polling, or a session can end where it should. Only the changes are reported: a reader
 * scrolling steadily gets one `true` at the end of their pause, not one per event, and the page
 * starting out active is not reported at all, being the state every caller already has.
 *
 * There is a native `IdleDetector`, but it is Chromium-only, needs the `idle-detection`
 * permission, and answers a different question — whether the machine is idle or its screen
 * locked, not whether anyone is reading this page.
 *
 * What the clock says outranks what the timer says. A timer set for the idle deadline can run
 * late: a long task blocks it, a background tab has its timers clamped to a second, and a tab
 * the browser has frozen may not run it at all. Waking late is therefore treated as proof the
 * user is idle rather than as a reason to doubt it, waking early re-arms for the remainder, and
 * a tab returning from hidden checks its deadline at once, since nothing may have run while it
 * was away. The clock is `performance.now()` — the wall clock jumps on an NTP correction or a
 * daylight-saving change, and would take the deadline with it.
 *
 * Answers for this tab alone unless `channel` is given a name, in which case every tab of this
 * origin using that name agrees: activity in any of them counts in all of them, and idle means
 * all of them are. That is what a session deadline wants — three tabs open and work happening
 * in the third should not log the first two out — and what a pausing video does not, since a
 * user reading elsewhere is exactly when this tab should stop playing. Hence a name to opt in
 * rather than a default. Where `BroadcastChannel` is missing, each tab falls back to answering
 * for itself.
 *
 * @param {function} callback Called with `false` when the user goes idle and `true` when they return
 * @param {object} [options]
 * @param {number} [options.timeout=60000] Milliseconds of no interaction that count as idle. `Infinity` never reports idle; zero or less is nothing to observe, answered with `null`
 * @param {string|Array<string>} [options.events] Events that count as interaction, replacing the defaults — `pointerdown`, `pointermove`, `keydown`, `wheel`, `scroll`, `touchstart` and `resize`. Listened for on `window`, in the capturing phase, so a widget that stops its own events from propagating cannot read as the user having left, and events only `window` ever receives still arrive. `scroll` is there for the scrollbar drag some browsers fire no pointer events for, and it cuts both ways: a page that scrolls itself — a carousel, a chat log pinned to its end — reads as a user for as long as it keeps moving. Such a page should pass the defaults minus `scroll`. Several events may share one space-separated string; an empty list is nothing to observe, answered with `null`
 * @param {string} [options.channel] A `BroadcastChannel` name shared with the other tabs of this origin, making activity in any of them count in all of them. What travels is the activity, never the verdict — each tab judges idle against its own `timeout`, so every observer sharing a name must share one, or the tab with the shortest deadline goes idle while the rest disagree. Left out, this tab answers for itself
 * @returns {object|null} `{ destroy }`, or `null` when there is no callback, no DOM, no positive timeout, or no events to listen for
 * @example
 * const activity = userActivity((active) => {
 *  if (!active) video.pause()
 * }, { timeout: 30000 })
 *
 * activity.destroy() // stop listening
 *
 * // Warning someone before the deadline is two observers, not an extra option
 * userActivity((active) => { warning.hidden = active }, { timeout: 25 * 60000 })
 * userActivity((active) => { if (!active) logout() }, { timeout: 30 * 60000 })
 *
 * // A deadline the whole site agrees on, however many tabs are open
 * userActivity((active) => { if (!active) logout() }, { timeout: 15 * 60000, channel: 'session' })
 */
export declare function userActivity(callback: Function, options?: {
    timeout?: number;
    events?: string | Array<string>;
    channel?: string;
}): object | null;
