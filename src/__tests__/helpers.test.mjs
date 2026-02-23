import userAgents from './data/user-agents.json' with { type: 'json' }
import slugifyData from './data/slugify.json' with { type: 'json' }
import {
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
  stringToBoolean,
  stringToPrimitive,
  stringToNumber,
  stringToArray,
  stringToObject,
  stringToRegex,
  stringToType,
  hasOwnProperties,
  mapByProperty,
  mapPropertyToProperty,
  slugify,
  removeAccents,
  stripHTMLTags,
  closestNumber,
  truncateString,
  randomIntInclusive,
  fixed,
  percentage,
  pick,
  reject,
  getObjectValueByPath,
  basicUID,
  generateUUID,
  random
} from '../helpers.mjs'

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

test('stringToNumber', () => {
  // integers
  expect(stringToNumber('1')).toBe(1)
  expect(stringToNumber('0')).toBe(0)
  expect(stringToNumber('42')).toBe(42)
  expect(stringToNumber(' 5 ')).toBe(5)

  // negative integers
  expect(stringToNumber('-1')).toBe(-1)
  expect(stringToNumber('-42')).toBe(-42)

  // floats
  expect(stringToNumber('1.5')).toBe(1.5)
  expect(stringToNumber('0.123')).toBe(0.123)
  expect(stringToNumber(' 3.14 ')).toBe(3.14)

  // negative floats
  expect(stringToNumber('-1.5')).toBe(-1.5)
  expect(stringToNumber('-0.99')).toBe(-0.99)

  // invalid
  expect(stringToNumber('foo')).toBe(undefined)
  expect(stringToNumber('1foo')).toBe(undefined)
  expect(stringToNumber('1.2.3')).toBe(undefined)
  expect(stringToNumber('...')).toBe(undefined)
  expect(stringToNumber('')).toBe(undefined)
})

test('stringToRegex', () => {
  // basic regex
  const re = stringToRegex('/foo/i')
  expect(re).toBeInstanceOf(RegExp)
  expect(re.source).toBe('foo')
  expect(re.flags).toBe('i')

  // global flag
  const reG = stringToRegex('/bar/g')
  expect(reG.source).toBe('bar')
  expect(reG.flags).toBe('g')

  // multiple flags
  const reGI = stringToRegex('/baz/gi')
  expect(reGI.source).toBe('baz')
  expect(reGI.flags).toBe('gi')

  // multiline flag
  const reM = stringToRegex('/^start/m')
  expect(reM.source).toBe('^start')
  expect(reM.flags).toBe('m')

  // no flags
  const reNone = stringToRegex('/test/')
  expect(reNone.source).toBe('test')
  expect(reNone.flags).toBe('')

  // pattern with special characters
  const reSpecial = stringToRegex('/\\d+\\.\\d+/g')
  expect(reSpecial.test('3.14')).toBe(true)

  // invalid input
  expect(stringToRegex('foo')).toBe(undefined)
  expect(stringToRegex('1')).toBe(undefined)
  expect(stringToRegex('')).toBe(undefined)
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

test('percentage', () => {
  expect(percentage(1, 2)).toBe(50)
  expect(fixed(percentage(1, 3))).toBe(33)
  expect(percentage(1, 4)).toBe(25)
  expect(percentage(1, 5)).toBe(20)
  expect(percentage(10, 2)).toBe(500)
  expect(percentage(10, 10)).toBe(100)
  expect(percentage(10, 0)).toBe(0)
  expect(percentage(0, 0)).toBe(0)
})

test('pick', () => {
  expect(pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, [])).toEqual({})
  expect(pick({}, [])).toEqual({})
  expect(pick(null, 'foo')).toEqual(undefined)
  expect(pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, undefined)).toEqual({})
  expect(pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, 'foo')).toEqual({ foo: 'bar'})
  expect(pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, ['foo', 'baz'])).toEqual({ foo: 'bar', baz: 'qux' })
  expect(pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, ['foo', 'baz', 'qux'])).toEqual({ foo: 'bar', baz: 'qux' })
  expect(pick(['foo', 'bar', 'baz', 'qux'], [0, 2])).toEqual(['foo', 'baz'])
  expect(pick(['foo', 'bar', 'baz', 'qux'], [0, 2, 3])).toEqual(['foo', 'baz', 'qux'])
  expect(pick(['foo', 'bar', 'baz', 'qux'], [0, 1, 2, 3])).toEqual(['foo', 'bar', 'baz', 'qux'])
  expect(pick(['foo', 'bar', 'baz', 'qux'], [0, 4])).toEqual(['foo'])
})

test('reject', () => {
  expect(reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, [])).toEqual({ foo: 'bar', bar: 'baz', baz: 'qux' })
  expect(reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, undefined)).toEqual({ foo: 'bar', bar: 'baz', baz: 'qux' })
  expect(reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, 'foo')).toEqual({ bar: 'baz', baz: 'qux' })
  expect(reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, ['foo', 'baz'])).toEqual({ bar: 'baz' })
  expect(reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, ['foo', 'baz', 'qux'])).toEqual({ bar: 'baz' })
  expect(reject(['foo', 'bar', 'baz', 'qux'], [0, 2])).toEqual(['bar', 'qux'])
  expect(reject(['foo', 'bar', 'baz', 'qux'], [0, 2, 3])).toEqual(['bar'])
  expect(reject(['foo', 'bar', 'baz', 'qux'], [0, 1, 2, 3])).toEqual([])
  expect(reject(['foo', 'bar', 'baz', 'qux'], [0, 4])).toEqual(['bar', 'baz', 'qux'])
})

test('getObjectValueByPath', () => {
  expect(getObjectValueByPath({}, 'a.b.c')).toBe(undefined)
  expect(getObjectValueByPath({ foo: { bar: { baz: 'qux' } } }, 'foo.bar.baz')).toBe('qux')
  expect(getObjectValueByPath({ foo: { bar: { baz: 'qux' } } }, 'foo.bar')).toEqual({ baz: 'qux' })
  expect(getObjectValueByPath({ foo: { bar: { baz: 'qux' } } }, 'foo')).toEqual({ bar: { baz: 'qux' } })
  expect(getObjectValueByPath({ foo: 'bar' }, 'foo')).toBe('bar')
  expect(getObjectValueByPath({ foo: 'bar' }, 'bar')).toBe(undefined)
})

test('stringToBoolean', () => {
  expect(stringToBoolean('true')).toBe(true)
  expect(stringToBoolean('false')).toBe(false)
  expect(stringToBoolean('TRUE')).toBe(true)
  expect(stringToBoolean('FALSE')).toBe(false)
  expect(stringToBoolean('True')).toBe(true)
  // note: whitespace is matched by regex but not trimmed before comparison
  expect(stringToBoolean(' true ')).toBe(false)
  expect(stringToBoolean('foo')).toBe(undefined)
  expect(stringToBoolean('1')).toBe(undefined)
  expect(stringToBoolean('')).toBe(undefined)
})

test('stringToArray', () => {
  expect(stringToArray('[1, 2, 3]')).toEqual([1, 2, 3])
  expect(stringToArray('["a", "b"]')).toEqual(['a', 'b'])
  expect(stringToArray('[]')).toEqual([])
  expect(stringToArray('foo')).toBe(undefined)
  expect(stringToArray('1')).toBe(undefined)
  expect(stringToArray('{"foo": "bar"}')).toBe(undefined)
  expect(stringToArray('[invalid')).toBe(undefined)
})

test('stringToObject', () => {
  expect(stringToObject('{"foo": "bar"}')).toEqual({ foo: 'bar' })
  expect(stringToObject('{"a": 1, "b": 2}')).toEqual({ a: 1, b: 2 })
  expect(stringToObject('{}')).toEqual({})
  expect(stringToObject('foo')).toBe(undefined)
  expect(stringToObject('1')).toBe(undefined)
  expect(stringToObject('[1, 2, 3]')).toBe(undefined)
  expect(stringToObject('{invalid')).toBe(undefined)
})

test('hasOwnProperties', () => {
  const obj = { foo: 1, bar: 2, baz: 3 }
  expect(hasOwnProperties(obj, ['foo', 'bar'])).toBe(true)
  expect(hasOwnProperties(obj, ['foo', 'bar', 'baz'])).toBe(true)
  expect(hasOwnProperties(obj, ['foo', 'qux'])).toBe(false)
  expect(hasOwnProperties(obj, 'foo')).toBe(true)
  expect(hasOwnProperties(obj, 'qux')).toBe(false)
})

test('basicUID', () => {
  const uid = basicUID()
  expect(typeof uid).toBe('string')
  expect(uid).toMatch(/^[0-9a-f]+-[0-9a-f]+$/)

  // two calls produce different values
  expect(basicUID()).not.toBe(basicUID())
})

test('generateUUID', () => {
  const uuid = generateUUID()
  expect(typeof uuid).toBe('string')
  // UUID v4 format: 8-4-4-4-12 hex chars
  expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

  // two calls produce different values
  expect(generateUUID()).not.toBe(generateUUID())
})

test('random', () => {
  const val = random()
  expect(typeof val).toBe('number')
  expect(val).toBeGreaterThanOrEqual(0)
  expect(val).toBeLessThanOrEqual(1)
})
