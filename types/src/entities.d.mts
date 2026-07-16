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
export declare function encodeHtmlEntities(str: string): string;
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
export declare function decodeHtmlEntities(str: string): string;
