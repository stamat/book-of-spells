/** @module browser */

import { isFunction } from './helpers.mjs'

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
  if (isFunction(query)) {
    matchMedia(query, (e) => {
      callback(e.matches)
    })

    const mql = matchMedia(query)
    callback(mql.matches)

    return mql.matches
  }

  return matchMedia(query).matches
}
