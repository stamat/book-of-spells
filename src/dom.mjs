/** @module dom */

import { transformDashToCamelCase, transformCamelCaseToDash, stringToNumber, isArray, isString, isObject, isFunction, shallowMerge, percentage } from './helpers.mjs'
import { encodeHtmlEntities, decodeHtmlEntities } from './entities.mjs'

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
 * @param {HTMLElement|Element} [from=document] The element to remove elements from
 * @example
 * document.body.innerHTML = `
 * <div id="foo"></div>
 * <div id="bar"></div>
 * <div id="baz"></div>`
 * `
 * remove('#foo, #bar') // => removes #foo and #bar
 */
export function remove(selector, from = document) {
  const elements = query(selector, from)
  for (const element of elements) {
    element.remove()
  }
}

/**
 * Queries the DOM for a single element and returns it. Substitutes for `document.querySelector(selector)` and JQuery's `$(selector).first()`
 * 
 * @param {string|HTMLElement|Element|Array<HTMLElement|Element>|NodeList} selector The selector to select an element
 * @param {HTMLElement|Element} [from=document] The element to query from
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
export function querySingle(selector, from = document) {
  if (selector instanceof Element) return selector
  return from.querySelector(selector)
}

/**
 * Queries the DOM for elements and returns them. Substitutes for `document.querySelectorAll(selector)` and JQuery's `$(selector)`
 * 
 * @param {string|HTMLElement|Element|Array<HTMLElement|Element>|NodeList} selector The selector to select elements
 * @param {HTMLElement|Element} [from=document] The element to query from
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
export function query(selector, from = document) {
  if (selector instanceof Array || selector instanceof NodeList) return selector
  if (selector instanceof Element) return [selector]
  if (from instanceof Element || from instanceof Document) return from.querySelectorAll(selector)
  if (isString(from)) from = query(from)
  if (!(from instanceof Array || from instanceof NodeList)) return []
  const res = []
  for (const element of from) {
    res.push(...element.querySelectorAll(selector))
  }
  return res
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
  if (!element || !styles) return
  for (let property in styles) {
    const key = transform ? transformDashToCamelCase(property) : property
    element.style[key] = styles[property]
  }
}

/**
 * Decodes HTML entities in a string using the browser's DOMParser. If the DOMParser is not available, it uses a regular expression to decode the basic entities.
 * 
 * @see {@link module:parsers.decodeHtmlEntities}
 * 
 * @param {string} html The HTML string to decode
 * @returns {string} The decoded HTML string
 * @example
 * decodeHTML('&lt;div&gt;foo&lt;/div&gt;') // => '<div>foo</div>'
 * decodeHTML('&lt;div&gt;foo&lt;/div&gt;&lt;div&gt;bar&lt;/div&gt;') // => '<div>foo</div><div>bar</div>'
 */
export function decodeHTML(html) {
  if (typeof document === 'undefined') return decodeHtmlEntities(html)
  const txt = document.createElement('textarea')
  txt.innerHTML = html
  const res = txt.value
  txt.remove()
  return res
}

/**
 * Encodes HTML entities in a string using the browser's DOMParser. If the DOMParser is not available, it uses a regular expression to encode the basic entities.
 * 
 * @see {@link module:parsers.encodeHtmlEntities}
 * 
 * @param {string} html The HTML string to encode
 * @returns {string} The encoded HTML string
 * @example
 * encodeHTML('<div>foo</div>') // => '&lt;div&gt;foo&lt;/div&gt;'
 * encodeHTML('<div>foo</div><div>bar</div>') // => '&lt;div&gt;foo&lt;/div&gt;&lt;div&gt;bar&lt;/div&gt;'
 */
export function encodeHTML(html) {
  if (typeof document === 'undefined') return encodeHtmlEntities(html)
  const txt = document.createElement('textarea')
  txt.textContent = html
  const res = txt.innerHTML
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
  if (!targetElement || !newElement) return
  targetElement.parentNode.insertBefore(newElement, targetElement);
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
export function getTransitionDurations(element) {
  if (!element) return {}
  const styles = getComputedStyle(element)
  const transitionProperties = styles.getPropertyValue('transition-property').split(',')
  const transitionDurations = styles.getPropertyValue('transition-duration').split(',')
  
  const map = {}
  
  for (let i = 0; i < transitionProperties.length; i++) {
    const property = transitionProperties[i].trim()
    // CSS repeats the duration list when it's shorter than the property list
    map[property] = cssTimeToMilliseconds(transitionDurations[i % transitionDurations.length].trim())
  }

  return map
}

/**
 * Read a set of typed options off an element's attributes.
 *
 * Accepts the bare, kebab-case and `data-*` spellings of each option, with `data-*`
 * winning when both are present, so a widget can be configured whichever way the
 * markup author reaches for. Only the options actually present come back - absent
 * ones are left out rather than defaulted, so the result merges cleanly over
 * whatever defaults the caller holds.
 *
 * Booleans follow HTML, not JavaScript: a bare attribute parses as an empty string
 * and means "on", and only `false` and `0` mean off. Numbers that do not parse are
 * dropped rather than coming back as NaN.
 *
 * @param {HTMLElement} element The element to read the attributes from
 * @param {object<string, 'boolean'|'number'|'string'>} schema A map of camelCase option names to types
 * @returns {object} The options present on the element, typed
 * @example
 * // <div data-page-step="25" exclusive label="FAQ">
 * readOptions(element, { pageStep: 'number', exclusive: 'boolean', label: 'string', muted: 'boolean' })
 * // => { pageStep: 25, exclusive: true, label: 'FAQ' }
 */
export function readOptions(element, schema) {
  const options = {}
  if (!element || !schema) return options

  for (const key in schema) {
    const raw = element.dataset[key] != null ? element.dataset[key] : element.getAttribute(transformCamelCaseToDash(key))
    if (raw == null) continue

    if (schema[key] === 'boolean') {
      // A bare attribute reads as '', which in HTML means "on"
      options[key] = raw !== 'false' && raw !== '0'
    } else if (schema[key] === 'number') {
      const num = stringToNumber(raw)
      if (num !== undefined) options[key] = num
    } else {
      options[key] = raw
    }
  }

  return options
}

/**
 * Returns the duration a single property will actually transition with, in milliseconds.
 *
 * Unlike reading getTransitionDurations() by key, this resolves the `all` keyword: a
 * `transition: all 1s` animates height too, it just isn't listed under that name. An
 * untransitioned property reads as 0, which is also what `transition: none` gives you -
 * so a reduced motion media query switching the transition off reads as "no animation".
 *
 * @param {HTMLElement} element The element to get the transition duration from
 * @param {string} [property='all'] The CSS property to get the duration for
 * @returns {number} The duration in milliseconds, 0 if the property is not transitioned
 * @example
 * getTransitionDuration(element, 'height') // 1000 if transition in CSS is set to 'height 1s'
 * getTransitionDuration(element, 'height') // 300 if transition in CSS is set to 'all 0.3s'
 * getTransitionDuration(element, 'height') // 0 if transition in CSS is set to 'opacity 1s'
 */
export function getTransitionDuration(element, property = 'all') {
  const durations = getTransitionDurations(element)
  if (durations.hasOwnProperty(property)) return durations[property]
  if (durations.hasOwnProperty('all')) return durations.all
  return 0
}

/**
 * Check a list of elements if any of them matches a selector
 * 
 * @param {Array<HTMLElement>|NodeList|HTMLElement} elements The elements to check
 * @param {string} selector The selector to check
 * @returns {boolean} True if any of the elements matches the selector, false otherwise
 * @example
 * document.body.innerHTML = `
 * <div id="foo"></div>
 * <div id="bar"></div>
 * <div id="baz"></div>`
 * 
 * matchesAny(document.querySelectorAll('div'), '#foo') // => true
 * matchesAny(document.querySelectorAll('div'), '#qux') // => false
 */
export function matchesAny(elements, selector) {
  if (!elements || !selector) return false
  if (elements instanceof Element) elements = [elements]
  if (isString(elements)) elements = query(elements)
  if (!elements.length) return false
  for (const element of elements) {
    if (element.matches(selector)) return true
  }
  return false
}

/**
 * Check a list of elements if all of them matches a selector
 * 
 * @param {Array<HTMLElement>|NodeList|HTMLElement} elements The elements to check
 * @param {string} selector The selector to check
 * @returns {boolean} True if all of the elements matches the selector, false otherwise
 * @example
 * document.body.innerHTML = `
 * <div id="foo"></div>
 * <div id="bar"></div>
 * <div id="baz"></div>`
 * 
 * matchesAll(document.querySelectorAll('div'), 'div') // => true
 * matchesAll(document.querySelectorAll('div'), '#foo') // => false
 */
export function matchesAll(elements, selector) {
  if (!elements || !selector) return false
  if (elements instanceof Element) elements = [elements]
  if (isString(elements)) elements = query(elements)
  if (!elements.length) return false
  for (const element of elements) {
    if (!element.matches(selector)) return false
  }
  return true
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
export function detachElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element);
  }
  return element
}

/**
 * Gets table data from a table element, a simple regular table element, or a table like structure.
 * Useful for scraping data.
 * 
 * @param {string} selector The selector to select the table element
 * @param {Array<string>|string|null} headers The headers to use for the data. If 'auto' is passed, the row containing th or the first row will be used as headers
 * @param {string} [rowSelector='tr'] The selector to select the rows
 * @param {string} [cellSelector='td'] The selector to select the cells
 * @returns {Array<object>} An array of objects with the properties as keys and the cell values as values
 * @example
 * document.body.innerHTML = `
 * <table id="table">
 *  <thead>
 *   <tr>
 *   <th>Foo</th>
 *  <th>Bar</th>
 * </tr>
 * </thead>
 * <tbody>
 * <tr>
 * <td>Foo 1</td>
 * <td>Bar 1</td>
 * </tr>  
 * <tr>
 * <td>Foo 2</td>
 * <td>Bar 2</td>
 * </tr>
 * </tbody>
 * </table>`
 * 
 * getTableData('#table', ['foo', 'bar'])
 * // => [
 * //  { foo: 'Foo 1', bar: 'Bar 1' },
 * //  { foo: 'Foo 2', bar: 'Bar 2' }
 * // ]
 */
export function getTableData(selector, headers, rowSelector = 'tr', cellSelector = 'td', headerCellSelector = 'th') {
  const table = typeof selector === 'string' ? document.querySelector(selector) : selector
  if (!table) return []
  const res = []
  const rows = table.querySelectorAll(rowSelector)
  let start = 0

  function iterateHeaders(arr) {
    if (!arr || !arr.length) return
    const res = []
    for (let i = 0; i < arr.length; i++) {
      res.push(arr[i].textContent.trim())
    }
    return res
  }

  if (headers && isString(headers) && headers === 'auto') {
    let headerCells = table.querySelectorAll(headerCellSelector)
    
    if (headerCells && headerCells.length) {
      headers = iterateHeaders(headerCells)
    } else {
      headers = iterateHeaders(rows[0].querySelectorAll(cellSelector))
      start = 1
    }
  }

  for (let i = start; i < rows.length; i++) {
    const row = rows[i]
    const cells = row.querySelectorAll(cellSelector)
    if (!cells || !cells.length) continue

    let rowData = []
    if (headers && isArray(headers) && headers.length) {
      rowData = {}
      for (let j = 0; j < headers.length; j++) {
        rowData[headers[j]] = cells[j] ? cells[j].textContent.trim() : null
      }
    } else {
      for (let j = 0; j < cells.length; j++) {
        rowData.push(cells[j].textContent.trim())
      }
    }
    res.push(rowData)
  }
  return res
}

/**
 * Parses HTML string to a DOM Node
 * 
 * @param {string} html The HTML string to parse
 * @param {boolean} [allChildren=false] If true, all children of the body will be returned, otherwise only the first child
 * @returns {Node} The parsed DOM Node
 * @example
 * parseDOM('<div>foo</div>') // => <div>foo</div>
 * parseDOM('<div>foo</div><div>bar</div>', true) // => NodeList(2) [div, div]
 * parseDOM(document.getElementById('foo')) // => <div id="foo"></div>
 * parseDOM(document.querySelectorAll('div')) // => NodeList(2) [div, div]
 */
export function parseDOM(html, allChildren) {
  if (html instanceof Element || html instanceof NodeList) return html
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  return !allChildren ? doc.body.firstChild : doc.body.childNodes
}

/**
 * Loads an image form a provided source url and calls a callback when it's loaded
 * 
 * @param {string} src The source url of the image
 * @param {Function} [callback] The callback to call when the image is loaded
 * @example
 * loadImage('https://example.com/image.png', () => {
 *  console.log('Image loaded')
 * })
 */
export function loadImage(src, callback) {
  const img = new Image()
  if (callback) img.addEventListener('load', callback, false)
  img.src = src
}

const NON_BUBBLING_EVENTS = new Set(['focus', 'blur', 'mouseenter', 'mouseleave', 'load', 'unload', 'scroll', 'resize'])

/**
 * Delegate DOM events. Uses event bubbling with closest() for events that bubble.
 * Uses MutationObserver for non-bubbling events (focus, blur, mouseenter, mouseleave, etc.)
 * to attach listeners directly to matching elements as they appear in the DOM.
 *
 * @param {string} selector The selector to select the elements to delegate the event to
 * @param {string} eventType The event type to delegate, like `click`
 * @param {Function} handler The handler to call when the event is triggered.
 * @returns {MutationObserver | {destroy: Function, disconnect: Function} | null} For non-bubbling events the MutationObserver instance (with an added destroy() method that also removes the element listeners), for bubbling events a handle with destroy()/disconnect(), or null when MutationObserver is required but unavailable
 * @example
 * delegateEvent('.foo', 'click', (e, target) => {
 * console.log('Clicked on', target)
 * })
 */
export function delegateEvent(selector, eventType, handler) {
  if (!NON_BUBBLING_EVENTS.has(eventType)) {
    const documentListener = (e) => {
      const target = e.target.closest(selector)
      if (target) handler(e, target)
    }
    document.addEventListener(eventType, documentListener)
    const destroy = () => document.removeEventListener(eventType, documentListener)
    return { destroy, disconnect: destroy }
  }

  if (typeof MutationObserver === 'undefined') return null

  const listener = (e) => {
    handler(e, e.currentTarget)
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue
        if (node.matches(selector)) {
          node.addEventListener(eventType, listener)
          continue
        }

        for (const child of node.querySelectorAll(selector)) {
          child.addEventListener(eventType, listener)
        }
      }
    }
  })

  for (const node of document.querySelectorAll(selector)) {
    node.addEventListener(eventType, listener)
  }
  observer.observe(document.body, { childList: true, subtree: true })
  observer.destroy = () => {
    observer.disconnect()
    for (const node of document.querySelectorAll(selector)) {
      node.removeEventListener(eventType, listener)
    }
  }
  return observer
}

/**
 * Run a handler on selected elements and on elements added to the DOM with the same selector as a MutationObserver abstraction,
 * or use it to delegate events as a `delegateEvent` alias
 * 
 * @param {string} selector The selector to select the elements to run the handler on
 * @param {string | Function} eventTypeOrHandler The event type to delegate, like `click`, or the handler to call on every element
 * @param {Function} [handler] The handler to call when the event is triggered.
 * @returns {MutationObserver | {destroy: Function, disconnect: Function} | null} The MutationObserver instance (with an added destroy() method), a destroy/disconnect handle for bubbling delegated events, or null when MutationObserver is required but unavailable
 * @see delegateEvent
 * @example
 * on('.foo', (el) => {
 * console.log('Element', el, 'added to the DOM')
 * })
 * 
 * on('.foo', 'click', (e, target) => {
 * console.log('Clicked on', target)
 * })
 */

export function on(selector, eventTypeOrHandler, handler) {
  if (isString(eventTypeOrHandler)) {
    return delegateEvent(selector, eventTypeOrHandler, handler)
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue
        if (node.matches(selector)) {
          eventTypeOrHandler(node)
          continue
        }

        for (const child of node.querySelectorAll(selector)) {
          eventTypeOrHandler(child)
        }
      }
    }
  })

  for (const node of document.querySelectorAll(selector)) {
    eventTypeOrHandler(node)
  }

  observer.observe(document.body, { childList: true, subtree: true })
  observer.destroy = () => observer.disconnect()
  return observer
}

/**
 * Adds one listener to multiple events
 * 
 * @param {string|HTMLElement|NodeList} elements The elements or a selector for elements to add the event listeners to
 * @param {string|Array<string>} events The event types to add the event listeners for, like `click mouseenter`
 * @param {Function} handler The handler to call when the event is triggered.
 * @param {object} [options] The options to pass to the event listeners
 * @example
 * addListenerForEvents('.foo', 'click mouseenter', (e) => { console.log(e.type) })
 */
export function addListenerForEvents(elements, events, handler, options) {
  if (elements instanceof Element) elements = [elements]
  if (typeof elements === 'string') elements = query(elements)

  const eventTypes = isArray(events) ? events : events.split(' ')
  for (const element of elements) {
    for (const eventType of eventTypes) {
      element.addEventListener(eventType, handler, options)
    }
  }
}

/**
 * Removes one listener from multiple registered events
 * 
 * @param {string|HTMLElement|NodeList} elements The elements or a selector for elements to remove the event listeners from
 * @param {string|Array<string>} events The event types to remove the event listeners for, like `click mouseenter`
 * @param {Function} handler The handler to remove
 * @param {object} [options] The options to pass to the event listeners
 * @example
 * removeListenerForEvents('.foo', 'click mouseenter', (e) => { console.log(e.type) })
 */
export function removeListenerForEvents(elements, events, handler, options) {
  if (elements instanceof Element) elements = [elements]
  if (typeof elements === 'string') elements = query(elements)

  const eventTypes = isArray(events) ? events : events.split(' ')
  for (const element of elements) {
    for (const eventType of eventTypes) {
      element.removeEventListener(eventType, handler, options)
    }
  }
}

/**
 * Resizes an element to cover its parent element while maintaining the aspect ratio
 * 
 * @param {string|HTMLElement|NodeList} elements The elements or a selector for elements to resize
 * @param {number} [ratio=1] The ratio to maintain
 * @param {number} [offset=0] An offset to add to the parent element's width and height
 * @example
 * proportionalParentCoverResize('.foo', 16/9, 10)
 */
export function proportionalParentCoverResize(elements, ratio = 1, offset = 0) {
  if (elements instanceof Element) elements = [elements]
  if (typeof elements === 'string') elements = query(elements)

  for (const element of elements) {
    const h = element.parentNode.offsetHeight + offset
    const w = element.parentNode.offsetWidth + offset

    if (ratio > w/h) {
      element.style.width = h*ratio + 'px'
      element.style.height = h + 'px'
    } else {
      element.style.width = w + 'px'
      element.style.height = w/ratio + 'px'
    }
  }
}

/**
 * If provided element is visible. Checks if the element is not visibility hidden or display none, has no opacity, and has a width and height.
 * 
 * @param {HTMLElement} element The element to check
 * @returns {boolean} True if the element is visible, false otherwise
 * 
 * @example
 * isVisible(document.getElementById('foo'))
 */
export function isVisible(element, checkOpacity = true) {
  if (!element || !(element instanceof HTMLElement)) return false
  if (typeof element.checkVisibility === 'function') return element.checkVisibility({ visibilityProperty: true, opacityProperty: checkOpacity })
  if (element.getAttribute('hidden') !== null) return false;
  const computedStyle = getComputedStyle(element)
  if (
    computedStyle.getPropertyValue('display') === 'none' ||
    computedStyle.getPropertyValue('visibility') === 'hidden' ||
    (checkOpacity && computedStyle.getPropertyValue('opacity') === '0')
  )
    return false
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
}

/**
 * Returns all focusable elements from a given element or the document.
 * Focusable elements are those that can be focused by the user, such as links, buttons, inputs, etc.
 * Always use getVisibleFocusableElements instead of this function to ensure that only visible elements are returned, since only visible elements can be focused by the user.
 * 
 * @see {@link getVisibleFocusableElements}
 * @param {HTMLElement|Element|Document} [from=document] The element to get the focusable elements from
 * @returns {Array<HTMLElement>} An array of focusable elements
 * @example
 * document.body.innerHTML = `
 * <div id="foo" tabindex="0">Foo</div>
 * <div id="bar" tabindex="-1">Bar</div>
 * <button id="baz">Baz</button>
 * <div id="qux" contenteditable="true">Qux</div>`
 * <a href="#quux" id="quux">Quux</a>
 * 
 * getFocusableElements() // => [<div id="foo" tabindex="0">Foo</div>, <button id="baz">Baz</button>, <div id="qux" contenteditable="true">Qux</div>, <a href="#quux" id="quux">Quux</a>]
 */
export function getFocusableElements(from = document) {
  if (from instanceof Element || from instanceof Document) {
    return Array.from(from.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable]:not([contenteditable="false"]), video, audio, summary'))
  }
  if (isString(from)) from = query(from)
  if (!isArray(from) && !(from instanceof NodeList)) return []
  const res = []
  for (const element of from) {
    res.push(...getFocusableElements(element))
  }
  return res
}

/**
 * Returns all visible focusable elements from a given element or the document.
 * 
 * @see {@link getFocusableElements}
 * @see {@link isVisible}
 * @param {HTMLElement|Element|Document} [from=document] The element to get the focusable elements from
 * @param {string} [excludeSelector] A selector to exclude elements from the result
 * @returns {Array<HTMLElement>} An array of visible focusable elements
 * 
 * @example
 * document.body.innerHTML = `
 * <div id="foo" tabindex="0">Foo</div>
 * <div id="bar" tabindex="-1">Bar</div>
 * <button id="baz" style="display: none;">Baz</button>
 * <div id="qux" contenteditable="true">Qux</div>`
 * 
 * getVisibleFocusableElements() // => [<div id="foo" tabindex="0">Foo</div>, <div id="qux" contenteditable="true">Qux</div>]
 * getVisibleFocusableElements(document.body, '#foo') // => [<div id="qux" contenteditable="true">Qux</div>]
 */
export function getVisibleFocusableElements(from = document, excludeSelector) {
  const elements = getFocusableElements(from)
  return Array.from(elements).filter(el => isVisible(el, false) && (!excludeSelector || !el.matches(excludeSelector)))
}

/**
 * Swipe event handler
 *
 * Two points make the gesture - where the pointer went down and where it came up - so there is
 * no `pointermove` listener running on every frame of every scroll down the page. The axis it
 * travelled furthest along is the one reported, and a gesture as far down as across is neither.
 *
 * @param {HTMLElement} element The element to listen for swipe gestures on
 * @param {object | Function} callback The callback to call when a swipe gesture is detected or the options object with the callback, threshold, timeThreshold and mouse
 * @param {number} [threshold=150] The threshold in pixels to trigger the callback.
 * @param {number} [timeThreshold=0] The threshold in milliseconds to trigger the callback. Defaults to 0, which means the callback will be called regardless of the time it took to swipe.
 * @param {boolean} [mouse=true] Whether a mouse drag counts as a swipe. Options object only. Turn it off on anything with selectable text, draggable images or links in it - reading a swipe from a mouse costs the page all three.
 * @returns {object | null} The destroy method to remove the event listeners, or null without an element
 * @example
 * swipe(document.getElementById('foo'), (e) => {
 *  console.log(e.direction)
 *  console.log(e.deltaX)
 *  console.log(e.deltaY)
 *  console.log(e.startX)
 *  console.log(e.startY)
 *  console.log(e.endX)
 *  console.log(e.endY)
 *  console.log(e.threshold)
 *  console.log(e.type)
 *  console.log(e.target)
 *  console.log(e.horizontal)
 *  console.log(e.vertical)
 *  console.log(e.horizontalDirection)
 *  console.log(e.verticalDirection)
 *  console.log(e.timeElapsed)
 *  console.log(e.timeThreshold)
 * })
 *
 * swipe(document.getElementById('foo'), { callback: onSwipe, threshold: 40, mouse: false })
 *
 * element.addEventListener('swipe', (e) => { ... })
 * element.addEventListener('swipestart', (e) => { ... })
 * element.addEventListener('swipeend', (e) => { ... })
 */
export function swipe(element, callback, threshold = 150, timeThreshold = 0) {
  let mouse = true
  let start = null
  let swiped = false

  if (isObject(callback)) {
    const options = callback
    callback = options.callback
    threshold = options.threshold || threshold
    timeThreshold = options.timeThreshold || timeThreshold
    if (options.mouse === false) mouse = false
  }

  if (!element) return null

  const handleStart = function(e) {
    swiped = false
    // A second pointer while one is already down is a pinch, and the first one's numbers are
    // noise from here on, so the gesture is dropped rather than answered wrongly.
    if (start || (!mouse && e.pointerType === 'mouse')) {
      start = null
      return
    }
    start = { id: e.pointerId, x: e.clientX, y: e.clientY, time: Date.now() }
    // Touch and pen are captured implicitly by the browser, the mouse is not - without this a
    // mouse swipe that ends off the element never reports its `pointerup`. It throws when the
    // id is not an active pointer, which a synthesised event is.
    if (element.setPointerCapture) {
      try { element.setPointerCapture(e.pointerId) } catch { /* the gesture still ends on the element */ }
    }
    element.dispatchEvent(new CustomEvent('swipestart', { detail: { target: element, startX: start.x, startY: start.y, startTime: start.time } }))
  }

  const handleEnd = function(e) {
    const from = start
    start = null
    if (!from || e.pointerId !== from.id) return

    const endX = e.clientX
    const endY = e.clientY
    const endTime = Date.now()
    const deltaX = Math.abs(endX - from.x)
    const deltaY = Math.abs(endY - from.y)
    const left = endX < from.x
    const up = endY < from.y
    const horizontal = deltaX > deltaY && deltaX > threshold
    const vertical = deltaY > deltaX && deltaY > threshold
    const timeElapsed = endTime - from.time

    if (horizontal || vertical) {
      if (!timeThreshold || timeElapsed <= timeThreshold) {
        const res = {
          target: element,
          deltaX: deltaX,
          deltaY: deltaY,
          startX: from.x,
          startY: from.y,
          endX: endX,
          endY: endY,
          threshold: threshold,
          horizontal: horizontal,
          vertical: vertical,
          horizontalDirection: left ? 'left' : 'right',
          verticalDirection: up ? 'up' : 'down',
          direction: horizontal ? (left ? 'left' : 'right') : (up ? 'up' : 'down'),
          timeElapsed: timeElapsed,
          timeThreshold: timeThreshold
        }

        swiped = true
        if (isFunction(callback)) callback(res)
        element.dispatchEvent(new CustomEvent('swipe', { detail: res }))
      }
    }

    element.dispatchEvent(new CustomEvent('swipeend', { detail: { target: element, startX: from.x, startY: from.y, startTime: from.time, endX, endY, endTime } }))
  }

  // The browser took the gesture - a scroll started under it, or the finger left the screen's
  // edge. Whatever it became, it is not a swipe.
  const handleCancel = function() {
    start = null
  }

  // A swipe that ends on a link fires a click too, and the browser only stops synthesising one
  // after a slop most thresholds are past - most, not all, and the one that still fires
  // navigates away from a page the reader was swiping through. `detail` is what keeps this off
  // the keyboard: Enter on a link reports zero pointer clicks.
  const handleClick = function(e) {
    if (!swiped) return
    swiped = false
    if (!e.detail) return
    e.preventDefault()
    e.stopPropagation()
  }

  element.addEventListener('pointerdown', handleStart)
  element.addEventListener('pointerup', handleEnd)
  element.addEventListener('pointercancel', handleCancel)
  element.addEventListener('click', handleClick, true)

  return {
    destroy: function() {
      element.removeEventListener('pointerdown', handleStart)
      element.removeEventListener('pointerup', handleEnd)
      element.removeEventListener('pointercancel', handleCancel)
      element.removeEventListener('click', handleClick, true)
      start = null
      swiped = false
    }
  }
}

/**
 * Alias for swipe
 * 
 * @see swipe
 * @deprecated Use swipe instead
 */
export const onSwipe = swipe

/**
 * Drag event handler
 * 
 * @param {HTMLElement} element The element to listen for drag gestures on
 * @param {object | Function} opts The options object or the callback to call when a drag gesture is detected
 * @param {boolean} [opts.inertia=false] Whether to enable inertia
 * @param {boolean} [opts.bounce=false] Whether to enable bounce when inertia is enabled
 * @param {number} [opts.friction=0.9] The friction to apply when inertia is enabled
 * @param {number} [opts.bounceFactor=0.2] The bounce factor to apply when bounce is enabled
 * @param {number} [opts.velocityWindow=80] Time window (ms) over which flick velocity is measured
 * @param {number} [opts.maxVelocity=2] Cap on flick velocity magnitude (px/ms) to stop overshoot
 * @param {boolean} [opts.preventDefaultTouch=true] Whether to prevent the default touch behavior
 * @param {Function} [opts.callback] The callback to call when a drag gesture is detected
 * @returns {object | null} The destroy method to remove the event listeners
 * @example
 * drag(document.getElementById('foo'), (e) => {
 *  console.log(e.x)
 *  console.log(e.y)
 *  console.log(e.relativeX)
 *  console.log(e.relativeY)
 *  console.log(e.xPercentage)
 *  console.log(e.yPercentage)
 *  console.log(e.velocityX)
 *  console.log(e.velocityY)
 *  console.log(e.prevX)
 *  console.log(e.prevY)
 * })
 * 
 * element.addEventListener('drag', (e) => { ... })
 * element.addEventListener('dragstart', (e) => { ... })
 * element.addEventListener('dragend', (e) => { ... })
 * element.addEventListener('draginertia', (e) => { ... })
 * element.addEventListener('draginertiaend', (e) => { ... })
 */
export function drag(element, opts) {
  if (!element || !(element instanceof Element)) return
  if (element.getAttribute('drag-enabled') === 'true') return

  let x = 0
  let y = 0
  let prevX = 0
  let prevY = 0
  let velocityX = 0
  let velocityY = 0
  let dragging = false
  let rect = null
  let inertiaId = null
  let inertiaTime = 0
  let samples = []

  const options = {
    inertia: false,
    bounce: false,
    friction: 0.9,
    bounceFactor: 0.2,
    velocityWindow: 80,
    maxVelocity: 2,
    callback: null,
    preventDefaultTouch: true
  }

  if (isFunction(opts)) {
    options.callback = opts
  } else if (isObject(opts)) {
    shallowMerge(options, opts)
  }

  options.friction = Math.abs(options.friction)
  options.bounceFactor = Math.abs(options.bounceFactor)
  options.maxVelocity = Math.abs(options.maxVelocity)

  const now = function() {
    return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  }
  const cap = function(v) {
    if (v > options.maxVelocity) return options.maxVelocity
    if (v < -options.maxVelocity) return -options.maxVelocity
    return v
  }
  const sampleVelocity = function() {
    if (samples.length < 2) return { vx: 0, vy: 0 }
    const last = samples[samples.length - 1]
    let start = samples[0]
    for (let i = samples.length - 1; i >= 0; i--) {
      start = samples[i]
      if (last.t - samples[i].t >= options.velocityWindow) break
    }
    const dt = last.t - start.t
    if (dt <= 0) return { vx: 0, vy: 0 }
    return { vx: cap((last.x - start.x) / dt), vy: cap((last.y - start.y) / dt) }
  }

  element.setAttribute('drag-enabled', 'true')
  element.setAttribute('dragging', 'false')

  const calcPageRelativeRect = function() {
    const origRect = element.getBoundingClientRect()
    const rect = {
      top: origRect.top + window.scrollY,
      left: origRect.left + window.scrollX,
      width: origRect.width,
      height: origRect.height
    }

    return rect
  }
  rect = calcPageRelativeRect()

  const handleStart = function(e) {
    samples = []
    setXY(e)
    dragging = true
    rect = calcPageRelativeRect()
    element.setAttribute('dragging', 'true')
    // Track on document so the drag survives the pointer leaving the element
    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseup', handleEnd)
    if (inertiaId) {
      cancelAnimationFrame(inertiaId)
      inertiaId = null
    }
    const event = new CustomEvent('dragstart', { detail: getDetail() })
    element.dispatchEvent(event)
  }

  const handleMove = function(e) {
    if (!dragging) return
    setXY(e)
    const v = sampleVelocity()
    velocityX = v.vx
    velocityY = v.vy
    const detail = getDetail()
    if (options.callback) options.callback(detail)
    const event = new CustomEvent('drag', { detail: detail })
    element.dispatchEvent(event)
  }

  const handleEnd = function() {
    if (!dragging) return
    dragging = false
    element.setAttribute('dragging', 'false')
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleEnd)
    const v = sampleVelocity()
    velocityX = v.vx
    velocityY = v.vy
    inertiaTime = now()
    if (options.inertia) inertiaId = requestAnimationFrame(inertia)
    const event = new CustomEvent('dragend', { detail: getDetail() })
    element.dispatchEvent(event)
  }

  const setXY = function(e) {
    const carrier = e.touches ? e.touches[0] : e
    if (e.touches && options.preventDefaultTouch) e.preventDefault()
    prevX = x
    prevY = y
    x = carrier.pageX
    y = carrier.pageY
    samples.push({ t: now(), x: x, y: y })
    if (samples.length > 12) samples.shift()
  }

  const getDetail = function() {
    const relativeX = x - rect.left
    const relativeY = y - rect.top
    const xPercentage = percentage(relativeX, rect.width)
    const yPercentage = percentage(relativeY, rect.height)

    const detail = {
      target: element,
      x: x,
      y: y,
      relativeX: relativeX,
      relativeY: relativeY,
      xPercentage: xPercentage,
      yPercentage: yPercentage,
      velocityX: velocityX,
      velocityY: velocityY,
      prevX: prevX,
      prevY: prevY
    }

    if (xPercentage < 0) detail.xPercentage = 0
    if (xPercentage > 100) detail.xPercentage = 100
    if (yPercentage < 0) detail.yPercentage = 0
    if (yPercentage > 100) detail.yPercentage = 100

    return detail
  }

  const inertia = function() {
    const t = now()
    const dt = t - inertiaTime
    inertiaTime = t
    x += velocityX * dt
    y += velocityY * dt
    const decay = Math.pow(options.friction, dt / 16.6667)
    velocityX *= decay
    velocityY *= decay

    if (options.bounce) {
      if (x < rect.left) {
        x = rect.left
        velocityX *= -options.bounceFactor
      }
      if (x > rect.width + rect.left) {
        x = rect.width + rect.left
        velocityX *= -options.bounceFactor
      }
      if (y < rect.top) {
        y = rect.top
        velocityY *= -options.bounceFactor
      }
      if (y > rect.height + rect.top) {
        y = rect.height + rect.top
        velocityY *= -options.bounceFactor
      }
    }

    if (Math.abs(velocityX) < 0.01) velocityX = 0
    if (Math.abs(velocityY) < 0.01) velocityY = 0

    const detail = getDetail()

    if (velocityX !== 0 || velocityY !== 0) {
      if (options.callback) options.callback(detail)
      const event = new CustomEvent('draginertia', { detail: detail })
      element.dispatchEvent(event)
      inertiaId = requestAnimationFrame(inertia)
    } else {
      inertiaId = null
      if (options.callback) options.callback(detail)
      const event = new CustomEvent('draginertiaend', { detail: detail })
      element.dispatchEvent(event)
    }
  }

  element.addEventListener('mousedown', handleStart)
  element.addEventListener('touchstart', handleStart)
  element.addEventListener('touchmove', handleMove)
  element.addEventListener('touchend', handleEnd)

  return {
    //TODO: add manual start, move and end methods - for programmatic control
    destroy: function() {
      element.removeEventListener('mousedown', handleStart)
      element.removeEventListener('touchstart', handleStart)
      element.removeEventListener('touchmove', handleMove)
      element.removeEventListener('touchend', handleEnd)
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseup', handleEnd)

      if (inertiaId) {
        cancelAnimationFrame(inertiaId)
        inertiaId = null
      }
    }
  }
}

/**
 * Alias for drag
 * 
 * @see drag
 * @deprecated Use drag instead
 */
export const onDrag = drag

/**
 * Checks if an element is overflowing its container
 * used to check if the scrollbar is visible.
 * 
 * @param {HTMLElement} element The element to check
 * @returns {boolean} True if the element is overflowing, false otherwise
 * @example
 * const el = document.getElementById('foo')
 * isVerticalScrollVisible(el) // => true or false
 */
export function isVerticalScrollVisible(element) {
  if (!element || !(element instanceof HTMLElement)) return false
  return element.offsetHeight < element.scrollHeight
}

/**
 * Checks if an element is overflowing horizontally
 * used to check if the scrollbar is visible.
 * 
 * @param {HTMLElement} element The element to check
 * @returns {boolean} True if the element is overflowing, false otherwise
 * @example
 * const el = document.getElementById('foo')
 * isHorizontalScrollVisible(el) // => true or false
 */
export function isHorizontalScrollVisible(element) {
  if (!element || !(element instanceof HTMLElement)) return false
  return element.offsetWidth < element.scrollWidth
}

/**
 * Checks if an element is overflowing its container either vertically or horizontally
 * used to check if the scrollbar is visible.
 * 
 * @param {HTMLElement} element The element to check
 * @returns {boolean} True if the element is overflowing, false otherwise
 * @example
 * const el = document.getElementById('foo')
 * isScrollVisible(el) // => true or false
 */
export function isScrollVisible(element) {
  if (!element || !(element instanceof HTMLElement)) return false
  return isVerticalScrollVisible(element) || isHorizontalScrollVisible(element)
}

/**
 * Gets if the vertical scroll has reached the start or end of the element.
 *
 * @param {HTMLElement} element The element to check
 * @param {number} [threshold=0] The threshold in pixels to consider the scroll as at the start or end
 * @returns {object} An object with `atStart` and `atEnd` properties indicating if the scroll is at the start or end of the element 
 * @example
 * const el = document.getElementById('foo')
 * const scrollState = getVerticalScrollState(el, 10)
 * console.log(scrollState.atStart) // => true or false
 * console.log(scrollState.atEnd) // => true or false
 */
export function getVerticalScrollState(element, threshold = 0) {
  const noState = {
    atStart: false,
    atEnd: false
  }
  if (!element || !(element instanceof HTMLElement)) return noState
  if (!isVerticalScrollVisible(element)) return noState

  const { scrollTop, scrollHeight, clientHeight } = element
  const scrollBottom = scrollHeight - scrollTop - clientHeight
  const scrollEndThreshold = scrollBottom <= threshold
  const scrollStartThreshold = scrollTop <= threshold

  return {
    atStart: scrollStartThreshold,
    atEnd: scrollEndThreshold
  }
}

/**
 * Gets if the horizontal scroll has reached the start or end of the element.
 * 
 * @param {HTMLElement} element The element to check
 * @param {number} [threshold=0] The threshold in pixels to consider the scroll as at the start or end
 * @returns {object} An object with `atStart` and `atEnd` properties indicating if the scroll is at the start or end of the element
 * @example
 * const el = document.getElementById('foo')
 * const scrollState = getHorizontalScrollState(el, 10)
 * console.log(scrollState.atStart) // => true or false
 * console.log(scrollState.atEnd) // => true or false
 */
export function getHorizontalScrollState(element, threshold = 0) {
  const noState = {
    atStart: false,
    atEnd: false
  }
  if (!element || !(element instanceof HTMLElement)) return noState
  if (!isHorizontalScrollVisible(element)) return noState

  const { scrollLeft, scrollWidth, clientWidth } = element
  const scrollRight = scrollWidth - scrollLeft - clientWidth
  const scrollEndThreshold = scrollRight <= threshold
  const scrollStartThreshold = scrollLeft <= threshold

  return {
    atStart: scrollStartThreshold,
    atEnd: scrollEndThreshold
  }
}

// The overflow values that create a scrolling mechanism, which is what a sticky element sticks
// inside. `clip` is absent by design: it clips without becoming a scrollport, which is what makes
// it the fix for a broken sticky rather than another cause of one.
const SCROLLPORT_OVERFLOW = new Set(['hidden', 'scroll', 'auto', 'overlay'])

const STICKY_AXES = [
  { insets: ['top', 'bottom'], overflow: 'overflowY', size: 'height', scrolls: isVerticalScrollVisible },
  { insets: ['left', 'right'], overflow: 'overflowX', size: 'width', scrolls: isHorizontalScrollVisible }
]

function stickyFindings(element) {
  // Every style of a detached element computes to the empty string in a real browser — jsdom
  // resolves inline styles regardless — so the checks below would read it as not sticky and
  // prescribe `position: sticky` to an element that already says so.
  if (!element.isConnected) {
    return [{
      code: 'detached',
      element: element,
      culprit: element,
      problem: 'the element is not in the document, so nothing about it computes',
      fix: 'attach it, then ask again'
    }]
  }

  const style = getComputedStyle(element)

  if (!style.position.endsWith('sticky')) {
    return [{
      code: 'not-sticky',
      element: element,
      culprit: element,
      problem: 'position is `' + style.position + '`',
      fix: 'set `position: sticky`'
    }]
  }

  const findings = []
  // An unset inset computes to `auto` in a browser and to an empty string in jsdom, so both
  // have to count as unset or the check passes for the wrong reason under test.
  const axes = STICKY_AXES.filter(function (axis) {
    return axis.insets.some(function (side) { return style[side] && style[side] !== 'auto' })
  })

  if (!axes.length) {
    findings.push({
      code: 'no-inset',
      element: element,
      culprit: element,
      problem: 'every inset is `auto`, so there is no threshold to stick at',
      fix: 'set `top`, `bottom`, `left` or `right`'
    })
  }

  const parent = element.parentElement
  for (const axis of parent ? axes : []) {
    const room = parent.getBoundingClientRect()[axis.size] - element.getBoundingClientRect()[axis.size]
    if (room > 0) continue
    findings.push({
      code: 'no-room',
      element: element,
      culprit: parent,
      problem: 'the containing block is no larger than the element, leaving ' + Math.round(room) + 'px to travel',
      fix: 'give the parent room — `align-self: flex-start` on a stretched flex item, or a taller wrapper'
    })
  }

  // Only the nearest scrolling ancestor matters: it is the scrollport, and anything above it is
  // out of reach. `html` and `body` are skipped because a non-visible overflow on either
  // propagates to the viewport, leaving the body itself treated as visible.
  for (let node = element.parentElement; node && node !== document.body && node !== document.documentElement; node = node.parentElement) {
    const ancestorStyle = getComputedStyle(node)
    const axis = STICKY_AXES.find(function (candidate) {
      return SCROLLPORT_OVERFLOW.has(ancestorStyle[candidate.overflow])
    })
    if (!axis) continue

    const declaration = '`' + axis.overflow + ': ' + ancestorStyle[axis.overflow] + '`'
    // Judged on the matched axis alone: a live scrollbar on the other axis moves nothing here.
    findings.push(axis.scrolls(node) ? {
      code: 'nested-scrollport',
      element: element,
      culprit: node,
      problem: 'sticks inside this ancestor’s scrollport (' + declaration + ') rather than to the viewport',
      fix: 'intended? then nothing to fix. Otherwise move the element out of this ancestor'
    } : {
      code: 'dead-scrollport',
      element: element,
      culprit: node,
      problem: 'this ancestor is the scrollport (' + declaration + ') and never scrolls, so the element can never move',
      fix: '`' + axis.overflow + ': clip` clips the same and creates no scrollport'
    })
    break
  }

  return findings
}

/**
 * Reports why a sticky element cannot stick.
 *
 * `position: sticky` fails silently: no error, no warning, an element that simply never moves.
 * The usual cause is an ancestor with `overflow: hidden`, `scroll`, `auto` or `overlay`, which
 * becomes the scrollport the element sticks inside — and when that ancestor does not itself
 * scroll, there is nowhere for the element to go. No DevTools reports it: neither engine's
 * inactive-CSS pass has a rule for sticky, since the declaration is valid and applied, and their
 * `scroll` badges mark containers that really do scroll — where the one that breaks stickiness is
 * a box that never scrolls at all. This reads the ancestors and names the culprit.
 *
 * Each finding carries a `code`, the `element` it is about, the `culprit` element to look at,
 * the `problem` in one sentence and a `fix`. The codes are `detached` (not in the document, so
 * nothing about it computes), `not-sticky`, `no-inset` (every inset
 * is `auto`, so there is no threshold to stick at), `no-room` (the containing block is no larger
 * than the element), `dead-scrollport` (an ancestor is the scrollport and never scrolls) and
 * `nested-scrollport` (the element sticks inside an ancestor rather than to the viewport, which
 * may well be what you meant).
 *
 * An empty array means nothing here can see a reason, never that the element sticks. Three things
 * it cannot see: `contain: paint`, `contain: layout` and `content-visibility` on an ancestor;
 * `html` and `body` overflow, skipped because a non-visible value there propagates to the viewport
 * and reporting it would fire on the most ordinary markup there is; and a containing block that is
 * not the element's parent, since `no-room` measures the parent.
 *
 * @param {string|HTMLElement} [target] The element to diagnose, or a selector for it. Left out, every sticky element on the page is diagnosed
 * @returns {Array<object>} One finding per problem found, `[]` when none were
 * @example
 * // In the console: every sticky element on the page, and what is wrong with each
 * console.table(whyNotSticky())
 * @example
 * whyNotSticky('#sidebar')
 * // => [{ code: 'dead-scrollport', element: aside#sidebar, culprit: div.wrap,
 * //       problem: 'this ancestor is the scrollport (`overflowY: hidden`) and never scrolls...',
 * //       fix: '`overflowY: clip` clips the same and creates no scrollport' }]
 */
export function whyNotSticky(target) {
  if (typeof document === 'undefined') return []

  let elements = []
  if (target === undefined) {
    elements = Array.from(document.querySelectorAll('*')).filter(function (element) {
      return getComputedStyle(element).position.endsWith('sticky')
    })
  } else if (typeof target === 'string') {
    elements = Array.from(document.querySelectorAll(target))
  } else if (target instanceof HTMLElement) {
    elements = [target]
  }

  return elements.flatMap(stickyFindings)
}

/**
 * Reports which section the reader is currently in, and calls back when that changes.
 *
 * The current section is the last one whose top edge has passed the reading line — `offset`
 * pixels below the top of the viewport — which is not the same as the topmost section on
 * screen: a heading scrolled just out of sight is still the section being read. At the very
 * bottom of the page the last section wins outright, because a final section shorter than the
 * screen can never reach the line and would otherwise be unreachable. Above the first section
 * the callback gets `null`, leaving what the top of the page means to the caller.
 *
 * Driven by a rAF-throttled scroll listener rather than an `IntersectionObserver`: an observer
 * fires only when visibility changes, so scrolling from one heading to the next inside a screen
 * that already shows both tells it nothing, and it keeps reporting the section before.
 *
 * Section positions are measured once and cached, so a scrolled frame costs one layout read —
 * a document-height check — instead of one per section. The cache rebuilds itself on window
 * resize, through a `ResizeObserver` on `document.body` whenever the body changes size, and on
 * any scrolled frame where the document's height moved — which is what catches a body pinned to
 * 100% height, whose box never resizes while its content grows. An `IntersectionObserver` over
 * the sections rides along as a staleness probe: its entries carry each section's rectangle for
 * free, so a shift that changed no height anywhere — two sections trading equal heights, a
 * transform settling — is caught the moment a moved section crosses a viewport edge. A shift
 * that neither changes a height nor crosses an edge answers stale until `update()` is called;
 * each observer degrades alone, so a browser missing one keeps every other trigger.
 *
 * Follows the window's scroll only, not a scrolling container's.
 *
 * @param {string|Element|Array<Element>|NodeList} elements The sections to watch, or a selector for them
 * @param {function} callback Called with the current section and its index, or with `null` and `-1`
 * @param {object} [options]
 * @param {number|function} [options.offset=0] Pixels below the top of the viewport that count as the reading line — the height of a sticky header, usually. A function is read every frame, so a header that collapses mid-scroll keeps the line honest
 * @returns {object|null} `{ update, destroy }`, or `null` when there is no callback or nothing to watch
 * @example
 * const spy = scrollSpy('.prose h2[id]', (section) => {
 *  document.querySelectorAll('.toc a').forEach((a) => a.removeAttribute('aria-current'))
 *  if (section) document.querySelector(`.toc a[href="#${section.id}"]`)?.setAttribute('aria-current', 'location')
 * }, { offset: 64 })
 *
 * spy.update()  // re-measure after a layout change the observers cannot see
 * spy.destroy() // stop listening
 */
export function scrollSpy(elements, callback, options = {}) {
  if (!isFunction(callback)) return null

  const sections = Array.from(query(elements)).filter((element) => element && isFunction(element.getBoundingClientRect))
  if (!sections.length) return null
  // Sorted rather than trusted: the scan below stops at the first section still below the line,
  // so an array assembled by hand and passed out of order would report a wrong answer quietly.
  sections.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))

  // A function is read every frame rather than once: a collapsing header's height is a
  // moving target, and caching it would be the staleness bug this function exists to avoid.
  const offset = isFunction(options.offset) ? options.offset : function() { return options.offset || 0 }
  let current
  let pending = false
  let frame = null
  let dirty = false
  let positions = []
  let maxScroll = 0

  const measure = function() {
    positions = sections.map((section) => section.getBoundingClientRect().top + window.scrollY)
    maxScroll = document.documentElement.scrollHeight - window.innerHeight
    dirty = false
  }

  const read = function() {
    if (maxScroll > 0 && window.scrollY >= maxScroll - 1) return sections.length - 1

    // A pixel of slack: a section scrolled exactly to the line reports a fractional top on a
    // display that is not at 1x, and landing a hair short would leave it uncurrent.
    const line = window.scrollY + (Number(offset()) || 0) + 1
    let index = -1
    for (let i = 0; i < positions.length; i++) {
      if (positions[i] > line) break
      index = i
    }
    return index
  }

  const report = function() {
    const index = read()
    if (index === current) return
    current = index
    callback(index === -1 ? null : sections[index], index)
  }

  // The latch is its own flag rather than the frame id, and it is raised before the call: a
  // `requestAnimationFrame` that runs its callback synchronously — a polyfill, a test — would
  // clear the id and then have it assigned back over the top, and every scroll after the first
  // would find a frame still pending and do nothing.
  const schedule = function() {
    if (pending) return
    pending = true
    frame = requestAnimationFrame(function() {
      pending = false
      frame = null
      // One layout read per frame rather than none: a body pinned to 100% height grows its
      // scrollHeight without resizing its box, so the observer stays silent — and the
      // document's height is the one number that moves on any vertical growth worth
      // remeasuring. A shift that changes no height at all still waits for update().
      if (dirty || document.documentElement.scrollHeight - window.innerHeight !== maxScroll) measure()
      report()
    })
  }

  const onScroll = schedule

  // Rebuilds ride the same frame latch as scrolls: a height animation fires the observer on
  // every step, and without the latch each notification would remeasure every section.
  const onLayout = function() {
    dirty = true
    schedule()
  }

  const update = function() {
    measure()
    report()
  }

  let observer = null
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(onLayout)
    observer.observe(document.body)
  }

  // The intersection observer is a staleness probe, not the answer: its entries carry each
  // section's rectangle, computed off the main thread, so a section crossing the viewport
  // edge with a rectangle that disagrees with the map means the page shifted without a
  // height change — remeasure. The rectangle is captured a beat before delivery, so a fast
  // scroll can disagree by the frames in between; that false alarm costs a spare remeasure
  // at a crossing, never a wrong answer.
  let probe = null
  if (typeof IntersectionObserver !== 'undefined') {
    const indexes = new Map(sections.map((section, i) => [section, i]))
    probe = new IntersectionObserver(function(entries) {
      for (const entry of entries) {
        const at = entry.boundingClientRect.top + window.scrollY
        if (Math.abs(at - positions[indexes.get(entry.target)]) > 1) {
          onLayout()
          return
        }
      }
    }, { threshold: 0 })
    for (const section of sections) probe.observe(section)
  }

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onLayout, { passive: true })
  update()

  return {
    update: update,
    destroy: function() {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onLayout)
      if (observer) observer.disconnect()
      observer = null
      if (probe) probe.disconnect()
      probe = null
      if (frame !== null) cancelAnimationFrame(frame)
      frame = null
      pending = false
    }
  }
}
