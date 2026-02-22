/** @module localstorage */

let verifiedLocalStorageSupport = false;

/**
 * Check if localStorage is available and functional. Caches the result after the first successful check for performance.
 *
 * @returns {boolean} True if localStorage is available, false otherwise
 * @example
 * if (isLocalStorageAvailable()) {
 *   setLocal('key', 'value')
 * }
 */
export function isLocalStorageAvailable() {
  if (typeof globalThis === 'undefined' || typeof globalThis.localStorage === 'undefined') return false
  if (verifiedLocalStorageSupport) return true

  try {
    const testKey = 'localStorage:test'
    globalThis.localStorage.setItem(testKey, 'value')
    globalThis.localStorage.removeItem(testKey)
    verifiedLocalStorageSupport = true
    return true
  } catch (e) {
    return false
  }
}

/**
 * Used only for testing purposes to reset the cached localStorage support check result
 * @internal
 */
export function _resetLocalStorageSupportCheck() {
  verifiedLocalStorageSupport = false
}

/**
 * Check if a timestamp has exceeded its TTL
 *
 * @param {number} timestamp The timestamp in milliseconds to check
 * @param {number} ttl The time-to-live in milliseconds
 * @returns {boolean} True if the timestamp has expired, false otherwise
 * @example
 * isExpired(Date.now() - 1000, 500) // => true
 * isExpired(Date.now() - 500, 1000) // => false
 */
export function isExpired(timestamp, ttl) {
  return Date.now() - timestamp > ttl
}

/**
 * Retrieve a value from localStorage by key. Automatically unwraps the storage envelope and checks TTL expiration. Expired items are removed from localStorage.
 *
 * @param {string} key The localStorage key
 * @returns {*} The stored value, or null if the key doesn't exist, has expired, or localStorage is unavailable
 * @example
 * setLocal('user', { name: 'Nikola' })
 * getLocal('user') // => { name: 'Nikola' }
 * getLocal('nonexistent') // => null
 */
export function getLocal(key) {
  if (!isLocalStorageAvailable()) return null
  const item = localStorage.getItem(key)
  if (!item) return null

  try {
    const parsed = JSON.parse(item)
    const isEnvelope = parsed !== null && typeof parsed === 'object' && 'value' in parsed && '__storedAt' in parsed
    if (!isEnvelope) return parsed
    
    const envelope = parsed
    if (typeof envelope.__ttl === 'number' && isExpired(envelope.__storedAt, envelope.__ttl)) {
      localStorage.removeItem(key)
      return null
    }

    return envelope.value
  } catch (e) {
    localStorage.removeItem(key)
    return null
  }
}

/**
 * Store a JSON-serializable value in localStorage wrapped in an envelope with a timestamp. Optionally set a TTL for automatic expiration on read. When update is true, preserves the original __storedAt timestamp and TTL of an existing item.
 *
 * @param {string} key The localStorage key
 * @param {*} value The value to store (must be JSON-serializable)
 * @param {number} [ttl] Optional time-to-live in milliseconds
 * @param {boolean} [update=false] If true, preserve the original __storedAt and TTL
 * @returns {*} The stored value, or null if localStorage is unavailable, the value can't be serialized, or the item has expired (update mode)
 * @example
 * setLocal('key', 'value') // => 'value'
 * setLocal('key', { foo: 'bar' }, 60000) // expires in 1 minute
 * setLocal('key', 'new', null, true) // update value, keep original timestamp and TTL
 */
export function setLocal(key, value, ttl, update = false) {
  if (!isLocalStorageAvailable()) return null

  try {
    if (update) {
      const item = localStorage.getItem(key)
      if (item) {
        const parsed = JSON.parse(item)
        const isEnvelope = parsed !== null && typeof parsed === 'object' && 'value' in parsed && '__storedAt' in parsed
        if (isEnvelope) {
          if (typeof parsed.__ttl === 'number' && isExpired(parsed.__storedAt, parsed.__ttl)) {
            localStorage.removeItem(key)
            return null
          }
          parsed.value = value
          localStorage.setItem(key, JSON.stringify(parsed))
          return value
        }
      }
    }

    const envelope = { value, __storedAt: Date.now() }
    if (typeof ttl === 'number') envelope.__ttl = ttl
    localStorage.setItem(key, JSON.stringify(envelope))
    return value
  } catch (e) {
    return null
  }
}

/**
 * Update the value of an existing localStorage item, preserving the original __storedAt timestamp and TTL. If the key doesn't exist or has no envelope, behaves like setLocal.
 *
 * @param {string} key The localStorage key
 * @param {*} value The new value to store (must be JSON-serializable)
 * @returns {*} The stored value, or null if localStorage is unavailable, the item has expired, or the value can't be serialized
 * @example
 * setLocal('key', 'old', 60000)
 * updateLocal('key', 'new') // => 'new' (keeps original timestamp and TTL)
 */
export function updateLocal(key, value) {
  return setLocal(key, value, null, true)
}

/**
 * Remove an item from localStorage by key
 *
 * @param {string} key The localStorage key to remove
 * @example
 * setLocal('key', 'value')
 * removeLocal('key')
 * getLocal('key') // => null
 */
export function removeLocal(key) {
  if (!isLocalStorageAvailable()) {
    return;
  }
  localStorage.removeItem(key)
}
