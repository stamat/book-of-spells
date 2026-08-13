// The pairs capability.bench.mjs asks every contender about, in one list so
// the parent process and the child that runs a cell agree on the numbering —
// a case is identified by its index across process boundaries, so inserting a
// row in the middle renumbers everything after it and that is fine, but the
// two sides must never hold different lists.
//
// `expected` is a boolean for a case with an objectively right answer, and
// undefined for a design choice where two libraries may reasonably differ.
// The split is the whole editorial position of this bench: only the former is
// scored, so the table cannot be won by agreeing with book-of-spells.
//
// Each case is a factory rather than a value: it builds its pair fresh on
// every call, so nothing short-circuits on reference identity and no contender
// inherits a mutation from the contender before it.

const cyclic = () => { const x = { tag: 'a' }; x.self = x; return x }
const buffer = (first) => { const b = new ArrayBuffer(4); new Uint8Array(b).set([first, 2, 3, 4]); return b }

function nest(depth) {
  let node = {}
  const root = node
  for (let i = 0; i < depth; i++) { node.n = {}; node = node.n }
  node.leaf = 1
  return root
}

class Point { constructor(x) { this.x = x } }

export const CASES = [
  // ---- correctness: the pair either is or is not structurally the same ----
  { section: 'correctness', label: 'NaN in a field', expected: true, make: () => [{ a: NaN }, { a: NaN }] },
  { section: 'correctness', label: 'key order differs', expected: true, make: () => [{ a: 1, b: 2 }, { b: 2, a: 1 }] },
  { section: 'correctness', label: 'nested array, one element differs', expected: false, make: () => [{ a: [1, [2, 3]] }, { a: [1, [2, 4]] }] },
  { section: 'correctness', label: 'array vs array-like object', expected: false, make: () => [[1, 2], { 0: 1, 1: 2, length: 2 }] },
  { section: 'correctness', label: 'Set, member order differs', expected: true, make: () => [new Set([1, 2]), new Set([2, 1])] },
  { section: 'correctness', label: 'Set of deep-equal objects', expected: true, make: () => [new Set([{ a: 1 }]), new Set([{ a: 1 }])] },
  { section: 'correctness', label: 'Set, one member differs', expected: false, make: () => [new Set([{ a: 1 }]), new Set([{ a: 2 }])] },
  { section: 'correctness', label: 'Map, deep-equal object keys', expected: true, make: () => [new Map([[{ k: 1 }, 'v']]), new Map([[{ k: 1 }, 'v']])] },
  { section: 'correctness', label: 'Map, same key, different value', expected: false, make: () => [new Map([['k', 1]]), new Map([['k', 2]])] },
  { section: 'correctness', label: 'cyclic self-reference', expected: true, make: () => [cyclic(), cyclic()] },
  { section: 'correctness', label: 'cyclic, differing outside the cycle', expected: false, make: () => { const y = cyclic(); y.tag = 'b'; return [cyclic(), y] } },
  { section: 'correctness', label: 'equal Dates', expected: true, make: () => [new Date(864e5), new Date(864e5)] },
  { section: 'correctness', label: 'Dates one millisecond apart', expected: false, make: () => [new Date(864e5), new Date(864e5 + 1)] },
  { section: 'correctness', label: 'RegExp, same source and flags', expected: true, make: () => [/a+/gi, /a+/gi] },
  { section: 'correctness', label: 'RegExp, flags differ', expected: false, make: () => [/a+/g, /a+/i] },
  { section: 'correctness', label: 'Uint8Array, equal', expected: true, make: () => [new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3])] },
  { section: 'correctness', label: 'Uint8Array, one byte differs', expected: false, make: () => [new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 9])] },
  { section: 'correctness', label: 'Int8Array vs Uint8Array, same bytes', expected: false, make: () => [new Int8Array([1, 2]), new Uint8Array([1, 2])] },
  { section: 'correctness', label: 'ArrayBuffer, equal', expected: true, make: () => [buffer(1), buffer(1)] },
  { section: 'correctness', label: 'ArrayBuffer, one byte differs', expected: false, make: () => [buffer(1), buffer(9)] },
  { section: 'correctness', label: 'DataView, equal', expected: true, make: () => [new DataView(buffer(1)), new DataView(buffer(1))] },
  { section: 'correctness', label: 'enumerable symbol key, values differ', expected: false, make: () => { const s = Symbol.for('bench.k'); return [{ [s]: 1 }, { [s]: 2 }] } },
  { section: 'correctness', label: 'WeakMap (contents unknowable)', expected: false, make: () => [new WeakMap(), new WeakMap()] },
  { section: 'correctness', label: 'URL, same href', expected: true, make: () => [new URL('https://a.io/x'), new URL('https://a.io/x')] },
  { section: 'correctness', label: 'URL, different href', expected: false, make: () => [new URL('https://a.io/x'), new URL('https://a.io/y')] },
  { section: 'correctness', label: 'Error, same message', expected: true, make: () => [new Error('boom'), new Error('boom')] },
  { section: 'correctness', label: 'Error, different message', expected: false, make: () => [new Error('boom'), new Error('bang')] },
  { section: 'correctness', label: 'nesting 200 deep', expected: true, make: () => [nest(200), nest(200)] },
  { section: 'correctness', label: 'nesting 20,000 deep', expected: true, make: () => [nest(20_000), nest(20_000)] },

  // ---- semantics: a position, not a result; these rows are not scored ----
  { section: 'semantics', label: 'class instance vs plain twin', make: () => [new Point(1), { x: 1 }] },
  { section: 'semantics', label: 'null-prototype object vs plain twin', make: () => [Object.assign(Object.create(null), { x: 1 }), { x: 1 }] },
  { section: 'semantics', label: 'own undefined vs missing key', make: () => [{ a: undefined }, {}] },
  { section: 'semantics', label: 'sparse hole vs explicit undefined', make: () => [[, 1], [undefined, 1]] },
  { section: 'semantics', label: '-0 vs 0 in a field', make: () => [{ a: -0 }, { a: 0 }] },
  { section: 'semantics', label: 'boxed Number vs primitive', make: () => [new Number(1), 1] },
  { section: 'semantics', label: 'two Invalid Dates', make: () => [new Date(NaN), new Date(NaN)] },
]
