// deepEqual() against what people actually npm install for this job.
//
// Table one races plain objects, arrays, strings and numbers only — the
// shapes every contender in contenders.mjs answers identically. That
// restriction is the whole reason the column means anything: an
// implementation that returns false on Sets is not fast at Sets, it is absent
// from them, and a table mixing the two prices a feature gap as a speed win.
// Which contender is absent from what is capability.bench.mjs's subject, and
// this file asserts every answer before timing it, so a disagreement on these
// shapes stops the bench rather than being reported as a number.
//
// Table two is the shapes they disagree on, run anyway, with the contenders
// that get them wrong marked `unsound` instead of timed — a number under a
// wrong answer measures nothing. Membership of that list is computed on the
// spot rather than written down here, so it cannot go stale when a rival
// ships a fix.
//
// The scenarios exist because deepEqual's cost is not one number. A walk that
// meets its difference in the first key does almost nothing; the same walk on
// an equal pair reads everything. Both are ordinary. Quoting either alone is
// the misleading half, which is why `equal` and `differs at the first key` sit
// in the same table.
//
// Deliberately not measured: memory, browser engines, and the cost of the
// first call on a cold JIT — harness.opsPerSec discards one untimed run and
// then measures a hot loop, which is the steady state a server sees and not
// the one a page load does.
import { table, opsPerSec, rate } from '../harness.mjs'
import { requireRivals, load, mulberry32, document } from './contenders.mjs'

if (!requireRivals()) process.exit(0)
const CONTENDERS = await load()

const rnd = mulberry32(42)
const base = document(rnd, 3)

// structuredClone rather than a second document(): every scenario needs a
// pair that is structurally equal without being the same reference, or the
// `a === b` fast path most of these implementations open with answers the
// equal case without reading a byte.
const equal = structuredClone(base)

const firstKeyDiff = structuredClone(base)
firstKeyDiff[Object.keys(firstKeyDiff)[0]] = '__different__'

// The deepest leaf of the last branch: the difference a walk can only find
// after reading everything, which is the worst case for every contender and
// the one a near-miss duplicate actually produces.
const lastKeyDiff = structuredClone(base)
let tail = lastKeyDiff
while (tail.child) tail = tail.child
tail.leaf = '__different__'

const typeDiff = structuredClone(base)
typeDiff.id = String(typeDiff.id)

const numbers = Array.from({ length: 10_000 }, () => rnd())
const numbersEqual = numbers.slice()

const docs = Array.from({ length: 1_000 }, () => document(rnd, 1))
const docsEqual = structuredClone(docs)

const SCENARIOS = [
  ['equal, nested 3 deep', base, equal, true],
  ['differs at the first key', base, firstKeyDiff, false],
  ['differs at the deepest leaf', base, lastKeyDiff, false],
  ['differs by type, not value', base, typeDiff, false],
  ['equal, 10,000 numbers', numbers, numbersEqual, true],
  ['equal, 1,000 documents', docs, docsEqual, true],
]

// Soundness before speed, every contender, every scenario — a bench that
// times wrong code measures nothing. These are the common-denominator shapes,
// so a disagreement here is a defect worth stopping for, not a design choice.
for (const [label, a, b, expected] of SCENARIOS) {
  for (const { name, fn } of CONTENDERS) {
    if (fn(a, b) !== expected) throw new Error(`${name} answers ${!expected} on "${label}" — that shape was chosen because every contender agrees on it, so either the choice or the contender is wrong`)
  }
}

console.log('plain objects, arrays, numbers and strings — the shapes every contender answers alike\n')
table(['contender', ...SCENARIOS.map(([label]) => label)], CONTENDERS.map(({ name, fn }) => [
  name,
  ...SCENARIOS.map(([, a, b]) => rate(opsPerSec(() => fn(a, b), 400))),
]))

// ---------- the shapes they disagree on ----------
// Each carries a pair that is equal and a pair that is not, and a contender
// has to get BOTH right before its equal-pair timing is reported. One
// direction is not enough: fast-deep-equal walks a Set's own enumerable
// properties, of which there are none, so it calls every pair of Sets equal —
// and on an equal pair alone that reads as a correct answer arriving ten
// times faster than anyone else's, which is the exact misreading this table
// exists to prevent. It is not fast at Sets. It does not look at them.
const set = () => new Set([{ a: 1 }, { a: 2 }, { a: 3 }])
const map = () => new Map([[{ k: 1 }, { v: 1 }], [{ k: 2 }, { v: 2 }]])
const cyclic = () => { const x = { deep: { tag: 'a' } }; x.self = x; return x }
const bytes = (last) => { const u = new Uint8Array(10_000).fill(7); u[9_999] = last; return u }

const DIVERGENT = [
  ['Set of objects', [set(), set()], [set(), new Set([{ a: 1 }, { a: 2 }, { a: 9 }])]],
  ['Map with object keys', [map(), map()], [map(), new Map([[{ k: 1 }, { v: 1 }], [{ k: 2 }, { v: 9 }]])]],
  ['cyclic', [cyclic(), cyclic()], [cyclic(), Object.assign(cyclic(), { deep: { tag: 'b' } })]],
  ['Uint8Array, 10,000 bytes', [bytes(7), bytes(7)], [bytes(7), bytes(9)]],
]

console.log('\nthe shapes they answer differently — `unsound` is a wrong answer, not a slow one\n')
table(['contender', ...DIVERGENT.map(([label]) => label)], CONTENDERS.map(({ name, fn }) => [
  name,
  ...DIVERGENT.map(([, [a, b], [c, d]]) => {
    // Soundness is decided per cell rather than from a list in a comment: a
    // rival that fixes its Set handling starts being timed on the next run,
    // with nothing in this file to update.
    try {
      if (fn(a, b) !== true || fn(c, d) !== false) return 'unsound'
    } catch { return '⚠️ throws' }
    return rate(opsPerSec(() => fn(a, b), 400))
  }),
]))
