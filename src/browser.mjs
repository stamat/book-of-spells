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
 * Disable the scroll on the page.
 * 
 * @param {number} [shift=0] The amount of pixels to substitute for the scrollbar width, getScrollbarWidth() is used to provide this value
 */
export function disableScroll(shift = 0) {
  const body = document.body
  body.style.overflow = 'hidden'
  body.style.paddingRight = `${shift}px`
}

/**
 * Enable the scroll on the page.
 * 
 * @param {number} [shift=0] The amount of pixels to substitute for the scrollbar width, getScrollbarWidth() is used to provide this value
 */
export function enableScroll(shift = 0) {
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
 * @example
 * hashChange((hash) => {
 * // Do something with the hash
 * })
 */
export function hashChange(callback) {
  onHashChange(callback)
  
  window.addEventListener('hashchange', () => {
    onHashChange(callback)
  })
}
