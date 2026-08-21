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
export declare function shallowMerge(target: object, source: object): object;
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
export declare function deepMerge(target: object, source: object): object;
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
export declare function clone<T>(o: T): T;
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
export declare function deepEqual(a: any, b: any): boolean;
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
export declare function dedupe(arr: any[]): any[];
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
export declare class DeepSet {
    #private;
    /**
     * @param {Iterable} [values] Values to add, in order; duplicates are dropped
     */
    constructor(values?: Iterable<any>);
    /**
     * @returns {number} How many structurally distinct values are held
     */
    get size(): number;
    /**
     * @param {*} value The value to look for
     * @returns {boolean} True when a structurally equal value is already held
     */
    has(value: any): boolean;
    /**
     * Adds a value unless one structurally equal to it is already held, in which
     * case the one already here stays and this call changes nothing.
     *
     * @param {*} value The value to add
     * @returns {DeepSet} This set, so calls chain
     */
    add(value: any): DeepSet;
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
    delete(value: any): boolean;
    /**
     * Removes every value, leaving the set reusable.
     *
     * @returns {void}
     * @example
     * const seen = new DeepSet([{ a: 1 }])
     * seen.clear()
     * seen.size  // => 0
     */
    clear(): void;
    /**
     * @returns {Iterator} The held values, in the order they were added
     */
    [Symbol.iterator](): Iterator<any, any, any>;
    get [Symbol.toStringTag](): string;
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
export declare function isEmptyObject(o: object): boolean;
/**
 * Check if an array is empty, substitute for Array.length === 0
 *
 * @param {Array} o The array to check
 * @returns boolean True if the array is empty, false otherwise
 * @example
 * isEmptyArray([]) // => true
 * isEmptyArray([1, 2, 3]) // => false
 */
export declare function isEmptyArray(o: any[]): boolean;
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
export declare function isEmpty(o: any): boolean;
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
export declare function stringToBoolean(str: string): boolean | undefined;
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
export declare function stringToNumber(str: string): number | undefined;
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
export declare function stringToArray(str: string): any;
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
export declare function stringToObject(str: string): any;
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
export declare function stringToRegex(str: string): RegExp | undefined;
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
export declare function stringToPrimitive(str: string): null | boolean | int | float | string;
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
export declare function stringToType(str: string): any;
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
export declare function isObject(o: any): boolean;
/**
 * If provided variable is an array. Just a wrapper for Array.isArray
 *
 * @param {any} o
 * @returns boolean
 * @example
 * isArray([]) // => true
 * isArray({}) // => false
 */
export declare function isArray(o: any): o is any[];
/**
 * If provided variable is a string. Just a wrapper for typeof === 'string'
 *
 * @param {any} o
 * @returns boolean
 * @example
 * isString('foo') // => true
 * isString({}) // => false
 */
export declare function isString(o: any): o is string;
/**
 * If provided variable is a function, substitute for typeof === 'function'
 *
 * @param {any} o
 * @returns boolean
 * @example
 * isFunction(function() {}) // => true
 * isFunction({}) // => false
 */
export declare function isFunction(o: any): boolean;
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
export declare function propertyIsFunction(obj: object, propertyName: string): boolean;
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
export declare function propertyIsString(obj: object, propertyName: string): boolean;
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
export declare function transformDashToCamelCase(str: string): string;
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
export declare function transformCamelCaseToDash(str: string): string;
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
export declare function mapByProperty(arr: any[], propertyName: string): {};
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
export declare function mapPropertyToProperty(arr: any[], keyPropertyName: string, valuePropertyName: string): {};
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
export declare function removeAccents(inputString: string): string;
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
export declare function matchesSearch(label: string, search: string): boolean;
/**
 * Strip HTML tags from a string
 *
 * @param {string} inputString
 * @returns string
 * @example
 * stripHTMLTags('<span>foo</span>') // => 'foo'
 * stripHTMLTags('<span>foo</span> <span>bar</span>') // => 'foo bar'
 */
export declare function stripHTMLTags(inputString: string): string;
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
export declare function slugify(str: string): string;
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
export declare function humanize(str: string, casing?: 'title' | 'sentence' | 'upper' | 'lower'): string;
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
export declare function hasOwnProperties(obj: object, properties: string | array): boolean;
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
export declare function closestNumber(goal: number, arr: any[]): any;
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
export declare function truncateString(str: string, numWords: number, ellipsis?: string): string;
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
export declare function randomIntInclusive(min: number, max: number, safe?: boolean): number;
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
export declare function fixed(number: number, digits: number): number;
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
export declare function percentage(num: number, total: number): number;
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
export declare function pickProperties(obj: object, props: any[] | string): {};
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
export declare function rejectProperties(obj: object, props: any[] | string, clone?: boolean): object;
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
export declare function pickArrayElements(arr: any[], indexes: any[] | number): any[] | undefined;
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
export declare function rejectArrayElements(arr: any[], indexes: any[] | number, clone?: boolean): any[] | undefined;
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
export declare function pick(obj: any[], props: any[] | string | number): {} | undefined;
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
export declare function reject(obj: any[], props: any[] | string | number, clone?: boolean): object | undefined;
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
export declare function basicUID(safe?: boolean): string;
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
export declare function generateUUID(safe?: boolean): string;
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
export declare function random(): number;
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
export declare function getObjectValueByPath(obj: object, path: any[] | string): any;
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
 * they run out.
 *
 * @param {Function} condition Called immediately and then on every tick. May return a promise. Truthy ends the wait
 * @param {object} [options]
 * @param {number} [options.interval=100] Milliseconds between checks
 * @param {number} [options.timeout=10000] Milliseconds before giving up. `0` or `Infinity` waits forever, which leaks a timer if the condition never comes
 * @param {AbortSignal} [options.signal] Aborting rejects the promise and stops the polling
 * @returns {Promise<*>} Resolves with whatever the condition returned. Rejects with a `TimeoutError` at the deadline, with the signal's reason when aborted, or with whatever the condition threw
 * @see on
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
export declare function waitFor(condition: Function, options?: {
    interval?: number;
    timeout?: number;
    signal?: AbortSignal;
}): Promise<any>;
