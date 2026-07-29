/**  
 * @module animations
 * @description
 * A collection of functions animating element transitions.
 * Substitutes for jQuery's "animation" functions slideUp(), slideDown(), slideToggle(), fadeIn(), fadeOut() functions.
 * Leans onto CSS transitions, reading the height transition duration and setting a timer based on that to clear the height property on animation end.
 * There is a unique reason for this, for instance animating height is ony possible through max-height, and if the max-height, which can produce inconsistent
 * animation duration depending on the element's actual height. Or, animating display none to display block, this can be done via opacity and pointer-events:none
 * this means the element will have to overlay the screen but be inaccessible. This module provides "javascript wrappers" that substitute the shortcomings of
 * the CSS transitions regarding these two cases.
 */

import { getTransitionDurations, getTransitionDuration } from './dom.mjs'
import { prefersReducedMotion } from './browser.mjs'
import { isFunction } from './helpers.mjs'

/**
 * Milliseconds added to a transition timer so it cannot land before the transition
 * it is timing. A timer that fires a frame early tears the inline height off mid
 * transition, which shows as a snap at the end of an otherwise smooth animation.
 */
const TRANSITION_TIMER_GRACE = 10

/**
 * Clears the property transition timer of an element. Timer ID is stored in the element's dataset, under the propertyTransitionTimer key.
 * 
 * @param {HTMLElement} element
 * @param {string} [property='all'] The property to clear the timer for. Defaults to 'all', thus the key in the dataset will be allTransitionTimer.
 */
function clearTransitionTimer(element, property = 'all') {
  if (!element) return
  const dataPropName = `${property}TransitionTimer`
  if (!element.dataset[dataPropName]) return
  clearTimeout(parseInt(element.dataset[dataPropName]))
  delete element.dataset[dataPropName]
}


/**
 * Assigning a timer for a selected property and binding the timerID in the element's property 
 * for later retrieval for clearing
 * 
 * @param {HTMLElement} element 
 * @param {string} [property='all'] 
 * @param {number} timeout in milliseconds 
 * @param {function} callback 
 * @returns {number | null} timer ID if timer is successfully created
 */
function setTransitionTimer(element, property = 'all', timeout, callback) {
  if (!element) return
  const dataPropName = `${property}TransitionTimer`
  const timer = setTimeout(() => {
    clearTransitionTimer(element, property)
    if (isFunction(callback)) callback(element)
  }, timeout)
  element.dataset[dataPropName] = timer.toString()

  return timer
}

/**
 * Sets the slide duration of an element. The element must have a CSS transition set for the height property.
 * The CSS transition duration is used to determine how long the slide animation will take.
 * 
 * @param {HTMLElement} element
 */
function setTransitionDuration(element, property = 'all') {
  if (!element) return
  const dataPropName = `${property}TransitionDuration`
  if (element.dataset[dataPropName]) return parseInt(element.dataset[dataPropName])
  const transitionDurations = getTransitionDurations(element)
  if (!transitionDurations.hasOwnProperty(property)) return
  element.dataset[dataPropName] = transitionDurations[property].toString()
  return transitionDurations[property]
}

/**
 * Slides an element's height to or from its content height, without touching `display`.
 *
 * The counterpart to slideUp()/slideDown() for elements whose visibility something else
 * already owns - a `<details>` panel, a popover, a dialog. Those hide their own contents,
 * so a slide that also sets `display` fights them: on `<details>` in particular a leftover
 * inline `display: none` survives the close and then hides the panel body even after the
 * browser reopens it for find-in-page.
 *
 * The starting height is yours to pass, which is what makes an interrupted slide
 * recoverable: hand it the element's current height and it picks up from where the last
 * one stopped instead of jumping. Reduced motion, or no height transition in the CSS,
 * finishes immediately and still calls back.
 *
 * The caller is responsible for the element being rendered before the call - an
 * unrendered box has no height to measure and the slide has nothing to animate.
 *
 * @param {HTMLElement} element
 * @param {number} from The height in pixels to start from, usually 0 or the current height
 * @param {boolean} open True to slide to the content height, false to slide to 0
 * @param {Function} [callback] Called when the slide ends, with the element
 * @example
 * // open, from collapsed
 * details.open = true
 * slide(content, 0, true)
 *
 * // close, and only actually close once the slide is done
 * slide(content, content.offsetHeight, false, () => { details.open = false })
 */
export function slide(element, from, open, callback) {
  if (!element) return
  clearTransitionTimer(element, 'height')

  // Read fresh every time rather than caching in the dataset: the duration is the
  // author's stylesheet talking, and it changes with a media query or a restyle.
  const duration = prefersReducedMotion() ? 0 : getTransitionDuration(element, 'height')

  const done = (element) => {
    element.style.removeProperty('height')
    element.style.removeProperty('overflow')
    if (isFunction(callback)) callback(element)
  }

  if (!duration) return done(element)

  element.style.overflow = 'hidden'
  element.style.height = `${from}px`
  // Reading the scroll height measures the target *and* forces the layout the browser
  // needs before the next write, so that write transitions instead of jumping.
  const full = element.scrollHeight
  element.style.height = `${open ? full : 0}px`

  setTransitionTimer(element, 'height', duration + TRANSITION_TIMER_GRACE, done)
}

/**
 * Slides up an element. The element must have a CSS transition set for the height property.
 * The transition duration is used to determine how long the slide up animation will take.
 * Substitutes for jQuery's slideUp() function.
 * 
 * @param {HTMLElement} element 
 * @param {Function} [callback]
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * slideUp(element)
 */
export function slideUp(element, callback, transitionStartCallback) {
  if (!element) return
  clearTransitionTimer(element, 'height')
  const styles = getComputedStyle(element)

  const duration = setTransitionDuration(element, 'height')
  
  element.style.overflow = 'hidden'
  if (styles.height !== 'auto') element.style.height = `${element.offsetHeight}px`

  setTimeout(() => {
    element.style.height = `0px`
    if (isFunction(transitionStartCallback)) transitionStartCallback(element)
  }, 10)

  setTransitionTimer(element, 'height', duration, (element) => {
    element.style.display = 'none'
    element.style.height = ''
    element.style.removeProperty('overflow')
    if (isFunction(callback)) callback(element)
  })
}

/**
 * Slides down an element. The element must have a CSS transition set for the height property.
 * The transition duration is used to determine how long the slide down animation will take.
 * Substitutes for jQuery's slideDown() function.
 * 
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * slideDown(element)
 */
export function slideDown(element, callback, transitionStartCallback) {
  if (!element) return
  clearTransitionTimer(element, 'height')
  const styles = getComputedStyle(element)

  const duration = setTransitionDuration(element, 'height')

  let oldHeight = parseInt(styles.height)
  if (Number.isNaN(oldHeight)) oldHeight = 0

  if (element.hasAttribute('hidden')) element.removeAttribute('hidden')
  element.style.pointerEvents = 'none'
  if (!oldHeight) element.style.visibility = 'hidden'
  element.style.display = 'block'
  element.style.height = ''
  element.style.overflow = 'hidden'
  
  const height = element.offsetHeight
  element.style.height = oldHeight ? `${oldHeight}px` : '0px'

  setTimeout(() => {
    element.style.height = `${height}px`
    element.style.visibility = 'visible'
    element.style.removeProperty('pointer-events')
    if (isFunction(transitionStartCallback)) transitionStartCallback(element)
  }, 10)

  setTransitionTimer(element, 'height', duration, (element) => {
    element.style.height = ''
    element.style.removeProperty('overflow')
    if (isFunction(callback)) callback(element)
  })
}

/**
 * Toggles the slide state of an element. The element must have a CSS transition set for the height property.
 * The transition duration is used to determine how long the slide animation will take.
 * Substitutes for jQuery's slideToggle() function.
 * 
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * slideToggle(element)
 */
export function slideToggle(element, callback, transitionStartCallback) {
  if (!element) return
  const styles = getComputedStyle(element)

  setTransitionDuration(element, 'height')
  if (!element.dataset.heightTransitionDuration) return

  if (styles.display === 'none' || parseInt(styles.height) === 0) {
    slideDown(element, callback, transitionStartCallback)
  } else {
    slideUp(element, callback, transitionStartCallback)
  }
}

/**
 * Fades in an element. The element must have a CSS transition set for the opacity property, and initial opacity to 0.
 * The transition duration is used to determine how long the fade in animation will take.
 * Substitutes for jQuery's fadeIn() function.
 * 
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * fadeIn(element)
 */
export function fadeIn(element, callback, transitionStartCallback) {
  if (!element) return
  clearTransitionTimer(element, 'opacity')
  const styles = getComputedStyle(element)

  const duration = setTransitionDuration(element, 'opacity')

  let oldOpacity = parseFloat(styles.opacity)
  if (Number.isNaN(oldOpacity)) oldOpacity = 0

  if (element.hasAttribute('hidden')) element.removeAttribute('hidden')
  element.style.pointerEvents = 'none'
  if (!oldOpacity) element.style.visibility = 'hidden'
  element.style.display = 'block'
  element.style.opacity = oldOpacity ? oldOpacity : 0

  setTimeout(() => {
    element.style.opacity = 1
    element.style.visibility = 'visible'
    element.style.removeProperty('pointer-events')
    if (isFunction(transitionStartCallback)) transitionStartCallback(element)
  }, 10)

  setTransitionTimer(element, 'opacity', duration, (element) => {
    if (isFunction(callback)) callback(element)
  })
}

/**
 * Fades out an element. The element must have a CSS transition set for the opacity property.
 * The transition duration is used to determine how long the fade out animation will take.
 * Substitutes for jQuery's fadeOut() function.
 * 
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * fadeOut(element)
 */
export function fadeOut(element, callback, transitionStartCallback) {
  if (!element) return
  clearTransitionTimer(element, 'opacity')
  const styles = getComputedStyle(element)

  const duration = setTransitionDuration(element, 'opacity')

  element.style.opacity = styles.opacity

  setTimeout(() => {
    element.style.opacity = 0
    element.style.pointerEvents = 'none'
    if (isFunction(transitionStartCallback)) transitionStartCallback(element)
  }, 10)

  setTransitionTimer(element, 'opacity', duration, (element) => {
    element.style.display = 'none'
    element.style.opacity = ''
    element.style.pointerEvents = ''
    if (isFunction(callback)) callback(element)
  })
}

/**
 * Toggles the fade state of an element. The element must have a CSS transition set for the opacity property.
 * The transition duration is used to determine how long the fade animation will take.
 * Substitutes for jQuery's fadeToggle() function.
 * 
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * fadeToggle(element)
 */
export function fadeToggle(element, callback, transitionStartCallback) {
  if (!element) return
  const styles = getComputedStyle(element)

  setTransitionDuration(element, 'opacity')
  if (!element.dataset.opacityTransitionDuration) return

  if (styles.display === 'none' || parseFloat(styles.opacity) === 0) {
    fadeIn(element, callback, transitionStartCallback)
  } else {
    fadeOut(element, callback, transitionStartCallback)
  }
}
