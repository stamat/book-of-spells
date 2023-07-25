const userAgents = require('./user-agents.json')
require = require('esm')(module)
const { isUserAgentIOS, isUserAgentSafari, isUserAgentMobile } = require('../browser')
const { mapPropertyToProperty } = require('../helpers.mjs')

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
  console.log(userAgentMap)
  expect(isUserAgentMobile(userAgentMap['Apple iPhone XR (Safari)'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Apple iPhone XS (Chrome)'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Apple iPhone XS Max (Firefox)'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Motorola Moto G Stylus 5G'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Samsung Galaxy S21 Ultra 5G'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Mac OS X-based computer using a Safari browser'])).toBe(false)
  expect(isUserAgentMobile(userAgentMap['Windows 10-based PC using Edge browser'])).toBe(false)
})
