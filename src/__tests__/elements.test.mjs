import { define, ElementBase, nextIndex, stepIndex, typeAheadIndex, fits, placeFlyout, placeSubmenu } from '../elements.mjs'

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
