/**
 * Escape special characters in a string to be used in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} The escaped string
 * @example
 * escapeRegExp('hello world') // 'hello world'
 * escapeRegExp('hello.*+?^${}()|[]\\world') // 'hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\world'
 */
export function escapeRegExp(string: string): string;
/**
 * @module regex
 */
/**
 * Regular expression for matching a YouTube video links and extracting their ID, works with both embed and watch URLs
 */
export const RE_YOUTUBE: RegExp;
/**
 * Regular expression for matching a Vimeo video links and extracting their ID, works with both embed and watch URLs, channels and groups
 */
export const RE_VIMEO: RegExp;
/**
 * Regular expression for matching a video URLs
 */
export const RE_VIDEO: RegExp;
/**
 * Regular expression for matching a image URLs
 */
export const RE_IMAGE: RegExp;
/**
 * Regular expression for matching a URL parameters
 */
export const RE_URL_PARAMETER: RegExp;
/**
 * Regular expression for matching a HTML attribute and tag names, also for matching shortcode attributes and names
 */
export const RE_ATTRIBUTES: RegExp;
/**
 * Regular expression for matching a single attribute without value
 */
export const RE_ATTRIBUTE_WITHOUT_VALUE: RegExp;
/**
 * Regular expression for matching a single attribute with value
 */
export const RE_ATTRIBUTE_WITH_VALUE: RegExp;
/**
 * Regular expression for matching the first or last quote of a string used for removing them
 */
export const RE_FIRST_OR_LAST_QUOTE: RegExp;
