/** @module parsers */

import { isArray, isObject, isString, stringToType } from './helpers.mjs'
import { RE_ATTRIBUTES, RE_ATTRIBUTE_WITHOUT_VALUE, RE_ATTRIBUTE_WITH_VALUE, RE_URL_PARAMETER, RE_FIRST_OR_LAST_QUOTE } from './regex.mjs'
import { decodeHTML } from './dom.mjs'
import { encodeHtmlEntities, decodeHtmlEntities } from './entities.mjs'

// Re-exported for backwards compatibility; implementations live in entities.mjs
export { encodeHtmlEntities, decodeHtmlEntities }

/**
 * Parse a string of attributes and return an object
 * 
 * @param {string} str
 * @returns object
 * @example
 * parseAttributes('button text="Click me" data='{"key": \"value"}' class="btn btn-primary"')
 * // => { button: null, text: 'Click me', data: '{"key": "value"}', class: 'btn btn-primary' }
 */
export function parseAttributes(str) {
	const re = RE_ATTRIBUTES
	const reWithoutValue = RE_ATTRIBUTE_WITHOUT_VALUE
	const reHasValue = RE_ATTRIBUTE_WITH_VALUE
	const reReplaceFirstAndLastQuote = RE_FIRST_OR_LAST_QUOTE

	const res = {}
	if (!isString(str) || str === '') return res
	const match = str.match(re)
	if (!match) return res

	for (let i = 0; i < match.length; i++) {
		const m = match[i]
		if (m === '') continue

		if (reWithoutValue.test(m)) {
			const [, key] = m.match(reWithoutValue)
			res[key] = null
		} else if (reHasValue.test(m)) {
			const [, key, value] = m.match(reHasValue)
			res[key] = stringToType(decodeHTML(value.replace(reReplaceFirstAndLastQuote, '')))
		}
	}

	return res
}

/**
 * Serialize an object of key value pairs into a string of attributes
 * 
 * @param {object} obj - The object to serialize
 * @returns {string} of attributes
 * @example
 * serializeAttributes({ button: null, text: 'Click me', data: '{"key": "value"}', class: 'btn btn-primary' }) // button text="Click me" data="{\"key\": \"value\"}" class="btn btn-primary"
 */
export function serializeAttributes(obj) {
	const res = []

	Object.keys(obj).forEach((key) => {
		let value = obj[key]
		if (isObject(value) || isArray(value)) value = JSON.stringify(value)
		if (isString(value)) value = encodeHtmlEntities(value)
		const valueString = value === null || value === undefined ? '' : `="${value}"`
		res.push(`${key}${valueString}`)
	})

	return res.join(' ')
}

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
export function parseUrlParameters(paramString, decode = true) {
  const res = {}

  const paramParts = paramString.split('&')
  paramParts.forEach((part) => {
    const m = part.match(RE_URL_PARAMETER)
		if (!m) return
    const key = m[1]
    const value = m[2]
    res[key] = value !== undefined && decode ? stringToType(decodeURIComponent(value)) : stringToType(value)
  })

  return res
}

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
export function serializeUrlParameters(obj, encode = true) {
	const res = []

	Object.keys(obj).forEach((key) => {
		const value = obj[key]
		if (value === undefined) return res.push(key)
		const encodedValue = encode ? encodeURIComponent(value) : value
		res.push(`${key}=${encodedValue}`)
	})

	return res.join('&')
}

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
export function parseResolutionString(res) {
  const DEFAULT_RESOLUTION = 1.7777777778 // 16:9
  if (!res || !res.length || /16[\:x\-\/]{1}9/i.test(res)) return DEFAULT_RESOLUTION
  const pts = res.split(/\s?[\:x\-\/]{1}\s?/i)
  if (pts.length < 2) return DEFAULT_RESOLUTION

  const w = parseInt(pts[0])
  const h = parseInt(pts[1])

  if (w === 0 || h === 0) return DEFAULT_RESOLUTION
  if (isNaN(w) || isNaN(h)) return DEFAULT_RESOLUTION

  return w/h;
}
