import { jest } from '@jest/globals'
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
  getTransitionDurations,
  matchesAny,
  matchesAll,
  detachElement,
  parseDOM,
  addListenerForEvents,
  removeListenerForEvents,
  isEmptyElement,
  getTableData,
  delegateEvent,
  isVisible,
  readOptions,
  scrollSpy,
  swipe,
  drag,
  whyNotSticky
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

test('getTransitionDurations', () => {
  const el = document.createElement('div')

  // single property
  const spy = jest.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (prop) => {
      if (prop === 'transition-property') return 'height'
      if (prop === 'transition-duration') return '1s'
      return ''
    }
  })
  expect(getTransitionDurations(el)).toEqual({ height: 1000 })

  // multiple properties
  spy.mockReturnValue({
    getPropertyValue: (prop) => {
      if (prop === 'transition-property') return 'height, opacity'
      if (prop === 'transition-duration') return '0.5s, 200ms'
      return ''
    }
  })
  expect(getTransitionDurations(el)).toEqual({ height: 500, opacity: 200 })

  // more properties than durations — CSS repeats the duration list
  spy.mockReturnValue({
    getPropertyValue: (prop) => {
      if (prop === 'transition-property') return 'height, opacity, color'
      if (prop === 'transition-duration') return '1s'
      return ''
    }
  })
  expect(getTransitionDurations(el)).toEqual({ height: 1000, opacity: 1000, color: 1000 })

  // duration list shorter than property list cycles through
  spy.mockReturnValue({
    getPropertyValue: (prop) => {
      if (prop === 'transition-property') return 'height, opacity, color'
      if (prop === 'transition-duration') return '1s, 200ms'
      return ''
    }
  })
  expect(getTransitionDurations(el)).toEqual({ height: 1000, opacity: 200, color: 1000 })

  spy.mockRestore()

  // null element
  expect(getTransitionDurations(null)).toEqual({})
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

test('delegateEvent returns a destroy handle for bubbling events', () => {
  document.body.innerHTML = '<button class="btn"></button>'
  let count = 0
  const handle = delegateEvent('.btn', 'click', () => count++)

  document.querySelector('.btn').dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(count).toBe(1)
  // disconnect is a backwards-compatible alias of destroy
  expect(handle.disconnect).toBe(handle.destroy)

  handle.destroy()
  document.querySelector('.btn').dispatchEvent(new MouseEvent('click', { bubbles: true }))
  expect(count).toBe(1)
})

test('delegateEvent returns the MutationObserver with destroy for non-bubbling events', () => {
  document.body.innerHTML = '<input class="inp">'
  let count = 0
  const observer = delegateEvent('.inp', 'focus', () => count++)

  document.querySelector('.inp').dispatchEvent(new FocusEvent('focus'))
  expect(count).toBe(1)
  // old API preserved: the observer instance itself is returned
  expect(observer).toBeInstanceOf(MutationObserver)

  observer.destroy()
  document.querySelector('.inp').dispatchEvent(new FocusEvent('focus'))
  expect(count).toBe(1)
})

test('isVisible forwards checkOpacity to native checkVisibility', () => {
  const el = document.createElement('div')
  const calls = []
  el.checkVisibility = (opts) => { calls.push(opts); return true }

  expect(isVisible(el)).toBe(true)
  expect(calls[0]).toEqual({ visibilityProperty: true, opacityProperty: true })

  isVisible(el, false)
  expect(calls[1]).toEqual({ visibilityProperty: true, opacityProperty: false })
})

describe('readOptions', () => {
  const el = (attrs) => {
    const div = document.createElement('div')
    for (const name in attrs) div.setAttribute(name, attrs[name])
    return div
  }

  test('parses booleans, numbers and strings from attributes', () => {
    const div = el({ exclusive: '', 'page-step': '25', label: 'FAQ', muted: 'false' })
    expect(readOptions(div, { exclusive: 'boolean', muted: 'boolean', pageStep: 'number', label: 'string' }))
      .toEqual({ exclusive: true, muted: false, pageStep: 25, label: 'FAQ' })
  })

  test('reads HTML boolean semantics, where a bare attribute means on', () => {
    expect(readOptions(el({ open: '' }), { open: 'boolean' })).toEqual({ open: true })
    expect(readOptions(el({ open: '0' }), { open: 'boolean' })).toEqual({ open: false })
    expect(readOptions(el({ open: 'false' }), { open: 'boolean' })).toEqual({ open: false })
    expect(readOptions(el({ open: 'anything' }), { open: 'boolean' })).toEqual({ open: true })
  })

  test('omits absent options instead of defaulting them', () => {
    expect(readOptions(el({}), { exclusive: 'boolean' })).toEqual({})
  })

  test('prefers data-* over the bare attribute', () => {
    expect(readOptions(el({ 'data-exclusive': 'false', exclusive: '' }), { exclusive: 'boolean' }))
      .toEqual({ exclusive: false })
  })

  test('drops unparsable numbers rather than returning NaN', () => {
    expect(readOptions(el({ 'page-step': 'nope' }), { pageStep: 'number' })).toEqual({})
    expect(readOptions(el({ 'page-step': '25nope' }), { pageStep: 'number' })).toEqual({})
    expect(readOptions(el({ 'page-step': '1.5' }), { pageStep: 'number' })).toEqual({ pageStep: 1.5 })
  })

  test('is a no-op without an element or a schema', () => {
    expect(readOptions(null, { a: 'string' })).toEqual({})
    expect(readOptions(el({}), null)).toEqual({})
  })
})

// scrollSpy, over a faked layout: jsdom lays nothing out, so every section's rect and the
// document's height are stubbed and the scroll position is moved by hand. ResizeObserver and
// IntersectionObserver are hand-rolled stubs too — jsdom ships neither — so what a real
// observer fires on, and when it delivers, stays uncovered.
// Also uncovered: the throttle itself — rAF is replaced with a straight call so a scroll event
// settles synchronously — and any behaviour inside a scrolling container, which the function
// does not have.
describe('scrollSpy', () => {
  const VIEWPORT = 800
  let spy = null
  let rafSpy = null
  let cancelSpy = null

  // Sections at absolute document offsets, plus a document tall enough to scroll through them.
  const layout = (tops, docHeight) => {
    document.body.innerHTML = tops.map((top, i) => `<section id="s${i}"></section>`).join('')
    const sections = tops.map((top, i) => {
      const element = document.getElementById(`s${i}`)
      element.getBoundingClientRect = () => ({ top: top - window.scrollY, height: 0 })
      return element
    })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: docHeight, configurable: true })
    return sections
  }

  const scrollTo = (y) => {
    window.scrollY = y
    window.dispatchEvent(new Event('scroll'))
  }

  beforeEach(() => {
    window.innerHeight = VIEWPORT
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true })
    rafSpy = jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => { cb(); return 1 })
    cancelSpy = jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
  })

  afterEach(() => {
    if (spy) spy.destroy()
    spy = null
    rafSpy.mockRestore()
    cancelSpy.mockRestore()
  })

  test('the section being read is the current one, not the topmost one on screen', () => {
    const sections = layout([0, 1000, 2000], 4000)
    const seen = []
    spy = scrollSpy(sections, (section) => seen.push(section && section.id))

    // 1200 puts section 1 above the line and section 2 far below it, while both 1 and 2 would
    // be inside a viewport twice this tall — the case an isIntersecting test gets wrong.
    scrollTo(1200)
    expect(seen[seen.length - 1]).toBe('s1')
  })

  test('nothing is current above the first section', () => {
    const sections = layout([500, 1500], 4000)
    const seen = []
    spy = scrollSpy(sections, (section, index) => seen.push([section, index]))

    expect(seen[0]).toEqual([null, -1])
  })

  test('a final section shorter than the screen still becomes current at the foot of the page', () => {
    // The page bottoms out at 3200, leaving s2's top 100px short of the line for good.
    const sections = layout([0, 1000, 3300], 4000)
    const seen = []
    spy = scrollSpy(sections, (section) => seen.push(section && section.id))

    scrollTo(3200)
    expect(seen[seen.length - 1]).toBe('s2')
  })

  test('a page too short to scroll is not reported as read to the end', () => {
    const sections = layout([0, 400], 600)
    const seen = []
    spy = scrollSpy(sections, (section) => seen.push(section && section.id))

    expect(seen).toEqual(['s0'])
  })

  test('scrolling inside one section does not call back again, and leaving it does', () => {
    const sections = layout([0, 2000], 5000)
    const callback = jest.fn()
    spy = scrollSpy(sections, callback)

    callback.mockClear()
    scrollTo(100)
    scrollTo(200)
    scrollTo(300)
    expect(callback).not.toHaveBeenCalled()

    // The other half of the same guarantee: a throttle that latched would also make this
    // silent, and a test that only counts the calls it does not want cannot tell the two apart.
    scrollTo(2100)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test('sections handed over out of document order still report in document order', () => {
    const [first, second, third] = layout([0, 1000, 2000], 4000)
    const seen = []
    spy = scrollSpy([third, first, second], (section) => seen.push(section && section.id))

    scrollTo(1200)
    expect(seen[seen.length - 1]).toBe('s1')
  })

  test('a destroyed spy stops answering the scroll', () => {
    const sections = layout([0, 1000], 4000)
    const callback = jest.fn()
    spy = scrollSpy(sections, callback)

    spy.destroy()
    callback.mockClear()
    scrollTo(1200)
    expect(callback).not.toHaveBeenCalled()
    spy = null
  })

  test('a body pinned to full height still remeasures when the document grows', () => {
    // height:100% keeps the body's box fixed while content overflows, so ResizeObserver never
    // fires — the per-frame document-height check is what catches this one.
    const sections = layout([0, 1000], 4000)
    const seen = []
    spy = scrollSpy(sections, (section) => seen.push(section && section.id))

    // An embed loads above s1: the document grows and s1 moves down, but no observer fires.
    sections[1].getBoundingClientRect = () => ({ top: 2000 - window.scrollY, height: 0 })
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 5000, configurable: true })
    scrollTo(1200)
    expect(seen[seen.length - 1]).toBe('s0')
  })

  test('a height-neutral shift is caught when the moved section crosses a viewport edge', () => {
    // Two sections trade equal heights: no resize, no document growth — only the probe's
    // free rectangle, disagreeing with the map at a crossing, can notice.
    let notify = null
    const disconnected = jest.fn()
    globalThis.IntersectionObserver = class {
      constructor(callback) { notify = callback }
      observe() {}
      disconnect() { disconnected() }
    }

    try {
      const sections = layout([0, 1000], 4000)
      const seen = []
      spy = scrollSpy(sections, (section) => seen.push(section && section.id))

      scrollTo(1200)
      expect(seen[seen.length - 1]).toBe('s1')

      // s1 moves to 2000 while something above shrinks by the same amount; scrolling on
      // still answers from the stale map — the honest window before the probe fires.
      sections[1].getBoundingClientRect = () => ({ top: 2000 - window.scrollY, height: 0 })
      scrollTo(1300)
      expect(seen[seen.length - 1]).toBe('s1')

      // s1 crosses the viewport edge and the observer delivers its rectangle: 700 viewport
      // + 1300 scroll = 2000 against a map that says 1000 — drift, remeasure, right answer.
      notify([{ target: sections[1], boundingClientRect: { top: 2000 - window.scrollY } }])
      expect(seen[seen.length - 1]).toBe('s0')

      spy.destroy()
      spy = null
      expect(disconnected).toHaveBeenCalled()
    } finally {
      delete globalThis.IntersectionObserver
    }
  })

  test('a probe rectangle that agrees with the map does not remeasure', () => {
    let notify = null
    globalThis.IntersectionObserver = class {
      constructor(callback) { notify = callback }
      observe() {}
      disconnect() {}
    }

    try {
      const sections = layout([0, 1000], 4000)
      const measured = jest.fn(sections[1].getBoundingClientRect)
      sections[1].getBoundingClientRect = measured
      spy = scrollSpy(sections, () => {})

      measured.mockClear()
      // An ordinary scroll crossing: the rectangle matches the cached position exactly.
      notify([{ target: sections[1], boundingClientRect: { top: 1000 - window.scrollY } }])
      expect(measured).not.toHaveBeenCalled()
    } finally {
      delete globalThis.IntersectionObserver
    }
  })

  test('positions are cached: a shift the observers cannot see answers stale until update()', () => {
    // Two sections trade heights without the body changing size — nothing fires, and the spy
    // answers from the map until it is told to look again. This is the documented trade, not
    // a bug: the test pins it so a future change to the contract is a loud one.
    const sections = layout([0, 1000], 4000)
    const seen = []
    spy = scrollSpy(sections, (section) => seen.push(section && section.id))

    sections[1].getBoundingClientRect = () => ({ top: 2000 - window.scrollY, height: 0 })
    scrollTo(1200)
    expect(seen[seen.length - 1]).toBe('s1')

    spy.update()
    expect(seen[seen.length - 1]).toBe('s0')
  })

  test('a window resize remeasures, and the answer moves with the reflowed page', () => {
    const sections = layout([0, 1000], 4000)
    const seen = []
    spy = scrollSpy(sections, (section) => seen.push(section && section.id))

    scrollTo(1200)
    expect(seen[seen.length - 1]).toBe('s1')

    // The column narrows and s1 reflows further down the page.
    sections[1].getBoundingClientRect = () => ({ top: 2000 - window.scrollY, height: 0 })
    window.dispatchEvent(new Event('resize'))
    expect(seen[seen.length - 1]).toBe('s0')
  })

  test('the page changing height remeasures through ResizeObserver, and destroy disconnects it', () => {
    let notify = null
    const observed = []
    const disconnected = jest.fn()
    globalThis.ResizeObserver = class {
      constructor(callback) { notify = callback }
      observe(target) { observed.push(target) }
      disconnect() { disconnected() }
    }

    try {
      const sections = layout([0, 1000], 4000)
      const seen = []
      spy = scrollSpy(sections, (section) => seen.push(section && section.id))
      // The observer watches the body, nothing else.
      expect(observed).toEqual([document.body])

      scrollTo(1200)
      // An image above s1 loads and pushes it down; the body grows and the observer fires.
      sections[1].getBoundingClientRect = () => ({ top: 2000 - window.scrollY, height: 0 })
      notify()
      expect(seen[seen.length - 1]).toBe('s0')

      spy.destroy()
      spy = null
      expect(disconnected).toHaveBeenCalled()
    } finally {
      delete globalThis.ResizeObserver
    }
  })

  test('a function offset moves the reading line as its answer changes', () => {
    // A collapsing header: same scroll neighbourhood, different header height, different section.
    const sections = layout([0, 1000], 4000)
    let header = 0
    const seen = []
    spy = scrollSpy(sections, (section) => seen.push(section && section.id), { offset: () => header })

    scrollTo(990)
    expect(seen[seen.length - 1]).toBe('s0')

    header = 100
    scrollTo(992)
    expect(seen[seen.length - 1]).toBe('s1')
  })

  test('an offset function returning nonsense reads as zero, not as no section at all', () => {
    const sections = layout([0, 1000], 4000)
    const seen = []
    spy = scrollSpy(sections, (section) => seen.push(section && section.id), { offset: () => undefined })

    scrollTo(1200)
    expect(seen[seen.length - 1]).toBe('s1')
  })

  test('nothing to watch and nothing to call back to are both no-ops', () => {
    expect(scrollSpy([], () => {})).toBe(null)
    expect(scrollSpy('.nothing-here', () => {})).toBe(null)
    expect(scrollSpy(layout([0], 4000), null)).toBe(null)
  })
})


// whyNotSticky, over a faked layout: jsdom lays nothing out, so every rectangle and every
// overflowing height is stubbed by hand, and every style is set inline because jsdom resolves
// those and not much else. That covers the rules, not the layout — whether a real engine agrees
// a box has room to travel was checked against headless Chrome once, and is not checked here.
// Also uncovered: `contain` and `content-visibility` ancestors, and html/body overflow
// propagation, neither of which the function models.
// Overflow is declared as `overflow-y` throughout because jsdom neither expands the `overflow`
// shorthand into the longhands nor fills it from them, while a browser resolves both — so a
// fixture written as `overflow: hidden` would read back as no overflow at all and pass for the
// wrong reason.
describe('whyNotSticky', () => {
  const codes = (target) => whyNotSticky(target).map((finding) => finding.code)

  const box = (element, size) => {
    element.getBoundingClientRect = () => ({ height: size, width: size })
    return element
  }

  // isScrollVisible reads offsetHeight against scrollHeight, neither of which jsdom computes.
  const scrollport = (element, scrolls) => {
    Object.defineProperty(element, 'offsetHeight', { value: 100, configurable: true })
    Object.defineProperty(element, 'scrollHeight', { value: scrolls ? 300 : 100, configurable: true })
    return element
  }

  const layout = (html, parentHeight = 500) => {
    document.body.innerHTML = html
    box(document.getElementById('sticky'), 50)
    const parent = document.getElementById('parent')
    if (parent) box(parent, parentHeight)
    return parent
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('says nothing about a sticky element that has an inset, room to travel and no scrolling ancestor', () => {
    layout('<div id="parent"><div id="sticky" style="position: sticky; top: 0"></div></div>')
    expect(codes('#sticky')).toEqual([])
  })

  it('reports an element whose insets are all unset as having no threshold to stick at', () => {
    layout('<div id="parent"><div id="sticky" style="position: sticky"></div></div>')
    expect(codes('#sticky')).toEqual(['no-inset'])
  })

  it('names the ancestor whose overflow made it a scrollport that never scrolls', () => {
    const parent = layout('<div id="parent" style="overflow-y: hidden"><div id="sticky" style="position: sticky; top: 0"></div></div>')
    scrollport(parent, false)
    const [finding] = whyNotSticky('#sticky')
    expect(finding.code).toBe('dead-scrollport')
    expect(finding.culprit).toBe(parent)
    // CSS syntax, not the JS style key: the fix is for pasting into a stylesheet.
    expect(finding.fix).toContain('overflow-y: clip')
  })

  it('an ancestor scrolling only on the other axis is still a dead scrollport, not a nested one', () => {
    const parent = layout('<div id="parent" style="overflow-y: hidden"><div id="sticky" style="position: sticky; top: 0"></div></div>')
    scrollport(parent, false)
    Object.defineProperty(parent, 'offsetWidth', { value: 100, configurable: true })
    Object.defineProperty(parent, 'scrollWidth', { value: 300, configurable: true })
    expect(codes('#sticky')).toEqual(['dead-scrollport'])
  })

  it('reports a scrolling ancestor as the scrollport the element sticks inside, not as a fault', () => {
    const parent = layout('<div id="parent" style="overflow-y: auto"><div id="sticky" style="position: sticky; top: 0"></div></div>')
    scrollport(parent, true)
    expect(codes('#sticky')).toEqual(['nested-scrollport'])
  })

  it('reports a parent no taller than the element as leaving nowhere to travel', () => {
    layout('<div id="parent"><div id="sticky" style="position: sticky; top: 0"></div></div>', 50)
    expect(codes('#sticky')).toEqual(['no-room'])
  })

  it('never reports an overflow-x clip ancestor, which clips without becoming a scrollport', () => {
    const parent = layout('<div id="parent" style="overflow-x: clip"><div id="sticky" style="position: sticky; top: 0"></div></div>')
    scrollport(parent, false)
    expect(codes('#sticky')).toEqual([])
  })

  it('reports an element that was never sticky as such, instead of diagnosing it', () => {
    layout('<div id="parent"><div id="sticky" style="position: relative; top: 0"></div></div>')
    expect(codes('#sticky')).toEqual(['not-sticky'])
  })

  it('names a detached element instead of misreading its empty computed styles', () => {
    const element = document.createElement('div')
    element.style.position = 'sticky'
    element.style.top = '0'
    expect(whyNotSticky(element).map((finding) => finding.code)).toEqual(['detached'])
  })

  it('blames the nearest scrolling ancestor, an outer scroller being out of reach behind it', () => {
    document.body.innerHTML = '<div id="outer" style="overflow-y: auto"><div id="parent" style="overflow-y: hidden"><div id="sticky" style="position: sticky; top: 0"></div></div></div>'
    box(document.getElementById('sticky'), 50)
    const parent = scrollport(box(document.getElementById('parent'), 500), false)
    scrollport(document.getElementById('outer'), true)
    const [finding, ...rest] = whyNotSticky('#sticky')
    expect(finding.code).toBe('dead-scrollport')
    expect(finding.culprit).toBe(parent)
    expect(rest).toEqual([])
  })

  it('diagnoses every sticky element on the page when called with no target, and ignores the rest', () => {
    document.body.innerHTML = '<div id="parent"><div id="sticky" style="position: sticky"></div><div id="other" style="position: sticky"></div><div id="static"></div></div>'
    box(document.getElementById('sticky'), 50)
    box(document.getElementById('other'), 50)
    box(document.getElementById('parent'), 500)
    expect(whyNotSticky().map((finding) => finding.element.id)).toEqual(['sticky', 'other'])
  })

  it('takes a list of elements the way every other helper here does', () => {
    layout('<div id="parent"><div id="sticky" style="position: sticky"></div></div>')
    expect(whyNotSticky(document.querySelectorAll('#sticky')).map((finding) => finding.code)).toEqual(['no-inset'])
    expect(whyNotSticky([document.getElementById('sticky')]).map((finding) => finding.code)).toEqual(['no-inset'])
  })

  it('returns nothing for a target that matches no element', () => {
    layout('<div id="parent"><div id="sticky" style="position: sticky; top: 0"></div></div>')
    expect(whyNotSticky('#nothing-here')).toEqual([])
  })
})


// `drag` is the pointer half of a gesture: where the pointer is, every move, until it is let go.
//
// What is pinned here is the bookkeeping a caller cannot see and would be bitten by — one
// gesture at a time, a cancelled gesture told apart from a finished one, the previous
// coordinates belonging to this gesture rather than the last one, the moves heard on the
// document so a row moved in the DOM mid-drag keeps reporting, the flick measured at the
// release rather than at the last move, and everything put back on `destroy`. The arithmetic
// on top of it — inertia, bounce — is left to the caller that asks for it.
//
// Deliberately not covered: pointer capture actually keeping a drag alive once the pointer has
// left the element. That is the browser's behaviour and jsdom has none of it, so what is checked
// is that capture is asked for and released, not what it then does. The same goes for
// `touch-action` stopping a scroll: what is checked is the property, not the gesture — and an
// unset one reads back as `undefined` here where a browser says `''`, which is why the negative
// assertion is the honest one.
describe('drag', () => {
  const pointer = (type, props = {}) => {
    const event = new Event(type, { bubbles: true, cancelable: true })
    Object.assign(event, { pointerId: 1, pointerType: 'mouse', pageX: 0, pageY: 0, clientX: 0, clientY: 0 }, props)
    return event
  }
  const heard = (element, ...types) => {
    const seen = []
    for (const type of types) element.addEventListener(type, (e) => seen.push([type, e.detail]))
    return seen
  }

  let element
  let handle
  beforeEach(() => {
    document.body.innerHTML = '<div id="drag-me"></div>'
    element = document.getElementById('drag-me')
    handle = null
  })
  afterEach(() => {
    if (handle) handle.destroy()
  })

  it('reports where the pointer is, in page coordinates and in the viewport ones a rect answers in', () => {
    const moves = []
    handle = drag(element, (detail) => moves.push(detail))
    element.dispatchEvent(pointer('pointerdown', { pageX: 10, pageY: 20, clientX: 10, clientY: 5 }))
    element.dispatchEvent(pointer('pointermove', { pageX: 12, pageY: 40, clientX: 12, clientY: 25 }))
    expect(moves).toHaveLength(1)
    expect([moves[0].x, moves[0].y]).toEqual([12, 40])
    expect([moves[0].clientX, moves[0].clientY]).toEqual([12, 25])
    expect(moves[0].pointerType).toBe('mouse')
  })

  it('does not report the last gesture coordinates as this one previous ones', () => {
    const moves = []
    handle = drag(element, (detail) => moves.push(detail))
    element.dispatchEvent(pointer('pointerdown', { pageX: 500, pageY: 500 }))
    element.dispatchEvent(pointer('pointermove', { pageX: 505, pageY: 505 }))
    element.dispatchEvent(pointer('pointerup', { pageX: 505, pageY: 505 }))

    element.dispatchEvent(pointer('pointerdown', { pageX: 10, pageY: 10 }))
    element.dispatchEvent(pointer('pointermove', { pageX: 12, pageY: 12 }))
    const last = moves[moves.length - 1]
    // 10, not 505 — the far side of the screen, and a delta nobody made.
    expect([last.prevX, last.prevY]).toEqual([10, 10])
  })

  it('says nothing about a move that moved nowhere', () => {
    const moves = []
    handle = drag(element, (detail) => moves.push(detail))
    element.dispatchEvent(pointer('pointerdown', { pageX: 10, pageY: 10, clientX: 10, clientY: 10 }))
    element.dispatchEvent(pointer('pointermove', { pageX: 10, pageY: 10, clientX: 10, clientY: 10 }))
    expect(moves).toHaveLength(0)
    element.dispatchEvent(pointer('pointermove', { pageX: 10, pageY: 11, clientX: 10, clientY: 11 }))
    expect(moves).toHaveLength(1)
  })

  it('reports a page that scrolled under a pointer that did not move', () => {
    // The two pairs come apart here: `clientY` is where it was, `pageY` is not, and a caller
    // reading page coordinates is owed the update.
    const moves = []
    handle = drag(element, (detail) => moves.push(detail))
    element.dispatchEvent(pointer('pointerdown', { pageY: 10, clientY: 10 }))
    element.dispatchEvent(pointer('pointermove', { pageY: 60, clientY: 10 }))
    expect(moves).toHaveLength(1)
    expect(moves[0].y).toBe(60)
  })

  it('measures the percentages against the track when one is named, not against the handle on it', () => {
    // jsdom lays nothing out, so both boxes are stated rather than measured: a 200-wide track
    // starting at 100, and a 20-wide handle sitting at 140 - the shape of every slider there is.
    document.body.innerHTML = '<div id="track"><div id="grip"></div></div>'
    const track = document.getElementById('track')
    const grip = document.getElementById('grip')
    track.getBoundingClientRect = () => ({ top: 0, left: 100, width: 200, height: 50 })
    grip.getBoundingClientRect = () => ({ top: 0, left: 140, width: 20, height: 50 })

    const along = []
    handle = drag(grip, { within: track, callback: (d) => along.push(d.xPercentage) })
    grip.dispatchEvent(pointer('pointerdown', { pageX: 150, clientX: 150 }))
    grip.dispatchEvent(pointer('pointermove', { pageX: 200, clientX: 200 }))
    // Half way along the track, not half way along the grip.
    expect(along).toEqual([50])

    handle.destroy()
    const own = []
    handle = drag(grip, (d) => own.push(d.xPercentage))
    grip.dispatchEvent(pointer('pointerdown', { pageX: 150, clientX: 150 }))
    grip.dispatchEvent(pointer('pointermove', { pageX: 200, clientX: 200 }))
    // The same pointer, the default box: 60px past a grip that is 20 wide, held at the end.
    expect(own).toEqual([100])
  })

  it('holds the percentages at the ends when the pointer leaves the track', () => {
    document.body.innerHTML = '<div id="track"><div id="grip"></div></div>'
    const track = document.getElementById('track')
    const grip = document.getElementById('grip')
    track.getBoundingClientRect = () => ({ top: 0, left: 100, width: 200, height: 50 })

    const along = []
    handle = drag(grip, { within: track, callback: (d) => along.push(d.xPercentage) })
    grip.dispatchEvent(pointer('pointerdown', { pageX: 150, clientX: 150 }))
    grip.dispatchEvent(pointer('pointermove', { pageX: 4000, clientX: 4000 }))
    grip.dispatchEvent(pointer('pointermove', { pageX: -4000, clientX: -4000 }))
    expect(along).toEqual([100, 0])
  })

  it('takes one gesture at a time, because a second pointer is a pinch', () => {
    const seen = heard(element, 'dragstart')
    handle = drag(element, () => {})
    element.dispatchEvent(pointer('pointerdown', { pointerId: 1 }))
    element.dispatchEvent(pointer('pointerdown', { pointerId: 2 }))
    expect(seen).toHaveLength(1)
  })

  it('ignores moves from a pointer that is not the one dragging', () => {
    const moves = []
    handle = drag(element, (detail) => moves.push(detail))
    element.dispatchEvent(pointer('pointerdown', { pointerId: 1 }))
    element.dispatchEvent(pointer('pointermove', { pointerId: 2, pageX: 99, pageY: 99 }))
    expect(moves).toHaveLength(0)
  })

  it('hears the gesture on the document, so a row moved in the DOM mid-drag keeps reporting', () => {
    // The spec hands capture to the document the moment the captured element is disconnected,
    // and `insertBefore` on a connected node disconnects it first. From then on the moves land
    // on the document and nothing below it — so that is where the gesture has to be heard.
    document.body.innerHTML = '<ul><li id="drag-me"></li><li id="other"></li></ul>'
    element = document.getElementById('drag-me')
    const moves = []
    handle = drag(element, (detail) => moves.push(detail))
    element.dispatchEvent(pointer('pointerdown'))
    document.getElementById('other').after(element)
    document.body.dispatchEvent(pointer('pointermove', { pageY: 30, clientY: 30 }))
    expect(moves).toHaveLength(1)
    expect(moves[0].target).toBe(element)
  })

  it('measures the flick at the release, so a drag held still before letting go carries none', () => {
    const clock = jest.spyOn(performance, 'now')
    const ends = heard(element, 'dragend')
    handle = drag(element, () => {})
    clock.mockReturnValue(0)
    element.dispatchEvent(pointer('pointerdown'))
    clock.mockReturnValue(16)
    element.dispatchEvent(pointer('pointermove', { pageY: 50, clientY: 50 }))
    clock.mockReturnValue(500)
    element.dispatchEvent(pointer('pointerup', { pageY: 50, clientY: 50 }))

    clock.mockReturnValue(1000)
    element.dispatchEvent(pointer('pointerdown'))
    clock.mockReturnValue(1016)
    element.dispatchEvent(pointer('pointermove', { pageY: 50, clientY: 50 }))
    clock.mockReturnValue(1020)
    element.dispatchEvent(pointer('pointerup', { pageY: 50, clientY: 50 }))
    clock.mockRestore()

    expect(ends[0][1].velocityY).toBe(0)
    expect(ends[1][1].velocityY).toBeGreaterThan(0)
  })

  it('tells a cancelled gesture from a finished one, because the person never let go', () => {
    const seen = heard(element, 'dragend', 'dragcancel')
    handle = drag(element, () => {})
    element.dispatchEvent(pointer('pointerdown'))
    element.dispatchEvent(pointer('pointercancel'))
    expect(seen.map(([type]) => type)).toEqual(['dragcancel'])
    expect(element.getAttribute('dragging')).toBe('false')
  })

  it('a cancelled gesture never coasts, whatever it was carrying', () => {
    const seen = heard(element, 'draginertia', 'draginertiaend')
    handle = drag(element, { inertia: true })
    element.dispatchEvent(pointer('pointerdown', { pageY: 0 }))
    element.dispatchEvent(pointer('pointermove', { pageY: 200 }))
    element.dispatchEvent(pointer('pointercancel'))
    expect(seen).toEqual([])
  })

  it('says it is dragging while it is, and stops saying so when it is not', () => {
    handle = drag(element, () => {})
    expect(element.getAttribute('drag-enabled')).toBe('true')
    expect(element.getAttribute('dragging')).toBe('false')
    element.dispatchEvent(pointer('pointerdown'))
    expect(element.getAttribute('dragging')).toBe('true')
    element.dispatchEvent(pointer('pointerup'))
    expect(element.getAttribute('dragging')).toBe('false')
  })

  it('takes the touch gesture with touch-action, and gives back what the page had', () => {
    element.style.touchAction = 'pan-x'
    handle = drag(element, () => {})
    expect(element.style.touchAction).toBe('none')
    handle.destroy()
    handle = null
    expect(element.style.touchAction).toBe('pan-x')
  })

  it('leaves the touch gesture alone when told to', () => {
    handle = drag(element, { preventDefaultTouch: false })
    expect(element.style.touchAction).not.toBe('none')
  })

  it('destroy takes the listeners and the attributes with it, mid-drag included', () => {
    const moves = []
    handle = drag(element, (detail) => moves.push(detail))
    element.dispatchEvent(pointer('pointerdown'))
    handle.destroy()
    handle = null
    element.dispatchEvent(pointer('pointermove', { pageX: 50 }))
    expect(moves).toHaveLength(0)
    expect(element.hasAttribute('drag-enabled')).toBe(false)
    expect(element.hasAttribute('dragging')).toBe(false)
  })

  it('will not attach twice to the same element', () => {
    handle = drag(element, () => {})
    expect(drag(element, () => {})).toBeUndefined()
  })

  it('answers nothing for something that is not an element', () => {
    expect(drag(null, () => {})).toBeUndefined()
  })

  // The second way in: a `pointerdown` already in hand. What a caller with one delegated
  // listener over a list has, where attaching per row would be a listener per row and a
  // re-attach every time the list grows one.
  describe('started from a pointerdown', () => {
    it('starts the gesture there and then, on the element the event was handled at', () => {
      const seen = heard(element, 'dragstart', 'drag')
      const down = pointer('pointerdown', { pageX: 5, pageY: 5, clientX: 5, clientY: 5 })
      Object.defineProperty(down, 'currentTarget', { value: element })
      handle = drag(down, () => {})
      expect(seen.map(([type]) => type)).toEqual(['dragstart'])
      element.dispatchEvent(pointer('pointermove', { pageX: 5, pageY: 25, clientX: 5, clientY: 25 }))
      expect(seen.map(([type]) => type)).toEqual(['dragstart', 'drag'])
      expect(seen[1][1].clientY).toBe(25)
    })

    it('writes nothing into an element the caller already owns', () => {
      const down = pointer('pointerdown')
      Object.defineProperty(down, 'currentTarget', { value: element })
      handle = drag(down, () => {})
      expect(element.hasAttribute('drag-enabled')).toBe(false)
      expect(element.hasAttribute('dragging')).toBe(false)
      expect(element.style.touchAction).not.toBe('none')
    })

    it('is one gesture: it takes its listeners away when the pointer is let go', () => {
      const moves = []
      const down = pointer('pointerdown')
      Object.defineProperty(down, 'currentTarget', { value: element })
      handle = drag(down, (detail) => moves.push(detail))
      element.dispatchEvent(pointer('pointermove', { pageY: 10, clientY: 10 }))
      element.dispatchEvent(pointer('pointerup'))
      element.dispatchEvent(pointer('pointermove', { pageY: 80, clientY: 80 }))
      expect(moves).toHaveLength(1)
      handle = null
    })

    it('takes an explicit target when the event was handled somewhere else', () => {
      // The delegated case: the listener is on a container, the gesture belongs to a handle.
      document.body.innerHTML = '<div id="list"><span id="handle"></span></div>'
      const list = document.getElementById('list')
      const grip = document.getElementById('handle')
      const seen = heard(grip, 'dragstart')
      const down = pointer('pointerdown')
      Object.defineProperty(down, 'currentTarget', { value: list })
      handle = drag(down, { target: grip, callback: () => {} })
      expect(seen).toHaveLength(1)
    })

    it('refuses a second gesture on an element already mid-gesture, because a second pointer is a pinch', () => {
      // The delegated listener fires once per finger, so the refusal has to hold across calls,
      // not inside one.
      const down = pointer('pointerdown')
      Object.defineProperty(down, 'currentTarget', { value: element })
      handle = drag(down, () => {})
      const seen = heard(element, 'dragstart')
      const second = pointer('pointerdown', { pointerId: 2 })
      Object.defineProperty(second, 'currentTarget', { value: element })
      expect(drag(second, () => {})).toBeUndefined()
      expect(seen).toHaveLength(0)
    })
  })
})
