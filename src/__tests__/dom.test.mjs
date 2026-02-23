import {
  css,
  querySingle,
  query,
  remove,
  encodeHTML,
  decodeHTML,
  insertBeforeElement,
  toggleAttributeValue,
  cssTimeToMilliseconds,
  matchesAny,
  matchesAll,
  detachElement,
  parseDOM,
  addListenerForEvents,
  removeListenerForEvents,
  isEmptyElement,
  getTableData
} from '../dom.mjs'

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

test('querySingle', () => {
  document.body.innerHTML = '<div id="qs-test" class="item"></div>'
  const el = document.getElementById('qs-test')

  // returns element when passed an element
  expect(querySingle(el)).toBe(el)

  // finds by selector
  expect(querySingle('#qs-test')).toBe(el)
  expect(querySingle('.item')).toBe(el)

  // returns null for no match
  expect(querySingle('#nonexistent')).toBe(null)
})

test('query', () => {
  document.body.innerHTML = `
    <ul id="list">
      <li class="item">1</li>
      <li class="item">2</li>
      <li class="item">3</li>
    </ul>
  `

  // returns NodeList for selector
  const items = query('.item')
  expect(items.length).toBe(3)

  // returns array with single element when passed an Element
  const ul = document.getElementById('list')
  const result = query(ul)
  expect(Array.isArray(result)).toBe(true)
  expect(result[0]).toBe(ul)

  // scoped query
  const scoped = query('.item', '#list')
  expect(scoped.length).toBe(3)

  // returns empty array for invalid from
  expect(query('.item', 123)).toEqual([])
})

test('remove', () => {
  document.body.innerHTML = `
    <div class="removable">A</div>
    <div class="removable">B</div>
    <div class="keep">C</div>
  `
  expect(document.querySelectorAll('.removable').length).toBe(2)
  remove('.removable')
  expect(document.querySelectorAll('.removable').length).toBe(0)
  expect(document.querySelectorAll('.keep').length).toBe(1)
})

test('encodeHTML', () => {
  expect(encodeHTML('<b>bold</b>')).toBe('&lt;b&gt;bold&lt;/b&gt;')
  expect(encodeHTML('a & b')).toBe('a &amp; b')
  expect(encodeHTML('hello')).toBe('hello')
})

test('decodeHTML', () => {
  expect(decodeHTML('&lt;b&gt;bold&lt;/b&gt;')).toBe('<b>bold</b>')
  expect(decodeHTML('a &amp; b')).toBe('a & b')
  expect(decodeHTML('&quot;quoted&quot;')).toBe('"quoted"')
  expect(decodeHTML('hello')).toBe('hello')
})

test('insertBeforeElement', () => {
  document.body.innerHTML = '<div id="parent"><span id="target">target</span></div>'
  const target = document.getElementById('target')
  const newEl = document.createElement('em')
  newEl.textContent = 'new'

  insertBeforeElement(target, newEl)
  const parent = document.getElementById('parent')
  expect(parent.firstChild).toBe(newEl)
  expect(parent.childNodes[1]).toBe(target)

  // no-op for null args
  expect(() => insertBeforeElement(null, newEl)).not.toThrow()
  expect(() => insertBeforeElement(target, null)).not.toThrow()
})

test('toggleAttributeValue', () => {
  const el = document.createElement('div')

  // does nothing if attribute is missing
  toggleAttributeValue(el, 'aria-expanded')
  expect(el.hasAttribute('aria-expanded')).toBe(false)

  // toggles between on and off
  el.setAttribute('aria-expanded', 'true')
  toggleAttributeValue(el, 'aria-expanded')
  expect(el.getAttribute('aria-expanded')).toBe('false')
  toggleAttributeValue(el, 'aria-expanded')
  expect(el.getAttribute('aria-expanded')).toBe('true')

  // custom on/off values
  el.setAttribute('data-state', 'open')
  toggleAttributeValue(el, 'data-state', 'open', 'closed')
  expect(el.getAttribute('data-state')).toBe('closed')
  toggleAttributeValue(el, 'data-state', 'open', 'closed')
  expect(el.getAttribute('data-state')).toBe('open')
})

test('cssTimeToMilliseconds', () => {
  expect(cssTimeToMilliseconds('100ms')).toBe(100)
  expect(cssTimeToMilliseconds('1.5s')).toBe(1500)
  expect(cssTimeToMilliseconds('0.3s')).toBe(300)
  expect(cssTimeToMilliseconds('0ms')).toBe(0)
  expect(cssTimeToMilliseconds('2s')).toBe(2000)
  expect(cssTimeToMilliseconds('')).toBe(0)
  expect(cssTimeToMilliseconds('invalid')).toBe(0)
})

test('matchesAny', () => {
  document.body.innerHTML = `
    <div class="a"></div>
    <div class="b"></div>
    <div class="c"></div>
  `
  const elements = document.querySelectorAll('div')

  expect(matchesAny(elements, '.a')).toBe(true)
  expect(matchesAny(elements, '.z')).toBe(false)
  expect(matchesAny(null, '.a')).toBe(false)
  expect(matchesAny(elements, null)).toBe(false)

  // single element
  const el = document.querySelector('.a')
  expect(matchesAny(el, '.a')).toBe(true)
  expect(matchesAny(el, '.b')).toBe(false)

  // string selector
  expect(matchesAny('div', '.a')).toBe(true)
})

test('matchesAll', () => {
  document.body.innerHTML = `
    <div class="x item"></div>
    <div class="y item"></div>
  `
  const elements = document.querySelectorAll('div')

  expect(matchesAll(elements, '.item')).toBe(true)
  expect(matchesAll(elements, '.x')).toBe(false)
  expect(matchesAll(null, '.item')).toBe(false)

  // single element
  const el = document.querySelector('.x')
  expect(matchesAll(el, '.x')).toBe(true)
  expect(matchesAll(el, '.y')).toBe(false)
})

test('detachElement', () => {
  document.body.innerHTML = '<div id="parent"><span id="child">hello</span></div>'
  const child = document.getElementById('child')

  const detached = detachElement(child)
  expect(detached).toBe(child)
  expect(document.getElementById('child')).toBe(null)
  expect(child.textContent).toBe('hello')

  // no-op for null
  expect(detachElement(null)).toBe(null)
})

test('parseDOM', () => {
  // single element
  const el = parseDOM('<div>hello</div>')
  expect(el.tagName).toBe('DIV')
  expect(el.textContent).toBe('hello')

  // multiple children
  const nodes = parseDOM('<span>a</span><span>b</span>', true)
  expect(nodes.length).toBe(2)

  // pass-through for Element
  const existing = document.createElement('p')
  expect(parseDOM(existing)).toBe(existing)
})

test('addListenerForEvents / removeListenerForEvents', () => {
  const el = document.createElement('div')
  let count = 0
  const handler = () => { count++ }

  addListenerForEvents(el, 'click mousedown', handler)
  el.dispatchEvent(new Event('click'))
  el.dispatchEvent(new Event('mousedown'))
  expect(count).toBe(2)

  removeListenerForEvents(el, 'click mousedown', handler)
  el.dispatchEvent(new Event('click'))
  el.dispatchEvent(new Event('mousedown'))
  expect(count).toBe(2)

  // array syntax
  count = 0
  addListenerForEvents(el, ['click', 'mousedown'], handler)
  el.dispatchEvent(new Event('click'))
  expect(count).toBe(1)
  removeListenerForEvents(el, ['click', 'mousedown'], handler)
})
