import { css, isEmptyElement, getTableData } from '../dom.mjs'

document.body.innerHTML = `
  <div id="foo"></div>
  <div id="bar">foo</div>
  <div id="baz"><br></div>
`

const foo = document.getElementById('foo')
const bar = document.getElementById('bar')
const baz = document.getElementById('baz')

test('css', () => {
  const el = document.createElement('div')

  // without transform
  css(el, { color: 'red', fontSize: '16px' })
  expect(el.style.color).toBe('red')
  expect(el.style.fontSize).toBe('16px')

  // with transform (dash-case to camelCase)
  css(el, { 'background-color': 'blue', 'font-weight': 'bold' }, true)
  expect(el.style.backgroundColor).toBe('blue')
  expect(el.style.fontWeight).toBe('bold')

  // null/undefined element does not throw
  expect(() => css(null, { color: 'red' })).not.toThrow()
  expect(() => css(el, null)).not.toThrow()
})

test('isEmptyElement', () => {
  expect(isEmptyElement(foo)).toBe(true)
  expect(isEmptyElement(bar)).toBe(false)
  expect(isEmptyElement(baz)).toBe(false)
})

test('getTableData', () => {
  document.body.innerHTML = `
    <table>
      <tbody>
        <tr>
          <td>baz</td>
          <td>qux</td>
        </tr>
        <tr>
          <td>quux</td>
          <td>corge</td>
        </tr>
        <tr>
          <td>grault</td>
        </tr>
      </tbody>
    </table>
  `

  const table = document.querySelector('table')
  const tableData = getTableData(table, ['foo', 'bar'])
  const tableDataWithoutHeaders = getTableData(table)

  expect(tableData).toEqual([{ foo: 'baz', bar: 'qux'}, { foo: 'quux', bar: 'corge'}, { foo: 'grault', bar: null}])
  expect(tableDataWithoutHeaders).toEqual([
    ['baz', 'qux'],
    ['quux', 'corge'],
    ['grault']
  ])
})
