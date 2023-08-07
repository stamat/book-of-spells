/** @module browser */

import { isEmpty, isFunction } from './helpers.mjs'
import { css } from './dom.mjs'
import { parseUrlParameters } from './parsers.mjs'

export function isUserAgentIOS(str) {
  return /iPad|iPhone|iPod/i.test(str)
}

export function isUserAgentMobile(str) {
  return /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(str) ||
    /\b(Android|Windows Phone|iPad|iPod)\b/i.test(str)
}

export function isUserAgentSafari(str) {
  return /^((?!chrome|android|crios|fxios).)*safari/i.test(str)
}

/**
 * Check if the device is an iOS device
 * 
 * @returns boolean True if the device is an iOS device, false otherwise
 */
export function isIOS() {
  return isUserAgentIOS(navigator.userAgent) && 'maxTouchPoints' in navigator && navigator.maxTouchPoints > 1
}

/**
 * Check if the device is a mobile device
 * 
 * @returns boolean True if the device is a mobile device, false otherwise
 */
export function isMobile() {
  if ('maxTouchPoints' in navigator) return navigator.maxTouchPoints > 0

  if ('matchMedia' in window) return !!matchMedia('(pointer:coarse)').matches

  if ('orientation' in window) return true

  return isUserAgentMobile(navigator.userAgent)
}

/**
 * Check if the browser is Safari
 *
 * @returns boolean True if the browser is Safari, false otherwise
 */
export function isSafari() {
  if (navigator.hasOwnProperty('vendor')) /apple/i.test(navigator.vendor)
  return isUserAgentSafari(navigator.userAgent)
}

/**
 * Check if the browser is Safari on iOS
 * 
 * @returns boolean True if the browser is Safari on iOS, false otherwise
 */
export function isIOSSafari() {
  return isIOS() && isSafari()
}

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
export function mediaMatcher(query, callback) {
  if (isFunction(callback)) {
    matchMedia(query).addEventListener('change', (e) => {
      callback(e.matches)
    })

    const mql = matchMedia(query)
    callback(mql.matches)

    return mql.matches
  }

  return matchMedia(query).matches
}

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
export function getScrollbarWidth() {
  const scrollDiv = document.createElement('div')
  
  css(scrollDiv, {
    width: '100px',
    height: '100px',
    position: 'absolute',
    left: '-9999px',
    zIndex: '0',
    overflowX: 'hidden',
    overflowY: 'scroll'
  })

  document.body.appendChild(scrollDiv)
  const scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth
  document.body.removeChild(scrollDiv)
  return scrollbarWidth
}

/**
 * Check if the vertical scrollbar is visible
 * 
 * @param {number} [scrollbarWidth] The width of the scrollbar, defaults to getScrollbarWidth()
 * @returns {boolean} True if the vertical scrollbar is visible, false otherwise
 */
export function hasVerticalScrollbarVisible(scrollbarWidth) {
  if (scrollbarWidth === undefined) scrollbarWidth = getScrollbarWidth()
  return window.innerHeight < document.body.scrollHeight && scrollbarWidth > 0
}

/**
 * Check if the horizontal scrollbar is visible
 * 
 * @param {number} [scrollbarWidth] The width of the scrollbar, defaults to getScrollbarWidth()
 * @returns {boolean} True if the horizontal scrollbar is visible, false otherwise
 */
export function hasHorizontalScrollbarVisible(scrollbarWidth) {
  if (scrollbarWidth === undefined) scrollbarWidth = getScrollbarWidth()
  return window.innerWidth < document.body.scrollWidth && scrollbarWidth > 0
}

/**
 * Disable the scroll on the page.
 * 
 * @param {number} [shift=0] If greater than 0 the body will be shifted to the left by the width of the scrollbar, getScrollbarWidth() is used to provide this value  
 */
export function disableScroll(shift) {
  const body = document.body
  if (shift && hasVerticalScrollbarVisible(shift)) body.style.paddingRight = `${shift}px`
  body.style.overflow = 'hidden'
}

/**
 * Enable the scroll on the page.
 * 
 * @param {boolean} [shift=0] If greater than 0 the body will be shifted back to the left by the width of the scrollbar, getScrollbarWidth() is used to provide this value
 */
export function enableScroll(shift) {
  const body = document.body
  body.style.overflow = ''
  if (shift) body.style.paddingRight = ''
}

/**
 * Parses a string of url query parameters into an object of key value pairs. Converts the values to the correct type.
 * 
 * @param {string} [entryQuery] - Optional query string to parse, without the starting ?, defaults to window.location.search without the starting ?
 * @returns {object} of key value pairs
 * @example
 * // url: https://example.com/?test&foo=bar&baz=qux
 * getQueryProperties() // { test: undefined, foo: 'bar', baz: 'qux' }
 */
export function getQueryProperties(entryQuery) {
  const query = entryQuery ? entryQuery : window.location.search.replace('?', '')
  if (isEmpty(query)) return {}

  return parseUrlParameters(query)
}

/**
 * Parses a string of url hash parameters into an object of key value pairs. Converts the values to the correct type.
 * 
 * @param {string} [entryHash] - Optional hash string to parse, without the starting #, defaults to window.location.hash without the starting #
 * @returns {object} of key value pairs
 * @example
 * // url: https://example.com/#test&foo=bar&baz=qux
 * getHashProperties() // { test: undefined, foo: 'bar', baz: 'qux' }
 */
export function getHashProperties(entryHash) {
  const hash = entryHash ? entryHash : window.location.hash.replace('#', '')
  if (isEmpty(hash)) return {}

  return parseUrlParameters(hash)
}

function onHashChange(callback) {
  const hash = window.location.hash.replace('#', '')
  if (!isEmpty(hash)) callback(hash)
}

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
export function hashChange(callback, single) {
  onHashChange(callback)
  
  if (single && window[single]) return
  if (single) window[single] = true
  
  window.addEventListener('hashchange', () => {
    onHashChange(callback)
  })
}
