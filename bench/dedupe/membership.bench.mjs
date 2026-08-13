// "Is this document already in that pile?" — the question dedupe() does not
// answer. This bench decided that DeepSet should exist and now guards the one
// number its documentation quotes.
//
// dedupe() compares N against N, and the fold pays there because it deletes
// comparisons that would otherwise happen. Membership compares 1 against N,
// where there is nothing to delete: the scan already touches each value once,
// and deepEqual leaves most of them after a key or two. So the fold cannot win
// a single lookup, and the only thing that could pay for it is asking many
// times against a pile that does not change. This bench finds out how many.
//
// Three contenders:
//
//   scan      arr.some(x => deepEqual(x, probe)). No build, nothing to keep,
//             and the right answer for anything under the crossover below.
//   DeepSet   the exported class, measured rather than a transcription of it —
//             the fold and the in-bucket deepEqual that dedupe() runs, kept
//             instead of thrown away. Building the index is the cost; has() is
//             what it buys.
//   JSON key  Set of JSON.stringify strings, built once. The thing people
//             actually reach for, here because it is genuinely the fastest
//             and genuinely wrong: key order reaches the key, so a document
//             that is structurally present but serialized differently reads
//             as absent. The probes below include exactly that.
//
// The crossover is computed rather than brute-forced. Both designs are linear
// in the number of queries — total = build + K × query — so the K where the
// index overtakes the scan is build ÷ (scan query − index query), and running
// K up to ten thousand at a hundred thousand documents to watch two straight
// lines cross would cost minutes to rediscover division. The measured K rows
// at the top exist to show the model holds before the computed table leans on
// it.
//
// Deliberately not measured: memory, an index that must be maintained as the
// array changes (a rebuild per mutation is the scan again, and no amount of
// benching makes it otherwise), and Sets or Maps as documents — those fold
// dearer per value, which moves the crossover right, and ecosystem.bench.mjs
// --collections already owns that shape.
import { deepEqual, DeepSet } from '../../src/helpers.mjs'
import { time, fmt, table, opsPerSec } from '../harness.mjs'
import { makeCorpus, shuffledClone, canonical } from './corpus.mjs'

const buildJsonIndex = (arr) => new Set(arr.map((v) => JSON.stringify(v)))
const hasInJsonIndex = (index, probe) => index.has(JSON.stringify(probe))
const scan = (arr, probe) => arr.some((x) => deepEqual(x, probe))

// A hit is a document that IS in the pile, arriving with its keys in a
// different order — which is what a duplicate looks like when it comes from a
// second producer, and the only interesting kind of hit. A miss is a document
// generated the same way and held out, so it is the same shape and the same
// cost to walk, differing only in being absent.
function fixture(n) {
  const all = makeCorpus(n + 64, 0)
  const arr = all.slice(0, n)
  const heldOut = all.slice(n)
  return {
    arr,
    hit: arr.filter((_, i) => i % Math.ceil(n / 32) === 0).slice(0, 32).map(shuffledClone),
    miss: heldOut.slice(0, 32),
  }
}

// The oracle: a sorted-key canonical string, sound by construction for this
// corpus and independent of everything under test. A contender that disagrees
// with it is reported, never timed.
function soundness(arr, probes, has) {
  const truth = new Set(arr.map(canonical))
  for (const probe of probes) {
    if (has(probe) !== truth.has(canonical(probe))) return false
  }
  return true
}

const SIZES = process.argv.includes('--full') ? [1_000, 10_000, 100_000] : [1_000, 10_000]

// ---------- the shape of it, at one size ----------
// Absolute totals, so the two straight lines are visible before the table
// below computes where they cross.
// Pinned, and not the largest size: at a hundred thousand documents a missing
// probe costs about 10 ms to scan, so the thousand-query cell alone would run
// for a quarter of an hour to redraw a line the crossover table below already
// computes. Varying the size is that table's job.
const SHOWN_K = [1, 10, 100, 1_000]
const shownSize = 10_000
const shown = fixture(shownSize)

for (const kind of ['hit', 'miss']) {
  const probes = shown[kind]
  const at = (i) => probes[i % probes.length]

  const deepSet = new DeepSet(shown.arr)
  const jsonIndex = buildJsonIndex(shown.arr)
  const sound = {
    scan: soundness(shown.arr, probes, (p) => scan(shown.arr, p)),
    deepSet: soundness(shown.arr, probes, (p) => deepSet.has(p)),
    json: soundness(shown.arr, probes, (p) => hasInJsonIndex(jsonIndex, p)),
  }
  if (!sound.scan) throw new Error('the scan disagrees with the oracle — deepEqual and canonical() have stopped meaning the same thing, and nothing below is measurable until that is settled')
  if (!sound.deepSet) throw new Error('DeepSet disagrees with the oracle — it and canonical() no longer mean the same thing by duplicate')

  // Discarded, for the same reason the crossover table below warms: without
  // it the first cell of the first row pays the JIT and reads dearer than the
  // cell measuring ten times the work.
  for (let i = 0; i < 20; i++) { scan(shown.arr, at(i)); deepSet.has(at(i)); hasInJsonIndex(jsonIndex, at(i)) }

  const rows = [
    ['scan — `arr.some(deepEqual)`', ...SHOWN_K.map((k) => fmt(time(() => { for (let i = 0; i < k; i++) scan(shown.arr, at(i)) })))],
    ['`DeepSet` — build + queries', ...SHOWN_K.map((k) => fmt(time(() => { const ix = new DeepSet(shown.arr); for (let i = 0; i < k; i++) ix.has(at(i)) })))],
    ['JSON key — build + queries', ...SHOWN_K.map((k) => sound.json
      ? fmt(time(() => { const ix = buildJsonIndex(shown.arr); for (let i = 0; i < k; i++) hasInJsonIndex(ix, at(i)) }))
      : 'unsound')],
  ]
  console.log(`${kind === 'hit' ? 'the document IS in the pile, keys in a different order' : 'the document is NOT in the pile'} — ${shownSize.toLocaleString('en-US')} documents\n`)
  table(['contender', ...SHOWN_K.map((k) => k.toLocaleString('en-US') + (k === 1 ? ' query' : ' queries'))], rows)
  console.log('')
}

// ---------- where it crosses ----------
// Per-unit costs measured once each, then the crossover is arithmetic:
// build + K × index = K × scan  ⟹  K = build ÷ (scan − index).
// A negative or infinite denominator means the index never overtakes, which
// is a real outcome and is printed as such rather than as a number.
//
// Every measurement is preceded by a discarded one at the same size. Without
// it these rows came out non-monotonic — a thousand documents scanning slower
// than ten thousand — because the section above leaves the JIT optimized for
// the shape and size it just finished hammering, and the first size measured
// afterwards pays the deopt. The discarded pass is what makes a row describe
// the code rather than the run order.
//
// Rows are still per-size draws, not points on one curve: corpus.mjs seeds a
// single generator at module load and never resets it, so each fixture is a
// different draw from the same sequence. Within a row all three numbers share
// one corpus, which is what the crossover divides — across rows, read the
// order of magnitude and not the slope.
// Median of three windows after a discarded one, for the same reason
// harness.time() takes a median of runs: a single window that catches a GC
// pause reported a miss at 3.0 ms where its neighbours agreed on 0.08, and one
// such cell is enough to move a crossover from 12 queries to 1.
function measure(fn) {
  opsPerSec(fn, 150)
  const windows = [opsPerSec(fn, 150), opsPerSec(fn, 150), opsPerSec(fn, 150)]
  return 1000 / windows.sort((a, b) => a - b)[1]
}

const crossRows = []
for (const n of SIZES) {
  const f = fixture(n)
  time(() => new DeepSet(f.arr))
  const buildMs = time(() => new DeepSet(f.arr))
  const index = new DeepSet(f.arr)

  for (const kind of ['hit', 'miss']) {
    const probes = f[kind]
    const at = (i) => probes[i % probes.length]
    let i = 0
    const scanMs = measure(() => scan(f.arr, at(i++)))
    let j = 0
    const queryMs = measure(() => index.has(at(j++)))
    const gain = scanMs - queryMs
    crossRows.push([
      n.toLocaleString('en-US'),
      kind,
      fmt(buildMs),
      scanMs.toFixed(4) + ' ms',
      queryMs.toFixed(4) + ' ms',
      gain <= 0 ? 'never' : Math.ceil(buildMs / gain).toLocaleString('en-US') + ' queries',
    ])
  }
}
console.log('the crossover — how many lookups against one unchanging pile pay for building the index\n')
table(['documents', 'probe', 'build once', 'per scan', 'per indexed query', 'index wins from'], crossRows)
