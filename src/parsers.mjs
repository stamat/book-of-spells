/** @module parsers */

import { isArray, isObject, isString, stringToType } from './helpers.mjs'
import { RE_ATTRIBUTES, RE_ATTRIBUTE_WITHOUT_VALUE, RE_ATTRIBUTE_WITH_VALUE, RE_URL_PARAMETER, RE_FIRST_OR_LAST_QUOTE } from './regex.mjs'
import { decodeHTML, encodeHTML } from './dom.mjs'

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
	const match = str.match(re)

	for (let i = 0; i < match.length; i++) {
		const m = match[i]
		if (m === '') continue

		if (reWithoutValue.test(m)) {
			const [, key] = m.match(reWithoutValue)
			res[key] = null
			reWithoutValue.lastIndex = 0
		} else if (reHasValue.test(m)) {
			const [, key, value] = m.match(reHasValue)
			res[key] = stringToType(decodeHTML(value.replace(reReplaceFirstAndLastQuote, '')))
			reReplaceFirstAndLastQuote.lastIndex = 0
			reHasValue.lastIndex = 0
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
		if (isString(value)) value = encodeHTML(value)
		const valueString = value === null || value === undefined ? '' : `="${value}"`
		res.push(`${key}${valueString}`)
	})

	return res.join(' ')
}

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
export function encodeHtmlEntities(str) {
	return str.replace(/[<>"'\&]/g, (m) => {
		switch (m) {
			case '<': return '&lt;'
			case '>': return '&gt;'
			case '"': return '&quot;'
			case "'": return '&#039;'
			case '&': return '&amp;'
		}
	})
}

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
export function decodeHtmlEntities(str) {
	return str.replace(/&lt;|&gt;|&quot;|&#039;|&amp;/g, (m) => {
		switch (m) {
			case '&lt;': return '<'
			case '&gt;': return '>'
			case '&quot;': return '"'
			case '&#039;': return "'"
			case '&amp;': return '&'
		}
	})
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
		RE_URL_PARAMETER.lastIndex = 0
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
