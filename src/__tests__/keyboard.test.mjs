/**
 * Covered: what a shortcut spec means, which presses it does and does not match, where a
 * binding is allowed to fire, and how a sequence advances, restarts and expires.
 *
 * Not covered, deliberately: real IME composition and real key repeat, which jsdom does not
 * produce — the tests set `isComposing` and `repeat` on the event themselves, which proves
 * the branch and not the browser. Nor the platform read: `navigator.platform` is redefined
 * here, so what is tested is that `mod` follows it, not that any given browser reports what
 * we expect.
 */

import { jest } from '@jest/globals'
import {
  matchesShortcut,
  bindShortcut,
  bindSequence,
  konamiCode,
  watchInputIntent,
  isKeyboardIntent,
  EDITABLE
} from '../keyboard.mjs'

/** Pretends to be a Mac, or stops. jsdom leaves `navigator.platform` empty, so both ways are set here. */
function setPlatform(platform) {
  Object.defineProperty(navigator, 'platform', { value: platform, configurable: true })
}

/** A keydown built the way a browser builds one, `getModifierState` and all. */
function keydown(key, { code = '', ...modifiers } = {}) {
  const event = new KeyboardEvent('keydown', { key, code, bubbles: true, cancelable: true, ...modifiers })
  return event
}

/** Dispatches at an element and lets it bubble, which is where a real keydown starts. */
function press(target, key, options) {
  const event = keydown(key, options)
  target.dispatchEvent(event)
  return event
}

beforeEach(() => {
  setPlatform('Win32')
  document.body.innerHTML = `
    <div id="editor"><textarea id="body"></textarea></div>
    <input id="loose" type="text">
    <p id="prose">not a field</p>
  `
})

describe('matchesShortcut', () => {
  test('matches the press the spec names', () => {
    expect(matchesShortcut(keydown('k', { ctrlKey: true }), 'mod+k')).toBe(true)
    expect(matchesShortcut(keydown('Escape'), 'Escape')).toBe(true)
  })

  test('the key is compared without case, so mod+K does not secretly demand shift', () => {
    expect(matchesShortcut(keydown('K', { ctrlKey: true }), 'mod+k')).toBe(true)
    expect(matchesShortcut(keydown('k', { ctrlKey: true }), 'mod+K')).toBe(true)
  })

  // The bug this function exists to make unwriteable: Ctrl+Shift+K opens the web console in
  // two browsers, and a hand-written check that tests the modifiers it thought of will take
  // it. Every modifier is tested, not every modifier the author remembered.
  test('a modifier the spec did not name must be up', () => {
    expect(matchesShortcut(keydown('k', { ctrlKey: true, shiftKey: true }), 'mod+k')).toBe(false)
    expect(matchesShortcut(keydown('k', { ctrlKey: true, altKey: true }), 'mod+k')).toBe(false)
    expect(matchesShortcut(keydown('k'), 'mod+k')).toBe(false)
    expect(matchesShortcut(keydown('k', { ctrlKey: true, shiftKey: true }), 'mod+shift+k')).toBe(true)
  })

  test('mod is the platform key: Command on Apple, Control everywhere else', () => {
    setPlatform('MacIntel')
    expect(matchesShortcut(keydown('k', { metaKey: true }), 'mod+k')).toBe(true)
    expect(matchesShortcut(keydown('k', { ctrlKey: true }), 'mod+k')).toBe(false)

    setPlatform('Win32')
    expect(matchesShortcut(keydown('k', { ctrlKey: true }), 'mod+k')).toBe(true)
    expect(matchesShortcut(keydown('k', { metaKey: true }), 'mod+k')).toBe(false)
  })

  // Why `mod` has to exist: macOS keeps the Emacs bindings live inside every text field, so
  // binding literal Control on a Mac is ordinary, and `cmd`/`ctrl` meaning "whichever this
  // machine calls primary" would make it unsayable.
  test('cmd and ctrl stay literal, so a mac binding can still mean the Control key', () => {
    setPlatform('MacIntel')
    expect(matchesShortcut(keydown('e', { ctrlKey: true }), 'ctrl+e')).toBe(true)
    expect(matchesShortcut(keydown('e', { metaKey: true }), 'ctrl+e')).toBe(false)
    expect(matchesShortcut(keydown('e', { metaKey: true }), 'cmd+e')).toBe(true)
  })

  test('every spelling of a modifier reaches the same modifier', () => {
    const event = keydown('k', { metaKey: true })
    for (const spec of ['meta+k', 'cmd+k', 'command+k', 'super+k', 'win+k']) {
      expect(matchesShortcut(event, spec)).toBe(true)
    }
    const alt = keydown('k', { altKey: true })
    for (const spec of ['alt+k', 'option+k', 'opt+k', 'ALT+K']) {
      expect(matchesShortcut(alt, spec)).toBe(true)
    }
  })

  // On macOS Alt rewrites the character — Alt+K arrives as `˚` — so a spec naming the letter
  // can never match one. The physical key is the way to say it.
  test('a key can be named by its code, for layouts where a modifier rewrites the character', () => {
    const event = keydown('˚', { altKey: true, code: 'KeyK' })
    expect(matchesShortcut(event, 'alt+k')).toBe(false)
    expect(matchesShortcut(event, 'alt+KeyK')).toBe(true)
  })

  test('a plus sign is a key like any other', () => {
    expect(matchesShortcut(keydown('+', { ctrlKey: true }), 'mod++')).toBe(true)
    expect(matchesShortcut(keydown('+'), '+')).toBe(true)
  })

  // A spec that resolves to nothing is a shortcut that can never fire and never says why.
  test('a spec naming no key, or a modifier that is not one, throws where it was written', () => {
    expect(() => matchesShortcut(keydown('k'), 'mod+')).toThrow(TypeError)
    expect(() => matchesShortcut(keydown('k'), 'mdo+k')).toThrow(/unknown modifier/)
    expect(() => matchesShortcut(keydown('k'), '')).toThrow(TypeError)
    expect(() => matchesShortcut(keydown('k'), null)).toThrow(TypeError)
  })
})

describe('bindShortcut', () => {
  test('runs the handler on the press, takes the key off the browser, and unbinds', () => {
    const handler = jest.fn()
    const unbind = bindShortcut('mod+k', handler)

    const event = press(document.getElementById('prose'), 'k', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(event.defaultPrevented).toBe(true)

    unbind()
    press(document.getElementById('prose'), 'k', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('preventDefault false leaves the key with the browser', () => {
    bindShortcut('mod+j', () => {}, { preventDefault: false })
    const event = press(document.getElementById('prose'), 'j', { ctrlKey: true })
    expect(event.defaultPrevented).toBe(false)
  })

  // The editor case: the binding is wanted precisely where a page-level one is not.
  test('when narrows a binding to one part of the page', () => {
    const handler = jest.fn()
    bindShortcut('mod+b', handler, { when: '#editor' })

    press(document.getElementById('body'), 'b', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)

    press(document.getElementById('prose'), 'b', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('except keeps a binding out of the places a person types', () => {
    const handler = jest.fn()
    bindShortcut('/', handler, { except: EDITABLE })

    press(document.getElementById('prose'), '/')
    expect(handler).toHaveBeenCalledTimes(1)

    press(document.getElementById('loose'), '/')
    press(document.getElementById('body'), '/')
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('a held key repeats only when asked, and a key mid-composition never counts', () => {
    const handler = jest.fn()
    bindShortcut('mod+k', handler)
    document.getElementById('prose').dispatchEvent(keydown('k', { ctrlKey: true, repeat: true }))
    expect(handler).not.toHaveBeenCalled()

    const composing = keydown('k', { ctrlKey: true, isComposing: true })
    document.getElementById('prose').dispatchEvent(composing)
    expect(handler).not.toHaveBeenCalled()

    const loud = jest.fn()
    bindShortcut('mod+k', loud, { allowRepeat: true })
    document.getElementById('prose').dispatchEvent(keydown('k', { ctrlKey: true, repeat: true }))
    expect(loud).toHaveBeenCalledTimes(1)
  })

  test('a malformed spec throws when it is bound, not on the first press', () => {
    expect(() => bindShortcut('mdo+k', () => {})).toThrow(/unknown modifier/)
  })
})

describe('bindSequence / konamiCode', () => {
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']

  const type = (keys, target = document.getElementById('prose')) =>
    keys.forEach((key) => press(target, key))

  beforeEach(() => { jest.useFakeTimers() })
  afterEach(() => { jest.useRealTimers() })

  test('fires only after every step, in order', () => {
    const handler = jest.fn()
    bindSequence(['g', 'i'], handler)

    type(['g'])
    expect(handler).not.toHaveBeenCalled()
    type(['i'])
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('a step out of order gets nothing', () => {
    const handler = jest.fn()
    bindSequence(['g', 'i'], handler)
    type(['i', 'g'])
    expect(handler).not.toHaveBeenCalled()
  })

  // The `↑ ↑ ↑ ↓` case: the third arrow breaks the run and starts a new one at the same
  // time, and a matcher that only reset would throw it away and need a fourth.
  test('a wrong key restarts the run, and is then tried as its first step', () => {
    const handler = jest.fn()
    bindSequence(['a', 'b', 'c'], handler)
    type(['a', 'b', 'a', 'b', 'c'])
    expect(handler).toHaveBeenCalledTimes(1)
  })

  test('a partial run forgets itself once the timeout passes', () => {
    const handler = jest.fn()
    bindSequence(['g', 'i'], handler, { timeout: 500 })

    type(['g'])
    jest.advanceTimersByTime(499)
    type(['i'])
    expect(handler).toHaveBeenCalledTimes(1)

    type(['g'])
    jest.advanceTimersByTime(500)
    type(['i'])
    expect(handler).toHaveBeenCalledTimes(1)
  })

  // A step with a modifier arrives as two keydowns — one for the modifier, one for the key —
  // so a sequence that reset on the first could never hold a shortcut with a modifier in it.
  test('the modifier keys themselves pass through without breaking a run', () => {
    const handler = jest.fn()
    bindSequence(['g', 'mod+i'], handler)

    type(['g'])
    press(document.getElementById('prose'), 'Control', { ctrlKey: true })
    press(document.getElementById('prose'), 'i', { ctrlKey: true })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  // Every arrow press matches step one long before the sequence is anywhere near done, and
  // preventing that default would stop the page scrolling for everyone who never finishes.
  test('a matched step is left with the browser unless preventDefault is asked for', () => {
    bindSequence(['ArrowUp', 'ArrowUp'], () => {})
    expect(press(document.getElementById('prose'), 'ArrowUp').defaultPrevented).toBe(false)
  })

  test('unbinding stops it mid-run', () => {
    const handler = jest.fn()
    const unbind = bindSequence(['g', 'i'], handler)
    type(['g'])
    unbind()
    type(['i'])
    expect(handler).not.toHaveBeenCalled()
  })

  test('an empty sequence, or a malformed step, throws where it was written', () => {
    expect(() => bindSequence([], () => {})).toThrow(TypeError)
    expect(() => bindSequence(['g', 'mdo+i'], () => {})).toThrow(/unknown modifier/)
  })

  test('the konami code is the classic ten, and nothing shorter will do', () => {
    const handler = jest.fn()
    konamiCode(handler)

    type(KONAMI.slice(0, -1))
    expect(handler).not.toHaveBeenCalled()
    type(['a'])
    expect(handler).toHaveBeenCalledTimes(1)
  })
})

// The part `:focus-visible` cannot cover: a contenteditable matches that pseudo-class on a
// mouse click too, so anything deciding whether the person is on a keyboard has to watch
// the input itself.
describe('watchInputIntent / isKeyboardIntent', () => {
  const fire = (type, target = document) =>
    target.dispatchEvent(new Event(type, { bubbles: true, cancelable: true }))

  test('is pointer until proven otherwise, so focus on load is not mistaken for a Tab', () => {
    expect(isKeyboardIntent()).toBe(false)
  })

  test('a keypress means keyboard, a pointer means pointer', () => {
    watchInputIntent()
    fire('keydown')
    expect(isKeyboardIntent()).toBe(true)
    fire('pointerdown')
    expect(isKeyboardIntent()).toBe(false)
  })

  test('survives a handler that stops propagation, which is why it captures', () => {
    watchInputIntent()
    fire('keydown')
    const swallow = (event) => event.stopPropagation()
    document.body.addEventListener('pointerdown', swallow)
    fire('pointerdown', document.body)
    document.body.removeEventListener('pointerdown', swallow)
    expect(isKeyboardIntent()).toBe(false)
  })

  test('watches a document once, however many components ask', () => {
    watchInputIntent()
    const spy = jest.spyOn(document, 'addEventListener')
    watchInputIntent()
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
