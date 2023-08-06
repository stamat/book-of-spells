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

import { getTransitionDurations } from './dom.mjs'
import { isFunction } from './helpers.mjs'

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
 * Slides up an element. The element must have a CSS transition set for the height property. 
 * The transition duration is used to determine how long the slide up animation will take.
 * Substitutes for jQuery's slideUp() function.
 * 
 * @param {HTMLElement} element 
 * @param {Function} [callback]
 * @example
 * slideUp(element)
 */
export function slideUp(element, callback) {
  if (!element) return
  clearTransitionTimer(element, 'height')
  const styles = getComputedStyle(element)

  const duration = setTransitionDuration(element, 'height')
  
  element.style.overflow = 'hidden'
  if (styles.height !== 'auto') element.style.height = `${element.offsetHeight}px`

  setTimeout(() => {
    element.style.height = `0px`
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
 * @param {Function} [callback]
 * @example
 * slideDown(element)
 */
export function slideDown(element, callback) {
  if (!element) return
  clearTransitionTimer(element, 'height')
  const styles = getComputedStyle(element)

  const duration = setTransitionDuration(element, 'height')

  let oldHeight = parseInt(styles.height)
  if (isNaN(oldHeight)) oldHeight = 0

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
 * @param {Function} [callback]
 * @example
 * slideToggle(element)
 */
export function slideToggle(element, callback) {
  if (!element) return
  const styles = getComputedStyle(element)

  setTransitionDuration(element, 'height')
  if (!element.dataset.heightTransitionDuration) return

  if (styles.display === 'none' || parseInt(styles.height) === 0) {
    slideDown(element, callback)
  } else {
    slideUp(element, callback)
  }
}

