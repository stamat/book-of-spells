/** @module parsers */

import { stringToType } from './helpers.mjs'

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
	const re = /\s*(?:([a-z_]{1}[a-z0-9\-_]*)=?(?:"([^"]+)"|'([^']+)')*)\s*/gi
	const reWithoutValue = /^\s*([a-z_]{1}[a-z0-9\-_]*)\s*$/i
	const reHasValue = /^\s*([a-z_]{1}[a-z0-9\-_]*)=("[^"]+"|'[^']+')\s*$/i
	const reReplaceFirstAndLastQuote = /^["']|["']$/g
	
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
    const m = part.match(/([^\s=&]+)=?([^&\s]+)?/)
    const key = m[1]
    const value = m[2]
    res[key] = value !== undefined && decode ? stringToType(decodeURIComponent(value)) : value
  })

  return res
}
