/** @module entities */

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
