// clone() against what people actually reach for when they need a deep copy.
//
// Table one races plain objects, arrays, strings and numbers only — the shapes
// every contender in contenders.mjs copies identically. That restriction is
// the whole reason the column means anything: a clone that returns `{}` for a
// Map is not fast at Maps, it is absent from them, and a table mixing the two
// prices data loss as a speed win. Which contender loses what is
// capability.bench.mjs's subject, and this file asserts every copy before
// timing it, so a disagreement on these shapes stops the bench rather than
// being reported as a number.
//
// Table two is the shapes they disagree on, run anyway, with the contenders
// that get them wrong marked `unsound` instead of timed. Membership of that
// list is computed on the spot rather than written down here, so it cannot go
// stale when a rival ships a fix.
//
// The scenarios exist because a clone's cost is not one number. A small flat
// object is dominated by the dispatch on its first value; a megabyte of nested
// documents is dominated by allocation. Both are ordinary, and quoting either
// alone is the misleading half.
//
// Deliberately not measured: peak memory, and the garbage collector. Every
// contender here allocates a full copy per call, so a hot loop measures
// allocation and collection as much as traversal — which is the steady state
// of code that clones, and not a distortion to apologise for, but it does mean
// these numbers move more between machines than a comparison bench's do.
import { table, opsPerSec, rate } from '../harness.mjs'
import { deepEqual } from '../../src/helpers.mjs'
import { requireRivals, load, mulberry32, document, sharesNothing } from './contenders.mjs'

if (!requireRivals()) process.exit(0)
const CONTENDERS = await load()

const sound = (copy, original) => deepEqual(copy, original) && sharesNothing(copy, original)

const rnd = mulberry32(42)

const flat = { id: 1, name: 'alpha', ok: true, score: 0.5, tag: 'x', n: 42, kind: 'row', slug: 'alpha-1' }
const nested = document(rnd, 3)
const docs = Array.from({ length: 1_000 }, () => document(rnd, 1))
const numbers = Array.from({ length: 10_000 }, () => rnd())

// 200 rather than the 20,000 the capability table uses: this is the depth a
// recursive walk survives, so the row measures the recursion instead of
// reporting who fell over. Who falls over is the other bench's subject.
let deepRoot = {}
let deepTail = deepRoot
for (let i = 0; i < 200; i++) { deepTail.n = {}; deepTail = deepTail.n }
deepTail.leaf = 1

const SCENARIOS = [
  ['flat object, 8 keys', flat],
  ['nested document, 3 deep', nested],
  ['1,000 documents', docs],
  ['10,000 numbers', numbers],
  ['nesting 200 deep', deepRoot],
]

// Soundness before speed, every contender, every scenario — a bench that times
// wrong code measures nothing. These are the common-denominator shapes, so a
// disagreement here is a defect worth stopping for, not a design choice.
for (const [label, value] of SCENARIOS) {
  for (const { name, fn } of CONTENDERS) {
    if (!sound(fn(value), value)) throw new Error(`${name} does not faithfully copy "${label}" — that shape was chosen because every contender handles it, so either the choice or the contender is wrong`)
  }
}

console.log('plain objects, arrays, numbers and strings — the shapes every contender copies alike\n')
table(['contender', ...SCENARIOS.map(([label]) => label)], CONTENDERS.map(({ name, fn }) => [
  name,
  ...SCENARIOS.map(([, value]) => rate(opsPerSec(() => fn(value), 400))),
]))

// ---------- the shapes they disagree on ----------
// Soundness is decided per cell rather than from a list in a comment: a rival
// that starts copying Maps starts being timed on the next run, with nothing in
// this file to update.
const cyclic = () => { const x = { deep: { tag: 'a' } }; x.self = x; return x }

const DIVERGENT = [
  ['Date', new Date(864e5)],
  ['Map of objects', new Map([[{ k: 1 }, { v: 1 }], [{ k: 2 }, { v: 2 }]])],
  ['Set of objects', new Set([{ a: 1 }, { a: 2 }, { a: 3 }])],
  ['Uint8Array, 10,000 bytes', new Uint8Array(10_000).fill(7)],
  ['cyclic', cyclic()],
]

console.log('\nthe shapes they copy differently — `unsound` is a lost copy, not a slow one\n')
table(['contender', ...DIVERGENT.map(([label]) => label)], CONTENDERS.map(({ name, fn }) => [
  name,
  ...DIVERGENT.map(([, value]) => {
    try {
      if (!sound(fn(value), value)) return 'unsound'
    } catch { return '⚠️ throws' }
    return rate(opsPerSec(() => fn(value), 400))
  }),
]))
