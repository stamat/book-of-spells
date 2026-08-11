// Where hashing starts paying, measured from both ends — because dedupe()
// beating a pairwise scan by 41× at a thousand values and losing to it by 12×
// at two is one fact, not two, and quoting either half alone misleads.
//
// The fold pays by amortization: one identity per value, asked about many
// times. So the two phases below bracket it.
//
// Phase one, ONE pair of large values, which amortizes nothing — the hash
// must consume both values entirely before it can say a word, while deepEqual
// stops at the first difference and allocates nothing. This is the row
// dedupe() loses, and it exists so the README and the blog post can say where
// NOT to use it and cite a number.
//
// Phase two, the crossover: at what pile size does deleting comparisons beat
// making them? Hashing never made a comparison faster, it made most of them
// not happen, and that trade only clears once there are enough values for
// O(N) vs O(N²) to outweigh a fold per value.
//
// Contenders are the public API on both sides — deepEqual / dedupe, never the
// private fold — because that is the choice a caller actually faces.
//
// Deliberately not measured: memory (the fold allocates nothing, deepEqual
// allocates nothing on the early-exit path, neither claim is timed here), and
// pile sizes past a thousand — dedupe.bench.mjs owns the scale curve.
//
// Runs on generated data by default. Pass `--corpus <file.json>` to give
// phase one a real document — the published numbers used plotly/datasets'
// geojson-counties-fips.json, 3.2 MB of US county polygons.
import { readFileSync } from 'node:fs'
import { deepEqual, dedupe } from '../src/helpers.mjs'
import { table } from './harness.mjs'

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// A stand-in for a big GeoJSON: one wrapper object over a long array of
// coordinate-heavy features, which is the shape that makes the point — the
// difference this bench injects sits in the wrapper, so the walk can exit
// immediately while the fold still has megabytes to chew.
function generate() {
  const rnd = mulberry32(42)
  return {
    type: 'FeatureCollection',
    // 600 × 120 coordinate pairs lands near 3 MB, the scale of the real file
    features: Array.from({ length: 600 }, (_, i) => ({
      type: 'Feature',
      id: String(i),
      properties: { name: 'region-' + i, pop: (rnd() * 1e6) | 0 },
      geometry: {
        type: 'Polygon',
        coordinates: [Array.from({ length: 120 }, () => [rnd() * 360 - 180, rnd() * 180 - 90])],
      },
    })),
  }
}

const corpusArg = process.argv.indexOf('--corpus')
const source = corpusArg !== -1
  ? JSON.parse(readFileSync(process.argv[corpusArg + 1], 'utf8'))
  : generate()

// Independent deep copies, so nothing short-circuits on reference identity —
// deepEqual's `a === b` fast path would otherwise answer the equal case
// without looking at anything.
const a = structuredClone(source)
const equal = structuredClone(source)
const earlyDiff = structuredClone(source)
// first key of the wrapper: the difference a structural walk meets on step one
earlyDiff[Object.keys(earlyDiff)[0]] = '__different__'

if (!deepEqual(a, equal)) throw new Error('equal pair is not equal — bench is measuring the wrong thing')
if (deepEqual(a, earlyDiff)) throw new Error('early-diff pair compares equal — bench is measuring the wrong thing')

// Timed loop rather than harness.time(): these ops span nanoseconds (early
// exit) to milliseconds (full walk), and a fixed run count cannot serve both.
function opsPerSec(fn, budgetMs = 1000) {
  fn()
  let n = 0
  const t0 = performance.now()
  let elapsed = 0
  while ((elapsed = performance.now() - t0) < budgetMs) {
    fn()
    n++
  }
  return (n / elapsed) * 1000
}

const rate = (n) => n >= 1e6 ? (n / 1e6).toFixed(1) + 'M ops/s'
  : n >= 1e3 ? Math.round(n / 1e3) + 'k ops/s'
  : Math.round(n) + ' ops/s'

const bytes = JSON.stringify(source).length
console.log(`one pair, ${(bytes / 1e6).toFixed(1)} MB per value\n`)

table(['case', 'structural walk — deepEqual(a, b)', 'hash both sides — dedupe([a, b])'], [
  [
    'equal pair',
    rate(opsPerSec(() => deepEqual(a, equal))),
    rate(opsPerSec(() => dedupe([a, equal]))),
  ],
  [
    'difference in the first key',
    rate(opsPerSec(() => deepEqual(a, earlyDiff))),
    rate(opsPerSec(() => dedupe([a, earlyDiff]))),
  ],
])

// ---------- phase two: the crossover ----------
// Small flat documents, all distinct — the corpus most favourable to the
// pairwise scan, since every comparison it makes runs to completion and none
// exits early on a mismatch it could have found sooner. Duplicates push the
// crossover right; larger documents push it right too, by making each fold
// dearer. The number below is an order of magnitude, not a threshold to
// hardcode.
console.log('')
const WORDS = ['alpha', 'beta', 'gamma', 'delta', 'sigma', 'omega']
function smallDoc(rnd) {
  const word = () => WORDS[(rnd() * WORDS.length) | 0] + ((rnd() * 1e6) | 0)
  return {
    id: (rnd() * 1e9) | 0,
    name: word(),
    email: word() + '@example.io',
    tags: [word(), word()],
    addr: { city: word(), geo: { lat: rnd() * 90, lng: rnd() * 180 } },
  }
}

function pairwise(arr) {
  const out = []
  outer: for (const it of arr) {
    for (const x of out) if (deepEqual(x, it)) continue outer
    out.push(it)
  }
  return out
}

const crossRows = []
for (const n of [2, 8, 16, 32, 128, 1_000]) {
  const rnd = mulberry32(7)
  const arr = Array.from({ length: n }, () => smallDoc(rnd))
  if (dedupe(arr).length !== pairwise(arr).length) throw new Error(`disagreement at ${n}`)
  const d = opsPerSec(() => dedupe(arr), 250)
  const p = opsPerSec(() => pairwise(arr), 250)
  crossRows.push([
    n.toLocaleString('en-US'),
    rate(d),
    rate(p),
    d > p ? `dedupe ${(d / p).toFixed(1)}×` : `pairwise ${(p / d).toFixed(1)}×`,
  ])
}
table(['items', 'dedupe', 'pairwise deepEqual', 'winner'], crossRows)
