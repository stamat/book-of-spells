/** @module parsers */

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
