import { cookieExpirationDate, setCookie, getCookie, deleteCookie, hasCookie, updateCookie } from '../cookies.mjs'

beforeEach(() => {
  // clear all cookies before each test
  document.cookie.split(';').forEach((c) => {
    const name = c.split('=')[0].trim()
    if (name) document.cookie = `${name}=; Max-Age=-99999999;`
  })
})

test('cookieExpirationDate', () => {
  expect(cookieExpirationDate()).toBe('')
  expect(cookieExpirationDate(0)).toBe('')
  expect(cookieExpirationDate(null)).toBe('')

  const result = cookieExpirationDate(7)
  expect(result).toMatch(/^; expires=/)
  // the date should be roughly 7 days from now
  const dateStr = result.replace('; expires=', '')
  const expiresAt = new Date(dateStr).getTime()
  const expected = Date.now() + 7 * 24 * 60 * 60 * 1000
  expect(Math.abs(expiresAt - expected)).toBeLessThan(1000)
})

test('setCookie and getCookie', () => {
  setCookie('foo', 'bar')
  expect(getCookie('foo')).toBe('bar')

  setCookie('baz', 'qux', 7)
  expect(getCookie('baz')).toBe('qux')
})

test('getCookie returns null for missing cookie', () => {
  expect(getCookie('nonexistent')).toBe(null)
})

test('setCookie with empty value', () => {
  setCookie('empty', '')
  // empty value results in `empty=` which browsers treat as no value
  expect(getCookie('empty')).toBe(null)
})

test('multiple cookies', () => {
  setCookie('a', '1')
  setCookie('b', '2')
  setCookie('c', '3')
  expect(getCookie('a')).toBe('1')
  expect(getCookie('b')).toBe('2')
  expect(getCookie('c')).toBe('3')
})

test('setCookie overwrites existing cookie', () => {
  setCookie('foo', 'bar')
  expect(getCookie('foo')).toBe('bar')
  setCookie('foo', 'baz')
  expect(getCookie('foo')).toBe('baz')
})

test('deleteCookie', () => {
  setCookie('foo', 'bar')
  expect(getCookie('foo')).toBe('bar')
  deleteCookie('foo')
  expect(getCookie('foo')).toBe(null)
})

test('deleteCookie for nonexistent cookie does not throw', () => {
  expect(() => deleteCookie('nonexistent')).not.toThrow()
})

test('hasCookie', () => {
  expect(hasCookie('foo')).toBe(false)
  setCookie('foo', 'bar')
  expect(hasCookie('foo')).toBe(true)
  deleteCookie('foo')
  expect(hasCookie('foo')).toBe(false)
})

test('updateCookie updates existing cookie', () => {
  setCookie('foo', 'bar')
  updateCookie('foo', 'baz')
  expect(getCookie('foo')).toBe('baz')
})

test('updateCookie does nothing for nonexistent cookie', () => {
  updateCookie('nonexistent', 'value')
  expect(getCookie('nonexistent')).toBe(null)
})

test('getCookie with special regex characters in name', () => {
  setCookie('foo.bar', 'value')
  expect(getCookie('foo.bar')).toBe('value')

  setCookie('a+b', 'value2')
  expect(getCookie('a+b')).toBe('value2')
})
