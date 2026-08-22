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
  if (navigator.hasOwnProperty('vendor')) return /apple/i.test(navigator.vendor)
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
    const mql = matchMedia(query)
    mql.addEventListener('change', (e) => {
      callback(e.matches)
    })
    callback(mql.matches)

    return mql.matches
  }

  return matchMedia(query).matches
}

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
export function prefersReducedMotion(callback) {
  if (typeof matchMedia !== 'function') return false
  return mediaMatcher('(prefers-reduced-motion: reduce)', callback)
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
export function decodeFragment(hash) {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
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
 * Answers for this tab alone. Someone busy in a second tab of the same site reads as idle here,
 * which is the thing to know before wiring this to a logout — coordinating tabs needs a
 * `BroadcastChannel` and is not attempted.
 *
 * @param {function} callback Called with `false` when the user goes idle and `true` when they return
 * @param {object} [options]
 * @param {number} [options.timeout=60000] Milliseconds of no interaction that count as idle
 * @param {string|Array<string>} [options.events] Events that count as interaction, replacing the defaults — `pointerdown`, `pointermove`, `keydown`, `wheel`, `scroll`, `touchstart` and `resize`. Listened for on `window`, in the capturing phase, so a widget that stops its own events from propagating cannot read as the user having left, and events only `window` ever receives still arrive
 * @returns {object|null} `{ destroy }`, or `null` when there is no callback or no DOM
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
 */
export function userActivity(callback, options = {}) {
  if (!isFunction(callback) || typeof window === 'undefined' || typeof document === 'undefined') return null

  const timeout = options.timeout || 60000
  const events = options.events ? [].concat(options.events) : ['pointerdown', 'pointermove', 'keydown', 'wheel', 'scroll', 'touchstart', 'resize']

  let last = performance.now()
  let idle = false
  let timer = null

  const arm = function(delay) {
    timer = setTimeout(check, delay)
  }

  const check = function() {
    const idleFor = performance.now() - last
    if (idleFor < timeout) {
      arm(timeout - idleFor)
      return
    }

    timer = null
    idle = true
    callback(false)
  }

  // An event costs a clock read and an assignment, so there is nothing here worth throttling,
  // and no timer to reset: the deadline extends itself the next time it comes due.
  const onActivity = function() {
    last = performance.now()
    if (!idle) return

    // Armed before the callback, never after: a callback that destroys the observer would
    // otherwise have a fresh timer set behind it, on listeners that are already gone.
    idle = false
    arm(timeout)
    callback(true)
  }

  const onVisibility = function() {
    if (document.visibilityState !== 'visible' || idle) return
    clearTimeout(timer)
    check()
  }

  for (const event of events) window.addEventListener(event, onActivity, { capture: true, passive: true })
  document.addEventListener('visibilitychange', onVisibility)
  arm(timeout)

  return {
    destroy: function() {
      for (const event of events) window.removeEventListener(event, onActivity, { capture: true })
      document.removeEventListener('visibilitychange', onVisibility)
      clearTimeout(timer)
      timer = null
    }
  }
}
