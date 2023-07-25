/**  
 * @module slide
 * @description
 * A collection of functions for sliding elements up and down.
 * Substitutes for jQuery's slideUp(), slideDown(), and slideToggle() functions.
 * Leans onto CSS transitions, reading the height transition duration and setting a timer based on that to clear the height property on animation end.
 */

import { getTransitionDurations } from './dom.mjs'

/**
 * Clears the height slide timer of an element. Timer ID is stored in the element's dataset.
 * 
 * @param {HTMLElement} element
 */
function clearSlideTimer(element) {
  if (!element) return
  if (!element.dataset.heightTimer) return
  clearTimeout(parseInt(element.dataset.heightTimer))
  delete element.dataset.heightTimer
}

/**
 * Sets the slide duration of an element. The element must have a CSS transition set for the height property.
 * The CSS transition duration is used to determine how long the slide animation will take.
 * 
 * @param {HTMLElement} element
 */
function setSlideDuration(element) {
  if (!element) return
  if (element.dataset.slideDuration) return
  const transitionDurations = getTransitionDurations(element)
  if (!transitionDurations.hasOwnProperty('height')) return
  element.dataset.slideDuration = transitionDurations['height'].toString()
}

/**
 * Slides up an element. The element must have a CSS transition set for the height property. 
 * The transition duration is used to determine how long the slide up animation will take.
 * Substitutes for jQuery's slideUp() function.
 * 
 * @param {HTMLElement} element 
 * @example
 * slideUp(element)
 */
export function slideUp(element) {
  if (!element) return
  clearSlideTimer(element)
  const styles = getComputedStyle(element)

  setSlideDuration(element)
  if (!element.dataset.slideDuration) return
  
  element.style.overflow = 'hidden'
  if (styles.height !== 'auto') element.style.height = `${element.offsetHeight}px`

  setTimeout(() => {
    element.style.height = `0px`
  }, 10)

  const timer = setTimeout(() => {
    element.style.display = 'none'
    element.style.height = 'auto'
    element.style.removeProperty('overflow')
    clearSlideTimer(element)
  }, parseInt(element.dataset.slideDuration))
  element.dataset.heightTimer = timer.toString()
}

/**
 * Slides down an element. The element must have a CSS transition set for the height property.
 * The transition duration is used to determine how long the slide down animation will take.
 * Substitutes for jQuery's slideDown() function.
 * 
 * @param {HTMLElement} element
 * @example
 * slideDown(element)
 */
export function slideDown(element) {
  if (!element) return
  clearSlideTimer(element)
  const styles = getComputedStyle(element)

  setSlideDuration(element)
  if (!element.dataset.slideDuration) return

  let oldHeight = parseInt(styles.height)
  if (isNaN(oldHeight)) oldHeight = 0

  if (element.hasAttribute('hidden')) element.removeAttribute('hidden')
  element.style.pointerEvents = 'none'
  if (!oldHeight) element.style.visibility = 'hidden'
  element.style.display = 'block'
  element.style.height = 'auto'
  element.style.overflow = 'hidden'
  
  const height = element.offsetHeight
  element.style.height = oldHeight ? `${oldHeight}px` : '0px'

  setTimeout(() => {
    element.style.height = `${height}px`
    element.style.visibility = 'visible'
    element.style.removeProperty('pointer-events')
  }, 10)

  const timer = setTimeout(() => {
    element.style.height = 'auto'
    element.style.removeProperty('overflow')
    clearSlideTimer(element)
  }, parseInt(element.dataset.slideDuration))
  element.dataset.heightTimer = timer.toString()
}

/**
 * Toggles the slide state of an element. The element must have a CSS transition set for the height property.
 * The transition duration is used to determine how long the slide animation will take.
 * Substitutes for jQuery's slideToggle() function.
 * 
 * @param {HTMLElement} element
 * @example
 * slideToggle(element)
 */
export function slideToggle(element) {
  if (!element) return
  const styles = getComputedStyle(element)

  setSlideDuration(element)
  if (!element.dataset.slideDuration) return

  if (styles.display === 'none' || parseInt(styles.height) === 0) {
    slideDown(element)
  } else {
    slideUp(element)
  }
}
