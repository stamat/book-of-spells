import { jest } from '@jest/globals'
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
  humanize,
  removeAccents,
  matchesSearch,
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
  random,
  deepEqual,
  dedupe,
  DeepSet,
  waitFor
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

// clone — deep copy of data, paired with deepEqual: whatever deepEqual reads
// as data, clone reproduces, so deepEqual(clone(x), x) holds.
// Covered: plain and null-prototype objects, class instances (prototype
// kept), arrays including holes and subclasses, Date, RegExp with lastIndex,
// Map, Set, Error with its non-enumerable message and stack, boxed
// primitives, ArrayBuffer, DataView, typed arrays sharing one buffer, symbol
// keys, cycles and repeated references (the graph shape survives).
// Deliberately not: anything clone does not recognise — functions, DOM
// nodes, Promise, WeakMap/WeakSet, SharedArrayBuffer — which is shared by
// reference rather than half-copied, so clone never throws where
// structuredClone raises DataCloneError. Also not: non-enumerable properties
// (dropped, Error's message and stack the one exception), accessors (read
// once and copied as data, as structuredClone reads them), and own
// properties hung on a boxed primitive.

test('clone: a nested structure is copied all the way down, sharing nothing', () => {
  const testA = clone(a)
  const testB = clone(b)

  expect(testA === a).toBe(false)
  expect(testB === b).toBe(false)
  expect(testA).toEqual(a)
  expect(testB).toEqual(b)
  expect(testA.baz === a.baz).toBe(false)
  expect(testA.baz[0].c === a.baz[0].c).toBe(false)
})

test('clone: primitives, including symbols, come back as themselves', () => {
  const sym = Symbol('s')
  expect(clone(1)).toBe(1)
  expect(clone('a')).toBe('a')
  expect(clone(null)).toBe(null)
  expect(clone(undefined)).toBe(undefined)
  expect(clone(NaN)).toBe(NaN)
  expect(clone(sym)).toBe(sym)
  expect(clone(10n)).toBe(10n)
})

test('clone: a Date keeps its instant instead of collapsing to an empty object', () => {
  const d = new Date('2020-01-01T00:00:00.000Z')
  const c = clone(d)
  expect(c).toBeInstanceOf(Date)
  expect(c === d).toBe(false)
  expect(c.getTime()).toBe(d.getTime())
  expect(clone(new Date(NaN)).getTime()).toBe(NaN)
})

test('clone: a RegExp keeps its source, flags and lastIndex', () => {
  const r = /ab+c/gi
  r.lastIndex = 3
  const c = clone(r)
  expect(c === r).toBe(false)
  expect(c.source).toBe('ab+c')
  expect(c.flags).toBe('gi')
  expect(c.lastIndex).toBe(3)
})

test('clone: a Map and a Set copy their members, not just their shell', () => {
  const key = { id: 1 }
  const m = new Map([[key, { v: 1 }], ['x', [1, 2]]])
  const c = clone(m)
  expect(c).toBeInstanceOf(Map)
  expect(c.size).toBe(2)
  expect(deepEqual(c, m)).toBe(true)
  expect(c.get('x') === m.get('x')).toBe(false)
  // the key is data too — cloned, so the original key no longer indexes it
  expect(c.has(key)).toBe(false)

  const s = new Set([{ v: 1 }, 2])
  const cs = clone(s)
  expect(cs).toBeInstanceOf(Set)
  expect(deepEqual(cs, s)).toBe(true)
  expect([...cs][0] === [...s][0]).toBe(false)
})

test('clone: an Error keeps its type, message and stack', () => {
  const e = new TypeError('bad input')
  e.code = 'ERR_BAD'
  const c = clone(e)
  expect(c).toBeInstanceOf(TypeError)
  expect(c === e).toBe(false)
  expect(c.message).toBe('bad input')
  expect(c.stack).toBe(e.stack)
  expect(c.code).toBe('ERR_BAD')
  // message and stack stay non-enumerable, or the clone would carry two
  // keys the original never showed
  expect(Object.keys(c)).toEqual(['code'])
})

test('clone: typed arrays copy their bytes, and views over one buffer stay views over one buffer', () => {
  const t = new Uint8Array([1, 2, 3])
  const c = clone(t)
  expect(c).toBeInstanceOf(Uint8Array)
  expect(c.buffer === t.buffer).toBe(false)
  expect([...c]).toEqual([1, 2, 3])
  c[0] = 9
  expect(t[0]).toBe(1)

  const buf = new ArrayBuffer(8)
  const pair = { a: new Uint8Array(buf), b: new Uint16Array(buf) }
  const cp = clone(pair)
  expect(cp.a.buffer === cp.b.buffer).toBe(true)
  expect(cp.a.buffer === buf).toBe(false)

  const dv = new DataView(buf, 2, 4)
  const cdv = clone(dv)
  expect(cdv).toBeInstanceOf(DataView)
  expect(cdv.byteOffset).toBe(2)
  expect(cdv.byteLength).toBe(4)

  const ab = new ArrayBuffer(4)
  new Uint8Array(ab)[0] = 7
  const cab = clone(ab)
  expect(cab === ab).toBe(false)
  expect(new Uint8Array(cab)[0]).toBe(7)
})

test('clone: boxed primitives keep their value', () => {
  const n = clone(new Number(5))
  expect(typeof n).toBe('object')
  expect(n.valueOf()).toBe(5)
  expect(clone(new String('ab')).valueOf()).toBe('ab')
  expect(clone(new Boolean(true)).valueOf()).toBe(true)
})

test('clone: a class instance stays an instance of its class, methods and all', () => {
  class Point {
    constructor(x) { this.x = x }
    double() { return this.x * 2 }
  }
  const c = clone(new Point(3))
  expect(c).toBeInstanceOf(Point)
  expect(c.double()).toBe(6)

  class List extends Array {}
  const l = List.from([1, 2])
  const cl = clone(l)
  expect(cl).toBeInstanceOf(List)
  expect([...cl]).toEqual([1, 2])
})

test('clone: a null-prototype object does not gain Object.prototype', () => {
  const o = Object.create(null)
  o.a = 1
  const c = clone(o)
  expect(Object.getPrototypeOf(c)).toBe(null)
  expect(c.a).toBe(1)
})

test('clone: array holes stay holes and extra properties on an array survive', () => {
  const arr = [1, , 3]
  arr.note = 'x'
  const c = clone(arr)
  expect(c.length).toBe(3)
  expect(1 in c).toBe(false)
  expect(c.note).toBe('x')
})

test('clone: own enumerable symbol keys are copied, inherited and non-enumerable ones are not', () => {
  const sym = Symbol('k')
  const hidden = Symbol('h')
  const o = { [sym]: { deep: 1 } }
  Object.defineProperty(o, hidden, { value: 1, enumerable: false })
  Object.defineProperty(o, 'quiet', { value: 1, enumerable: false })
  const c = clone(o)
  expect(c[sym]).toEqual({ deep: 1 })
  expect(c[sym] === o[sym]).toBe(false)
  expect(hidden in c).toBe(false)
  expect('quiet' in c).toBe(false)
})

test('clone: a cycle terminates, and a repeated reference stays one object in the copy', () => {
  const cyclic = { name: 'root' }
  cyclic.self = cyclic
  cyclic.list = [cyclic]
  const c = clone(cyclic)
  expect(c === cyclic).toBe(false)
  expect(c.self).toBe(c)
  expect(c.list[0]).toBe(c)

  const shared = { v: 1 }
  const graph = clone({ a: shared, b: shared })
  expect(graph.a).toBe(graph.b)
  expect(graph.a === shared).toBe(false)
})

test('clone: what it cannot copy is shared by reference, never a throw and never a broken half-copy', () => {
  const fn = () => 1
  const promise = Promise.resolve(1)
  const weak = new WeakMap()
  const node = document.createElement('div')
  const o = { fn, promise, weak, node, data: [1] }

  const c = clone(o)
  expect(c.fn).toBe(fn)
  expect(c.promise).toBe(promise)
  expect(c.weak).toBe(weak)
  expect(c.node).toBe(node)
  expect(c.data === o.data).toBe(false)
  // the case that makes clone worth having: structuredClone cannot do this
  expect(() => structuredClone(o)).toThrow()
})

test('clone: whatever deepEqual reads as data, clone reproduces', () => {
  const sym = Symbol('s')
  const buf = new ArrayBuffer(4)
  const value = {
    n: 1, s: 'x', nan: NaN, nil: null, un: undefined,
    d: new Date(5), r: /x/g,
    m: new Map([[{ k: 1 }, [1, 2]]]),
    set: new Set([{ v: 1 }]),
    arr: [1, [2, [3]]],
    typed: new Uint8Array(buf),
    view: new DataView(buf),
    boxed: new Number(3),
    err: new RangeError('nope'),
    [sym]: 'symbol value'
  }
  value.self = value

  expect(deepEqual(clone(value), value)).toBe(true)
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
  expect(isEmptyObject(Object.create({ inherited: 'yes' }))).toBe(true)
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
  expect(stringToPrimitive('0')).toBe(0)
  expect(stringToPrimitive('null')).toBe(null)
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
  expect(stringToType('0')).toBe(0)
  expect(stringToType('null')).toBe(null)
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
  expect(removeAccents('Œ')).toBe('OE')
  expect(removeAccents('æ')).toBe('ae')
  expect(removeAccents('Æ')).toBe('AE')
  expect(removeAccents('ß')).toBe('ss')
  expect(removeAccents('Straße')).toBe('Strasse')
  expect(removeAccents('ﬀ')).toBe('ff')
  expect(removeAccents('ﬁ')).toBe('fi')
  expect(removeAccents('ﬂ')).toBe('fl')
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

test('a slug keeps the stroked letters instead of dropping them on the floor', () => {
  // Before `removeAccents` mapped the strokes, `đ` and `ł` came through it intact — there is
  // no combining mark on them to strip — and the `[^\w0-9-]` pass that follows deleted them
  // outright, so the letter vanished from the URL instead of losing its stroke.
  expect(slugify('Đorđe Balašević')).toBe('dorde-balasevic')
  expect(slugify('Łódź')).toBe('lodz')
  expect(slugify('Nørrebro')).toBe('norrebro')
})

test('humanize', () => {
  expect(humanize('foo-bar')).toBe('Foo Bar')
  expect(humanize('foo_bar-baz')).toBe('Foo Bar Baz')
  expect(humanize('  foo--bar  ')).toBe('Foo Bar')
  expect(humanize('foo')).toBe('Foo')
  expect(humanize('foo-bar', 'sentence')).toBe('Foo bar')
  expect(humanize('foo-bar', 'upper')).toBe('FOO BAR')
  expect(humanize('Foo-Bar', 'lower')).toBe('foo bar')
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

test('randomIntInclusive stays in range at random() boundaries', () => {
  const original = crypto.getRandomValues.bind(crypto)

  // random() returns 0 → should give min
  crypto.getRandomValues = (arr) => { arr[0] = 0; return arr }
  expect(randomIntInclusive(1, 10, true)).toBe(1)

  // random() returns max uint32 → should give max, not max+1
  crypto.getRandomValues = (arr) => { arr[0] = 4294967295; return arr }
  expect(randomIntInclusive(1, 10, true)).toBe(10)

  crypto.getRandomValues = original
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
  expect(percentage(0, 10)).toBe(0)
  expect(percentage(NaN, 10)).toBe(0)
  expect(percentage(10, NaN)).toBe(0)
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
  expect(stringToBoolean(' true ')).toBe(true)
  expect(stringToBoolean(' false ')).toBe(false)
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

test('random returns [0, 1) range at boundaries', () => {
  const original = crypto.getRandomValues.bind(crypto)

  // simulate min return (0)
  crypto.getRandomValues = (arr) => { arr[0] = 0; return arr }
  expect(random()).toBe(0)

  // simulate max return (2^32 - 1)
  crypto.getRandomValues = (arr) => { arr[0] = 4_294_967_295; return arr }
  expect(random()).toBeGreaterThan(0.999)
  expect(random()).toBeLessThan(1)

  crypto.getRandomValues = original
})

test('reject array handles unsorted and duplicate indexes', () => {
  expect(reject(['foo', 'bar', 'baz'], [2, 0])).toEqual(['bar'])
  expect(reject(['foo', 'bar', 'baz', 'qux'], [3, 1, 0])).toEqual(['baz'])
  expect(reject(['foo', 'bar', 'baz'], [0, 0, 2])).toEqual(['bar'])
})

test('merge functions do not pollute prototypes', () => {
  const payload = JSON.parse('{"__proto__": {"polluted": "yes"}, "constructor": {"bad": true}, "safe": 1}')

  const deepTarget = {}
  deepMerge(deepTarget, payload)
  expect({}.polluted).toBe(undefined)
  expect(deepTarget.safe).toBe(1)

  const shallowTarget = {}
  shallowMerge(shallowTarget, payload)
  expect({}.polluted).toBe(undefined)
  expect(Object.getPrototypeOf(shallowTarget)).toBe(Object.prototype)
  expect(shallowTarget.safe).toBe(1)
})

test('randomIntInclusive returns an integer when min equals max', () => {
  expect(randomIntInclusive(1.4, 1.4)).toBe(1)
  expect(randomIntInclusive(2, 2)).toBe(2)
})

test('random and generateUUID fall back when crypto lacks methods', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto')
  Object.defineProperty(globalThis, 'crypto', { value: {}, configurable: true })

  const r = random()
  expect(r).toBeGreaterThanOrEqual(0)
  expect(r).toBeLessThan(1)

  const uuid = generateUUID()
  expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)

  Object.defineProperty(globalThis, 'crypto', descriptor)
})

// deepEqual — structural (data) equality.
// Covered: primitives under SameValueZero (NaN equals itself, 0 equals -0),
// property-order independence, nesting, Date, RegExp, boxed primitives
// (boxed symbols unwrap and equal by reference, like their primitives),
// Map/Set regardless of insertion order (NaN keys included, and a Map value
// mismatch on a shared key re-pairs through a distinct deep-equal key),
// typed arrays, ArrayBuffer and SharedArrayBuffer, symbol keys, cyclic
// structures, Date/Array subclasses, transparent Proxies, and cross-realm
// values via node:vm — dispatch never touches realm-bound constructors.
// Deliberately not: prototype identity (data equality ignores class), sparse
// array holes (read as undefined — JSON has no holes), WeakMap/WeakSet
// contents (unobservable, so never equal), Promise (no special case — own
// enumerable properties only). Host objects with a custom toString (URL,
// Error and kin) compare by that string form gating an own-property walk,
// so an Error's assigned .code counts too.

test('deepEqual: primitives compare by value, never by coercion', () => {
  expect(deepEqual(1, 1)).toBe(true)
  expect(deepEqual(1, '1')).toBe(false)
  expect(deepEqual('a', 'a')).toBe(true)
  expect(deepEqual(true, 1)).toBe(false)
  expect(deepEqual(null, null)).toBe(true)
  expect(deepEqual(null, undefined)).toBe(false)
  expect(deepEqual(undefined, undefined)).toBe(true)
})

test('deepEqual: NaN equals NaN and 0 equals -0 — SameValueZero, not strict equality', () => {
  expect(deepEqual(NaN, NaN)).toBe(true)
  expect(deepEqual(0, -0)).toBe(true)
  expect(deepEqual([NaN], [NaN])).toBe(true)
})

test('deepEqual: property order does not matter', () => {
  expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
})

test('deepEqual: a missing property and one set to undefined are different objects', () => {
  expect(deepEqual({ a: undefined }, {})).toBe(false)
})

test('deepEqual: nested objects and arrays compare all the way down', () => {
  const x = { a: [1, { b: 'c', d: [2, 3] }], e: { f: null } }
  const y = { e: { f: null }, a: [1, { d: [2, 3], b: 'c' }] }
  expect(deepEqual(x, y)).toBe(true)
  y.a[1].d[1] = 4
  expect(deepEqual(x, y)).toBe(false)
})

test('deepEqual: arrays are ordered — same members in a different order are not equal', () => {
  expect(deepEqual([1, 2], [1, 2])).toBe(true)
  expect(deepEqual([1, 2], [2, 1])).toBe(false)
  expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
})

test('deepEqual: an array and an object are never equal', () => {
  expect(deepEqual([], {})).toBe(false)
})

test('deepEqual: dates compare by instant, and invalid dates equal each other', () => {
  expect(deepEqual(new Date(5), new Date(5))).toBe(true)
  expect(deepEqual(new Date(5), new Date(6))).toBe(false)
  expect(deepEqual(new Date(NaN), new Date(NaN))).toBe(true)
})

test('deepEqual: regexes compare by source and flags', () => {
  expect(deepEqual(/a+b/g, /a+b/g)).toBe(true)
  expect(deepEqual(/a+b/g, /a+b/i)).toBe(false)
  expect(deepEqual(/a+b/g, /a+c/g)).toBe(false)
})

test('deepEqual: functions are not data — only the same reference is equal', () => {
  const f = () => 1
  const g = () => 1
  expect(deepEqual(f, f)).toBe(true)
  expect(deepEqual(f, g)).toBe(false)
})

test('deepEqual: a boxed primitive equals a boxed primitive, never the bare value', () => {
  expect(deepEqual(Object(1), Object(1))).toBe(true)
  expect(deepEqual(Object(1), 1)).toBe(false)
  expect(deepEqual(Object('a'), Object('a'))).toBe(true)
})

test('deepEqual: maps equal regardless of insertion order, keys matched deeply', () => {
  expect(deepEqual(new Map([[1, 'a'], [2, 'b']]), new Map([[2, 'b'], [1, 'a']]))).toBe(true)
  expect(deepEqual(new Map([[{ x: 1 }, 'a']]), new Map([[{ x: 1 }, 'a']]))).toBe(true)
  expect(deepEqual(new Map([[1, 'a']]), new Map([[1, 'b']]))).toBe(false)
  expect(deepEqual(new Map([[1, 'a']]), new Map([[1, 'a'], [2, 'b']]))).toBe(false)
})

test('deepEqual: a Map value mismatch on a shared key is not a verdict — a distinct deep-equal key may carry the matching value', () => {
  const shared = { x: 1 }
  expect(deepEqual(
    new Map([[shared, 1], [{ x: 1 }, 2]]),
    new Map([[shared, 2], [{ x: 1 }, 1]])
  )).toBe(true)
  expect(deepEqual(
    new Map([[shared, 1], [{ x: 1 }, 2]]),
    new Map([[shared, 2], [{ x: 1 }, 3]])
  )).toBe(false)
  // primitive keys cannot re-pair — their value mismatch stays final
  expect(deepEqual(new Map([[1, 'a']]), new Map([[1, 'b']]))).toBe(false)
})

test('deepEqual: sets equal regardless of order, members matched deeply', () => {
  expect(deepEqual(new Set([1, 2, 3]), new Set([3, 2, 1]))).toBe(true)
  expect(deepEqual(new Set([{ x: 1 }]), new Set([{ x: 1 }]))).toBe(true)
  expect(deepEqual(new Set([{ x: 1 }]), new Set([{ x: 2 }]))).toBe(false)
})

test('deepEqual: typed arrays compare element by element, NaN included', () => {
  expect(deepEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true)
  expect(deepEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false)
  expect(deepEqual(new Float64Array([NaN]), new Float64Array([NaN]))).toBe(true)
  expect(deepEqual(new Uint8Array([1]), new Int8Array([1]))).toBe(false)
})

test('deepEqual: array buffers compare by byte', () => {
  expect(deepEqual(new Uint8Array([1, 2]).buffer, new Uint8Array([1, 2]).buffer)).toBe(true)
  expect(deepEqual(new Uint8Array([1, 2]).buffer, new Uint8Array([1, 3]).buffer)).toBe(false)
})

test('deepEqual: shared array buffers compare by byte, not as two empty objects', () => {
  const make = (byte) => {
    const sab = new SharedArrayBuffer(4)
    new Uint8Array(sab)[0] = byte
    return sab
  }
  expect(deepEqual(make(1), make(1))).toBe(true)
  expect(deepEqual(make(1), make(99))).toBe(false)
})

test('deepEqual: symbol keys count toward equality', () => {
  const s = Symbol('k')
  expect(deepEqual({ [s]: 1 }, { [s]: 1 })).toBe(true)
  expect(deepEqual({ [s]: 1 }, { [s]: 2 })).toBe(false)
  expect(deepEqual({ [s]: 1 }, {})).toBe(false)
})

test('deepEqual: a cycle terminates instead of overflowing the stack', () => {
  const x = { v: 1 }
  x.self = x
  const y = { v: 1 }
  y.self = y
  expect(deepEqual(x, y)).toBe(true)

  const z = { self: null, v: 2 }
  z.self = z
  expect(deepEqual(x, z)).toBe(false)

  const p = []
  p.push(p)
  const q = []
  q.push(q)
  expect(deepEqual(p, q)).toBe(true)
})

test('deepEqual: prototype identity is ignored — data is data', () => {
  expect(deepEqual(Object.assign(Object.create(null), { a: 1 }), { a: 1 })).toBe(true)
  class Point { constructor () { this.a = 1 } }
  expect(deepEqual(new Point(), { a: 1 })).toBe(true)
})

test('deepEqual: weak collections cannot be inspected, so only the same reference is equal', () => {
  const w = new WeakMap()
  expect(deepEqual(w, w)).toBe(true)
  expect(deepEqual(new WeakMap(), new WeakMap())).toBe(false)
  expect(deepEqual(new WeakSet(), new WeakSet())).toBe(false)
})

test('deepEqual: URLs compare by href, not by their empty own properties', () => {
  expect(deepEqual(new URL('http://a.com/'), new URL('http://a.com/'))).toBe(true)
  expect(deepEqual(new URL('http://a.com/'), new URL('http://b.com/'))).toBe(false)
})

test('deepEqual: errors compare by their message, not by empty own properties', () => {
  expect(deepEqual(new Error('a'), new Error('a'))).toBe(true)
  expect(deepEqual(new Error('a'), new Error('b'))).toBe(false)
})

test('deepEqual: an error carries data beyond its message — an assigned .code counts', () => {
  const make = (code) => {
    const e = new Error('x')
    e.code = code
    return e
  }
  expect(deepEqual(make('ENOENT'), make('ENOENT'))).toBe(true)
  expect(deepEqual(make('ENOENT'), make('EACCES'))).toBe(false)
})

test('deepEqual: boxing a symbol does not make two distinct symbols equal', () => {
  const s = Symbol('a')
  expect(deepEqual(Object(s), Object(s))).toBe(true)
  expect(deepEqual(Object(Symbol('a')), Object(Symbol('a')))).toBe(false)
})

test('deepEqual: NaN works as a Map key', () => {
  expect(deepEqual(new Map([[NaN, 'a']]), new Map([[NaN, 'a']]))).toBe(true)
  expect(deepEqual(new Map([[NaN, 'a']]), new Map([[NaN, 'b']]))).toBe(false)
})

test('deepEqual: an array hole equals an explicit undefined — JSON has no holes', () => {
  expect(deepEqual([, 1], [undefined, 1])).toBe(true)
})

test('deepEqual: -0 nested in an object equals 0', () => {
  expect(deepEqual({ x: -0 }, { x: 0 })).toBe(true)
})

test('deepEqual: Date and Array subclasses equal their plain counterparts', () => {
  class D extends Date {}
  class Arr extends Array {}
  expect(deepEqual(new D(5), new Date(5))).toBe(true)
  expect(deepEqual(Arr.from([1, 2]), [1, 2])).toBe(true)
})

test('deepEqual: a transparent Proxy equals a twin of its target', () => {
  expect(deepEqual(new Proxy({ a: 1 }, {}), { a: 1 })).toBe(true)
})

test('deepEqual: values built in another realm equal their local twins', async () => {
  const vm = await import('node:vm')
  expect(deepEqual(vm.runInNewContext('({a: 1, b: [1, 2]})'), { a: 1, b: [1, 2] })).toBe(true)
  expect(deepEqual(vm.runInNewContext('[1, 2, 3]'), [1, 2, 3])).toBe(true)
  expect(deepEqual(vm.runInNewContext('[1, 2, 3]'), [1, 2, 4])).toBe(false)
})

// dedupe — structural dedup of an array, deepEqual deciding what a duplicate is.
// Covered: deep duplicates regardless of property order, first-occurrence
// identity, input left untouched, SameValueZero primitives (NaN, -0), mixed
// types staying apart, hash-coarse values that share a bucket yet must not
// merge (Errors), values only deepEqual can equate across shapes (class
// instance vs plain twin, Sets in a different insertion order), cyclic
// structures, and symbol-keyed near-twins only deepEqual can split.
// Deliberately not: non-array input (the natural TypeError is the answer) and
// scale — the linear-vs-quadratic claim lives in the changelog benchmark,
// asserting it here would buy CI time and no spec.

test('dedupe: deep-equal objects collapse to one, property order ignored', () => {
  const out = dedupe([{ a: 1, b: { c: [1, 2] } }, { b: { c: [1, 2] }, a: 1 }, { a: 1, b: { c: [1, 3] } }])
  expect(out).toEqual([{ a: 1, b: { c: [1, 2] } }, { a: 1, b: { c: [1, 3] } }])
})

test('dedupe: the first occurrence is the one kept, by reference', () => {
  const first = { a: 1 }
  const out = dedupe([first, { a: 1 }])
  expect(out).toHaveLength(1)
  expect(out[0]).toBe(first)
})

test('dedupe: the input array and its elements are left untouched', () => {
  const a = { a: 1 }
  const b = { a: 1 }
  const input = [a, b]
  dedupe(input)
  expect(input).toHaveLength(2)
  expect(input[0]).toBe(a)
  expect(input[1]).toBe(b)
  expect(a).toEqual({ a: 1 })
  expect(b).toEqual({ a: 1 })
})

test('dedupe: a fresh array comes back even when there is nothing to remove', () => {
  const input = [1, 2]
  const out = dedupe(input)
  expect(out).toEqual([1, 2])
  expect(out).not.toBe(input)
  expect(dedupe([])).toEqual([])
})

test('dedupe: NaN is one value and 0 equals -0 — SameValueZero all the way down', () => {
  expect(dedupe([NaN, NaN])).toEqual([NaN])
  expect(dedupe([0, -0])).toHaveLength(1)
  expect(dedupe([[NaN], [NaN]])).toHaveLength(1)
})

test('dedupe: primitives dedupe too, and mixed types never merge', () => {
  expect(dedupe(['a', 'a', null, null, undefined, undefined, true, true])).toEqual(['a', null, undefined, true])
  expect(dedupe([1, '1', [1], { 0: 1 }, true])).toEqual([1, '1', [1], { 0: 1 }, true])
})

test('dedupe: dates dedupe by instant, distinct instants both stay', () => {
  expect(dedupe([new Date(5), new Date(5), new Date(6)])).toHaveLength(2)
})

test('dedupe: sets with the same members in a different insertion order are one value', () => {
  expect(dedupe([new Set([1, 2]), new Set([2, 1]), new Set([1, 3])])).toHaveLength(2)
})

// The fold hashes Set members and Map entries commutatively, so insertion
// order cannot reach the hash. These are the ways that choice could split a
// pair deepEqual calls equal — and a split is a duplicate landing in a fresh
// bucket and surviving, the one thing the fold is never allowed to do.
test('dedupe: sets of deep-equal but distinct members collapse, built in either order', () => {
  const a = new Set([{ id: 1 }, { id: 2 }])
  const b = new Set([{ id: 2 }, { id: 1 }])
  expect(dedupe([a, b])).toHaveLength(1)
})

test('dedupe: a set holding two members equal to each other is not the set holding one', () => {
  const twins = () => new Set([{ id: 1 }, { id: 1 }])
  expect(dedupe([twins(), twins()])).toHaveLength(1)
  expect(dedupe([twins(), new Set([{ id: 1 }])])).toHaveLength(2)
})

test('dedupe: maps whose equal keys pair up crosswise are still one value', () => {
  const a = new Map([[{ k: 1 }, 'x'], [{ k: 1 }, 'y']])
  const b = new Map([[{ k: 1 }, 'y'], [{ k: 1 }, 'x']])
  expect(deepEqual(a, b)).toBe(true)
  expect(dedupe([a, b])).toHaveLength(1)
})

test('dedupe: a map with its key and value swapped is a different value', () => {
  expect(dedupe([new Map([['a', 'b']]), new Map([['b', 'a']])])).toHaveLength(2)
})

test('dedupe: a class instance and its plain twin are one value — data is data', () => {
  class Point { constructor () { this.x = 1 } }
  expect(dedupe([new Point(), { x: 1 }])).toHaveLength(1)
})

test('dedupe: errors share a coarse bucket but only equal messages merge', () => {
  expect(dedupe([new Error('a'), new Error('b')])).toHaveLength(2)
  expect(dedupe([new Error('a'), new Error('a')])).toHaveLength(1)
})

test('dedupe: cyclic structures terminate and equal cycles collapse', () => {
  const x = {}
  x.self = x
  const y = {}
  y.self = y
  expect(dedupe([x, y])).toHaveLength(1)
})

test('dedupe: twins that differ only in a symbol-keyed value both stay', () => {
  const s = Symbol('s')
  expect(dedupe([{ k: 1, [s]: 1 }, { k: 1, [s]: 2 }])).toHaveLength(2)
})

// DeepSet — membership by structure, the bucket-then-verify pass dedupe makes
// internally, kept instead of thrown away.
// Covered: has() answering for a value never inserted, add() refusing a
// structural duplicate while keeping the first reference, insertion order and
// exact values surviving iteration (-0 included, which a native Set would
// normalise), the constructor taking any iterable or nothing, dedupe agreeing
// with it value for value, delete and clear taking values back out, and the
// two refusals the class documents — a mutated member becoming unfindable, and
// two DeepSets never being deepEqual.
// Deliberately not: scale, which bench/dedupe/membership.bench.mjs owns;
// delete's cost, which is a documented O(n) and not a behaviour a test can
// pin; and the fold's own behaviour, which the dedupe cases above already pin,
// since both call the same one.

test('DeepSet: a value never inserted is found by an equal one, and an unequal one is not', () => {
  const set = new DeepSet([{ a: 1, b: { c: [1, 2] } }])
  expect(set.has({ b: { c: [1, 2] }, a: 1 })).toBe(true)
  expect(set.has({ a: 1, b: { c: [1, 3] } })).toBe(false)
  expect(set.has({ a: 1 })).toBe(false)
})

test('DeepSet: adding a structural duplicate changes nothing and keeps the first reference', () => {
  const first = { a: 1 }
  const set = new DeepSet([first])
  expect(set.add({ a: 1 }).size).toBe(1)
  expect([...set][0]).toBe(first)
})

test('DeepSet: add returns the set, so calls chain', () => {
  const set = new DeepSet()
  expect(set.add({ a: 1 }).add({ a: 2 }).add({ a: 1 }).size).toBe(2)
})

test('DeepSet: iteration is insertion order, and values come back exactly as given', () => {
  expect([...new DeepSet([{ a: 3 }, { a: 1 }, { a: 2 }])]).toEqual([{ a: 3 }, { a: 1 }, { a: 2 }])
  // a native Set would hand back 0 here, which is a value the caller never passed in
  expect(Object.is([...new DeepSet([-0])][0], -0)).toBe(true)
})

test('DeepSet: the constructor takes any iterable, or nothing at all', () => {
  expect(new DeepSet().size).toBe(0)
  expect(new DeepSet(undefined).size).toBe(0)
  expect(new DeepSet(null).size).toBe(0)
  expect([...new DeepSet('aab')]).toEqual(['a', 'b'])
  expect(new DeepSet(new Set([{ a: 1 }, { a: 1 }])).size).toBe(1)
})

test('DeepSet: SameValueZero values behave as dedupe already promises', () => {
  expect(new DeepSet([NaN]).has(NaN)).toBe(true)
  expect(new DeepSet([undefined]).has(undefined)).toBe(true)
  expect(new DeepSet([0]).has(-0)).toBe(true)
  expect(new DeepSet([new Set([1, 2])]).has(new Set([2, 1]))).toBe(true)
})

test('DeepSet: dedupe is this set spread, value for value', () => {
  const input = [{ a: 1, b: 2 }, { b: 2, a: 1 }, new Date(5), new Date(5), NaN, NaN, { c: 3 }]
  expect(dedupe(input)).toEqual([...new DeepSet(input)])
})

test('DeepSet: delete takes a value out by structure, and says whether it took one', () => {
  const set = new DeepSet([{ a: 1 }, { b: 2 }])
  expect(set.delete({ a: 1 })).toBe(true)
  expect(set.has({ a: 1 })).toBe(false)
  expect(set.size).toBe(1)
  expect(set.delete({ a: 1 })).toBe(false)
  expect(set.delete({ nothing: 'like this was ever in here' })).toBe(false)
  expect(set.size).toBe(1)
})

test('DeepSet: what survives a delete keeps its order, and a re-add goes to the back', () => {
  const set = new DeepSet([{ a: 1 }, { a: 2 }, { a: 3 }])
  set.delete({ a: 1 })
  expect([...set]).toEqual([{ a: 2 }, { a: 3 }])
  set.add({ a: 1 })
  expect([...set]).toEqual([{ a: 2 }, { a: 3 }, { a: 1 }])
})

test('DeepSet: deleting a NaN removes the NaN and not whatever sits at the end', () => {
  // indexOf never finds a NaN, and the -1 it answers with would splice the last
  // value out instead — the bug this test exists to keep out
  const set = new DeepSet([NaN, { a: 1 }])
  expect(set.delete(NaN)).toBe(true)
  expect([...set]).toEqual([{ a: 1 }])
})

test('DeepSet: delete matches -0 against 0, exactly as has and add already do', () => {
  const set = new DeepSet([-0])
  expect(set.delete(0)).toBe(true)
  expect(set.size).toBe(0)
})

test('DeepSet: a member mutated after it goes in cannot be deleted either', () => {
  const value = { a: 1 }
  const set = new DeepSet([value])
  value.a = 2
  expect(set.delete(value)).toBe(false)
  expect(set.size).toBe(1)
})

test('DeepSet: clear empties it and leaves it usable', () => {
  const set = new DeepSet([{ a: 1 }, { b: 2 }])
  expect(set.clear()).toBeUndefined()
  expect(set.size).toBe(0)
  expect([...set]).toEqual([])
  expect(set.has({ a: 1 })).toBe(false)
  // the index went with the values, so this is a first occurrence again
  expect(set.add({ a: 1 }).size).toBe(1)
  expect(set.has({ a: 1 })).toBe(true)
})

test('DeepSet: a member mutated after it goes in becomes unfindable, by structure and by reference', () => {
  const value = { a: 1 }
  const set = new DeepSet([value])
  value.a = 2
  expect(set.has({ a: 2 })).toBe(false)
  expect(set.has(value)).toBe(false)
  // still held, still iterable — it is the index that no longer routes to it
  expect(set.size).toBe(1)
  expect([...set][0]).toBe(value)
})

test('DeepSet: two of them are never deepEqual, however alike their contents', () => {
  expect(deepEqual(new DeepSet([1]), new DeepSet([1]))).toBe(false)
  expect(deepEqual(new DeepSet([1]), new DeepSet([2]))).toBe(false)
  // the refusal is what stops the empty-looking walk from calling them equal
  expect(Object.prototype.toString.call(new DeepSet())).toBe('[object DeepSet]')
  // spread them to ask the question deepEqual declines
  expect(deepEqual([...new DeepSet([{ a: 1 }])], [...new DeepSet([{ a: 1 }])])).toBe(true)
})

// Moved here from `<combobox-elemental>`, which is where these were written and where the
// cases came from — a filtering list is the thing that needs them, and there is now more
// than one.

test('a search matches anywhere in the label, not only at its start', () => {
  // "contains" rather than "starts with", because the reader searching a list of cities
  // for "york" wants New York and knows it is not the first word.
  expect(matchesSearch('New York', 'york')).toBe(true)
  expect(matchesSearch('New York', 'new')).toBe(true)
  expect(matchesSearch('New York', 'boston')).toBe(false)
})

test('case is not part of the search', () => {
  expect(matchesSearch('Lemon', 'LEM')).toBe(true)
  expect(matchesSearch('LEMON', 'lem')).toBe(true)
})

test('an empty search matches everything, so an unfiltered list is every label', () => {
  expect(matchesSearch('Lemon', '')).toBe(true)
  expect(matchesSearch('Lemon', '   ')).toBe(true)
})

test('a keyboard without diacritics still finds the words that have them', () => {
  // Typing `sipka` on an English layout has to find `Šipka`, or the search is unusable
  // to exactly the readers whose language needs it.
  expect(matchesSearch('Šipka', 'sipka')).toBe(true)
  expect(matchesSearch('Čačak', 'cacak')).toBe(true)
  expect(matchesSearch('Ćuprija', 'cuprija')).toBe(true)
  expect(matchesSearch('Kraków', 'krakow')).toBe(true)
  expect(matchesSearch('Zürich', 'zurich')).toBe(true)
})

test('the stroked letters lose their stroke, which decomposition alone does not do', () => {
  // `đ`, `ø` and `ł` are single code points with no combining mark to strip, so NFKD
  // leaves them exactly as they were and a search for "dordevic" finds nothing.
  expect(removeAccents('Đorđe')).toBe('Dorde')
  expect(removeAccents('Łódź')).toBe('Lodz')
  expect(removeAccents('Nørrebro')).toBe('Norrebro')
  expect(matchesSearch('Đorđević', 'dordevic')).toBe(true)
  expect(matchesSearch('Nørrebro', 'norrebro')).toBe(true)
})

test('a letter that is two letters wearing one glyph is spelled out', () => {
  // The digraphs come free from NFKD's compatibility decomposition; the ligature letters
  // decompose to nothing and are mapped by hand. Both have to work or a Serbian, Dutch or
  // Icelandic label is unfindable.
  expect(removeAccents('Ǆungla')).toBe('DZungla')
  expect(removeAccents('Ǉubljana')).toBe('LJubljana')
  expect(removeAccents('Ĳsselmeer')).toBe('IJsselmeer')
  expect(removeAccents('Þingvellir')).toBe('THingvellir')
  expect(removeAccents('ﬁreﬂy')).toBe('firefly')
})

test('the capital sharp s spells out like the lower case one', () => {
  // `ß` has spelled out to `ss` since this function was written; `ẞ` came through untouched,
  // so the same word in caps folded differently from the word in lower case.
  expect(removeAccents('Straße')).toBe('Strasse')
  expect(removeAccents('Straẞe')).toBe('StraSSe')
})

test('a letter that is not a decorated letter is left alone', () => {
  // The IPA and Africanist letters are where the fold has to stop: in the texts they appear
  // in, `Ɛ` is not a dressed-up `E` — it is the content, and folding it destroys the word.
  expect(removeAccents('Ɔ Ɛ Ʃ Ʒ ǃ')).toBe('Ɔ Ɛ Ʃ Ʒ ǃ')
})

test('removing the accents leaves the case where it found it', () => {
  // The lower-casing belongs to the caller: a slug wants it, a label rendered back to the
  // reader does not.
  expect(removeAccents('Đorđe Balašević')).toBe('Dorde Balasevic')
  expect(removeAccents('CRÈME BRÛLÉE')).toBe('CREME BRULEE')
})

test('a script with no Latin in it survives the search whole', () => {
  // The reason this is not `slugify`, which is further down the same file and would be the
  // obvious thing to reach for: it is for URLs, so it drops everything outside `[\w0-9-]`
  // and leaves a Cyrillic or CJK label as an empty string — a search box that cannot find
  // Београд on a Serbian site.
  expect(removeAccents('Београд')).toBe('Београд')
  expect(matchesSearch('Београд', 'бео')).toBe(true)
  expect(matchesSearch('北京', '北')).toBe(true)
})

test('a ligature is the letters it stands for', () => {
  expect(matchesSearch('Straße', 'strasse')).toBe(true)
  expect(matchesSearch('Œuvre', 'oeuvre')).toBe(true)
})

test('a diacritic typed in the search is not a reason to miss the word', () => {
  // Both sides are folded, so the reader who does have the layout is not punished for
  // using it.
  expect(matchesSearch('Cacak', 'čačak')).toBe(true)
})

// waitFor: the polling loop, its deadline, and the two ways out of it — abort and a throwing
// condition. Deliberately not covered: that the interval is honoured to the millisecond by a
// real timer, which is the platform's promise and not this function's.
describe('waitFor', () => {
  let clock = 0
  let nowSpy = null

  // Time and timers move together; the deadline is read off the clock, so a test that moved
  // only one would be testing a platform that does not exist.
  const advance = async (ms) => {
    clock += ms
    await jest.advanceTimersByTimeAsync(ms)
  }

  beforeEach(() => {
    jest.useFakeTimers()
    clock = 0
    nowSpy = jest.spyOn(performance, 'now').mockImplementation(() => clock)
  })

  afterEach(() => {
    nowSpy.mockRestore()
    jest.useRealTimers()
  })

  test('a condition already true is answered without waiting for a tick', async () => {
    await expect(waitFor(() => 'ready')).resolves.toBe('ready')
  })

  test('the wait ends with whatever the condition returned, not merely with true', async () => {
    let dataLayer = null
    const waiting = waitFor(() => dataLayer)

    await advance(100)
    dataLayer = ['loaded']
    await advance(100)

    await expect(waiting).resolves.toBe(dataLayer)
  })

  test('the condition is asked again on every interval until it agrees', async () => {
    let calls = 0
    const waiting = waitFor(() => (++calls >= 3 ? 'here' : null), { interval: 50 })

    await advance(100)

    await expect(waiting).resolves.toBe('here')
    expect(calls).toBe(3)
  })

  test('an interval of zero means every tick, not the hundred-millisecond default', async () => {
    let calls = 0
    const waiting = waitFor(() => (++calls >= 5 ? 'now' : null), { interval: 0 })

    // Five milliseconds is four more polls even where the platform clamps a zero delay to a
    // millisecond — the hundred-millisecond default would not have polled even once.
    await advance(5)

    await expect(waiting).resolves.toBe('now')
    expect(calls).toBe(5)
  })

  test('a promise the condition returns is waited on before it counts as an answer', async () => {
    let ready = false
    const waiting = waitFor(async () => ready)

    await advance(100)
    ready = true
    await advance(100)

    await expect(waiting).resolves.toBe(true)
  })

  test('a condition that never comes true gives up at the deadline instead of polling forever', async () => {
    let calls = 0
    const waiting = waitFor(() => { calls++; return false }, { timeout: 500 })
    const rejected = expect(waiting).rejects.toMatchObject({ name: 'TimeoutError' })

    await advance(500)
    await rejected

    const callsAtDeadline = calls
    await advance(5000)
    expect(calls).toBe(callsAtDeadline)
  })

  test('a condition true at the deadline still counts, the last sleep landing on it', async () => {
    // 250ms with a 100ms interval: the third sleep is cut to 50ms so the deadline itself is
    // looked at, rather than overshot and reported as a timeout.
    const waiting = waitFor(() => (clock >= 250 ? 'late' : null), { interval: 100, timeout: 250 })

    await advance(100)
    await advance(100)
    await advance(50)

    await expect(waiting).resolves.toBe('late')
  })

  test('a condition still pending at the deadline is timed out, not waited on', async () => {
    const waiting = waitFor(() => new Promise(() => {}), { timeout: 500 })
    const rejected = expect(waiting).rejects.toMatchObject({ name: 'TimeoutError' })

    await advance(500)
    await rejected
  })

  test('a timeout of zero waits for as long as it takes', async () => {
    let ready = false
    const waiting = waitFor(() => ready, { timeout: 0 })

    await advance(60000)
    ready = 'eventually'
    await advance(100)

    await expect(waiting).resolves.toBe('eventually')
  })

  test('an abort ends the wait and leaves no timer polling behind it', async () => {
    let calls = 0
    const controller = new AbortController()
    const waiting = waitFor(() => { calls++; return false }, { signal: controller.signal, timeout: 0 })
    const rejected = expect(waiting).rejects.toMatchObject({ name: 'AbortError' })

    await advance(100)
    controller.abort()
    await rejected

    const callsAtAbort = calls
    await advance(5000)
    expect(calls).toBe(callsAtAbort)
  })

  test('a signal already aborted never asks the condition at all', async () => {
    let calls = 0
    const controller = new AbortController()
    controller.abort()

    await expect(waitFor(() => { calls++; return true }, { signal: controller.signal }))
      .rejects.toMatchObject({ name: 'AbortError' })
    expect(calls).toBe(0)
  })

  test('a condition that throws fails loud rather than being retried', async () => {
    let calls = 0
    const waiting = waitFor(() => { calls++; throw new Error('the widget exploded') })
    const rejected = expect(waiting).rejects.toThrow('the widget exploded')

    await rejected
    await advance(5000)
    expect(calls).toBe(1)
  })

  test('something that is not a function is a caller bug, reported as one', async () => {
    await expect(waitFor('.widget')).rejects.toThrow(TypeError)
  })
})
