export function isUserAgentIOS(str: any): boolean;
export function isUserAgentMobile(str: any): boolean;
export function isUserAgentSafari(str: any): boolean;
/**
 * Check if the device is an iOS device
 *
 * @returns boolean True if the device is an iOS device, false otherwise
 */
export function isIOS(): boolean;
/**
 * Check if the device is a mobile device
 *
 * @returns boolean True if the device is a mobile device, false otherwise
 */
export function isMobile(): boolean;
/**
 * Check if the browser is Safari
 *
 * @returns boolean True if the browser is Safari, false otherwise
 */
export function isSafari(): boolean;
/**
 * Check if the browser is Safari on iOS
 *
 * @returns boolean True if the browser is Safari on iOS, false otherwise
 */
export function isIOSSafari(): boolean;
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
export function mediaMatcher(query: string, callback?: Function): boolean;
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
export function getScrollbarWidth(): number;
/**
 * Check if the vertical scrollbar is visible
 *
 * @param {number} [scrollbarWidth] The width of the scrollbar, defaults to getScrollbarWidth()
 * @returns {boolean} True if the vertical scrollbar is visible, false otherwise
 */
export function hasVerticalScrollbarVisible(scrollbarWidth?: number): boolean;
/**
 * Check if the horizontal scrollbar is visible
 *
 * @param {number} [scrollbarWidth] The width of the scrollbar, defaults to getScrollbarWidth()
 * @returns {boolean} True if the horizontal scrollbar is visible, false otherwise
 */
export function hasHorizontalScrollbarVisible(scrollbarWidth?: number): boolean;
/**
 * Disable the scroll on the page.
 *
 * @param {number} [shift=0] If greater than 0 the body will be shifted to the left by the width of the scrollbar, getScrollbarWidth() is used to provide this value
 */
export function disableScroll(shift?: number): void;
/**
 * Enable the scroll on the page.
 *
 * @param {boolean} [shift=0] If greater than 0 the body will be shifted back to the left by the width of the scrollbar, getScrollbarWidth() is used to provide this value
 */
export function enableScroll(shift?: boolean): void;
/**
 * Parses a string of url query parameters into an object of key value pairs. Converts the values to the correct type.
 *
 * @param {string} [entryQuery] - Optional query string to parse, without the starting ?, defaults to window.location.search without the starting ?
 * @returns {object} of key value pairs
 * @example
 * // url: https://example.com/?test&foo=bar&baz=qux
 * getQueryProperties() // { test: undefined, foo: 'bar', baz: 'qux' }
 */
export function getQueryProperties(entryQuery?: string): object;
/**
 * Parses a string of url hash parameters into an object of key value pairs. Converts the values to the correct type.
 *
 * @param {string} [entryHash] - Optional hash string to parse, without the starting #, defaults to window.location.hash without the starting #
 * @returns {object} of key value pairs
 * @example
 * // url: https://example.com/#test&foo=bar&baz=qux
 * getHashProperties() // { test: undefined, foo: 'bar', baz: 'qux' }
 */
export function getHashProperties(entryHash?: string): object;
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
export function hashChange(callback: Function, single?: string): void;
