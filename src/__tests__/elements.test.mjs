import { jest } from '@jest/globals'
import { announcer, define, ElementBase, nextIndex, stepIndex, typeAheadIndex, fits, placeFlyout, placeSubmenu } from '../elements.mjs'

describe('define', () => {
  test('registers once, and a second call is a no-op', () => {
    class TestElement extends ElementBase {}
    define('test-element', TestElement)
    expect(customElements.get('test-element')).toBe(TestElement)
    expect(() => define('test-element', class extends ElementBase {})).not.toThrow()
    expect(customElements.get('test-element')).toBe(TestElement)
  })
})

describe('nextIndex', () => {
  test('implements the APG key map every wrapping list of widgets uses', () => {
    expect(nextIndex(0, 'ArrowDown', 3)).toBe(1)
    expect(nextIndex(1, 'ArrowUp', 3)).toBe(0)
    expect(nextIndex(0, 'Home', 3)).toBe(0)
    expect(nextIndex(0, 'End', 3)).toBe(2)
    expect(nextIndex(0, 'Tab', 3)).toBeNull() // ignores unrelated keys
  })

  test('wraps around both ends', () => {
    expect(nextIndex(2, 'ArrowDown', 3)).toBe(0)
    expect(nextIndex(0, 'ArrowUp', 3)).toBe(2)
  })

  test('is a no-op for an empty list', () => {
    expect(nextIndex(0, 'ArrowDown', 0)).toBeNull()
    expect(nextIndex(0, 'Home', 0)).toBeNull()
  })

  test('starts a list with nothing focused at either end', () => {
    expect(nextIndex(-1, 'ArrowDown', 3)).toBe(0)
    expect(nextIndex(-1, 'ArrowUp', 3)).toBe(2)
  })
})

describe('stepIndex', () => {
  test('arrows step one way or the other, whichever axis they are on', () => {
    expect(stepIndex(0, 'ArrowRight', 4)).toBe(1)
    expect(stepIndex(0, 'ArrowDown', 4)).toBe(1)
    expect(stepIndex(2, 'ArrowLeft', 4)).toBe(1)
    expect(stepIndex(2, 'ArrowUp', 4)).toBe(1)
  })

  test('the ends do not wrap', () => {
    expect(stepIndex(3, 'ArrowRight', 4)).toBeNull()
    expect(stepIndex(0, 'ArrowLeft', 4)).toBeNull()
  })

  test('Home and End go to the ends', () => {
    expect(stepIndex(2, 'Home', 4)).toBe(0)
    expect(stepIndex(2, 'End', 4)).toBe(3)
  })

  test('nothing focused steps onto the first item', () => {
    expect(stepIndex(-1, 'ArrowRight', 4)).toBe(0)
  })

  test('unhandled keys and empty sets move nowhere', () => {
    expect(stepIndex(0, 'Enter', 4)).toBeNull()
    expect(stepIndex(0, 'a', 4)).toBeNull()
    expect(stepIndex(0, 'ArrowRight', 0)).toBeNull()
  })
})

describe('typeAheadIndex', () => {
  const LABELS = ['Profile', 'Preferences', 'Archive', 'Sign out']

  test('a typed letter finds the next item starting with it', () => {
    expect(typeAheadIndex(LABELS, 0, 'a')).toBe(2)
    expect(typeAheadIndex(LABELS, 0, 's')).toBe(3)
  })

  test('the search starts after the focused item, and wraps', () => {
    expect(typeAheadIndex(LABELS, 0, 'p')).toBe(1)
    expect(typeAheadIndex(LABELS, 3, 'p')).toBe(0)
  })

  test('a repeated letter cycles the items starting with it', () => {
    expect(typeAheadIndex(LABELS, 0, 'pp')).toBe(1)
    expect(typeAheadIndex(LABELS, 1, 'ppp')).toBe(0)
  })

  test('a buffer being typed narrows onto the item already focused', () => {
    expect(typeAheadIndex(LABELS, 1, 'pre')).toBe(1)
    expect(typeAheadIndex(LABELS, 1, 'pro')).toBe(0)
  })

  test('matching ignores case and the whitespace markup leaves behind', () => {
    expect(typeAheadIndex(['\n  Archive\n', 'Sign out'], -1, 'ARC')).toBe(0)
  })

  test('nothing typed, nothing matching, and an empty list all move nowhere', () => {
    expect(typeAheadIndex(LABELS, 0, '')).toBeNull()
    expect(typeAheadIndex(LABELS, 0, 'z')).toBeNull()
    expect(typeAheadIndex([], 0, 'a')).toBeNull()
  })
})

describe('placement', () => {
  const VIEWPORT = { width: 1000, height: 800 }
  const PANEL = { width: 200, height: 300 }
  const rect = (left, top, width = 100, height = 30) => ({
    left, top, right: left + width, bottom: top + height
  })

  test('fits checks both ends', () => {
    expect(fits(100, 300, 800)).toBe(true)
    expect(fits(700, 300, 800)).toBe(false)
    expect(fits(-10, 300, 800)).toBe(false)
  })

  test('a trigger with room below and to the right keeps the preferred placement', () => {
    expect(placeFlyout(rect(20, 20), PANEL, VIEWPORT, false)).toEqual({
      side: 'block-end',
      align: 'start'
    })
  })

  test('a trigger near the bottom right opens up and back to the left', () => {
    expect(placeFlyout(rect(900, 760), PANEL, VIEWPORT, false)).toEqual({
      side: 'block-start',
      align: 'end'
    })
  })

  test('a trigger hemmed in on both sides keeps the preferred placement anyway', () => {
    const tiny = { width: 400, height: 100 }
    expect(placeFlyout(rect(20, 40), PANEL, tiny, false)).toEqual({
      side: 'block-end',
      align: 'start'
    })
  })

  test('right to left flips which edge counts as the start', () => {
    expect(placeFlyout(rect(0, 20), PANEL, VIEWPORT, true).align).toBe('end')
    expect(placeFlyout(rect(900, 20), PANEL, VIEWPORT, true).align).toBe('start')
  })

  // Opt-in, because `align` is spent as a CSS keyword by whoever asked for the placement,
  // and a caller whose stylesheet only answers `start` and `end` would be handed a value it
  // has no rule for. Off by default, every existing caller keeps the placement it had.
  test('a panel is only centred on its trigger when the caller asks for it', () => {
    expect(placeFlyout(rect(400, 20), PANEL, VIEWPORT, false).align).toBe('start')
    expect(placeFlyout(rect(400, 20), PANEL, VIEWPORT, false, true).align).toBe('center')
  })

  // Centring is symmetric, so there is no start edge left for the direction to pick - and it
  // is only ever about the inline axis, so the block side still flips as it did.
  test('a centred panel is the same in either direction, and still flips its side', () => {
    expect(placeFlyout(rect(400, 20), PANEL, VIEWPORT, true, true).align).toBe('center')
    expect(placeFlyout(rect(400, 760), PANEL, VIEWPORT, false, true)).toEqual({
      side: 'block-start',
      align: 'center'
    })
  })

  // The ask is a preference and not an instruction: a panel centred on a trigger near the
  // edge would hang off the viewport, and an edge it can still reach is worth more than
  // symmetry it cannot.
  test('a centred panel with no room for it falls back to the edge that fits', () => {
    expect(placeFlyout(rect(20, 20), PANEL, VIEWPORT, false, true).align).toBe('start')
    expect(placeFlyout(rect(880, 20), PANEL, VIEWPORT, false, true).align).toBe('end')
  })

  test('a nested panel with room beside it opens beside it, downwards', () => {
    expect(placeSubmenu(rect(20, 20), PANEL, VIEWPORT, false)).toEqual({
      side: 'inline-end',
      align: 'start'
    })
  })

  test('a nested panel in the bottom right corner opens up and to the left', () => {
    expect(placeSubmenu(rect(880, 700), PANEL, VIEWPORT, false)).toEqual({
      side: 'inline-start',
      align: 'end'
    })
  })

  test('a nested panel in RTL prefers the left and flips to the right', () => {
    expect(placeSubmenu(rect(500, 20), PANEL, VIEWPORT, true).side).toBe('inline-end')
    expect(placeSubmenu(rect(20, 20), PANEL, VIEWPORT, true).side).toBe('inline-start')
  })
})

describe('announcer', () => {
  beforeEach(() => { jest.useFakeTimers() })
  afterEach(() => { jest.useRealTimers() })

  const host = () => document.body.appendChild(document.createElement('div'))

  test('the region is in the document, and empty, before there is anything to say', () => {
    // The whole reason this is called at upgrade rather than at the moment there is a
    // message: a region created and filled in one breath announces nothing at all.
    const region = announcer(host())
    expect(region.node.isConnected).toBe(true)
    expect(region.node.getAttribute('role')).toBe('status')
    expect(region.node.textContent).toBe('')
  })

  test('what it says lands in the region, a task later', () => {
    const region = announcer(host())
    region.say('Copied')
    expect(region.node.textContent).toBe('')
    jest.advanceTimersByTime(0)
    expect(region.node.textContent).toBe('Copied')
  })

  test('the same sentence twice is two announcements, not one silence', () => {
    // A live region announces a change, so the second copy, the second failed save and the
    // second press of a toggle are all silent without the clear in between.
    const region = announcer(host())
    const seen = []
    region.say('Copied')
    jest.advanceTimersByTime(0)
    seen.push(region.node.textContent)
    region.say('Copied')
    seen.push(region.node.textContent)
    jest.advanceTimersByTime(0)
    seen.push(region.node.textContent)
    expect(seen).toEqual(['Copied', '', 'Copied'])
  })

  test('nothing to say empties the region rather than announcing an empty string', () => {
    const region = announcer(host())
    region.say('Copied')
    jest.advanceTimersByTime(0)
    region.say('')
    expect(region.node.textContent).toBe('')
    jest.advanceTimersByTime(50)
    expect(region.node.textContent).toBe('')
  })

  test('a second call adopts the region already there instead of adding another', () => {
    // Called from a lifecycle callback that can run more than once - a page moving the
    // element, a framework re-attaching it - and two live regions saying the same thing is
    // the sentence read twice.
    const parent = host()
    const first = announcer(parent, { className: 'x-status' })
    const second = announcer(parent, { className: 'x-status' })
    expect(second.node).toBe(first.node)
    expect(parent.querySelectorAll('.x-status')).toHaveLength(1)
  })

  test('the class, the role and the delay are the callers to make', () => {
    const region = announcer(host(), { className: 'loud', role: 'alert', delay: 200 })
    expect(region.node.className).toBe('loud')
    expect(region.node.getAttribute('role')).toBe('alert')
    region.say('Gone wrong')
    jest.advanceTimersByTime(199)
    expect(region.node.textContent).toBe('')
    jest.advanceTimersByTime(1)
    expect(region.node.textContent).toBe('Gone wrong')
  })

  test('a message still in the air when the element goes is a message nobody is waiting for', () => {
    const region = announcer(host(), { delay: 100 })
    region.say('too late')
    region.destroy()
    jest.advanceTimersByTime(500)
    expect(region.node.textContent).toBe('')
  })

  test('clearing takes the region back to empty at once', () => {
    const region = announcer(host())
    region.say('Copied')
    jest.advanceTimersByTime(0)
    region.clear()
    expect(region.node.textContent).toBe('')
  })
})
