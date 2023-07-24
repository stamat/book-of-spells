require = require('esm')(module)
const { isEmptyElement} = require('../dom')

document.body.innerHTML = `
  <div id="foo"></div>
  <div id="bar">foo</div>
  <div id="baz"><br></div>
`

const foo = document.getElementById('foo')
const bar = document.getElementById('bar')
const baz = document.getElementById('baz')

test('isEmptyElement', () => {
  expect(isEmptyElement(foo)).toBe(true)
  expect(isEmptyElement(bar)).toBe(false)
  expect(isEmptyElement(baz)).toBe(false)
})
