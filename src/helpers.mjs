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
 * Deep clone for data. The copy shares no mutable structure with the
 * original, the object graph survives — a value referenced twice is one
 * object in the copy too, and a cycle terminates — and prototypes are kept,
 * so a class instance clones into an instance of its class rather than a
 * plain object.
 *
 * The pair to {@link deepEqual}: whatever deepEqual reads as data, clone
 * reproduces, so `deepEqual(clone(x), x)` holds. Handles plain and
 * null-prototype objects, class instances, arrays including holes and
 * subclasses, Date, RegExp with its lastIndex, Map, Set, Error with its
 * non-enumerable message and stack, boxed primitives, ArrayBuffer, DataView
 * and typed arrays — views over one buffer clone into views over one buffer.
 *
 * **Anything it does not recognise is shared by reference, not copied** — a
 * function, a DOM node, a Promise, a WeakMap, a SharedArrayBuffer, a host
 * object. That is the difference worth having: `structuredClone` raises
 * DataCloneError on all of them, so it cannot touch an options object
 * carrying a callback or an element reference, which is most of the objects
 * a page actually holds. Reproducing a value it cannot inspect would be the
 * broken half-copy, so it shares instead — and never throws.
 *
 * Versus the field, from `bench/clone` against `structuredClone`, rfdc 1.4.1,
 * lodash 4.18.1, es-toolkit 1.50.0 and a JSON round-trip. rfdc is shown with
 * its defaults, which is what `rfdc()` gives you; `{circles: true}` buys it
 * the cycle row for 1–13%. The last four rows are semantics choices, not
 * defects in the others; the rest are data the copy either kept or lost:
 *
 * | Input | here | structuredClone | rfdc | lodash | es-toolkit | JSON |
 * |---|---|---|---|---|---|---|
 * | Date, Map, Set | cloned | cloned | cloned | cloned | cloned | `{}`, or an ISO string |
 * | RegExp | cloned | cloned | `{}` | cloned | cloned | `{}` |
 * | typed array, ArrayBuffer, DataView | cloned | cloned | `{}` | cloned | cloned | `{}` |
 * | two views over one buffer | one buffer | one buffer | lost | two buffers | two buffers | lost |
 * | cycle | terminates | terminates | stack overflow | terminates | terminates | TypeError |
 * | repeated reference | one object | one object | two objects | one object | one object | two objects |
 * | Error with an assigned `.code` | all of it | `.code` dropped | `.code` only | whole Error is `{}` | all of it | `.code` only |
 * | `undefined` value | kept | kept | kept | kept | kept | dropped |
 * | nesting 20,000 deep | RangeError | RangeError | RangeError | RangeError | RangeError | survives |
 * | function, Promise, WeakMap | shared | DataCloneError | function shared, rest lost | shared | shared | dropped |
 * | class instance | an instance | plain object | plain object | an instance | an instance | plain object |
 * | null-prototype object | kept null | gains `Object.prototype` | gains it | gains it | kept null | gains it |
 * | symbol key | kept | dropped | dropped | kept | kept | dropped |
 *
 * It recurses, so depth is bounded by the stack — 200 levels is nothing,
 * 20,000 throws. A JSON round-trip is the only column that survives that,
 * being a loop in C++, and it loses thirteen of the eighteen scored rows to
 * be there.
 *
 * The cost, on a flat eight-key object: rfdc 7.2M ops/s, this 4.0M,
 * es-toolkit 2.4M, lodash 2.0M, ramda 1.8M, a JSON round-trip 1.7M,
 * `structuredClone` 775k. rfdc leads the object shapes by 1.1–2.9×, and that
 * lead is what its defaults buy — the six rows above where the copy comes
 * back missing the data. If you clone plain acyclic JSON in a hot loop, use
 * rfdc; if you want the copy to still be the value you cloned, use this.
 *
 * Shape decides it, though, and this is not uniformly ahead. On an array of
 * 10,000 numbers es-toolkit does 14k ops/s against 3k here, with
 * `structuredClone` at 6k: a long flat run of primitives is what a per-key
 * walk is worst at and a specialised array path is best at. If that is your
 * data, this is the wrong function for it.
 *
 * Where `structuredClone` applies — pure data, no functions or nodes — it is
 * still the one to reach for if you are not already importing this: it ships
 * with the platform and costs you nothing. What it is not is reliably faster.
 * A structured clone is a serialise and a deserialise rather than a walk, so
 * it runs 1.5–5× behind on objects and roughly 2× ahead on that flat number
 * array, on top of dropping prototypes, symbol keys and an Error's own
 * properties.
 *
 * @template T
 * @param {T} o The value to clone
 * @returns {T} The cloned value; primitives, functions and symbols come back as themselves
 * @example
 * const obj = { foo: 'bar', when: new Date(0), tags: new Set(['a']) }
 * const copy = clone(obj)
 * copy.foo = 'baz'
 * console.log(obj.foo, copy.foo) // 'bar' 'baz'
 * console.log(copy.when instanceof Date, copy.tags.has('a')) // true true
 * @example
 * const options = { el: document.body, onDone: () => {} }
 * clone(options).onDone === options.onDone // => true, shared, not cloned
 * structuredClone(options) // => throws DataCloneError
 * @example
 * const cyclic = { name: 'root' }
 * cyclic.self = cyclic
 * clone(cyclic).self === clone(cyclic) // => false, but each copy's .self is itself
 */
export function clone(o) {
  if (o === null || typeof o !== 'object') return o
  return cloneCyclic(o, new WeakMap())
}

// Non-enumerable on an Error, so the own-property walk below never sees them.
// Carried with their descriptor rather than assigned, or the copy would show
// keys the original hides — and deepEqual, which walks own enumerable
// properties, would then call the two unequal.
const ERROR_PROPERTIES = ['message', 'stack', 'cause']

// Date, Map, Array and kin need their internal slot, which only their own
// constructor can create — so a subclass instance is built through the base
// and then re-pointed at the original's prototype. Object.create cannot make
// a real one.
function retarget(res, o) {
  const proto = getProto(o)
  if (getProto(res) !== proto) Object.setPrototypeOf(res, proto)
  return res
}

// Own enumerable string and symbol keys, matching what deepEqual compares and
// what structuredClone carries. Absent keys are never visited, which is how
// an array's holes stay holes.
function cloneOwn(o, res, seen) {
  const keys = Object.keys(o)
  for (let i = 0; i < keys.length; i++) {
    res[keys[i]] = cloneCyclic(o[keys[i]], seen)
  }
  const symbols = getSymbols(o)
  for (let i = 0; i < symbols.length; i++) {
    if (objPropEnumerable.call(o, symbols[i])) res[symbols[i]] = cloneCyclic(o[symbols[i]], seen)
  }
  return res
}

function cloneCyclic(o, seen) {
  if (o === null || typeof o !== 'object') return o

  // Every clone is registered before its contents are filled in, so a
  // reference back into an unfinished object resolves to the copy. This runs
  // from depth zero, unlike deepEqual's guard: sharing is observable at the
  // top level, where a cycle is not.
  const seenClone = seen.get(o)
  if (seenClone !== undefined) return seenClone

  if (Array.isArray(o)) {
    const res = new Array(o.length)
    seen.set(o, res)
    return cloneOwn(o, retarget(res, o), seen)
  }

  const proto = getProto(o)
  if (proto === objProto || proto === null) {
    const res = proto === null ? Object.create(null) : {}
    seen.set(o, res)
    return cloneOwn(o, res, seen)
  }

  const tag = objTag.call(o)
  let res = null

  switch (tag) {
    // A class instance. The prototype carries the methods so it is kept, but
    // the constructor is not re-run — anything it set in a closure or a
    // private field is not an own property and does not come along.
    case '[object Object]':
      res = Object.create(proto)
      seen.set(o, res)
      return cloneOwn(o, res, seen)
    case '[object Map]':
      res = new Map()
      seen.set(o, res)
      retarget(res, o)
      for (const [key, value] of o) res.set(cloneCyclic(key, seen), cloneCyclic(value, seen))
      return cloneOwn(o, res, seen)
    case '[object Set]':
      res = new Set()
      seen.set(o, res)
      retarget(res, o)
      for (const value of o) res.add(cloneCyclic(value, seen))
      return cloneOwn(o, res, seen)
    // Built through Error and re-pointed rather than Object.create'd: the
    // [[ErrorData]] slot is what makes Object.prototype.toString answer
    // [object Error], and only a constructor can create it. A prototype-only
    // copy reads back as a plain object to anything dispatching on the tag,
    // deepEqual included.
    case '[object Error]':
      res = retarget(new Error(), o)
      seen.set(o, res)
      for (let i = 0; i < ERROR_PROPERTIES.length; i++) {
        const property = ERROR_PROPERTIES[i]
        const descriptor = getOwnDescriptor(o, property)
        if (descriptor === undefined) continue
        // V8 hangs .stack off the instance as an accessor over an internal
        // slot; copied as an accessor it would read the clone's missing slot
        // and answer undefined, so it is read here and written as data —
        // which is the shape structuredClone produces as well.
        Object.defineProperty(res, property, {
          value: cloneCyclic(o[property], seen),
          writable: true,
          enumerable: descriptor.enumerable,
          configurable: true
        })
      }
      return cloneOwn(o, res, seen)
    case '[object Date]':
      res = new Date(o.getTime())
      break
    case '[object RegExp]':
      res = new RegExp(o.source, o.flags)
      res.lastIndex = o.lastIndex
      break
    case '[object ArrayBuffer]':
      res = o.slice(0)
      break
    case '[object DataView]':
      // No own-key walk on this or a typed array: their indices are own
      // enumerable properties, and re-assigning every byte through the
      // property path after the bytes are already copied is pure waste.
      seen.set(o, res = new DataView(cloneCyclic(o.buffer, seen), o.byteOffset, o.byteLength))
      return retarget(res, o)
    // A boxed primitive's own indices are read-only — a String object's
    // characters — so the walk would throw in strict mode. Its value is all
    // the data it has.
    case '[object Number]':
    case '[object String]':
    case '[object Boolean]':
    case '[object Symbol]':
      seen.set(o, res = Object(o.valueOf()))
      return retarget(res, o)
    default: {
      // A typed array. The constructor comes from the tag rather than from
      // o.constructor, which is a writable property any caller can point at
      // something else; retarget restores a subclass prototype after.
      const ctor = ArrayBuffer.isView(o) ? globalThis[tag.slice(8, -1)] : null
      // Everything unrecognised — DOM node, Promise, WeakMap,
      // SharedArrayBuffer, host object — is shared by reference. It is
      // returned unregistered, which costs nothing: identity is preserved by
      // being the same object.
      if (typeof ctor !== 'function') return o
      seen.set(o, res = new ctor(cloneCyclic(o.buffer, seen), o.byteOffset, o.length))
      return retarget(res, o)
    }
  }

  seen.set(o, res)
  return cloneOwn(o, retarget(res, o), seen)
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
 * primitives, Map, Set, typed arrays, ArrayBuffer/SharedArrayBuffer/DataView,
 * symbol keys and cyclic structures. WeakMap/WeakSet contents are
 * unobservable, so two distinct weak collections are never equal.
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
 * | URLs / Errors with different content | not equal — toString plus own props, so an Error's `.code` counts | not equal | URL yes, Error missed | not equal | not equal |
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
 * deepEqual([1, 2], [2, 1]) // => false
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
const getOwnDescriptor = Object.getOwnPropertyDescriptor

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
      // a boxed symbol unwraps to its primitive, which equals by reference
      // only — the same rule unboxed symbols get; toString would call two
      // distinct symbols with the same description equal
      case '[object Symbol]':
        return a.valueOf() === b.valueOf()
      case '[object RegExp]':
        return a.source === b.source && a.flags === b.flags
      // weak collection contents cannot be enumerated — equality cannot be
      // verified, so refuse to claim it
      case '[object WeakMap]':
      case '[object WeakSet]':
        return false
      // A DeepSet keeps its members in private fields, which this walk cannot
      // reach: without this line two DeepSets holding different values read as
      // two objects with no own properties and compare equal, which is the
      // silent wrong answer. Refusing is the conservative half of the same
      // rule the weak collections get — compare [...a] and [...b] to ask the
      // question this declines to answer.
      case '[object DeepSet]':
        return false
    }

    if (tag === '[object ArrayBuffer]' || tag === '[object SharedArrayBuffer]' || tag === '[object DataView]') {
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
      // Phase one, allocation-free: members found in b by SameValueZero. A
      // Set hit is a forced pairing — keys are SameValueZero-unique within
      // each collection. A Map hit with mismatched values is not: the
      // matching value may sit under a distinct deep-equal key, so the pair
      // defers to phase two on both sides. Only object keys defer — a
      // primitive key deep-equals nothing but its SameValueZero self, so its
      // value mismatch is final.
      let missed = null
      let deferred = null
      for (const key of a.keys()) {
        if (b.has(key)) {
          if (isMap && !deepEqualCyclic(a.get(key), b.get(key), depth + 1, seen)) {
            if (typeof key !== 'object' || key === null) return false
            if (missed === null) missed = []
            missed.push(key)
            if (deferred === null) deferred = []
            deferred.push(key)
          }
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
      // deferred keys exist in both maps by SameValueZero, so the !a.has
      // filter above excluded them from b's leftovers — they re-enter here
      // or phase two could never re-pair them
      if (deferred !== null) {
        for (let i = 0; i < deferred.length; i++) unused.push(deferred[i])
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
    // below alone would call any two of them equal. toString gates first,
    // then the walk still runs, because an Error's data can outgrow its
    // string form — .code assigned on a Node error is an own enumerable
    // property toString never shows. Exotic tags only: a plain
    // [object Object] never reaches here, so a class instance with a custom
    // toString still equals its plain-object twin structurally.
    if (tag !== '[object Object]' && typeof a.toString === 'function' && a.toString !== objTag) {
      if (a.toString() !== b.toString()) return false
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
        // Members fold commutatively — each hashed from the seed, the results
        // summed — because deepEqual matches Set members and Map entries in
        // any order, and an order-sensitive fold would split two equal
        // collections. Deep-equal members fold identically, so equal
        // collections reach the same sum. Every member is folded and never a
        // prefix: a prefix follows iteration order, which is order-sensitive
        // again. Summed, not XORed — a Set may hold two distinct members that
        // are deepEqual, and XOR would cancel that pair into the hash of a Set
        // without either.
        case '[object Set]': {
          h = foldNumber(h, v.size)
          let sum = 0
          for (const m of v) sum = (sum + foldValue(FNV_SEED, m, depth + 1)) >>> 0
          return foldNumber(h, sum)
        }
        case '[object Map]': {
          h = foldNumber(h, v.size)
          let sum = 0
          // The key is mixed into the value asymmetrically, so Map{a → b} and
          // Map{b → a} do not reach the same entry hash.
          for (const [k, val] of v) {
            const pair = (Math.imul(foldValue(FNV_SEED, k, depth + 1), 0x9E3779B1) ^ foldValue(FNV_SEED, val, depth + 1)) >>> 0
            sum = (sum + pair) >>> 0
          }
          return foldNumber(h, sum)
        }
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
 * correctness comes from deepEqual alone.
 *
 * Sets and Maps fold their members too, commutatively, so insertion order
 * never reaches the hash and equal collections still land in one bucket. The
 * bill is a walk per member on every collection: a pile of large Sets costs
 * more to fold than a pile of small documents, and a single pair of them is a
 * job for {@link deepEqual} rather than for this. The bucket-then-verify idea is
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
  const set = new DeepSet()
  for (let i = 0; i < arr.length; i++) set.add(arr[i])
  return [...set]
}

/**
 * A Set that decides membership by structure rather than by reference, so
 * `has` answers the question `new Set()` cannot: is a value like this one
 * already in here? {@link deepEqual} defines "like", exactly as it does for
 * {@link dedupe}, and the two share one bucket-then-verify pass — a DeepSet is
 * that pass kept instead of thrown away.
 *
 * Reach for it when the same unchanging pile is asked about repeatedly.
 * `arr.some(x => deepEqual(x, value))` beats it outright for a single lookup:
 * a fold has to read the whole value before it can say a word, where deepEqual
 * abandons most candidates after a key or two. Building the index only pays
 * back across queries, from around thirty of them, and that figure barely
 * moves between a thousand values and a hundred thousand — build and scan both
 * scale with the pile, so their ratio does not.
 * `bench/dedupe/membership.bench.mjs` regenerates it.
 *
 * **A value must not be mutated while it is in here.** Membership is decided
 * by contents, so changing a value changes the bucket it should live in while
 * it sits in the old one, and it becomes unfindable — by `has`, by `delete`,
 * and by its own reference. `new Set()` has no such rule, because reference
 * identity survives mutation and structure does not. Add copies if the
 * originals move.
 *
 * Insertion order is preserved and the first occurrence of every distinct
 * value is the one kept, so `[...new DeepSet(arr)]` is `dedupe(arr)`. Values
 * are held as given, `-0` included — the platform's `Set` normalises that to
 * `0` and this does not, which is why an array backs the order rather than a
 * `Set`.
 *
 * Two DeepSets are never {@link deepEqual} to each other: their members live in
 * private fields a structural walk cannot reach, and refusing is better than
 * the wrong answer that walk would otherwise give. Compare `[...a]` and
 * `[...b]`.
 *
 * `delete` is the one method that costs more here than on a native `Set`:
 * insertion order is an array, so the value has to be found in it and spliced
 * out, which is linear in the size of the set against the O(1) the name
 * implies. Occasional removal is fine; dropping many values at once is cheaper
 * as a rebuild from a filtered iteration. `clear` pays nothing — it drops both
 * halves whole.
 *
 * @example
 * const seen = new DeepSet([{ a: 1 }, { b: 2 }])
 * seen.has({ a: 1 })          // => true — a different object, same structure
 * seen.has({ a: 2 })          // => false
 * seen.add({ b: 2 }).size     // => 2 — already present, not added again
 * seen.delete({ a: 1 })       // => true — again, structure and not reference
 * [...new DeepSet([{ a: 1 }, { a: 1 }])]  // => [{ a: 1 }]
 */
export class DeepSet {
  // hash → the values that folded to it, usually one. deepEqual settles a
  // shared bucket; the hash never decides anything on its own.
  #buckets = new Map()
  // Insertion order, and the only place a value is held exactly as given.
  // Deliberately not a Set: that would normalise -0 to 0 and hand back a value
  // the caller never passed in.
  #values = []

  /**
   * @param {Iterable} [values] Values to add, in order; duplicates are dropped
   */
  constructor(values) {
    if (values === undefined || values === null) return
    for (const value of values) this.add(value)
  }

  /**
   * @returns {number} How many structurally distinct values are held
   */
  get size() {
    return this.#values.length
  }

  /**
   * @param {*} value The value to look for
   * @returns {boolean} True when a structurally equal value is already held
   */
  has(value) {
    const bucket = this.#buckets.get(foldValue(FNV_SEED, value, 0) >>> 0)
    if (bucket === undefined) return false
    for (let i = 0; i < bucket.length; i++) {
      if (deepEqual(bucket[i], value)) return true
    }
    return false
  }

  /**
   * Adds a value unless one structurally equal to it is already held, in which
   * case the one already here stays and this call changes nothing.
   *
   * @param {*} value The value to add
   * @returns {DeepSet} This set, so calls chain
   */
  add(value) {
    const key = foldValue(FNV_SEED, value, 0) >>> 0
    const bucket = this.#buckets.get(key)
    if (bucket === undefined) {
      this.#buckets.set(key, [value])
      this.#values.push(value)
      return this
    }
    for (let i = 0; i < bucket.length; i++) {
      if (deepEqual(bucket[i], value)) return this
    }
    bucket.push(value)
    this.#values.push(value)
    return this
  }

  /**
   * Removes the held value structurally equal to the one given, if there is
   * one. Linear in the size of the set — see the note on the class.
   *
   * @param {*} value The value to remove
   * @returns {boolean} True when a value was removed, false when none matched
   * @example
   * const seen = new DeepSet([{ a: 1 }])
   * seen.delete({ a: 1 })  // => true — a different object, same structure
   * seen.delete({ a: 1 })  // => false — nothing left to match
   */
  delete(value) {
    const key = foldValue(FNV_SEED, value, 0) >>> 0
    const bucket = this.#buckets.get(key)
    if (bucket === undefined) return false
    for (let i = 0; i < bucket.length; i++) {
      if (!deepEqual(bucket[i], value)) continue
      const held = bucket[i]
      bucket.splice(i, 1)
      // An emptied bucket has to go with it, or a set churning values keeps a
      // key per hash it has ever seen and grows without bound.
      if (bucket.length === 0) this.#buckets.delete(key)
      // Object.is, not indexOf: a held NaN is never found by indexOf, and the
      // -1 it returns would splice the last value out instead.
      const at = this.#values.findIndex((v) => Object.is(v, held))
      if (at !== -1) this.#values.splice(at, 1)
      return true
    }
    return false
  }

  /**
   * Removes every value, leaving the set reusable.
   *
   * @returns {void}
   * @example
   * const seen = new DeepSet([{ a: 1 }])
   * seen.clear()
   * seen.size  // => 0
   */
  clear() {
    this.#buckets.clear()
    this.#values.length = 0
  }

  /**
   * @returns {Iterator} The held values, in the order they were added
   */
  [Symbol.iterator]() {
    return this.#values[Symbol.iterator]()
  }

  // Gives instances the [object DeepSet] tag, which is what lets deepEqual
  // refuse them by name rather than walking them and finding nothing.
  get [Symbol.toStringTag]() {
    return 'DeepSet'
  }
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

/** The letters NFKD cannot help with, because they carry no separable combining mark: the
 * ones written through the glyph (`Đ`, `Ø`, `Ŧ`), the ones that are two letters wearing one
 * (`Æ`, `ß`, `Þ`), and Turkish `ı`, which is a letter in its own right rather than an `i`
 * missing something. Serbian `đ` is the one that matters here; the rest are the same shape
 * of problem next door.
 *
 * Deliberately stops at the living orthographies. The IPA and Africanist letters — `Ɔ`, `Ɛ`,
 * `Ʃ`, `Ʒ` and the click letters — survive whole, because in the texts they appear in the
 * letter *is* the content and folding it to `O`, `E`, `S`, `3` would destroy the word. */
const PLAIN = {
  Æ: 'AE', æ: 'ae', Œ: 'OE', œ: 'oe', ß: 'ss', ẞ: 'SS', Þ: 'TH', þ: 'th',
  Đ: 'D', đ: 'd', Ð: 'D', ð: 'd', Ø: 'O', ø: 'o', Ł: 'L', ł: 'l', Ŀ: 'L', ŀ: 'l',
  Ħ: 'H', ħ: 'h', Ŧ: 'T', ŧ: 't', Ǥ: 'G', ǥ: 'g', Ŋ: 'N', ŋ: 'n', ı: 'i'
}

/** Runs *before* NFKD, and the order is the point: `Ŀ` has a compatibility decomposition to
 * `L` + `·`, so after NFKD there is no `Ŀ` left to match and the middle dot survives into the
 * output as a stray character. Every replacement is ASCII, so decomposing afterwards has
 * nothing left to do to them. */
const PLAIN_RE = new RegExp(`[${Object.keys(PLAIN).join('')}]`, 'g')

/**
 * A string flattened to plain Latin: the accents taken off, the letters that are two letters
 * wearing one glyph spelled out, and the stroked letters given their plain form. Case is
 * preserved — `.toLowerCase()` afterwards if a comparison needs it.
 *
 * Two mechanisms, because Unicode offers no single one. NFKD decomposes and the combining
 * marks are dropped, which handles `é` and `ź` and unpacks the ligatures and digraphs that
 * have a compatibility decomposition — `ﬁ`, `Ǆ`, `Ǉ`, `Ĳ`. What is left has no separable
 * mark to strip and is mapped by hand: without that pass `removeAccents('Đorđe')` returns
 * `Đorđe` unchanged, and a `[^\w]` filter downstream then deletes the letter outright rather
 * than plainifying it.
 *
 * Only the scripts that share the Latin alphabet are touched. Cyrillic, Greek, Arabic and
 * CJK come through whole, because mapping those to Latin is transliteration — a different
 * job, answered per language rather than per character.
 *
 * @param {string} inputString
 * @returns string
 * @example
 * removeAccents('áéíóú') // => 'aeiou'
 * removeAccents('ÁÉÍÓÚ') // => 'AEIOU'
 * removeAccents('señor') // => 'senor'
 * removeAccents('Crème Brûlée') // => 'Creme Brulee'
 * removeAccents('Đorđe') // => 'Dorde'
 * removeAccents('Łódź') // => 'Lodz'
 * removeAccents('Nørrebro') // => 'Norrebro'
 * removeAccents('Æ') // => 'AE'
 * removeAccents('Œ') // => 'OE'
 * removeAccents('ß') // => 'ss'
 * removeAccents('Straẞe') // => 'Strasse'
 * removeAccents('Þingvellir') // => 'THingvellir'
 * removeAccents('Ǆungla') // => 'DZungla'
 * removeAccents('ﬁ') // => 'fi'
 * removeAccents('Београд') // => 'Београд', a script with no Latin in it is left alone
 */
export function removeAccents(inputString) {
  return inputString.replace(PLAIN_RE, (c) => PLAIN[c]).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
}

/**
 * Whether a label answers what has been typed — the match a filtering list needs.
 *
 * "Contains" and not "starts with": the reader looking through a list of cities for `york`
 * knows New York is not spelled that way and is asking for the one word they remember. Both
 * sides go through `removeAccents` and lower case, so a search typed with diacritics and one
 * typed without both land on the same labels.
 *
 * An empty search matches everything, which is what makes an unfiltered list the same code
 * path as a filtered one.
 *
 * Not `slugify`, further down this same file, which starts the same way and then keeps
 * going: that one is for URLs, so it drops everything outside `[\w0-9-]` and leaves
 * `Београд` and `北京` as empty strings. A search box that cannot find a Cyrillic city on a
 * Serbian site is not a smaller bug than one that cannot fold an accent.
 *
 * @param {string} label
 * @param {string} search
 * @returns {boolean}
 * @example
 * matchesSearch('New York', 'york') // => true
 * matchesSearch('Šipka', 'sipka') // => true
 * matchesSearch('Lemon', '') // => true
 * matchesSearch('New York', 'boston') // => false
 */
export function matchesSearch(label, search) {
  const needle = removeAccents(search.trim()).toLowerCase()
  return needle === '' || removeAccents(label).toLowerCase().includes(needle)
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
 * Anything outside `[\w0-9-]` is dropped, so a script with no Latin in it — `Београд`, `北京`
 * — slugifies to the empty string. That is the job: a slug is for a URL. `matchesSearch` is
 * the one for a search box, which keeps those scripts whole.
 *
 * @param {string} str
 * @returns string
 * @example
 * slugify('Foo Bar') // => 'foo-bar'
 * slugify('Foo Bar <span>baz</span>') // => 'foo-bar-baz'
 * slugify('Đorđe Balašević') // => 'dorde-balasevic'
 * slugify('Łódź') // => 'lodz'
 */
export function slugify(str) {
  str = removeAccents(str.trim()).toLowerCase()
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

/**
 * Waits for a condition to become truthy, polling it until it does.
 *
 * For an element appearing in the DOM reach for `on` instead — a MutationObserver reacts where
 * polling only notices on its next tick. This is for what an observer cannot see: a third-party
 * script defining its global, a widget flipping a flag, a value settling somewhere unwatchable.
 *
 * The deadline is measured against the clock rather than counted in ticks, and the last sleep is
 * cut short to land on it: a background tab clamps `setTimeout` to a second or more, and a caller
 * who asked for two seconds means two seconds either way — including one last look at the moment
 * they run out. A condition promise still pending when the deadline lands does not hold it open:
 * the wait rejects on time and the late answer is discarded.
 *
 * @param {Function} condition Called immediately and then on every tick. May return a promise. Truthy ends the wait
 * @param {object} [options]
 * @param {number} [options.interval=100] Milliseconds between checks. `0` checks again every tick
 * @param {number} [options.timeout=10000] Milliseconds before giving up. `0` or `Infinity` waits forever, which leaks a timer if the condition never comes
 * @param {AbortSignal} [options.signal] Aborting rejects the promise and stops the polling
 * @returns {Promise<*>} Resolves with whatever the condition returned. Rejects with a `TimeoutError` at the deadline, with the signal's reason when aborted, or with whatever the condition threw
 * @see module:dom.on
 * @example
 * const dataLayer = await waitFor(() => window.dataLayer)
 *
 * @example
 * // Give up rather than poll a widget that is never coming
 * try {
 *   await waitFor(() => window.Intercom, { timeout: 2000 })
 * } catch {
 *   renderContactFormInstead()
 * }
 *
 * @example
 * // Stop waiting when the thing that wanted the answer is gone
 * const controller = new AbortController()
 * waitFor(() => player.ready, { signal: controller.signal })
 * onUnmount(() => controller.abort())
 */
export function waitFor(condition, options = {}) {
  if (!isFunction(condition)) return Promise.reject(new TypeError('waitFor: condition must be a function'))

  const interval = options.interval === undefined ? 100 : options.interval
  const timeout = options.timeout === undefined ? 10000 : options.timeout
  const signal = options.signal
  // `0 || Infinity` and `now + Infinity` both land on an infinite deadline, so the two
  // wait-forever spellings need no branch of their own.
  const deadline = performance.now() + (timeout || Infinity)

  return new Promise((resolve, reject) => {
    let timer = null
    let guard = null

    const onAbort = function() {
      stop()
      reject(signal.reason)
    }

    const stop = function() {
      if (timer !== null) clearTimeout(timer)
      timer = null
      clearTimeout(guard)
      guard = null
      if (signal) signal.removeEventListener('abort', onAbort)
    }

    const timedOut = function() {
      stop()
      reject(new DOMException(`waitFor timed out after ${timeout}ms`, 'TimeoutError'))
    }

    const check = async function() {
      let value

      // The deadline cannot wait on the condition: a promise that stalls past it — a hung
      // fetch, a flag that never settles — would otherwise hold the wait open with the timeout
      // already spent. Armed around the await alone; an answer in time just clears it.
      if (deadline !== Infinity) guard = setTimeout(timedOut, Math.max(deadline - performance.now(), 0))

      try {
        value = await condition()
      } catch (error) {
        stop()
        reject(error)
        return
      }

      clearTimeout(guard)
      guard = null

      // An abort landing while an async condition was in flight has already rejected and cleared
      // the timer. Scheduling another one here would poll on past the abort, forever.
      if (signal && signal.aborted) return

      if (value) {
        stop()
        resolve(value)
        return
      }

      const remaining = deadline - performance.now()

      if (remaining <= 0) {
        timedOut()
        return
      }

      timer = setTimeout(check, Math.min(interval, remaining))
    }

    if (signal) {
      if (signal.aborted) return reject(signal.reason)
      signal.addEventListener('abort', onAbort, { once: true })
    }

    check()
  })
}
