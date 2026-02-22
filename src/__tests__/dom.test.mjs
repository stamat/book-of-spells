import { isEmptyElement, getTableData } from '../dom.mjs'

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
