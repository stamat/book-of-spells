import { jest } from '@jest/globals'
import userAgents from './data/user-agents.json' with { type: 'json' }
import { isUserAgentIOS, isUserAgentSafari, isUserAgentMobile, getQueryProperties, getHashProperties, decodeFragment, disableScroll, enableScroll, userActivity } from '../browser.mjs'
import { mapPropertyToProperty } from '../helpers.mjs'

const userAgentMap = mapPropertyToProperty(userAgents, 'device', 'userAgent')

test('isUserAgentIOS', () => {
  userAgents.forEach(({ device, userAgent }) => {
    expect(isUserAgentIOS(userAgent)).toBe(/iPhone/i.test(device))
  })
})

test('isUserAgentSafari', () => {
  expect(isUserAgentSafari(userAgentMap['Apple iPhone XR (Safari)'])).toBe(true)
  expect(isUserAgentSafari(userAgentMap['Apple iPhone XS (Chrome)'])).toBe(false)
  expect(isUserAgentSafari(userAgentMap['Apple iPhone XS Max (Firefox)'])).toBe(false)
  expect(isUserAgentSafari(userAgentMap['Mac OS X-based computer using a Safari browser'])).toBe(true)
})

test('isUserAgentMobile', () => {
  expect(isUserAgentMobile(userAgentMap['Apple iPhone XR (Safari)'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Apple iPhone XS (Chrome)'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Apple iPhone XS Max (Firefox)'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Motorola Moto G Stylus 5G'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Samsung Galaxy S21 Ultra 5G'])).toBe(true)
  expect(isUserAgentMobile(userAgentMap['Mac OS X-based computer using a Safari browser'])).toBe(false)
  expect(isUserAgentMobile(userAgentMap['Windows 10-based PC using Edge browser'])).toBe(false)
})

test('getQueryProperties', () => {
  // with explicit query string
  expect(getQueryProperties('foo=bar&baz=qux')).toEqual({ foo: 'bar', baz: 'qux' })
  // parseUrlParameters uses stringToType, so numeric values are converted
  expect(getQueryProperties('a=1&b=2&c=3')).toEqual({ a: 1, b: 2, c: 3 })
  expect(getQueryProperties('key=value')).toEqual({ key: 'value' })

  // empty
  expect(getQueryProperties('')).toEqual({})
})

test('getHashProperties', () => {
  // with explicit hash string
  expect(getHashProperties('foo=bar&baz=qux')).toEqual({ foo: 'bar', baz: 'qux' })
  expect(getHashProperties('a=1')).toEqual({ a: 1 })

  // empty
  expect(getHashProperties('')).toEqual({})
})

test('disableScroll / enableScroll', () => {
  disableScroll()
  expect(document.body.style.overflow).toBe('hidden')

  enableScroll()
  expect(document.body.style.overflow).toBe('')
})

test('decodeFragment', () => {
  expect(decodeFragment('#section-2')).toBe('section-2')
  expect(decodeFragment('section-2')).toBe('section-2') // leading # optional
  expect(decodeFragment('#caf%C3%A9')).toBe('café')
  expect(decodeFragment('#100%')).toBe('100%') // a bad escape is kept as written
  expect(decodeFragment('#')).toBe('')
  expect(decodeFragment('')).toBe('')
})

// userActivity, over a clock the test owns: `performance.now` is stubbed so that time passing
// and a timer running can be moved apart, which is the whole point of the deadline check — a
// timer woken late and a timer woken early are otherwise indistinguishable under fake timers.
// Not covered: what makes a timer late in the first place — a browser clamping a background
// tab's timers, or freezing them outright — and the capture and passive flags on the listeners,
// since a jsdom event dispatched at `document` reaches the listener either way.
describe('userActivity', () => {
  let observer = null
  let clock = 0
  let nowSpy = null

  const dispatch = (type) => window.dispatchEvent(new Event(type))
  const move = (x, y) => window.dispatchEvent(new MouseEvent('pointermove', { clientX: x, clientY: y }))

  // Fired at the document by the browser, never at the window, so it is dispatched where
  // a real one lands rather than through the helper above.
  const visibilityChange = () => document.dispatchEvent(new Event('visibilitychange'))

  // Time and timers move together, which is the ordinary case; a test wanting a late or a
  // frozen timer moves one without the other.
  const advance = (ms) => {
    clock += ms
    jest.advanceTimersByTime(ms)
  }

  beforeEach(() => {
    jest.useFakeTimers()
    clock = 0
    nowSpy = jest.spyOn(performance, 'now').mockImplementation(() => clock)
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
  })

  afterEach(() => {
    if (observer) observer.destroy()
    observer = null
    nowSpy.mockRestore()
    jest.useRealTimers()
  })

  test('a user who never touches the page still goes idle', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })

    advance(1000)
    expect(seen).toEqual([false])
  })

  test('coming back is reported once, however much the user then does', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })

    advance(1000)
    dispatch('pointermove')
    dispatch('pointermove')
    dispatch('keydown')
    expect(seen).toEqual([false, true])
  })

  test('a deadline that comes due mid-activity moves to the last thing the user did', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })

    advance(600)
    dispatch('pointermove')

    // The first deadline is now due, but the user was here 400ms ago.
    advance(400)
    expect(seen).toEqual([])

    advance(600)
    expect(seen).toEqual([false])
  })

  test('a deadline woken late is proof of idleness, not a reason to doubt it', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })

    // A blocked main thread, or a background tab whose timers were clamped: a minute of real
    // time passes before the timer set for 1000ms gets to run.
    clock += 60000
    jest.advanceTimersByTime(1000)
    expect(seen).toEqual([false])
  })

  test('returning to a hidden tab finds the idle that came due while it was away', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })

    // Frozen: time passed, the timer never ran.
    clock += 60000
    visibilityChange()
    expect(seen).toEqual([false])
  })

  test('a hidden tab still inside its deadline is not reported idle on return', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })

    clock += 400
    visibilityChange()
    expect(seen).toEqual([])

    advance(600)
    expect(seen).toEqual([false])
  })

  test('the events that count can be replaced, and one of them may be given as a string', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000, events: 'click' })

    advance(1000)
    dispatch('pointermove')
    expect(seen).toEqual([false])

    dispatch('click')
    expect(seen).toEqual([false, true])
  })

  test('a destroyed observer stops listening and stops counting', () => {
    const callback = jest.fn()
    observer = userActivity(callback, { timeout: 1000 })

    observer.destroy()
    observer = null
    advance(5000)
    dispatch('pointermove')
    expect(callback).not.toHaveBeenCalled()
  })

  test('there is nothing to observe without a callback', () => {
    expect(userActivity()).toBe(null)
    expect(userActivity('not a function')).toBe(null)
  })

  test('a window resize counts, since the user is the one dragging the window', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })

    advance(1000)
    // Only window ever receives this one — a listener on document would never hear it.
    window.dispatchEvent(new Event('resize'))
    expect(seen).toEqual([false, true])
  })

  test('a widget that stops its own events from propagating cannot hide its user', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })
    const gag = (event) => event.stopPropagation()
    document.addEventListener('keydown', gag, true)

    advance(1000)
    document.body.dispatchEvent(new Event('keydown', { bubbles: true }))
    document.removeEventListener('keydown', gag, true)
    expect(seen).toEqual([false, true])
  })

  test('a pointer that reports the place it already was is not a user', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })

    advance(1000)
    move(5, 5)
    expect(seen).toEqual([false, true])

    advance(1000)
    expect(seen).toEqual([false, true, false])

    // Content moving under a parked cursor: same coordinates, no user.
    move(5, 5)
    expect(seen).toEqual([false, true, false])

    move(6, 5)
    expect(seen).toEqual([false, true, false, true])
  })

  test('a move event carrying no coordinates is left alone rather than dropped', () => {
    const seen = []
    observer = userActivity((active) => seen.push(active), { timeout: 1000 })

    advance(1000)
    dispatch('pointermove')
    dispatch('pointermove')
    expect(seen).toEqual([false, true])
  })
})
