const userAgents = require('./data/user-agents.json')
const slugifyData = require('./data/slugify.json')
require = require('esm')(module)
const { 
  shallowMerge, 
  deepMerge, 
  clone, 
  isObject, 
  isEmptyObject, 
  isArray,
  isEmptyArray,
  isEmpty,
  isString, 
  isFunction,
  propertyIsFunction, 
  transformDashToCamelCase, 
  transformCamelCaseToDash,
  stringToPrimitive,
  stringToType,
  mapByProperty,
  mapPropertyToProperty,
  slugify,
  removeAccents,
  stripHTMLTags,
  closestNumber,
  truncateString,
  randomIntInclusive,
  fixed,
  getPercentage,
  parseResolutionString
} = require('../helpers')

const a = { 
  foo: 'bar', 
  bar: 'baz', 
  baz: [
    { a: 1, b: 2, c: { d: 3, e: 4}}
  ]
}

const b = {
  foo: 'qux',
  baz: [
    { a: 7, b: 8},
    { a: 5, b: 6}
  ]
}

test('shallowMerge', () => {
  const testA = clone(a)
  const testB = clone(b)

  shallowMerge(testA, testB)

  expect(testA).toEqual({
    foo: 'qux',
    bar: 'baz',
    baz: [
      { a: 7, b: 8},
      { a: 5, b: 6}
    ]
  })
})

test('deepMerge', () => {
  const testA = clone(a)
  const testB = clone(b)

  deepMerge(testA, testB)

  expect(testA).toEqual({
    foo: 'qux',
    bar: 'baz',
    baz: [
      { a: 7, b: 8, c: { d: 3, e: 4}},
      { a: 5, b: 6}
    ]
  })
})

test('clone', () => {
  const testA = clone(a)
  const testB = clone(b)

  expect(testA === a).toBe(false)
  expect(testB === b).toBe(false)
  expect(testA).toEqual(a)
  expect(testB).toEqual(b)
})

test('isObject', () => {
  expect(isObject({})).toBe(true)
  expect(isObject([])).toBe(false)
  expect(isObject('')).toBe(false)
  expect(isObject(1)).toBe(false)
  expect(isObject(null)).toBe(false)
  expect(isObject(undefined)).toBe(false)
})

test('isEmptyObject', () => {
  expect(isEmptyObject({})).toBe(true)
  expect(isEmptyObject({a: 1, b: 2})).toBe(false)
})

test('isArray', () => {
  expect(isArray([])).toBe(true)
  expect(isArray({})).toBe(false)
  expect(isArray('')).toBe(false)
  expect(isArray(1)).toBe(false)
  expect(isArray(null)).toBe(false)
  expect(isArray(undefined)).toBe(false)
})

test('isEmptyArray', () => {
  expect(isEmptyArray([])).toBe(true)
  expect(isEmptyArray([1, 2])).toBe(false)
})

test('isEmpty', () => {
  expect(isEmpty({})).toBe(true)
  expect(isEmpty([])).toBe(true)
  expect(isEmpty('')).toBe(true)
  expect(isEmpty(1)).toBe(false)
  expect(isEmpty(null)).toBe(false)
  expect(isEmpty(undefined)).toBe(false)
})

test('isString', () => {
  expect(isString('')).toBe(true)
  expect(isString({})).toBe(false)
  expect(isString([])).toBe(false)
  expect(isString(1)).toBe(false)
  expect(isString(null)).toBe(false)
  expect(isString(undefined)).toBe(false)
})

test('isFunction', () => {
  expect(isFunction(() => {})).toBe(true)
  expect(isFunction({})).toBe(false)
  expect(isFunction([])).toBe(false)
  expect(isFunction(1)).toBe(false)
  expect(isFunction(null)).toBe(false)
  expect(isFunction(undefined)).toBe(false)
})

test('propertyIsFunction', () => {
  expect(propertyIsFunction({ foo: () => {} }, 'foo')).toBe(true)
  expect(propertyIsFunction({ foo: {} }, 'foo')).toBe(false)
  expect(propertyIsFunction({ foo: [] }, 'foo')).toBe(false)
  expect(propertyIsFunction({ foo: 1 }, 'foo')).toBe(false)
  expect(propertyIsFunction({ foo: null }, 'foo')).toBe(false)
  expect(propertyIsFunction({ foo: undefined }, 'foo')).toBe(false)
})

test('transformDashToCamelCase', () => {
  expect(transformDashToCamelCase('foo-bar-baz')).toBe('fooBarBaz')
  expect(transformDashToCamelCase('foo-bar-baz-qux')).toBe('fooBarBazQux')
  expect(transformDashToCamelCase('fooBarBaz-qux')).toBe('fooBarBazQux')
})

test('transformCamelCaseToDash', () => {
  expect(transformCamelCaseToDash('fooBarBaz')).toBe('foo-bar-baz')
  expect(transformCamelCaseToDash('fooBarBazQux')).toBe('foo-bar-baz-qux')
  expect(transformCamelCaseToDash('foo-bar-bazQux')).toBe('foo-bar-baz-qux')
})

test('stringToPrimitive', () => {
  expect(stringToPrimitive('true')).toBe(true)
  expect(stringToPrimitive('false')).toBe(false)
  expect(stringToPrimitive('1')).toBe(1)
  expect(stringToPrimitive('1.5')).toBe(1.5)
  expect(stringToPrimitive('foo')).toBe('foo')
})

test('stringToType', () => {
  expect(stringToType('true')).toBe(true)
  expect(stringToType('false')).toBe(false)
  expect(stringToType('1')).toBe(1)
  expect(stringToType('1.5')).toBe(1.5)
  expect(stringToType('foo')).toBe('foo')
  expect(stringToType('{"foo": "bar"}')).toEqual({ foo: 'bar' })
  expect(stringToType('[1, 2, 3]')).toEqual([1, 2, 3])
  expect(stringToType('foo')).toBe('foo')
})

test('mapByProperty', () => {
  const userAgentsMap = mapByProperty(userAgents, 'device')

  expect(userAgentsMap['Apple iPhone XR (Safari)']).toEqual({
    device: 'Apple iPhone XR (Safari)',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1'
  })
})

test('mapPropertyToProperty', () => {
  const userAgentsMap = mapPropertyToProperty(userAgents, 'device', 'userAgent')

  expect(userAgentsMap['Apple iPhone XR (Safari)']).toBe('Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1')
})

test('removeAccents', () => {
  expect(removeAccents('áéíóú')).toBe('aeiou')
  expect(removeAccents('ÁÉÍÓÚ')).toBe('AEIOU')
  expect(removeAccents('señor')).toBe('senor')
  expect(removeAccents('œ')).toBe('oe')
})

test('stripHTMLTags', () => {
  expect(stripHTMLTags('<p>foo</p>')).toBe('foo')
  expect(stripHTMLTags('<p>foo</p><p>bar</p>')).toBe('foobar')
  expect(stripHTMLTags('<p>foo<p>bar<p>baz</p></p></p>')).toBe('foobarbaz')
})

test('slugify', () => {
  slugifyData.forEach(({ input, expected }) => {
    expect(slugify(input)).toBe(expected)
  })
})

test('closestNumber', () => {
  expect(closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(9)
  expect(closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11])).toBe(9)
  expect(closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 9.5])).toBe(9.5)
  expect(closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])).toBe(10)
})

test('truncateString', () => {
  expect(truncateString('foo bar baz', 1)).toBe('foo…')
  expect(truncateString('foo bar baz', 2)).toBe('foo bar…')
  expect(truncateString('foo bar baz', 3)).toBe('foo bar baz')
  expect(truncateString('foo bar baz', 4)).toBe('foo bar baz')
  expect(truncateString('foo bar? baz', 2, '...')).toBe('foo bar? ...')
})

test('randomIntInclusive', () => {
  expect(randomIntInclusive(1, 1)).toBe(1)

  let randomInt = randomIntInclusive(1, 2)
  expect(randomInt).toBeGreaterThanOrEqual(1)
  expect(randomInt).toBeLessThanOrEqual(2)

  randomInt = randomIntInclusive(1, 3)
  expect(randomInt).toBeGreaterThanOrEqual(1)
  expect(randomInt).toBeLessThanOrEqual(3)

  randomInt = randomIntInclusive(3, 1)
  expect(randomInt).toBeGreaterThanOrEqual(1)
  expect(randomInt).toBeLessThanOrEqual(3)
  
  randomInt = randomIntInclusive(-5, 5)
  expect(randomInt).toBeGreaterThanOrEqual(-5)
  expect(randomInt).toBeLessThanOrEqual(5)
})

test('fixed', () => {
  expect(fixed(1.234, 2)).toBe(1.23)
  expect(fixed(1.235, 2)).toBe(1.24)
  expect(fixed(1.235)).toBe(1)
  expect(fixed(1.235, 0)).toBe(1)
  expect(fixed(1.235, 5)).toBe(1.235)
})

test('getPercentage', () => {
  expect(getPercentage(1, 2)).toBe(50)
  expect(fixed(getPercentage(1, 3))).toBe(33)
  expect(getPercentage(1, 4)).toBe(25)
  expect(getPercentage(1, 5)).toBe(20)
  expect(getPercentage(10, 2)).toBe(500)
  expect(getPercentage(10, 10)).toBe(100)
  expect(getPercentage(10, 0)).toBe(0)
  expect(getPercentage(0, 0)).toBe(0)
})

test('parseResolutionString', () => {
  expect(parseResolutionString('16:9')).toBe(1.7777777778)
  expect(fixed(parseResolutionString('4:3'), 10)).toBe(1.3333333333)
  expect(parseResolutionString('1:1')).toBe(1)
  expect(fixed(parseResolutionString('4x3'), 10)).toBe(1.3333333333)
  expect(fixed(parseResolutionString('4-3'), 10)).toBe(1.3333333333)
  expect(fixed(parseResolutionString('4/3'), 10)).toBe(1.3333333333)
  expect(parseResolutionString('16:0')).toBe(1.7777777778)
  expect(parseResolutionString('0:0')).toBe(1.7777777778)
  expect(parseResolutionString('0:0')).toBe(1.7777777778)
  expect(parseResolutionString()).toBe(1.7777777778)
  expect(parseResolutionString('')).toBe(1.7777777778)
  expect(parseResolutionString('foo')).toBe(1.7777777778)
})
