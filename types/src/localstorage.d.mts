/**
 * Check if localStorage is available and functional. Caches the result after the first successful check for performance.
 *
 * @returns {boolean} True if localStorage is available, false otherwise
 * @example
 * if (isLocalStorageAvailable()) {
 *   setLocal('key', 'value')
 * }
 */
export function isLocalStorageAvailable(): boolean;
/**
 * Used only for testing purposes to reset the cached localStorage support check result
 * @internal
 */
export function _resetLocalStorageSupportCheck(): void;
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
export function isExpired(timestamp: number, ttl: number): boolean;
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
export function getLocal(key: string): any;
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
export function setLocal(key: string, value: any, ttl?: number, update?: boolean): any;
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
export function updateLocal(key: string, value: any): any;
/**
 * Remove an item from localStorage by key
 *
 * @param {string} key The localStorage key to remove
 * @example
 * setLocal('key', 'value')
 * removeLocal('key')
 * getLocal('key') // => null
 */
export function removeLocal(key: string): void;
