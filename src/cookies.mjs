/** @module cookies */
import { escapeRegExp } from './regex.mjs'

/**
 * Returns a string with the expiration date for a cookie.
 * 
 * @param {int} days
 * @returns string - The expiration date for a cookie in UTC format or an empty string if days is not provided
 * @example
 * cookieExpirationDate(7) // Returns a string in the format '; expires=Thu, 01 Jan 1970 00:00:00 UTC' for 7 days from now
 */
export function cookieExpirationDate(days) {
  if (!days) return ""
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1e3)
  return `; expires=${date.toUTCString()}`
}

/**
 * Sets a cookie with the given name and value. If days is provided, it will set the expiration date.
 * 
 * @param {string} name 
 * @param {string} value 
 * @param {int} days
 * @returns void
 * @example
 * setCookie('foo', 'bar', 7) // Sets a cookie named 'foo' with the value 'bar' that expires in 7 days
 */
export function setCookie(name, value, days) {
  document.cookie = `${name}=${value || ""}${cookieExpirationDate(days)}; path=/`
}

/**
 * Gets a cookie with the given name.
 * 
 * @param {string} name
 * @returns string|null
 * @example
 * setCookie('foo', 'bar', 7)
 * getCookie('foo') // Returns the value of the cookie named 'foo'
 * getCookie('bar') // Returns null if the cookie named 'bar' doesn't exist
 */
export function getCookie(name) {
  const escapedName = escapeRegExp(name)
  const matches = document.cookie.match(new RegExp(`(?:^|;\\s*)${escapedName}\\s*=\\s*([^;]+)`))
  return matches ? matches[1] : null
}

/**
 * Erases a cookie with the given name.
 * 
 * @param {string} name
 * @returns void
 * @example
 * setCookie('foo', 'bar', 7)
 * deleteCookie('foo') // Erases the cookie named 'foo'
 * getCookie('foo') // Returns null
 */
export function deleteCookie(name) {
  document.cookie = `${name}=; Max-Age=-99999999;`
}

/**
 * Checks if a cookie with the given name exists.
 * 
 * @param name
 * @returns boolean
 * @example
 * setCookie('foo', 'bar', 7)
 * hasCookie('foo') // Returns true
 * hasCookie('bar') // Returns false
 */
export function hasCookie(name) {
  return getCookie(name) !== null
}

/**
 * Updates a cookie with the given name and value. If days is provided, it will set the expiration date.
 * 
 * @param {string} name
 * @param {string|number} value
 * @param {int} days
 * @returns void
 * @example
 * setCookie('foo', 'bar', 7)
 * updateCookie('foo', 'baz', 7) // Updates the cookie named 'foo' with the value 'baz' that expires in 7 days
 * getCookie('foo') // Returns 'baz'
 */
export function updateCookie(name, value, days) {
  if (!hasCookie(name)) return
  setCookie(name, value, days)
}
