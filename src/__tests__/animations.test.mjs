import { jest } from '@jest/globals'
import { slide } from '../animations.mjs'
import { getTransitionDuration } from '../dom.mjs'
import { prefersReducedMotion } from '../browser.mjs'

function element(transitionProperty, transitionDuration) {
  const el = document.createElement('div')
  if (transitionProperty) el.style.transitionProperty = transitionProperty
  if (transitionDuration) el.style.transitionDuration = transitionDuration
  document.body.appendChild(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
  delete window.matchMedia
})

describe('getTransitionDuration', () => {
  test('reads the duration belonging to the property', () => {
    expect(getTransitionDuration(element('height', '0.25s'), 'height')).toBe(250)
    expect(getTransitionDuration(element('opacity, height', '1s, 100ms'), 'height')).toBe(100)
  })

  test('repeats a short duration list, as CSS does', () => {
    expect(getTransitionDuration(element('opacity, height', '0.5s'), 'height')).toBe(500)
  })

  test('resolves the `all` keyword, which names no property but covers every one', () => {
    expect(getTransitionDuration(element('all', '0.3s'), 'height')).toBe(300)
  })

  test('reads an untransitioned property as no animation', () => {
    expect(getTransitionDuration(element('opacity', '1s'), 'height')).toBe(0)
    expect(getTransitionDuration(element('none', '0s'), 'height')).toBe(0)
    expect(getTransitionDuration(element(), 'height')).toBe(0)
  })
})

describe('prefersReducedMotion', () => {
  test('is false when matchMedia says the user expressed no preference', () => {
    window.matchMedia = () => ({ matches: false })
    expect(prefersReducedMotion()).toBe(false)
  })

  test('is true when the media query matches', () => {
    window.matchMedia = (query) => ({ matches: query === '(prefers-reduced-motion: reduce)' })
    expect(prefersReducedMotion()).toBe(true)
  })
})

describe('slide', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    window.matchMedia = () => ({ matches: false })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('clips and pins the height while animating, then hands the box back', () => {
    const el = element('height', '0.25s')
    const callback = jest.fn()

    slide(el, 120, false, callback)
    expect(el.style.overflow).toBe('hidden')
    expect(el.style.height).toBe('0px')
    expect(callback).not.toHaveBeenCalled()

    jest.advanceTimersByTime(300)
    expect(el.style.height).toBe('')
    expect(el.style.overflow).toBe('')
    expect(callback).toHaveBeenCalledWith(el)
  })

  test('outlasts the transition it is timing, so the end is not cut off', () => {
    const el = element('height', '0.25s')
    const callback = jest.fn()

    slide(el, 0, true, callback)
    jest.advanceTimersByTime(250)
    expect(callback).not.toHaveBeenCalled() // still inside the grace

    jest.advanceTimersByTime(10)
    expect(callback).toHaveBeenCalled()
  })

  test('finishes immediately, and still calls back, without a height transition', () => {
    const el = element('opacity', '1s')
    const callback = jest.fn()

    slide(el, 0, true, callback)
    expect(callback).toHaveBeenCalledWith(el)
    expect(el.style.height).toBe('')
    expect(el.style.overflow).toBe('')
  })

  test('does not animate when the user prefers reduced motion', () => {
    window.matchMedia = (query) => ({ matches: query === '(prefers-reduced-motion: reduce)' })
    const el = element('height', '0.25s')
    const callback = jest.fn()

    slide(el, 120, false, callback)
    expect(callback).toHaveBeenCalledWith(el)
    expect(el.style.height).toBe('')
  })

  test('an interrupting slide cancels the one it replaces, so only one callback lands', () => {
    const el = element('height', '0.25s')
    const closing = jest.fn()
    const opening = jest.fn()

    slide(el, 200, false, closing)
    jest.advanceTimersByTime(100)
    slide(el, 80, true, opening) // user clicked again mid-close
    jest.advanceTimersByTime(300)

    expect(closing).not.toHaveBeenCalled()
    expect(opening).toHaveBeenCalledWith(el)
  })

  test('is a no-op on a missing element', () => {
    expect(() => slide(null, 0, true, () => {})).not.toThrow()
  })
})
