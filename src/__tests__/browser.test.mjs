import userAgents from './data/user-agents.json' with { type: 'json' }
import { isUserAgentIOS, isUserAgentSafari, isUserAgentMobile, getQueryProperties, getHashProperties, disableScroll, enableScroll } from '../browser.mjs'
import { mapPropertyToProperty } from '../helpers.mjs'

const userAgentMap = mapPropertyToProperty(userAgents, 'device', 'userAgent')

test('isUserAgentIOS', () => {
  userAgents.forEach(({ device, userAgent }) => {
    expect(isUserAgentIOS(userAgent)).toBe(/iPhone/i.test(device))
  })
})

test('isUserAgentSafari', () => {
  expect(isUserAgentSafari(userAgentMap['Apple iPhone XR (Safari)'])).toBe(true)
  expect(isUserAgentSafari(userAgentMap['Apple iPhone XS (Chrome)'])).toBe(false)
  expect(isUserAgentSafari(userAgentMap['Apple iPhone XS Max (Firefox)'])).toBe(false)
  expect(isUserAgentSafari(userAgentMap['Mac OS X-based computer using a Safari browser'])).toBe(true)
})

test('isUserAgentMobile', () => {
  expect(isUserAgentMobile(userAgentMap['Apple iPhone XR (Safari)'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Apple iPhone XS (Chrome)'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Apple iPhone XS Max (Firefox)'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Motorola Moto G Stylus 5G'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Samsung Galaxy S21 Ultra 5G'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Mac OS X-based computer using a Safari browser'])).toBe(false)
  expect(isUserAgentMobile(userAgentMap['Windows 10-based PC using Edge browser'])).toBe(false)
})

test('getQueryProperties', () => {
  // with explicit query string
  expect(getQueryProperties('foo=bar&baz=qux')).toEqual({ foo: 'bar', baz: 'qux' })
  // parseUrlParameters uses stringToType, so numeric values are converted
  expect(getQueryProperties('a=1&b=2&c=3')).toEqual({ a: 1, b: 2, c: 3 })
  expect(getQueryProperties('key=value')).toEqual({ key: 'value' })

  // empty
  expect(getQueryProperties('')).toEqual({})
})

test('getHashProperties', () => {
  // with explicit hash string
  expect(getHashProperties('foo=bar&baz=qux')).toEqual({ foo: 'bar', baz: 'qux' })
  expect(getHashProperties('a=1')).toEqual({ a: 1 })

  // empty
  expect(getHashProperties('')).toEqual({})
})

test('disableScroll / enableScroll', () => {
  disableScroll()
  expect(document.body.style.overflow).toBe('hidden')

  enableScroll()
  expect(document.body.style.overflow).toBe('')
})
