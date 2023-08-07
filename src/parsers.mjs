/** @module parsers */

import { stringToType } from './helpers.mjs'
import { RE_ATTRIBUTES, RE_ATTRIBUTE_WITHOUT_VALUE, RE_ATTRIBUTE_WITH_VALUE, RE_URL_PARAMETER, RE_FIRST_OR_LAST_QUOTE } from './regex.mjs'

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
			res[key] = value.replace(reReplaceFirstAndLastQuote, '')
			reReplaceFirstAndLastQuote.lastIndex = 0
			reHasValue.lastIndex = 0
		}
	}

	return res
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
 */
export function parseUrlParameters(paramString, decode = true) {
  const res = {}

  const paramParts = paramString.split('&')
  paramParts.forEach((part) => {
    const m = part.match(RE_URL_PARAMETER)
    const key = m[1]
    const value = m[2]
    res[key] = value !== undefined && decode ? stringToType(decodeURIComponent(value)) : value
		RE_URL_PARAMETER.lastIndex = 0
  })

  return res
}
