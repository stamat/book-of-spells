/**
 * Parse a string of attributes and return an object
 *
 * @param {string} str
 * @returns object
 * @example
 * parseAttributes('button text="Click me" data='{"key": \"value"}' class="btn btn-primary"')
 * // => { button: null, text: 'Click me', data: '{"key": "value"}', class: 'btn btn-primary' }
 */
export function parseAttributes(str: string): {};
/**
 * Serialize an object of key value pairs into a string of attributes
 *
 * @param {object} obj - The object to serialize
 * @returns {string} of attributes
 * @example
 * serializeAttributes({ button: null, text: 'Click me', data: '{"key": "value"}', class: 'btn btn-primary' }) // button text="Click me" data="{\"key\": \"value\"}" class="btn btn-primary"
 */
export function serializeAttributes(obj: object): string;
/**
 * Encodes HTML entities in a string using the following rules:
 *
 * - & (ampersand) becomes &amp;
 * - " (double quote) becomes &quot;
 * - ' (single quote) becomes &#039;
 * - < (less than) becomes &lt;
 * - > (greater than) becomes &gt;
 *
 * It is different than dom.encodeHTML, which encodes all characters using the browser's DOMParser. This function only encodes the characters listed above and should be used when DOMParser is not available.
 * @see {@link module:dom.encodeHTML}
 *
 * @param {string} str - The string to encode
 * @returns {string} The encoded string
 * @example
 * htmlEncode('<a href="#">Link</a>') // &lt;a href=&quot;#&quot;&gt;Link&lt;/a&gt;
 */
export function encodeHtmlEntities(str: string): string;
/**
 * Decodes HTML entities in a string using the following rules:
 *
 * - &amp; becomes &
 * - &quot; becomes "
 * - &#039; becomes '
 * - &lt; becomes <
 * - &gt; becomes >
 *
 * It is different than dom.decodeHTML, which decodes all characters using the browser's DOMParser. This function only decodes the characters listed above and should be used when DOMParser is not available.
 * @see {@link module:dom.decodeHTML}
 *
 * @param {string} str - The string to decode
 * @returns {string} The decoded string
 * @example
 * htmlDecode('&lt;a href=&quot;#&quot;&gt;Link&lt;/a&gt;') // <a href="#">Link</a>
 */
export function decodeHtmlEntities(str: string): string;
/**
 * Parses a string of url parameters into an object of key value pairs
 *
 * @param {string} paramString - The string to parse without ? or # and with & as separator
 * @param {boolean} [decode=true] - Whether to decode the values or not
 * @returns {object} of key value pairs
 * @example
 * parseUrlParams('foo=true&baz=555') // { foo: true, baz: 555 }
 * parseUrlParams('foo=bar&baz=qux', false) // { foo: 'true', baz: '555' }
 * parseUrlParams('foo&bar&baz=qux') // { foo: undefined, bar: undefined, baz: 'qux' }
 */
export function parseUrlParameters(paramString: string, decode?: boolean): object;
/**
 * Serialize an object of key value pairs into a string of url parameters
 *
 * @param {object} obj - The object to serialize
 * @param {boolean} [encode=true] - Whether to encode the values or not
 * @returns {string} of url parameters
 * @example
 * serializeUrlParams({ foo: true, baz: 555 }) // foo=true&baz=555
 * serializeUrlParams({ bar: undefined, baz: 'qux' }, false) // bar=&baz=qux
 */
export function serializeUrlParameters(obj: object, encode?: boolean): string;
/**
 * Parses a resolution string into a number. Resolution string is in the format of 'width:height', e.g. '16:9'
 *
 * @param {string} res Resolution string. Format is 'width:height', e.g. '16:9', or 'widthxheight', e.g. '16x9', or 'width-height', e.g. '16-9', or 'width/height', e.g. '16/9'
 * @returns number
 * @example
 * parseResolutionString('16:9') // => 1.7777777778
 * parseResolutionString('4:3') // => 1.3333333333
 * parseResolutionString('4x3') // => 1.3333333333
 * parseResolutionString('4-3') // => 1.3333333333
 */
export function parseResolutionString(res: string): number;
