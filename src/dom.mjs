/** @module dom */

import { transformDashToCamelCase, isArray, isString, isObject, isFunction, shallowMerge, percentage } from './helpers.mjs'
import { encodeHtmlEntities, decodeHtmlEntities } from './parsers.mjs'

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
  if (!from instanceof Array  && !from instanceof NodeList) return []
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
    if (transform) property = transformDashToCamelCase(property)
    element.style[property] = styles[property]
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
  if (!elements || !selector || !elements.length) return false
  if (elements instanceof Element) elements = [elements]
  if (isString(elements)) elements = query(elements)
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
  if (!elements || !selector || !elements.length) return false
  if (elements instanceof Element) elements = [elements]
  if (isString(elements)) elements = query(elements)
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
  if (callback)
    img.addEventListener('load', callback, false);
  img.src = src
}

/**
 * Delegate DOM events using MutationObserver with a fallback to document.addEventListener
 * 
 * @param {string} selector The selector to select the elements to delegate the event to
 * @param {string} eventType The event type to delegate, like `click`
 * @param {Function} handler The handler to call when the event is triggered.
 * @returns {MutationObserver | null} The MutationObserver instance
 * @example
 * delegateEvent('.foo', 'click', (e, target) => {
 * console.log('Clicked on', target)
 * })
 */
export function delegateEvent(selector, eventType, handler) {
  if (typeof MutationObserver === 'undefined') {
    document.addEventListener(eventType, (e) => {
      const target = e.target.closest(selector)
      if (target) handler(e, target)
    })

    return null
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof HTMLElement)) continue
        if (!node.matches(selector)) continue
        node.addEventListener(eventType, (e) => {
          handler(e, e.currentTarget)
        })
      }
    }
  })

  for (const node of document.querySelectorAll(selector)) {
    node.addEventListener(eventType, (e) => {
      handler(e, e.currentTarget)
    })
  }

  observer.observe(document.body, { childList: true, subtree: true })
  return observer
}

/**
 * Run a handler on selected elements and on elements added to the DOM with the same selector, 
 * or can be delegateEvent alias.
 * 
 * @param {string} selector The selector to select the elements to run the handler on
 * @param {string | Function} eventTypeOrHandler The event type to delegate, like `click`, or the handler to call on every element
 * @param {Function} [handler] The handler to call when the event is triggered.
 * @returns {MutationObserver | null} The MutationObserver instance
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
        if (!node.matches(selector)) continue
        eventTypeOrHandler(node)
      }
    }
  })

  for (const node of document.querySelectorAll(selector)) {
    eventTypeOrHandler(node)
  }

  observer.observe(document.body, { childList: true, subtree: true })

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
export function isVisible(element) {
  if (!element) return false;
  const computedStyle = getComputedStyle(element);
  if (computedStyle.getPropertyValue('display') === 'none') return false;
  if (element.getAttribute('hidden') !== null || computedStyle.getPropertyValue('visibility') === 'hidden' || computedStyle.getPropertyValue('opacity') == "0") return false;
  return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length)
}

/**
 * Swipe event handler
 * 
 * @param {HTMLElement} element The element to listen for swipe gestures on
 * @param {object | Function} callback The callback to call when a swipe gesture is detected or the options object with the callback, threshold, and timeThreshold
 * @param {number} [threshold=150] The threshold in pixels to trigger the callback.
 * @param {number} [timeThreshold=0] The threshold in milliseconds to trigger the callback. Defaults to 0, which means the callback will be called regardless of the time it took to swipe.
 * @returns {object} The destroy method to remove the event listeners
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
 * element.addEventListener('swipe', (e) => { ... })
 * element.addEventListener('swipestart', (e) => { ... })
 * element.addEventListener('swipeend', (e) => { ... })
 */
export function swipe(element, callback, threshold = 150, timeThreshold = 0) {
  let startX = 0
  let startY = 0
  let endX = 0
  let endY = 0
  let startTime = 0
  let endTime = 0

  if (isObject(callback)) {
    const options = callback
    callback = options.callback
    threshold = options.threshold || threshold
    timeThreshold = options.timeThreshold || timeThreshold
  }

  if (!element) return
  if (element.getAttribute('swipe-enabled') === 'true') return
  element.setAttribute('swipe-enabled', 'true')

  const handleStart = function(e) {
    const carrier = e.touches ? e.touches[0] : e
    startX = carrier.clientX
    startY = carrier.clientY
    startTime = Date.now();
    element.dispatchEvent(new CustomEvent('swipestart', { detail: { target: element, startX, startY, startTime } }))
  }

  const handleEnd = function(e) {
    const carrier = e.changedTouches ? e.changedTouches[0] : e
    endX = carrier.clientX
    endY = carrier.clientY
    endTime = Date.now();
    handleSwipeGesture()
    element.dispatchEvent(new CustomEvent('swipeend', { detail: { target: element, startX, startY, startTime, endX, endY, endTime } }))
  }

  const handleSwipeGesture = function() {
    const deltaX = Math.abs(endX - startX)
    const deltaY = Math.abs(endY - startY)
    const horizontal = deltaX > threshold
    const vertical = deltaY > threshold
    const left = endX < startX
    const up = endY < startY
    const direction = []
    const timeElapsed = endTime - startTime;
    
    if (horizontal) direction.push(left ? 'left' : 'right')
    if (vertical) direction.push(up ? 'up' : 'down')

    let condition = direction.length && callback
    if (timeThreshold) condition = condition && timeElapsed <= timeThreshold
    
    if (condition) {
      const res = {
        target: element,
        deltaX: deltaX,
        deltaY: deltaY,
        startX: startX,
        startY: startY,
        endX: endX,
        endY: endY,
        threshold: threshold,
        horizontal: horizontal,
        vertical: vertical,
        horizontalDirection: left ? 'left' : 'right',
        verticalDirection: up ? 'up' : 'down',
        direction: direction.length === 1 ? direction[0] : direction,
        timeElapsed: timeElapsed,
        timeThreshold: timeThreshold
      }

      callback(res)
      element.dispatchEvent(new CustomEvent('swipe', { detail: res })) 
    }
  }

  element.addEventListener('touchstart', handleStart)
  element.addEventListener('touchend', handleEnd)
  element.addEventListener('mousedown', handleStart)
  element.addEventListener('mouseup', handleEnd)

  return {
    destroy: function() {
      element.removeEventListener('touchstart', handleStart)
      element.removeEventListener('touchend', handleEnd)
      element.removeEventListener('mousedown', handleStart)
      element.removeEventListener('mouseup', handleEnd)
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
 * @param {boolean} [opts.bounce=false] Whether to enable bounce
 * @param {number} [opts.friction=0.9] The friction to apply when inertia is enabled
 * @param {number} [opts.bounceFactor=0.5] The bounce factor to apply when bounce is enabled
 * @param {Function} [opts.callback] The callback to call when a drag gesture is detected
 * @returns {object} The destroy method to remove the event listeners
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
  let x = 0
  let y = 0
  let prevX = 0
  let prevY = 0
  let velocityX = 0
  let velocityY = 0
  let dragging = false
  let rect = element.getBoundingClientRect()
  let inertiaId = null

  const options = {
    inertia: false,
    bounce: false,
    friction: 0.9,
    bounceFactor: 0.5,
    callback: null
  }

  if (isFunction(opts)) {
    options.callback = opts
  } else if (isObject(opts)) {
    shallowMerge(options, opts)
  }
  
  if (!element) return
  if (element.getAttribute('drag-enabled') === 'true') return
  element.setAttribute('drag-enabled', 'true')
  element.setAttribute('dragging', 'false')

  const handleStart = function(e) {
    setXY(e)
    dragging = true
    element.setAttribute('dragging', 'true')
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
    velocityX = x - prevX
    velocityY = y - prevY
    const detail = getDetail()
    if (options.callback) options.callback(detail)
    const event = new CustomEvent('drag', { detail: detail })
    element.dispatchEvent(event)
  }

  const handleEnd = function() {
    dragging = false
    element.setAttribute('dragging', 'false')
    if (options.inertia) inertiaId = requestAnimationFrame(inertia)
    const event = new CustomEvent('dragend', { detail: getDetail() })
    element.dispatchEvent(event)
  }

  const setXY = function(e) {
    const carrier = e.touches ? e.touches[0] : e
    if (e.touches) e.preventDefault()
    prevX = x
    prevY = y
    x = carrier.clientX
    y = carrier.clientY
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
    x += velocityX
    y += velocityY
    velocityX *= options.friction
    velocityY *= options.friction

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

    if (Math.abs(velocityX) < 0.1) velocityX = 0
    if (Math.abs(velocityY) < 0.1) velocityY = 0

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
  element.addEventListener('mousemove', handleMove)
  element.addEventListener('mouseup', handleEnd)
  element.addEventListener('touchstart', handleStart)
  element.addEventListener('touchmove', handleMove)
  element.addEventListener('touchend', handleEnd)

  return {
    destroy: function() {
      element.removeEventListener('mousedown', handleStart)
      element.removeEventListener('mousemove', handleMove)
      element.removeEventListener('mouseup', handleEnd)
      element.removeEventListener('touchstart', handleStart)
      element.removeEventListener('touchmove', handleMove)
      element.removeEventListener('touchend', handleEnd)

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
