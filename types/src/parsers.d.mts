/** @module parsers */
import { encodeHtmlEntities, decodeHtmlEntities } from './entities.mjs';
export { encodeHtmlEntities, decodeHtmlEntities };
/**
 * Parse a string of attributes and return an object
 *
 * @param {string} str
 * @returns object
 * @example
 * parseAttributes('button text="Click me" data='{"key": \"value"}' class="btn btn-primary"')
 * // => { button: null, text: 'Click me', data: '{"key": "value"}', class: 'btn btn-primary' }
 */
export declare function parseAttributes(str: string): {};
/**
 * Serialize an object of key value pairs into a string of attributes
 *
 * @param {object} obj - The object to serialize
 * @returns {string} of attributes
 * @example
 * serializeAttributes({ button: null, text: 'Click me', data: '{"key": "value"}', class: 'btn btn-primary' }) // button text="Click me" data="{\"key\": \"value\"}" class="btn btn-primary"
 */
export declare function serializeAttributes(obj: object): string;
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
export declare function parseUrlParameters(paramString: string, decode?: boolean): object;
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
export declare function serializeUrlParameters(obj: object, encode?: boolean): string;
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
export declare function parseResolutionString(res: string): number;
