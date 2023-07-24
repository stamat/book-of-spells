/** @module dom */

import { transformDashToCamelCase } from './helpers'

/**
 * Checks if an element is empty
 * 
 * @param {HTMLElement} element 
 * @returns boolean
 * @example
 * document.body.innerHTML = `
 *  <div id="empty-element"></div>
 *  <div id="non-empty-element1">foo</div>
 *  <div id="non-empty-element2"><br></div>`
 * 
 * isEmptyElement(document.getElementById('empty-element')) // => true
 * isEmptyElement(document.getElementById('non-empty-element1')) // => false
 * isEmptyElement(document.getElementById('non-empty-element2')) // => false
 */
export function isEmptyElement(element) {
  return element.innerHTML.trim() === ''
}

/**
 * Removes all elements matching a selector from the DOM
 * 
 * @param {string|HTMLElement|Element} selector The selector to select elements to remove
 * @example
 * document.body.innerHTML = `
 * <div id="foo"></div>
 * <div id="bar"></div>
 * <div id="baz"></div>`
 * `
 * remove('#foo, #bar') // => removes #foo and #bar
 */
export function remove(selector) {
  const elements = query(selector)
  for (const element of elements) {
    element.remove()
  }
}

/**
 * Queries the DOM for a single element and returns it. Substitutes for `document.querySelector(selector)` and JQuery's `$(selector).first()`
 * 
 * @param {string|HTMLElement|Element|Array<HTMLElement|Element>|NodeList} selector The selector to select an element
 * @returns {HTMLElement|Element}
 * @example
 * document.body.innerHTML = `
 * <div id="foo"></div>
 * <div id="bar"></div>
 * <div id="baz"></div>`
 * 
 * querySingle('#foo') // => <div id="foo"></div>
 * querySingle(document.getElementById('foo')) // => <div id="foo"></div>
 * querySingle(document.querySelector('#foo')) // => <div id="foo"></div>
 */
export function querySingle(selector) {
  if (selector instanceof Element) return selector
  return document.querySelector(selector)
}

/**
 * Queries the DOM for elements and returns them. Substitutes for `document.querySelectorAll(selector)` and JQuery's `$(selector)`
 * 
 * @param {string|HTMLElement|Element|Array<HTMLElement|Element>|NodeList} selector The selector to select elements
 * @returns {Array<Element>|NodeList}
 * @example
 * document.body.innerHTML = `
 * <div id="foo"></div>
 * <div id="bar"></div>
 * <div id="baz"></div>`
 * 
 * query('#foo') // => [<div id="foo"></div>]
 * query(document.getElementById('foo')) // => [<div id="foo"></div>]
 * query('div') // => [<div id="foo"></div>, <div id="bar"></div>, <div id="baz"></div>]
 */
export function query(selector) {
  if (selector instanceof Array) return selector
  if (selector instanceof Element) return [selector]
  return document.querySelectorAll(selector)
}

/**
 * Sets element styles from passed object of styles. Can also transform dash-case to camelCase for CSS properties
 * 
 * @param {HTMLElement} element The element to set styles on
 * @param {object} styles The object of styles to set
 * @param {boolean} transform Whether to transform dash-case to camelCase for CSS properties
 * @example
 * css(document.getElementById('foo'), { 'background-color': 'red', 'font-size': '16px' }, true) // => sets background-color and font-size
 * css(document.getElementById('foo'), { backgroundColor: 'red', fontSize: '16px' }) // => sets background-color and font-size
 */
export function css(element, styles, transform = false) {
  for (let property in styles) {
    if (transform) property = transformDashToCamelCase(property)
    element.style[property] = styles[property]
  }
}

/**
 * Decodes HTML entities in a string
 * 
 * @param {string} html The HTML string to decode
 * @returns {string} The decoded HTML string
 * @example
 * decodeHTML('&lt;div&gt;foo&lt;/div&gt;') // => '<div>foo</div>'
 * decodeHTML('&lt;div&gt;foo&lt;/div&gt;&lt;div&gt;bar&lt;/div&gt;') // => '<div>foo</div><div>bar</div>'
 */
export function decodeHTML(html) {
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  const res = txt.value
  txt.remove()
  return res
}

/**
 * Inserts an element before another element
 * 
 * @param {HTMLElement} targetElement The element to insert before
 * @param {HTMLElement} newElement The element to insert
 * @example
 * const target = document.getElementById('target')
 * const newElement = document.createElement('div')
 * newElement.id = 'newElement'
 * insertBeforeElement(target, newElement)
 * // <div id="newElement"></div>
 * // <div id="target"></div>
 */
export function insertBeforeElement(targetElement, newElement) {
  targetElement.parentNode?.insertBefore(newElement, targetElement);
}

/**
 * Toggles an attribute value on an element
 * 
 * @param {HTMLElement} element The element to toggle the attribute on
 * @param {string} attribute The attribute to toggle
 * @param {string} on Default: 'true'
 * @param {string} off Default: 'false'
 * @example
 * toggleAttributeValue(element, 'aria-expanded', 'true', 'false')
 * toggleAttributeValue(element, 'aria-expanded')
 */
export function toggleAttributeValue(element, attribute, on = 'true', off = 'false') {
  if (!element.hasAttribute(attribute)) return

  if (element.getAttribute(attribute) === on) {
    element.setAttribute(attribute, off)
  } else {
    element.setAttribute(attribute, on)
  }
}

/**
 * Converts a duration string to milliseconds integer
 * 
 * @param {string} duration The duration string to convert, e.g. '1s', '100ms', '0.5s'
 * @returns {number} The duration in milliseconds
 * @example
 * convertToMilliseconds('1s') // 1000
 * convertToMilliseconds('100ms') // 100
 * convertToMilliseconds('0.5s') // 500
 * convertToMilliseconds('0.5') // 0
 * convertToMilliseconds('foo') // 0
 */
export function cssTimeToMilliseconds(duration) {
  const regExp = new RegExp('([0-9.]+)([a-z]+)', 'i')
  const matches = regExp.exec(duration)
  if (!matches) return 0
  
  const unit = matches[2]
  switch (unit) {
    case 'ms':
      return parseFloat(matches[1])
    case 's':
      return parseFloat(matches[1]) * 1000
    default:
      return 0
  }
}

/**
 * Returns a map of transition properties and durations
 * 
 * @param {HTMLElement} element The element to get the transition properties and durations from
 * @returns {object<string, number>} A map of transition properties and durations
 * @example
 * getTransitionDurations(element) // { height: 1000 } if transition in CSS is set to 'height 1s'
 * getTransitionDurations(element) // { height: 500, opacity: 1000 } if transition in CSS is set to 'height 0.5s, opacity 1s'
 */
function getTransitionDurations(element) {
  if (!element) {}
  const styles = getComputedStyle(element)
  const transitionProperties = styles.getPropertyValue('transition-property').split(',')
  const transitionDurations = styles.getPropertyValue('transition-duration').split(',')
  
  const map = {}
  
  for (let i = 0; i < transitionProperties.length; i++) {
    const property = transitionProperties[i].trim()
    map[property] = transitionDurations.hasOwnProperty(i) ? cssTimeToMilliseconds(transitionDurations[i].trim()) : null
  }
  
  return map
}


/**
 * Detaches an element from the DOM and returns it
 * 
 * @param {HTMLElement} element The element to detach
 * @example
 * detachElement(element)
 * // => element
 * console.log(element.parentNode) // => null
 */
function detachElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
  return element
}
