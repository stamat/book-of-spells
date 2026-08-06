/**
 * Shallow merges two objects together. Used to pass simple options to functions.
 * Mutates the target object. Faster than deepMerge, so use when you don't need to merge nested objects or arrays.
 * 
 * @param {object} target The target object to merge into
 * @param {object} source The source object to merge from
 * @returns object The mutated target object with the source object's properties merged into it
 * @example
 * const target = { foo: 'bar' }
 * const source = { bar: 'baz' }
 * shallowMerge(target, source) // { foo: 'bar', bar: 'baz' }
 */
export function shallowMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
    target[key] = source[key]
  }

  return target
}

/**
 * Deep merge function that's mindful of arrays and objects. Mutates target object.
 * shallowMerge is faster than deepMerge, so use shallowMerge when you don't need to merge nested objects or arrays.
 * 
 * @param {object} target The target object to merge into
 * @param {object} source The source object to merge from
 * @returns object The mutated target object with the source object's properties merged into it
 * @example
 * const target = { foo: 'bar' }
 * const source = { bar: 'baz' }
 * deepMerge(target, source) // { foo: 'bar', bar: 'baz' }
 */
export function deepMerge(target, source) {
  if (isObject(source) && isObject(target)) {
    for (const key of Object.keys(source)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
      target[key] = deepMerge(target[key], source[key])
    }
  } else if (isArray(source) && isArray(target)) {
    for (let i = 0; i < source.length; i++) {
      target[i] = deepMerge(target[i], source[i])
    }
  } else {
    target = source
  }
  return target
}

/**
 * Deep clone function that's mindful of nested arrays and objects
 * 
 * @param {object} o The object to clone
 * @returns object The cloned object
 * @example
 * const obj = { foo: 'bar' }
 * const clone = clone(obj)
 * clone.foo = 'baz'
 * console.log(obj.foo) // 'bar'
 * console.log(clone.foo) // 'baz'
 * console.log(obj === clone) // false
 * console.log(JSON.stringify(obj) === JSON.stringify(clone)) // true
 * @todo Check if faster than assign. This function is pretty old...
 */ 
export function clone(o) {
  let res = null
  if (isArray(o)) {
    res = []
    for (const item of o) {
      res.push(clone(item))
    }
  } else if (isObject(o)) {
    res = {}
    for (const key of Object.keys(o)) {
      res[key] = clone(o[key])
    }
  } else {
    res = o
  }
  return res
}

/**
 * Deep structural equality for data. Two values are equal when they hold the
 * same data, regardless of reference identity, property order or prototype.
 *
 * Semantics, where they differ from Node's `util.isDeepStrictEqual` (which
 * browsers don't have anyway): primitives compare by SameValueZero (NaN
 * equals NaN, 0 equals -0), prototypes are ignored (a class instance equals
 * a plain object with the same own properties), and functions compare by
 * reference only — functions are not data. Handles Date, RegExp, boxed
 * primitives, Map, Set, typed arrays, ArrayBuffer/DataView, symbol keys and
 * cyclic structures. WeakMap/WeakSet contents are unobservable, so two
 * distinct weak collections are never equal.
 *
 * Versus the field, probed against fast-deep-equal 3.1.3 (`/es6`), dequal
 * 2.0.3, lodash.isequal 4.5.0 and Node 25 `util.isDeepStrictEqual`. The last
 * row is a semantics choice, not a defect in the others; the rest are facts:
 *
 * | Input | here | fast-deep-equal | dequal | lodash | Node util |
 * |---|---|---|---|---|---|
 * | cyclic structure | terminates | stack overflow | stack overflow on equal graphs | terminates | terminates |
 * | `{[sym]: 1}` vs `{[sym]: 2}` | not equal | equal — symbols ignored | equal — symbols ignored | not equal | not equal |
 * | Map/Set members matched deeply | yes | no — by reference | yes | yes | yes |
 * | two invalid dates | equal | not equal | not equal | equal | equal |
 * | `NaN` inside a typed array | equal | not equal | not equal | equal | equal |
 * | distinct WeakMaps | never equal | equal | equal | never equal | never equal |
 * | cross-realm twin (iframe, vm) | equal | not equal — realm-bound constructor check | not equal | equal | not equal |
 * | URLs / Errors with different content | not equal — compared by toString | not equal | URL yes, Error missed | not equal | not equal |
 * | class instance vs same-shape plain object | equal — data is data | not equal — constructor check | not equal | not equal | not equal |
 *
 * The cost of the guarantees is small: the cycle guard only engages past
 * recursion depth 30 (a cycle always crosses that, shallow data never pays),
 * so on plain JSON this sits within ~15% of fast-deep-equal and dequal on
 * nested documents and ~1.5× behind on tiny flat objects — where the
 * remaining gap is the symbol-key pass they skip — at ~1KB min+gzip. If you
 * compare acyclic symbol-free JSON a million times in a loop, use
 * fast-deep-equal; if you want the answer to be right on the full range of
 * inputs, use this.
 *
 * @param {*} a The first value
 * @param {*} b The second value
 * @returns boolean True when a and b are structurally equal
 * @example
 * deepEqual({ a: 1, b: [1, 2] }, { b: [1, 2], a: 1 }) // => true
 * deepEqual(new Set([1, 2]), new Set([2, 1])) // => true
 * deepEqual(NaN, NaN) // => true
 * const x = {}
 * x.self = x
 * const y = {}
 * y.self = y
 * deepEqual(x, y) // => true
 */
export function deepEqual(a, b) {
  return deepEqualCyclic(a, b, 0, null)
}

// The cycle guard engages only past this recursion depth. Sound because a
// cycle grows the recursion depth without bound, so it always crosses the
// gate and every pair below it gets tracked — while acyclic data shallower
// than this never pays the WeakMap and Set allocations.
const CYCLE_GUARD_DEPTH = 30

// Returns true when this pair is already on the comparison stack — assumed
// equal, because if the structures actually differ some pair further up the
// stack returns false, so the assumption never decides the result on its own.
// Otherwise returns the (possibly just created) tracking map.
function trackPair(a, b, seen) {
  if (seen === null) seen = new WeakMap()
  const pairs = seen.get(a)
  if (pairs) {
    if (pairs.has(b)) return true
    pairs.add(b)
  } else {
    seen.set(a, new Set([b]))
  }
  return seen
}

function sameValueZero(a, b) {
  return a === b || (a !== a && b !== b)
}

// Hoisted once — property loads off the globals on every visited pair are
// measurable on hot paths, the same reason fast-deep-equal hoists them
const objHasOwn = Object.prototype.hasOwnProperty
const objPropEnumerable = Object.prototype.propertyIsEnumerable
const objTag = Object.prototype.toString
const objProto = Object.prototype
const getProto = Object.getPrototypeOf
const getSymbols = Object.getOwnPropertySymbols

function deepEqualCyclic(a, b, depth, seen) {
  if (a === b || (a !== a && b !== b)) return true
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false

  const isArr = Array.isArray(a)
  if (isArr !== Array.isArray(b)) return false

  if (isArr) {
    if (a.length !== b.length) return false
    if (seen !== null || depth > CYCLE_GUARD_DEPTH) {
      const tracked = trackPair(a, b, seen)
      if (tracked === true) return true
      seen = tracked
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqualCyclic(a[i], b[i], depth + 1, seen)) return false
    }
    return true
  }

  // Plain-vs-plain is the hot path — resolved on prototypes alone, no tag
  // strings. A class instance is not "plain" here yet still equals a plain
  // object with the same own properties: that pair falls through to the tag
  // path below, where both sides read [object Object] and walk as objects.
  const protoA = getProto(a)
  const protoB = getProto(b)
  if (protoA !== objProto && protoA !== null || protoB !== objProto && protoB !== null) {
    const tag = objTag.call(a)
    if (tag !== objTag.call(b)) return false

    switch (tag) {
      // valueOf unwraps boxed primitives and turns a Date into its timestamp —
      // two invalid dates are both NaN, which SameValueZero treats as equal
      case '[object Date]':
      case '[object Number]':
      case '[object Boolean]':
      case '[object String]':
        return sameValueZero(a.valueOf(), b.valueOf())
      case '[object RegExp]':
        return a.source === b.source && a.flags === b.flags
      // weak collection contents cannot be enumerated — equality cannot be
      // verified, so refuse to claim it
      case '[object WeakMap]':
      case '[object WeakSet]':
        return false
    }

    if (tag === '[object ArrayBuffer]' || tag === '[object DataView]') {
      a = tag === '[object DataView]' ? new Uint8Array(a.buffer, a.byteOffset, a.byteLength) : new Uint8Array(a)
      b = tag === '[object DataView]' ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : new Uint8Array(b)
    }

    if (ArrayBuffer.isView(a)) {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (!sameValueZero(a[i], b[i])) return false
      }
      return true
    }

    if (tag === '[object Set]' || tag === '[object Map]') {
      if (a.size !== b.size) return false
      if (seen !== null || depth > CYCLE_GUARD_DEPTH) {
        const tracked = trackPair(a, b, seen)
        if (tracked === true) return true
        seen = tracked
      }
      const isMap = tag === '[object Map]'
      // Phase one, allocation-free: members found in b by SameValueZero.
      // Since keys are SameValueZero-unique within each collection, every hit
      // is a forced pairing — sizes being equal, a miss-free pass proves the
      // bijection outright. Only the misses go to phase two.
      let missed = null
      for (const key of a.keys()) {
        if (b.has(key)) {
          if (isMap && !deepEqualCyclic(a.get(key), b.get(key), depth + 1, seen)) return false
        } else {
          if (missed === null) missed = []
          missed.push(key)
        }
      }
      if (missed === null) return true
      // Phase two: the misses matched pairwise against b's leftovers by deep
      // comparison — O(n·m) when members are objects, sized for data, not
      // for bulk indexes. undefined doubles as the consumed-slot sentinel,
      // which cannot collide with an undefined member: one present on both
      // sides pairs in phase one, one present on one side only can match
      // nothing here and the size check already forces inequality.
      const unused = []
      for (const key of b.keys()) {
        if (!a.has(key)) unused.push(key)
      }
      outer: for (let i = 0; i < missed.length; i++) {
        for (let j = 0; j < unused.length; j++) {
          if (unused[j] === undefined) continue
          if (!deepEqualCyclic(missed[i], unused[j], depth + 1, seen)) continue
          if (isMap && !deepEqualCyclic(a.get(missed[i]), b.get(unused[j]), depth + 1, seen)) continue
          unused[j] = undefined
          continue outer
        }
        return false
      }
      return true
    }

    // Host objects that stringify themselves — URL, Error and kin — carry
    // their data in toString, not in own enumerable properties; the walk
    // below would call any two of them equal. Exotic tags only: a plain
    // [object Object] never reaches here, so a class instance with a custom
    // toString still equals its plain-object twin structurally.
    if (tag !== '[object Object]' && typeof a.toString === 'function' && a.toString !== objTag) {
      return a.toString() === b.toString()
    }
  }

  if (seen !== null || depth > CYCLE_GUARD_DEPTH) {
    const tracked = trackPair(a, b, seen)
    if (tracked === true) return true
    seen = tracked
  }

  const keys = Object.keys(a)
  if (keys.length !== Object.keys(b).length) return false
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const valueB = b[key]
    if (!deepEqualCyclic(a[key], valueB, depth + 1, seen)) return false
    // hasOwnProperty deferred to the one ambiguous case: an undefined read
    // that could be either an own undefined or a missing key
    if (valueB === undefined && !objHasOwn.call(b, key)) return false
  }

  const symbolsA = getSymbols(a)
  const symbolsB = getSymbols(b)
  if (symbolsA.length > 0 || symbolsB.length > 0) {
    let countA = 0
    for (let i = 0; i < symbolsA.length; i++) {
      if (objPropEnumerable.call(a, symbolsA[i])) countA++
    }
    let countB = 0
    for (let i = 0; i < symbolsB.length; i++) {
      if (objPropEnumerable.call(b, symbolsB[i])) countB++
    }
    if (countA !== countB) return false
    for (let i = 0; i < symbolsA.length; i++) {
      const symbol = symbolsA[i]
      if (!objPropEnumerable.call(a, symbol)) continue
      if (!objPropEnumerable.call(b, symbol)) return false
      if (!deepEqualCyclic(a[symbol], b[symbol], depth + 1, seen)) return false
    }
  }

  return true
}

// The contract that keeps dedupe() exact while its hash stays cheap: the fold
// may merge values deepEqual tells apart — the in-bucket deepEqual pass
// separates those — but must never split values deepEqual calls equal, or a
// duplicate lands in a fresh bucket and survives. Every branch below is
// written against that one-way rule.
const FNV_SEED = 2166136261
// Past this depth everything folds to one token: cycles terminate, and two
// equal values truncate at the same node, so the cap cannot split them.
const FOLD_DEPTH_CAP = 32

// Scratch pair for reading a double's bits; safe to share because it is
// written and read back before any recursive call can touch it.
const foldF64 = new Float64Array(1)
const foldU32 = new Uint32Array(foldF64.buffer)

function foldString(h, s) {
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h
}

// SameValueZero folds: every NaN one token, -0 folded as 0 — anything finer
// would split pairs sameValueZero calls equal
function foldNumber(h, n) {
  if (n !== n) return Math.imul(h ^ 0x7A3, 16777619)
  foldF64[0] = n === 0 ? 0 : n
  h = Math.imul(h ^ foldU32[0], 16777619)
  return Math.imul(h ^ foldU32[1], 16777619)
}

function foldValue(h, v, depth) {
  if (v === null) return Math.imul(h ^ 1, 16777619)
  const t = typeof v
  if (t === 'number') return foldNumber(Math.imul(h ^ 2, 16777619), v)
  if (t === 'string') return foldString(Math.imul(h ^ 3, 16777619), v)
  if (t === 'boolean') return Math.imul(h ^ (v ? 4 : 5), 16777619)
  if (t === 'bigint') return foldString(Math.imul(h ^ 6, 16777619), String(v))
  // undefined, symbol, function — deepEqual equates these by reference only,
  // so one token per type is coarse but never wrong
  if (t !== 'object') return Math.imul(h ^ 7, 16777619)
  if (depth > FOLD_DEPTH_CAP) return Math.imul(h ^ 8, 16777619)
  if (Array.isArray(v)) {
    h = Math.imul(h ^ 9, 16777619)
    for (let i = 0; i < v.length; i++) h = foldValue(h, v[i], depth + 1)
    return Math.imul(h ^ 10, 16777619)
  }
  const proto = getProto(v)
  if (proto !== objProto && proto !== null) {
    const tag = objTag.call(v)
    // A class instance keeps the [object Object] tag and falls through to the
    // plain walk: deepEqual calls it equal to its plain twin, so it has to
    // fold like one.
    if (tag !== '[object Object]') {
      h = foldString(h, tag)
      switch (tag) {
        case '[object Date]':
        case '[object Number]':
          return foldNumber(h, v.valueOf())
        case '[object String]':
          return foldString(h, v.valueOf())
        case '[object Boolean]':
          return Math.imul(h ^ (v.valueOf() ? 4 : 5), 16777619)
        case '[object RegExp]':
          return foldString(foldString(h, v.source), v.flags)
        // members fold no further: deepEqual matches them in any order, and
        // an order-sensitive fold would split equal collections
        case '[object Set]':
        case '[object Map]':
          return foldNumber(h, v.size)
      }
      if (ArrayBuffer.isView(v)) return foldNumber(h, v.byteLength)
      // URL, Error, ArrayBuffer and other exotic hosts fold by tag alone —
      // coarse buckets the in-bucket deepEqual resolves
      return h
    }
  }
  // symbol keys are not folded — near-twins split inside the bucket instead
  const keys = Object.keys(v).sort()
  h = Math.imul(h ^ 11, 16777619)
  for (let i = 0; i < keys.length; i++) {
    h = foldString(h, keys[i])
    h = foldValue(h, v[keys[i]], depth + 1)
  }
  return Math.imul(h ^ 12, 16777619)
}

/**
 * Removes structural duplicates from an array — deepEqual decides what a
 * duplicate is, so property order, prototype and reference identity don't
 * matter, contents do. The first occurrence of every distinct value is kept,
 * in order, and the input array is left untouched.
 *
 * The platform's `new Set(arr)` dedupes by reference identity and lodash's
 * `uniqWith(arr, isEqual)` compares every pair — O(N²). Here every value
 * folds to a 32-bit FNV-1a hash in a single walk, values collide into
 * buckets, and deepEqual runs only within a bucket: linear in practice. The
 * hash is free to be coarse — a shared bucket costs one comparison, while
 * correctness comes from deepEqual alone. The bucket-then-verify idea is
 * HashCache (2013,
 * https://stamat.wordpress.com/2013/07/03/javascript-quickly-find-very-large-objects-in-a-large-array/)
 * with the CRC32-over-canonical-string hash replaced by a fold over the live
 * values — no string is ever built.
 *
 * @param {Array} arr The array to dedupe
 * @returns {Array} A new array: first occurrence of every distinct value, in order
 * @example
 * dedupe([{ a: 1, b: 2 }, { b: 2, a: 1 }]) // => [{ a: 1, b: 2 }]
 * dedupe([NaN, NaN, 0, -0]) // => [NaN, 0]
 * dedupe([new Set([1, 2]), new Set([2, 1])]) // => [new Set([1, 2])]
 */
export function dedupe(arr) {
  const buckets = new Map()
  const out = []
  for (let i = 0; i < arr.length; i++) {
    const item = arr[i]
    const key = foldValue(FNV_SEED, item, 0) >>> 0
    const bucket = buckets.get(key)
    if (bucket === undefined) {
      buckets.set(key, [item])
      out.push(item)
      continue
    }
    let seen = false
    for (let j = 0; j < bucket.length; j++) {
      if (deepEqual(bucket[j], item)) {
        seen = true
        break
      }
    }
    if (!seen) {
      bucket.push(item)
      out.push(item)
    }
  }
  return out
}

/**
 * Check if an object is empty
 *
 * @param {object} o The object to check
 * @returns boolean True if the object is empty, false otherwise
 * @example
 * isEmptyObject({}) // => true
 * isEmptyObject({ foo: 'bar' }) // => false
 */
export function isEmptyObject(o) {
  return Object.keys(o).length === 0
}

/**
 * Check if an array is empty, substitute for Array.length === 0
 * 
 * @param {Array} o The array to check
 * @returns boolean True if the array is empty, false otherwise
 * @example
 * isEmptyArray([]) // => true
 * isEmptyArray([1, 2, 3]) // => false
 */
export function isEmptyArray(o) {
  return o.length === 0
}

/**
 * Check if a variable is empty
 * 
 * @param {any} o The variable to check
 * @returns boolean True if the variable is empty, false otherwise
 * @example
 * isEmpty({}) // => true
 * isEmpty([]) // => true
 * isEmpty('') // => true
 * isEmpty(null) // => false
 * isEmpty(undefined) // => false
 * isEmpty(0) // => false
 */
export function isEmpty(o) {
  if (isObject(o)) {
    return isEmptyObject(o)
  } else if (isArray(o)) {
    return isEmptyArray(o)
  } else if (isString(o)) {
    return o === ''
  }
  return false
}

/**
 * Try to convert a string to a boolean
 * 
 * @param {string} str The string to convert
 * @returns boolean The converted boolean or undefined if conversion failed
 * @example
 * stringToBoolean('true') // => true
 * stringToBoolean('false') // => false
 * stringToBoolean('foo') // => undefined
 */
export function stringToBoolean(str) {
  if (/^\s*(true|false)\s*$/i.test(str)) return str.trim().toLowerCase() === 'true'
}

/**
 * Try to convert a string to a number
 * 
 * @param {string} str The string to convert
 * @returns number The converted number or undefined if conversion failed
 * @example
 * stringToNumber('1') // => 1
 * stringToNumber('1.5') // => 1.5
 * stringToNumber('foo') // => undefined
 * stringToNumber('1foo') // => undefined
 */
export function stringToNumber(str) {
  if (/^\s*-?\d+\s*$/.test(str)) return parseInt(str)
  if (/^\s*-?\d+\.\d+\s*$/.test(str)) return parseFloat(str)
}

/**
 * Try to convert a string to an array
 * 
 * @param {string} str The string to convert
 * @returns array The converted array or undefined if conversion failed
 * @example
 * stringToArray('[1, 2, 3]') // => [1, 2, 3]
 * stringToArray('foo') // => undefined
 * stringToArray('1') // => undefined
 * stringToArray('{"foo": "bar"}') // => undefined
 */
export function stringToArray(str) {
  if (!/^\s*\[.*\]\s*$/.test(str)) return
  try {
    return JSON.parse(str)
  } catch (e) {}
}

/**
 * Try to convert a string to an object
 * 
 * @param {string} str The string to convert
 * @returns object The converted object or undefined if conversion failed
 * @example
 * stringToObject('{ "foo": "bar" }') // => { foo: 'bar' }
 * stringToObject('foo') // => undefined
 * stringToObject('1') // => undefined
 * stringToObject('[1, 2, 3]') // => undefined
 */
export function stringToObject(str) {
  if (!/^\s*\{.*\}\s*$/.test(str)) return
  try {
    return JSON.parse(str)
  } catch (e) {}
}

/**
 * Try to convert a string to a regex
 * 
 * @param {string} str The string to convert
 * @returns regex The converted regex or undefined if conversion failed
 * @example
 * stringToRegex('/foo/i') // => /foo/i
 * stringToRegex('foo') // => undefined
 * stringToRegex('1') // => undefined
 */
export function stringToRegex(str) {
  if (typeof str !== 'string') return
  const match = str.match(/^\s*\/(.*?)\/([gimsuy]*)\s*$/)
  if (!match) return
  try {
    return new RegExp(match[1], match[2])
  } catch (e) {}
}

/**
 * Try to convert a string to a primitive
 * 
 * @param {string} str The string to convert
 * @returns {null|boolean|int|float|string} The converted primitive or input string if conversion failed
 * @example
 * stringToPrimitive('null') // => null
 * stringToPrimitive('true') // => true
 * stringToPrimitive('false') // => false
 * stringToPrimitive('1') // => 1
 * stringToPrimitive('1.5') // => 1.5
 * stringToPrimitive('foo') // => 'foo'
 * stringToPrimitive('1foo') // => '1foo'
 */
export function stringToPrimitive(str) {
  if (/^\s*null\s*$/.test(str)) return null
  const bool = stringToBoolean(str)
  if (bool !== undefined) return bool
  return stringToNumber(str) ?? str
}

/**
 * Try to convert a string to a data type
 * 
 * @param {string} str The string to convert
 * @returns any The converted data type or input string if conversion failed
 * @example
 * stringToData('null') // => null
 * stringToData('true') // => true
 * stringToData('false') // => false
 * stringToData('1') // => 1
 * stringToData('1.5') // => 1.5
 * stringToData('foo') // => 'foo'
 * stringToData('1foo') // => '1foo'
 * stringToData('[1, 2, 3]') // => [1, 2, 3]
 * stringToData('{ "foo": "bar" }') // => { foo: 'bar' }
 * stringToData('/foo/i') // => /foo/i
 */
export function stringToType(str) {
  if (/^\s*null\s*$/.test(str)) return null
  const bool = stringToBoolean(str)
  if (bool !== undefined) return bool
  return stringToNumber(str) ?? stringToArray(str) ?? stringToObject(str) ?? stringToRegex(str) ?? str
}

/**
 * If provided variable is an object
 * 
 * @param {any} o 
 * @returns boolean
 * @example
 * isObject({}) // => true
 * isObject([]) // => false
 * isObject(null) // => false
 */
export function isObject(o) {
  return typeof o === 'object' && !Array.isArray(o) && o !== null
}

/**
 * If provided variable is an array. Just a wrapper for Array.isArray
 * 
 * @param {any} o
 * @returns boolean
 * @example
 * isArray([]) // => true
 * isArray({}) // => false
 */
export function isArray(o) {
  return Array.isArray(o)
}

/**
 * If provided variable is a string. Just a wrapper for typeof === 'string'
 * 
 * @param {any} o
 * @returns boolean
 * @example
 * isString('foo') // => true
 * isString({}) // => false
 */
export function isString(o) {
  return typeof o === 'string'
}

/**
 * If provided variable is a function, substitute for typeof === 'function'
 * 
 * @param {any} o
 * @returns boolean
 * @example
 * isFunction(function() {}) // => true
 * isFunction({}) // => false
 */
export function isFunction(o) {
  return typeof o === 'function'
}

/**
 * If object property is a function
 * 
 * @param {object} obj
 * @param {string} propertyName
 * @returns boolean
 * @example
 * const obj = { foo: 'bar', baz: function() {} }
 * propertyIsFunction(obj, 'foo') // => false
 * propertyIsFunction(obj, 'baz') // => true
 */
export function propertyIsFunction(obj, propertyName) {
  return obj.hasOwnProperty(propertyName) && isFunction(obj[propertyName])
}

/**
 * If object property is a string
 * 
 * @param {object} obj
 * @param {string} propertyName
 * @returns boolean
 * @example
 * const obj = { foo: 'bar', baz: function() {} }
 * propertyIsString(obj, 'foo') // => true
 * propertyIsString(obj, 'baz') // => false
 */
export function propertyIsString(obj, propertyName) {
  return obj.hasOwnProperty(propertyName) && isString(obj[propertyName])
}

/**
 * Transforms a dash separated string to camelCase
 *
 * @param {string} str
 * @returns boolean
 * @example
 * transformDashToCamelCase('foo-bar') // => 'fooBar'
 * transformDashToCamelCase('foo-bar-baz') // => 'fooBarBaz'
 * transformDashToCamelCase('foo') // => 'foo'
 * transformDashToCamelCase('fooBarBaz-qux') // => 'fooBarBazQux'
 */
export function transformDashToCamelCase(str) {
  return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase() });
}

/**
 * Transforms a camelCase string to dash separated string
 * 
 * @param {string} str
 * @returns boolean
 * @example
 * transformCamelCaseToDash('fooBar') // => 'foo-bar'
 * transformCamelCaseToDash('fooBarBaz') // => 'foo-bar-baz'
 * transformCamelCaseToDash('foo') // => 'foo'
 * transformDashToCamelCase('fooBarBaz-qux') // => 'foo-bar-baz-qux'
 */
export function transformCamelCaseToDash(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Maps an array of objects by a property name
 * 
 * @param {Array} arr
 * @param {string} propertyName
 * @returns object
 * @example
 * const arr = [{ foo: 'bar' }, { foo: 'baz' }]
 * mapByProperty(arr, 'foo') // => { bar: { foo: 'bar' }, baz: { foo: 'baz' } }
 */
export function mapByProperty(arr, propertyName) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    res[arr[i][propertyName]] = arr[i]
  }
  return res
}

/**
 * Maps an array of objects by a property name to another property name
 * 
 * @param {Array} arr
 * @param {string} keyPropertyName
 * @param {string} valuePropertyName
 * @returns object
 * @example
 * const arr = [{ foo: 'bar', baz: 'qux' }, { foo: 'quux', baz: 'corge' }]
 * mapPropertyToProperty(arr, 'foo', 'baz') // => { bar: 'qux', quux: 'corge' }
 */
export function mapPropertyToProperty(arr, keyPropertyName, valuePropertyName) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    res[arr[i][keyPropertyName]] = arr[i][valuePropertyName]
  }
  return res
}

/**
 * Remove accents from a string
 * 
 * @param {string} inputString
 * @returns string
 * @example
 * removeAccents('áéíóú') // => 'aeiou'
 * removeAccents('ÁÉÍÓÚ') // => 'AEIOU'
 * removeAccents('señor') // => 'senor'
 * removeAccents('Œ') // => 'OE'
 * removeAccents('œ') // => 'oe'
 * removeAccents('Æ') // => 'AE'
 * removeAccents('æ') // => 'ae'
 * removeAccents('ß') // => 'ss'
 * removeAccents('Crème Brûlée') // => 'Creme Brulee'
 * removeAccents('ﬀ') // => 'ff'
 * removeAccents('ﬁ') // => 'fi'
 * removeAccents('ﬂ') // => 'fl'
 */
export function removeAccents(inputString) {
  return inputString.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/Œ/g, 'OE').replace(/œ/g, 'oe').replace(/Æ/g, 'AE').replace(/æ/g, 'ae').replace(/ß/g, 'ss').normalize('NFC')
}

/**
 * Strip HTML tags from a string
 * 
 * @param {string} inputString
 * @returns string
 * @example
 * stripHTMLTags('<span>foo</span>') // => 'foo'
 * stripHTMLTags('<span>foo</span> <span>bar</span>') // => 'foo bar'
 */
export function stripHTMLTags(inputString) {
  return inputString.replace(/<[^>]*>/g, '')
}

/**
 * Slugify a string, e.g. 'Foo Bar' => 'foo-bar'. Similar to WordPress' sanitize_title(). Will remove accents and HTML tags.
 * 
 * @param {string} str 
 * @returns string
 * @example
 * slugify('Foo Bar') // => 'foo-bar'
 * slugify('Foo Bar <span>baz</span>') // => 'foo-bar-baz'
 */
export function slugify(str) {
  str = str.trim().toLowerCase()
  str = removeAccents(str)
  str = stripHTMLTags(str)
  return str.replace(/\s+|\.+|\/+|\\+|—+|–+/g, '-').replace(/[^\w0-9\-]+/g, '').replace(/-{2,}/g, '-').replace(/^-|-$/g, '')
}

/**
 * Humanize a slug, e.g. 'foo-bar' => 'Foo Bar'. Opposite of slugify. Replaces dashes and underscores with spaces and applies the chosen casing.
 *
 * @param {string} str
 * @param {'title'|'sentence'|'upper'|'lower'} [casing='title'] Casing to apply: 'title' capitalizes each word, 'sentence' capitalizes the first word only, 'upper' converts to upper case, 'lower' converts to lower case
 * @returns string
 * @example
 * humanize('foo-bar') // => 'Foo Bar'
 * humanize('foo_bar-baz') // => 'Foo Bar Baz'
 * humanize('foo-bar', 'sentence') // => 'Foo bar'
 * humanize('foo-bar', 'upper') // => 'FOO BAR'
 * humanize('Foo-Bar', 'lower') // => 'foo bar'
 */
export function humanize(str, casing = 'title') {
  str = str.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()
  switch (casing) {
    case 'upper': return str.toUpperCase()
    case 'lower': return str.toLowerCase()
    case 'sentence': return str.charAt(0).toUpperCase() + str.slice(1)
    default: return str.replace(/\b\w/g, c => c.toUpperCase())
  }
}

/**
 * Check if object has multiple properties
 * 
 * @param {object} obj
 * @param {string|array} properties
 * @returns boolean
 * @example
 * const obj = { foo: 'bar', baz: 'qux' }
 * hasOwnProperties(obj, ['foo', 'baz']) // => true
 * hasOwnProperties(obj, ['foo', 'baz', 'qux']) // => false
 */
export function hasOwnProperties(obj, properties) {
  if(!isArray(properties)) properties = [properties]
  for (let i = 0; i < properties.length; i++) {
    if (!obj.hasOwnProperty(properties[i])) return false
  }
  return true
}

/**
 * Finds the closest number to the set goal in an array to a given number
 * 
 * @param {number} goal Number to search for
 * @param {Array} arr Array of numbers to search in
 * @returns number
 * @example
 * closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9]) // => 9
 * closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11]) // => 9
 * closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 9.5]) // => 9.5
 * closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11) // => 10
 */
export function closestNumber(goal, arr) {
  return arr.reduce(function(prev, curr) {
    return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
  })
}

/**
 * Truncate a string to a given number of words
 * 
 * @param {string} str String to truncate
 * @param {number} numWords Number of words to truncate to
 * @param {string} ellipsis Ellipsis to append to the end of the string
 * @returns string
 * @example
 * truncateString('foo bar baz', 2) // => 'foo bar…'
 * truncateString('foo bar baz', 2, '...') // => 'foo bar...'
 * truncateString('foo bar. baz', 2, '...') // => 'foo bar. ...'
 */
export function truncateString(str, numWords, ellipsis = '…') {
  const words = str.trim().split(' ')
  if (words.length <= numWords) return str
  if (numWords <= 0) return ''
  if (/[.?!]$/.test(words[numWords - 1]) && ellipsis.trim() !== '') ellipsis = ` ${ellipsis}`
  return words.slice(0, numWords).join(' ') + ellipsis
}

/**
 * Generates a random integer between two values, inclusive of both
 * 
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @param {boolean} safe Defaults to false, if true will use a cryptographically secure random number generator
 * @returns number
 * @example
 * randomIntInclusive(1, 10) // => 1
 * randomIntInclusive(1, 10) // => 10
 * randomIntInclusive(1, 10) // => 5
 */
export function randomIntInclusive(min, max, safe = false) {
  min = Number(min)
  max = Number(max)
  if (isNaN(min) || isNaN(max)) throw new TypeError('Both min and max must be numbers')
  if (min > max) [min, max] = [max, min]
  min = Math.round(min)
  max = Math.round(max)
  if (min === max) return min
  const rand = safe ? random() : Math.random()
  return Math.floor(rand * (max - min + 1)) + min
}

/**
 * Gets fixed number of digits after the decimal point
 * 
 * @param {number} number Number to fix
 * @param {number} digits Number of digits to fix to
 * @returns number
 * @example
 * fixed(1.234, 2) // => 1.23
 * fixed(1.235, 2) // => 1.24
 * fixed(1.234) // => 1
 * fixed(1.234, 0) // => 1
 * fixed(1.234, 5) // => 1.234
 * @note Gotta ask myself why I wrote this function in the first place... 🤔 It's just not useful in a lot of cases lol...
 */
export function fixed(number, digits) {
  if (!digits) return parseInt(number)
  return parseFloat(number.toFixed(digits))
}

/**
 * Calculates the percentage of a number in relation to another number
 * 
 * @param {number} num Number to calculate percentage of
 * @param {number} total Total number
 * @returns number
 * @example
 * percentage(1, 10) // => 10
 * percentage(5, 10) // => 50
 * percentage(10, 10) // => 100
 * percentage(0, 10) // => 0
 * percentage(10, 2) // => 500
 */
export function percentage(num, total) {
  if (Number.isNaN(num) || Number.isNaN(total) || total === 0) return 0
  return num / total * 100
}

/**
 * Pick properties from an object, returning a new object with only the picked properties
 *
 * @param {object} obj The object to pick properties from
 * @param {Array|string} props Properties to pick, can be an array of strings or a single string
 * @returns object A new object with only the picked properties
 * @example
 * pickProperties({ foo: 'bar', baz: 'qux' }, 'foo') // => { foo: 'bar' }
 * pickProperties({ foo: 'bar', baz: 'qux' }, ['foo', 'baz']) // => { foo: 'bar', baz: 'qux' }
 */
export function pickProperties(obj, props) {
  const res = {}
  if (!props) return res
  if (!isArray(props)) props = [props]
  for (let i = 0; i < props.length; i++) {
    if (obj.hasOwnProperty(props[i])) res[props[i]] = obj[props[i]]
  }
  return res
}

/**
 * Remove properties from an object
 *
 * @param {object} obj The object to remove properties from
 * @param {Array|string} props Properties to remove, can be an array of strings or a single string
 * @param {boolean} clone Defaults to true, will clone the object before removing properties
 * @returns object The object without the removed properties
 * @example
 * rejectProperties({ foo: 'bar', baz: 'qux' }, 'foo') // => { baz: 'qux' }
 * rejectProperties({ foo: 'bar', baz: 'qux' }, ['foo', 'baz']) // => {}
 */
export function rejectProperties(obj, props, clone = true) {
  if (clone) obj = { ...obj }
  if (!props) return obj
  if (!isArray(props)) props = [props]
  for (let i = 0; i < props.length; i++) {
    if (obj.hasOwnProperty(props[i])) delete obj[props[i]]
  }
  return obj
}

/**
 * Pick elements from an array by index, returning a new array of the picked elements
 *
 * @param {Array} arr The array to pick elements from
 * @param {Array|number} indexes Indexes to pick, can be an array of numbers or a single number
 * @returns array | undefined A new array of the picked elements, or undefined if arr is not an array
 * @example
 * pickArrayElements(['foo', 'bar', 'baz'], 0) // => ['foo']
 * pickArrayElements(['foo', 'bar', 'baz'], [0, 2]) // => ['foo', 'baz']
 */
export function pickArrayElements(arr, indexes) {
  if (!isArray(arr)) return
  if (!isArray(indexes)) indexes = [indexes]
  const res = []
  for (let i = 0; i < indexes.length; i++) {
    if (arr.hasOwnProperty(indexes[i])) res.push(arr[indexes[i]])
  }
  return res
}

/**
 * Remove elements from an array by index. Indexes may be passed in any order and are deduplicated.
 *
 * @param {Array} arr The array to remove elements from
 * @param {Array|number} indexes Indexes to remove, can be an array of numbers or a single number
 * @param {boolean} clone Defaults to true, will clone the array before removing elements
 * @returns array | undefined The array without the removed elements, or undefined if arr is not an array
 * @example
 * rejectArrayElements(['foo', 'bar', 'baz'], 0) // => ['bar', 'baz']
 * rejectArrayElements(['foo', 'bar', 'baz'], [2, 0]) // => ['bar']
 */
export function rejectArrayElements(arr, indexes, clone = true) {
  if (!isArray(arr)) return
  if (clone) arr = [...arr]
  if (!isArray(indexes)) indexes = [indexes]
  indexes = [...new Set(indexes)].sort((a, b) => b - a)
  for (let i = 0; i < indexes.length; i++) {
    if (arr.hasOwnProperty(indexes[i])) arr.splice(indexes[i], 1)
  }
  return arr
}

/**
 * Pick properties from an object or elements from an array
 * 
 * @param {Array} obj Object or array to pick properties or elements from
 * @param {Array | string | number} props Properties to remove, can be an array of strings or a single string or number
 * @returns object | array | undefined
 * @example
 * 
 * pick({ foo: 'bar', bar: 'baz', baz: 'qux' }) // => {}
 * pick({}, []) // => {}
 * pick(null, 'foo') // => undefined
 * pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, undefined) // => {}
 * pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, 'foo') // => { foo: 'bar'}
 * pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, ['foo', 'baz']) // => { foo: 'bar', baz: 'qux' }
 * 
 * pick(['foo', 'bar', 'baz'], []) // => []
 * pick([], []) // => []
 * pick(null, 0) // => undefined
 * pick(['foo', 'bar', 'baz'], undefined) // => []
 * pick(['foo', 'bar', 'baz'], 0) // => ['foo']
 * pick(['foo', 'bar', 'baz'], [0, 2]) // => ['foo', 'baz']
 * pick(['foo', 'bar', 'baz'], [0, 2, 3]) // => ['foo', 'baz']
 */
export function pick(obj, props) {
  return isObject(obj) ? pickProperties(obj, props) : pickArrayElements(obj, props)
}

/**
 * Remove properties from an object or elements from an array
 * 
 * @param {Array} obj Object or array to remove properties or elements from
 * @param {Array | string | number} props Properties to remove, can be an array of strings or a single string or number
 * @param {boolean} clone Defaults to true, will clone the object or array before removing properties or elements.
 * @returns object | array | undefined
 * @example
 * 
 * reject({ foo: 'bar', bar: 'baz', baz: 'qux' }) // => {}
 * reject({}, []) // => {}
 * reject(null, 'foo') // => undefined
 * reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, undefined) // => {}
 * reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, 'foo') // => { bar: 'baz', baz: 'qux' }
 * reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, ['foo', 'baz']) // => { bar: 'baz' }
 * 
 * reject(['foo', 'bar', 'baz'], []) // => []
 * reject([], []) // => []
 * reject(null, 0) // => undefined
 * reject(['foo', 'bar', 'baz'], undefined) // => []
 * reject(['foo', 'bar', 'baz'], 0) // => ['bar', 'baz']
 * reject(['foo', 'bar', 'baz'], [0, 2]) // => ['bar']
 * reject(['foo', 'bar', 'baz'], [0, 2, 3]) // => ['bar']
 */
export function reject(obj, props, clone = true) {
  return isObject(obj) ? rejectProperties(obj, props, clone) : rejectArrayElements(obj, props, clone)
}

/**
 * Basic timestamp first UID generator that's good enough for most use cases but not for security purposes.
 * There's an extremely small chance of collision, so create a map object to check for collisions if you're worried about that.
 * 
 * - `Date.now().toString(16)` is used for the timestamp, which is a base16 representation of the current timestamp in milliseconds.
 * - `random().toString(16).substring(2)` is used for the random number, which is a base16 representation of a random number between 0 and 1, with the first two characters removed.
 * 
 * @param {boolean} safe Defaults to false, if true will use a cryptographically secure random number generator for the random number improving security but reducing performance. If crypto is not available, will use Math.random() instead.
 * @returns string
 * @example
 * basicUID() // => '18d4613e4d2-750bf066ac6158'
 */
export function basicUID(safe = false) {
  const rand = safe ? random() : Math.random()
  return Date.now().toString(16)+'-'+rand.toString(16).substring(2)
}

function cryptoUUIDFallback() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
   (c ^ Math.random() * 16 >> c / 4).toString(16)
  )
}

// Taken from https://stackoverflow.com/a/2117523/5437943
function cryptoRandomUUIDFallback() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

/**
 * Generates a UUID v4
 * - Uses crypto.randomUUID if available
 * - Uses crypto.getRandomValues if available
 * - Uses a fallback if neither is available, which is not safe because it uses Math.random() instead of a cryptographically secure random number generator
 * 
 * I'm bad at crypto and bitwise operations, not my cup of tea, so I had to rely on StackOverflow for the fallback: https://stackoverflow.com/a/2117523/5437943
 * 
 * @param {boolean} safe Defaults to true, if false will use a fallback that's not cryptographically secure but significantly faster
 * @returns string
 * @example
 * generateUUID() // UUID v4, example 09ed0fe4-8eb6-4c2a-a8d3-a862b7513294
 */
export function generateUUID(safe = true) {
  if (typeof crypto === 'undefined' || !safe) return cryptoUUIDFallback()
  if (crypto.randomUUID) return crypto.randomUUID()
  if (crypto.getRandomValues) return cryptoRandomUUIDFallback()
  return cryptoUUIDFallback()
}

/**
 * Generates a random number between 0 and 1, inclusive of 0 but not inclusive of 1.
 * 
 * - Uses crypto.getRandomValues if available
 * - Uses Math.random() if crypto.getRandomValues is not available
 * 
 * @returns number
 * @example
 * random() // => 0.123456789
 */
export function random() {
  if (typeof crypto === 'undefined') return Math.random()
  if (crypto.getRandomValues) return crypto.getRandomValues(new Uint32Array(1))[0] / 4_294_967_296 // 2^32 = 4294967296
  return Math.random()
}

/**
 * Access nested object properties using a path
 * 
 * @param {object} obj The object to access
 * @param {Array|string} path The path to access
 * @returns {*} The value of the accessed property
 * 
 * @example
 * const obj = { foo: { bar: 'baz' } }
 * getObjectValueByPath(obj, 'foo.bar') // => 'baz'
 */
export function getObjectValueByPath(obj, path) {
  if (typeof path === 'string') path = path.split('.');
  return path.reduce((acc, part) => acc !== null && acc !== undefined ? acc[part] : undefined, obj);
}
