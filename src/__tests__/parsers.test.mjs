import {
  parseAttributes,
  serializeAttributes,
  encodeHtmlEntities,
  decodeHtmlEntities,
  parseUrlParameters,
  serializeUrlParameters,
  parseResolutionString
} from '../parsers.mjs'

import { fixed } from '../helpers.mjs'

test('parseAttributes', () => {
  expect(parseAttributes('shortcode foo="bar"')).toEqual({"foo": "bar", "shortcode": null})
  expect(parseAttributes('foo="bar" baz="qux"')).toEqual({ foo: 'bar', baz: 'qux' })
  expect(parseAttributes("button text=\"Click me\" data='{\"key\": \"value\"}' class=\"btn btn-primary\"")).toEqual({ button: null, text: 'Click me', data: {"key": "value"}, class: 'btn btn-primary' })
  expect(parseAttributes("text=\"Click me\" data='{\"key\": \"value\"}' class=\"btn btn-primary\"")).toEqual({ text: 'Click me', data: {"key": "value"}, class: 'btn btn-primary' })
})

test('serializeAttributes', () => {
  expect(serializeAttributes({ button: null, text: 'Click me', data: {"key": "value"}, class: 'btn btn-primary' })).toBe('button text="Click me" data="{&quot;key&quot;:&quot;value&quot;}" class="btn btn-primary"')
  expect(serializeAttributes({ text: 'Click me', data: {"key": "value"}, class: 'btn btn-primary' })).toBe('text="Click me" data="{&quot;key&quot;:&quot;value&quot;}" class="btn btn-primary"')
})

test('encodeHtmlEntities', () => {
  expect(encodeHtmlEntities('<a href="#">Link</a>')).toBe('&lt;a href=&quot;#&quot;&gt;Link&lt;/a&gt;')
})

test('decodeHtmlEntities', () => {
  expect(decodeHtmlEntities('&lt;a href=&quot;#&quot;&gt;Link&lt;/a&gt;')).toBe('<a href="#">Link</a>')
})

test('parseUrlParameters', () => {
  expect(parseUrlParameters('')).toEqual({})
  expect(parseUrlParameters('test')).toEqual({ test: undefined })
  expect(parseUrlParameters('test&bar')).toEqual({ test: undefined, bar: undefined })
  expect(parseUrlParameters('test&foo=bar&baz=qux')).toEqual({ test: undefined, foo: 'bar', baz: 'qux' })
  expect(parseUrlParameters('test&foo=bar&bar&baz=qux')).toEqual({ test: undefined, foo: 'bar', bar: undefined, baz: 'qux' })
})

test('serializeUrlParameters', () => {
  expect(serializeUrlParameters({})).toBe('')
  expect(serializeUrlParameters({ test: undefined })).toBe('test')
  expect(serializeUrlParameters({ test: undefined, bar: undefined })).toBe('test&bar')
  expect(serializeUrlParameters({ test: undefined, foo: 'bar', baz: 'qux' })).toBe('test&foo=bar&baz=qux')
  expect(serializeUrlParameters({ test: undefined, foo: 'bar', bar: undefined, baz: 'qux' }, true)).toBe('test&foo=bar&bar&baz=qux')
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
