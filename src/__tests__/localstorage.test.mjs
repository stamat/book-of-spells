import { jest } from '@jest/globals'
import {
  isLocalStorageAvailable,
  _resetLocalStorageSupportCheck,
  isExpired,
  getLocal,
  setLocal,
  updateLocal,
  removeLocal
} from '../localstorage.mjs'

beforeEach(() => {
  localStorage.clear()
  _resetLocalStorageSupportCheck()
})

test('isLocalStorageAvailable', () => {
  expect(isLocalStorageAvailable()).toBe(true)
})

test('isLocalStorageAvailable caches result', () => {
  expect(isLocalStorageAvailable()).toBe(true)

  const spy = jest.spyOn(Storage.prototype, 'setItem')
  expect(isLocalStorageAvailable()).toBe(true)
  expect(spy).not.toHaveBeenCalled()
  spy.mockRestore()
})

test('isLocalStorageAvailable returns false when localStorage throws', () => {
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError')
  })

  expect(isLocalStorageAvailable()).toBe(false)
  spy.mockRestore()
})

test('_resetLocalStorageSupportCheck resets cached check', () => {
  isLocalStorageAvailable()
  _resetLocalStorageSupportCheck()

  const spy = jest.spyOn(Storage.prototype, 'setItem')
  isLocalStorageAvailable()
  expect(spy).toHaveBeenCalledWith('localStorage:test', 'value')
  spy.mockRestore()
})

test('isExpired', () => {
  const now = Date.now()
  expect(isExpired(now - 1000, 500)).toBe(true)
  expect(isExpired(now - 500, 1000)).toBe(false)
  expect(isExpired(now, 1000)).toBe(false)
})

test('setLocal stores value in envelope', () => {
  setLocal('key', 'hello')
  const raw = JSON.parse(localStorage.getItem('key'))
  expect(raw).toHaveProperty('value', 'hello')
  expect(raw).toHaveProperty('__storedAt')
  expect(typeof raw.__storedAt).toBe('number')
  expect(raw.__ttl).toBeUndefined()
})

test('setLocal stores envelope with TTL', () => {
  setLocal('key', 'hello', 5000)
  const raw = JSON.parse(localStorage.getItem('key'))
  expect(raw).toHaveProperty('value', 'hello')
  expect(raw).toHaveProperty('__storedAt')
  expect(raw).toHaveProperty('__ttl', 5000)
})

test('setLocal returns the value', () => {
  expect(setLocal('key', 42)).toBe(42)
  expect(setLocal('key', 'hello')).toBe('hello')
  const obj = { foo: 'bar' }
  expect(setLocal('key', obj)).toBe(obj)
})

test('setLocal stores various types', () => {
  setLocal('num', 42)
  expect(getLocal('num')).toBe(42)

  setLocal('bool', true)
  expect(getLocal('bool')).toBe(true)

  setLocal('arr', [1, 2, 3])
  expect(getLocal('arr')).toEqual([1, 2, 3])

  setLocal('obj', { a: 1, b: { c: 2 } })
  expect(getLocal('obj')).toEqual({ a: 1, b: { c: 2 } })

  setLocal('nil', null)
  expect(getLocal('nil')).toBe(null)
})

test('setLocal returns null when localStorage is unavailable', () => {
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError')
  })
  _resetLocalStorageSupportCheck()

  expect(setLocal('key', 'value')).toBe(null)
  spy.mockRestore()
})

test('setLocal returns null when JSON.stringify fails', () => {
  isLocalStorageAvailable()
  const circular = {}
  circular.self = circular

  expect(setLocal('key', circular)).toBe(null)
})

test('getLocal retrieves stored value', () => {
  setLocal('key', 'hello')
  expect(getLocal('key')).toBe('hello')
})

test('getLocal returns null for non-existent key', () => {
  expect(getLocal('nonexistent')).toBe(null)
})

test('getLocal returns null when localStorage is unavailable', () => {
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError')
  })
  _resetLocalStorageSupportCheck()

  expect(getLocal('key')).toBe(null)
  spy.mockRestore()
})

test('getLocal handles expired TTL', () => {
  const envelope = {
    value: 'expired',
    __storedAt: Date.now() - 2000,
    __ttl: 1000
  }
  localStorage.setItem('key', JSON.stringify(envelope))

  expect(getLocal('key')).toBe(null)
  expect(localStorage.getItem('key')).toBe(null)
})

test('getLocal returns value when TTL not expired', () => {
  const envelope = {
    value: 'fresh',
    __storedAt: Date.now(),
    __ttl: 60000
  }
  localStorage.setItem('key', JSON.stringify(envelope))

  expect(getLocal('key')).toBe('fresh')
})

test('getLocal returns value from envelope without TTL', () => {
  const envelope = {
    value: 'no-ttl',
    __storedAt: Date.now()
  }
  localStorage.setItem('key', JSON.stringify(envelope))

  expect(getLocal('key')).toBe('no-ttl')
})

test('getLocal handles legacy non-envelope JSON', () => {
  localStorage.setItem('legacy', JSON.stringify({ foo: 'bar' }))
  expect(getLocal('legacy')).toEqual({ foo: 'bar' })

  localStorage.setItem('legacy-arr', JSON.stringify([1, 2, 3]))
  expect(getLocal('legacy-arr')).toEqual([1, 2, 3])
})

test('getLocal removes and returns null for invalid JSON', () => {
  localStorage.setItem('bad', 'not json {{{')
  expect(getLocal('bad')).toBe(null)
  expect(localStorage.getItem('bad')).toBe(null)
})

test('removeLocal removes item', () => {
  setLocal('key', 'hello')
  expect(getLocal('key')).toBe('hello')

  removeLocal('key')
  expect(getLocal('key')).toBe(null)
})

test('removeLocal does nothing when localStorage is unavailable', () => {
  setLocal('key', 'hello')

  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError')
  })
  _resetLocalStorageSupportCheck()

  removeLocal('key')
  spy.mockRestore()

  _resetLocalStorageSupportCheck()
  expect(getLocal('key')).toBe('hello')
})

test('updateLocal preserves __storedAt and __ttl', () => {
  setLocal('key', 'old', 60000)
  const rawBefore = JSON.parse(localStorage.getItem('key'))

  updateLocal('key', 'new')
  const rawAfter = JSON.parse(localStorage.getItem('key'))

  expect(getLocal('key')).toBe('new')
  expect(rawAfter.__storedAt).toBe(rawBefore.__storedAt)
  expect(rawAfter.__ttl).toBe(rawBefore.__ttl)
})

test('updateLocal preserves envelope without TTL', () => {
  setLocal('key', 'old')
  const rawBefore = JSON.parse(localStorage.getItem('key'))

  updateLocal('key', 'new')
  const rawAfter = JSON.parse(localStorage.getItem('key'))

  expect(getLocal('key')).toBe('new')
  expect(rawAfter.__storedAt).toBe(rawBefore.__storedAt)
  expect(rawAfter.__ttl).toBeUndefined()
})

test('updateLocal falls back to setLocal for non-existent key', () => {
  expect(updateLocal('missing', 'value')).toBe('value')
  expect(getLocal('missing')).toBe('value')
})

test('updateLocal falls back to setLocal for legacy non-envelope data', () => {
  localStorage.setItem('legacy', JSON.stringify({ foo: 'bar' }))

  updateLocal('legacy', 'new')
  const raw = JSON.parse(localStorage.getItem('legacy'))

  expect(getLocal('legacy')).toBe('new')
  expect(raw).toHaveProperty('__storedAt')
})

test('updateLocal returns null for expired item', () => {
  const envelope = {
    value: 'old',
    __storedAt: Date.now() - 2000,
    __ttl: 1000
  }
  localStorage.setItem('key', JSON.stringify(envelope))

  expect(updateLocal('key', 'new')).toBe(null)
  expect(localStorage.getItem('key')).toBe(null)
})

test('updateLocal returns null when localStorage is unavailable', () => {
  const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceededError')
  })
  _resetLocalStorageSupportCheck()

  expect(updateLocal('key', 'value')).toBe(null)
  spy.mockRestore()
})

test('setLocal and getLocal roundtrip with falsy values', () => {
  setLocal('zero', 0)
  expect(getLocal('zero')).toBe(0)

  setLocal('empty', '')
  expect(getLocal('empty')).toBe('')

  setLocal('false', false)
  expect(getLocal('false')).toBe(false)
})
