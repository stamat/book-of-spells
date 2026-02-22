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
export function isEmptyElement(element: HTMLElement): boolean;
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
export function remove(selector: string | HTMLElement | Element, from?: HTMLElement | Element): void;
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
export function querySingle(selector: string | HTMLElement | Element | Array<HTMLElement | Element> | NodeList, from?: HTMLElement | Element): HTMLElement | Element;
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
export function query(selector: string | HTMLElement | Element | Array<HTMLElement | Element> | NodeList, from?: HTMLElement | Element): Array<Element> | NodeList;
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
export function css(element: HTMLElement, styles: object, transform?: boolean): void;
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
export function decodeHTML(html: string): string;
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
export function encodeHTML(html: string): string;
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
export function insertBeforeElement(targetElement: HTMLElement, newElement: HTMLElement): void;
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
export function toggleAttributeValue(element: HTMLElement, attribute: string, on?: string, off?: string): void;
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
export function cssTimeToMilliseconds(duration: string): number;
/**
 * Returns a map of transition properties and durations
 *
 * @param {HTMLElement} element The element to get the transition properties and durations from
 * @returns {object<string, number>} A map of transition properties and durations
 * @example
 * getTransitionDurations(element) // { height: 1000 } if transition in CSS is set to 'height 1s'
 * getTransitionDurations(element) // { height: 500, opacity: 1000 } if transition in CSS is set to 'height 0.5s, opacity 1s'
 */
export function getTransitionDurations(element: HTMLElement): object;
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
export function matchesAny(elements: Array<HTMLElement> | NodeList | HTMLElement, selector: string): boolean;
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
export function matchesAll(elements: Array<HTMLElement> | NodeList | HTMLElement, selector: string): boolean;
/**
 * Detaches an element from the DOM and returns it
 *
 * @param {HTMLElement} element The element to detach
 * @example
 * detachElement(element)
 * // => element
 * console.log(element.parentNode) // => null
 */
export function detachElement(element: HTMLElement): HTMLElement;
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
export function getTableData(selector: string, headers: Array<string> | string | null, rowSelector?: string, cellSelector?: string, headerCellSelector?: string): Array<object>;
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
export function parseDOM(html: string, allChildren?: boolean): Node;
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
export function loadImage(src: string, callback?: Function): void;
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
export function delegateEvent(selector: string, eventType: string, handler: Function): MutationObserver | null;
/**
 * Run a handler on selected elements and on elements added to the DOM with the same selector as a MutationObserver abstraction,
 * or use it to delegate events as a `delegateEvent` alias
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
export function on(selector: string, eventTypeOrHandler: string | Function, handler?: Function): MutationObserver | null;
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
export function addListenerForEvents(elements: string | HTMLElement | NodeList, events: string | Array<string>, handler: Function, options?: object): void;
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
export function removeListenerForEvents(elements: string | HTMLElement | NodeList, events: string | Array<string>, handler: Function, options?: object): void;
/**
 * Resizes an element to cover its parent element while maintaining the aspect ratio
 *
 * @param {string|HTMLElement|NodeList} elements The elements or a selector for elements to resize
 * @param {number} [ratio=1] The ratio to maintain
 * @param {number} [offset=0] An offset to add to the parent element's width and height
 * @example
 * proportionalParentCoverResize('.foo', 16/9, 10)
 */
export function proportionalParentCoverResize(elements: string | HTMLElement | NodeList, ratio?: number, offset?: number): void;
/**
 * If provided element is visible. Checks if the element is not visibility hidden or display none, has no opacity, and has a width and height.
 *
 * @param {HTMLElement} element The element to check
 * @returns {boolean} True if the element is visible, false otherwise
 *
 * @example
 * isVisible(document.getElementById('foo'))
 */
export function isVisible(element: HTMLElement, checkOpacity?: boolean): boolean;
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
export function getFocusableElements(from?: HTMLElement | Element | Document): Array<HTMLElement>;
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
export function getVisibleFocusableElements(from?: HTMLElement | Element | Document, excludeSelector?: string): Array<HTMLElement>;
/**
 * Swipe event handler
 *
 * @param {HTMLElement} element The element to listen for swipe gestures on
 * @param {object | Function} callback The callback to call when a swipe gesture is detected or the options object with the callback, threshold, and timeThreshold
 * @param {number} [threshold=150] The threshold in pixels to trigger the callback.
 * @param {number} [timeThreshold=0] The threshold in milliseconds to trigger the callback. Defaults to 0, which means the callback will be called regardless of the time it took to swipe.
 * @returns {object | null} The destroy method to remove the event listeners
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
export function swipe(element: HTMLElement, callback: object | Function, threshold?: number, timeThreshold?: number): object | null;
/**
 * Drag event handler
 *
 * @param {HTMLElement} element The element to listen for drag gestures on
 * @param {object | Function} opts The options object or the callback to call when a drag gesture is detected
 * @param {boolean} [opts.inertia=false] Whether to enable inertia
 * @param {boolean} [opts.bounce=false] Whether to enable bounce when inertia is enabled
 * @param {number} [opts.friction=0.9] The friction to apply when inertia is enabled
 * @param {number} [opts.bounceFactor=0.2] The bounce factor to apply when bounce is enabled
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
export function drag(element: HTMLElement, opts: object | Function): object | null;
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
export function isVerticalScrollVisible(element: HTMLElement): boolean;
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
export function isHorizontalScrollVisible(element: HTMLElement): boolean;
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
export function isScrollVisible(element: HTMLElement): boolean;
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
export function getVerticalScrollState(element: HTMLElement, threshold?: number): object;
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
export function getHorizontalScrollState(element: HTMLElement, threshold?: number): object;
/**
 * Swipe event handler
 *
 * @param {HTMLElement} element The element to listen for swipe gestures on
 * @param {object | Function} callback The callback to call when a swipe gesture is detected or the options object with the callback, threshold, and timeThreshold
 * @param {number} [threshold=150] The threshold in pixels to trigger the callback.
 * @param {number} [timeThreshold=0] The threshold in milliseconds to trigger the callback. Defaults to 0, which means the callback will be called regardless of the time it took to swipe.
 * @returns {object | null} The destroy method to remove the event listeners
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
export function onSwipe(element: HTMLElement, callback: object | Function, threshold?: number, timeThreshold?: number): object | null;
/**
 * Drag event handler
 *
 * @param {HTMLElement} element The element to listen for drag gestures on
 * @param {object | Function} opts The options object or the callback to call when a drag gesture is detected
 * @param {boolean} [opts.inertia=false] Whether to enable inertia
 * @param {boolean} [opts.bounce=false] Whether to enable bounce when inertia is enabled
 * @param {number} [opts.friction=0.9] The friction to apply when inertia is enabled
 * @param {number} [opts.bounceFactor=0.2] The bounce factor to apply when bounce is enabled
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
export function onDrag(element: HTMLElement, opts: object | Function): object | null;
