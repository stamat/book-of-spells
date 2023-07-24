require = require('esm')(module)
const { parseAttributes } = require('../parsers')

test('parseAttributes', () => {
  expect(parseAttributes('shortcode foo="bar"')).toEqual({"foo": "bar", "shortcode": null})
  expect(parseAttributes('foo="bar" baz="qux"')).toEqual({ foo: 'bar', baz: 'qux' })
  expect(parseAttributes("button text=\"Click me\" data='{\"key\": \"value\"}' class=\"btn btn-primary\"")).toEqual({ button: null, text: 'Click me', data: '{"key": "value"}', class: 'btn btn-primary' })
  expect(parseAttributes("text=\"Click me\" data='{\"key\": \"value\"}' class=\"btn btn-primary\"")).toEqual({ text: 'Click me', data: '{"key": "value"}', class: 'btn btn-primary' })
})
