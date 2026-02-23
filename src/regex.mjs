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
 * @param {string} string The string to escape
 * @returns {string} The escaped string
 * @example
 * escapeRegExp('hello world') // 'hello world'
 * escapeRegExp('hello.*+?^${}()|[]\\world') // 'hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\world'
 */
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * @internal
 * Find the index of the closing parenthesis matching the opening one at the given index
 * @param {string} str The string to search
 * @param {number} openIndex The index of the opening parenthesis
 * @returns {number} The index of the matching closing parenthesis, or -1 if not found
 */
function findMatchingParen(str, openIndex) {
  let depth = 1
  for (let i = openIndex + 1; i < str.length; i++) {
    if (str[i] === '(') depth++
    if (str[i] === ')') depth--
    if (depth === 0) return i
  }
  return -1
}

/**
 * @internal
 * Extract all !() negation extglob patterns from a glob string
 * @param {string} glob The glob pattern
 * @returns {Array<{start: number, end: number, inner: string}>} Array of negation descriptors with start/end indices and inner content
 */
function extractNegatedGlobs(glob) {
  const negations = []
  for (let i = 0; i < glob.length; i++) {
    if (glob[i] !== '!' || glob[i + 1] !== '(') continue
    const closeIndex = findMatchingParen(glob, i + 1)
    if (closeIndex === -1) continue
    negations.push({ start: i, end: closeIndex, inner: glob.slice(i + 2, closeIndex) })
    i = closeIndex
  }
  return negations
}

/**
 * @internal
 * Build a glob variant by replacing !() negations — one is expanded to @() for matching, the rest become * wildcards
 * @param {string} glob The original glob pattern
 * @param {Array<{start: number, end: number, inner: string}>} negations The negation descriptors from extractNegatedGlobs
 * @param {number} expandIndex The index of the negation to expand as @(), or -1 to replace all with *
 * @returns {string} The modified glob string
 */
function buildGlobVariant(glob, negations, expandIndex) {
  let result = ''
  let lastEnd = 0
  negations.forEach((neg, idx) => {
    result += glob.slice(lastEnd, neg.start)
    result += idx === expandIndex ? '@(' + neg.inner + ')' : '*'
    lastEnd = neg.end + 1
  })
  result += glob.slice(lastEnd)
  return result
}

/**
 * @internal
 * Handle !() negation extglob patterns by building a positive regex and negative regexes, 
 * returning an object with a test method that matches the positive but rejects the negatives
 * @param {string} glob The glob pattern containing !() negations
 * @param {boolean} [anchored=false] Whether to anchor the regex with ^ and $ for exact matching
 * @returns {{test: function}|null} An object with a test method, or null if no negations are found
 */
function convertGlobNegationsToRegex(glob, anchored = false) {
  const negations = extractNegatedGlobs(glob)
  if (negations.length === 0) return null

  const positiveGlob = buildGlobVariant(glob, negations, -1)
  const positiveRegex = convertGlobToRegex(positiveGlob, anchored)
  if (!positiveRegex) return null

  const negativeRegexes = negations.map((_, idx) => {
    return convertGlobToRegex(buildGlobVariant(glob, negations, idx), anchored)
  }).filter(Boolean)

  if (negativeRegexes.length === 0) return positiveRegex

  return {
    test(str) {
      if (anchored) {
        if (!new RegExp('^' + positiveRegex.source + '$').test(str)) return false
        return negativeRegexes.every(re => !new RegExp('^' + re.source + '$').test(str))
      }
      const globalRe = new RegExp(positiveRegex.source, 'g')
      let match
      while ((match = globalRe.exec(str)) !== null) {
        if (negativeRegexes.every(re => !new RegExp('^' + re.source + '$').test(match[0]))) {
          return true
        }
        if (match[0].length === 0) globalRe.lastIndex++
      }
      return false
    }
  }
}

/**
 * @internal
 * Convert a glob pattern to a regex source string by parsing glob syntax character by character
 * @param {string} glob The glob pattern to convert
 * @param {boolean} [anchored=false] Whether to anchor the regex with ^ and $ for exact matching
 * @returns {string} The regex source string
 */
function convertGlobToRegexString(glob, anchored = false) {
  let regexString = ''
  let insideSquareBrackets = false
  let insideCurlyBraces = false
  const extglobStack = []

  for (let i = 0; i < glob.length; i++) {
    const char = glob[i]
    const next = glob[i + 1]

    // Glob escape: \x → literal x
    if (char === '\\' && i + 1 < glob.length) {
      regexString += '\\' + next
      i++
      continue
    }

    // Inside character class [...]
    if (insideSquareBrackets) {
      if (char === ']') {
        insideSquareBrackets = false
        regexString += ']'
      } else if (char === '!') {
        regexString += '^'
      } else {
        regexString += char
      }
      continue
    }

    // Extended glob: ?(, *(, +(, @(
    if (next === '(' && '?*+@'.includes(char)) {
      extglobStack.push(char)
      regexString += '(?:'
      i++
      continue
    }

    // Closing ) for extglob
    if (char === ')' && extglobStack.length > 0) {
      const type = extglobStack.pop()
      const suffixes = { '?': ')?', '*': ')*', '+': ')+', '@': ')' }
      regexString += suffixes[type]
      continue
    }

    // ** globstar — matches across path separators
    if (char === '*' && next === '*') {
      regexString += '.*'
      i++
      if (glob[i + 1] === '/') i++
      continue
    }

    // * — matches within a single path segment
    if (char === '*') { regexString += '[^\\/\\\\]*'; continue }

    // ? — single non-separator character
    if (char === '?') { regexString += '[^\\/\\\\]'; continue }

    // Character class
    if (char === '[') { insideSquareBrackets = true; regexString += '['; continue }

    // Brace expansion
    if (char === '{') { insideCurlyBraces = true; regexString += '('; continue }
    if (char === '}') { insideCurlyBraces = false; regexString += ')'; continue }
    if (char === ',' && insideCurlyBraces) { regexString += '|'; continue }

    // Pipe is alternation inside extglob, literal outside
    if (char === '|' && extglobStack.length > 0) { regexString += '|'; continue }

    // Escape regex-special characters
    if ('.|+$^(){}\\/-'.includes(char)) { regexString += '\\' + char; continue }

    regexString += char
  }

  if (anchored) {
    regexString = '^' + regexString + '$'
  }

  return regexString
}

/**
 * Convert a glob pattern to a regular expression but unanchored (doesn't add ^ or $) by default
 *
 * Supports standard glob syntax (*, **, ?, [...], {...}), extended glob patterns
 * (?(pattern), *(pattern), +(pattern), @(pattern), !(pattern)), and backslash escaping.
 * 
 * Alternative packages to consider: micromatch, picomatch, minimatch, glob-to-regexp...
 *
 * @param {string} glob - The glob pattern to convert
 * @param {boolean} [anchored=false] - Whether to anchor the regex with ^ and $ for exact matching
 * @returns {RegExp|{test: function}|null} A RegExp (or object with test method for negation 
 * patterns), or null if the pattern is invalid
 * @example
 * convertGlobToRegex('*.js').test('app.js') // true
 * convertGlobToRegex('src/**\/*.ts').test('src/lib/utils.ts') // true
 * convertGlobToRegex('*.{js,ts}').test('app.ts') // true
 * convertGlobToRegex('!(test).js').test('app.js') // true
 * convertGlobToRegex('!(test).js').test('test.js') // false
 */
export function convertGlobToRegex(glob, anchored = false) {
  const negations = convertGlobNegationsToRegex(glob, anchored)
  if (negations) return negations

  const regexString = convertGlobToRegexString(glob, anchored)
  if (!regexString || regexString.length === 0) return null
  
  try {
    return new RegExp(regexString)
  } catch (e) {
    return null
  }
}