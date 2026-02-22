/**
 * @module regex
 */

/**
 * Regular expression for matching a YouTube video links and extracting their ID, works with both embed and watch URLs
 */
export const RE_YOUTUBE = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i

/**
 * Regular expression for matching a Vimeo video links and extracting their ID, works with both embed and watch URLs, channels and groups
 */
export const RE_VIMEO = /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/i

/**
 * Regular expression for matching a video URLs
 */
export const RE_VIDEO = /\/([^\/]+\.(?:mp4|ogg|ogv|ogm|webm|avi))\s*$/i

/**
 * Regular expression for matching a image URLs
 */
export const RE_IMAGE = /\/([^\/]+\.(?:jpg|jpeg|png|gif|svg|webp))\s*$/i

/**
 * Regular expression for matching a URL parameters
 */
export const RE_URL_PARAMETER = /([^\s=&]+)=?([^&\s]+)?/

/**
 * Regular expression for matching a HTML attribute and tag names, also for matching shortcode attributes and names
 */
export const RE_ATTRIBUTES = /\s*(?:([a-z_]{1}[a-z0-9\-_]*)=?(?:"([^"]+)"|'([^']+)')*)\s*/gi

/**
 * Regular expression for matching a single attribute without value
 */
export const RE_ATTRIBUTE_WITHOUT_VALUE = /^\s*([a-z_]{1}[a-z0-9\-_]*)\s*$/i

/**
 * Regular expression for matching a single attribute with value
 */
export const RE_ATTRIBUTE_WITH_VALUE = /^\s*([a-z_]{1}[a-z0-9\-_]*)=("[^"]+"|'[^']+')\s*$/i

/**
 * Regular expression for matching the first or last quote of a string used for removing them
 */
export const RE_FIRST_OR_LAST_QUOTE = /^["']|["']$/g

/**
 * Escape special characters in a string to be used in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} The escaped string
 * @example
 * escapeRegExp('hello world') // 'hello world'
 * escapeRegExp('hello.*+?^${}()|[]\\world') // 'hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\world'
 */
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}