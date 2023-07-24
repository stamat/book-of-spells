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
  stringToPrimitive,
  stringToType,
  stringToBoolean,
  stringToNumber,
  stringToArray,
  stringToObject,
  stringToRegex
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

  console.log(testA)

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
