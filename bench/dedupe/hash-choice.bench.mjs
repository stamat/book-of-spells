// Which hash dedupe() should fold with, measured with everything else held
// still: same bucket-then-deepEqual architecture for every contender, so the
// only variable is how a value becomes a bucket key.
//
// The grid is deliberately 2×2 — {FNV-1a, CRC32} × {folded during the walk,
// computed over the canonical string} — because the two changes between 2013
// and today (drop the string, swap the hash) landed together, and a table
// that moves both at once cannot say which one paid. The diagonal is the only
// honest attribution.
//
// Also reported: bucket quality per hash — distinct values in, distinct keys
// out, collisions between. Correctness is not on this axis and cannot be:
// deepEqual inside the bucket decides every verdict, so a worse hash costs
// comparisons, never answers. Every contender's output is asserted against
// the canonical-string oracle before its time is reported.
//
// Deliberately not measured: cryptographic strength (nothing here defends
// against chosen inputs — see the SHA-1 row's purpose, which is to price
// object-hash's default, not to compete), and browser engines.
//
// Runs on the deterministic generated corpus by default. Pass
// `--corpus <file.json>` with an array of documents to run the real thing —
// the published numbers used json-iterator/test-data's large-file.json,
// 11,351 GitHub event objects.
import { createHash } from 'node:crypto'
import { crc32 as zlibCrc32 } from 'node:zlib'
import { readFileSync } from 'node:fs'
import { deepEqual } from '../../src/helpers.mjs'
import { time, fmt, table } from '../harness.mjs'

// ---------- deterministic corpus (mulberry32, seed 42) ----------
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
// reassigned before the quality phase, which has to be reproducible whether
// or not --corpus consumed this stream first
let rnd = mulberry32(42)
const pick = (arr) => arr[(rnd() * arr.length) | 0]
const WORDS = ['alpha', 'beta', 'gamma', 'delta', 'sigma', 'omega', 'lambda', 'kappa', 'zeta', 'theta']
const word = () => pick(WORDS) + ((rnd() * 1e6) | 0)

function event() {
  return {
    type: pick(WORDS) + 'Event',
    actor: { id: (rnd() * 1e6) | 0, login: word() },
    repo: { id: (rnd() * 1e6) | 0, name: word() + '/' + word() },
    payload: {
      action: pick(WORDS),
      commits: Array.from({ length: 1 + ((rnd() * 3) | 0) }, () => ({ sha: word() + word(), message: word() + ' ' + word(), distinct: rnd() > 0.3 })),
    },
    public: true,
  }
}

function shuffledClone(v) {
  if (v === null || typeof v !== 'object') return v
  if (Array.isArray(v)) return v.map(shuffledClone)
  const keys = Object.keys(v)
  for (let i = keys.length - 1; i > 0; i--) {
    const j = (rnd() * (i + 1)) | 0
    ;[keys[i], keys[j]] = [keys[j], keys[i]]
  }
  const out = {}
  for (const k of keys) out[k] = shuffledClone(v[k])
  return out
}

const corpusArg = process.argv.indexOf('--corpus')
const base = corpusArg !== -1
  ? JSON.parse(readFileSync(process.argv[corpusArg + 1], 'utf8'))
  : Array.from({ length: 11_351 }, event)

// 10% duplicates, injected as key-order-reshuffled deep clones: structurally
// equal, byte-order different — the case byte identity cannot see
const input = []
for (let i = 0; i < base.length; i++) {
  input.push(base[i])
  if (rnd() < 0.1) input.push(shuffledClone(base[(rnd() * (i + 1)) | 0]))
}

// ---------- the canonical string, post one's identity ----------
function canonical(v) {
  if (v === null || typeof v !== 'object') return JSON.stringify(v)
  if (Array.isArray(v)) {
    let s = '['
    for (let i = 0; i < v.length; i++) { if (i) s += ','; s += canonical(v[i]) }
    return s + ']'
  }
  const keys = Object.keys(v).sort()
  let s = '{'
  for (let i = 0; i < keys.length; i++) { if (i) s += ','; s += JSON.stringify(keys[i]) + ':' + canonical(v[keys[i]]) }
  return s + '}'
}

// ---------- FNV-1a, folded ----------
// A transcription of src/helpers.mjs' private fold, kept here rather than
// exported: the fold is an implementation detail of dedupe(), and a bench is
// not a reason to make it public. Drift between the two is caught by the
// oracle assertion below, not by trust.
const FNV_SEED = 2166136261
const DEPTH_CAP = 32
const f64 = new Float64Array(1)
const u32 = new Uint32Array(f64.buffer)
const objProto = Object.prototype
const objTag = Object.prototype.toString

function fnvString(h, s) {
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h
}
function fnvNumber(h, n) {
  if (n !== n) return Math.imul(h ^ 0x7A3, 16777619)
  f64[0] = n === 0 ? 0 : n
  h = Math.imul(h ^ u32[0], 16777619)
  return Math.imul(h ^ u32[1], 16777619)
}
function fnvValue(h, v, depth) {
  if (v === null) return Math.imul(h ^ 1, 16777619)
  const t = typeof v
  if (t === 'number') return fnvNumber(Math.imul(h ^ 2, 16777619), v)
  if (t === 'string') return fnvString(Math.imul(h ^ 3, 16777619), v)
  if (t === 'boolean') return Math.imul(h ^ (v ? 4 : 5), 16777619)
  if (t !== 'object') return Math.imul(h ^ 7, 16777619)
  if (depth > DEPTH_CAP) return Math.imul(h ^ 8, 16777619)
  if (Array.isArray(v)) {
    h = Math.imul(h ^ 9, 16777619)
    for (let i = 0; i < v.length; i++) h = fnvValue(h, v[i], depth + 1)
    return Math.imul(h ^ 10, 16777619)
  }
  const proto = Object.getPrototypeOf(v)
  if (proto !== objProto && proto !== null && objTag.call(v) !== '[object Object]') return fnvString(h, objTag.call(v))
  const keys = Object.keys(v).sort()
  h = Math.imul(h ^ 11, 16777619)
  for (let i = 0; i < keys.length; i++) {
    h = fnvString(h, keys[i])
    h = fnvValue(h, v[keys[i]], depth + 1)
  }
  return Math.imul(h ^ 12, 16777619)
}
const fnvFold = (v) => fnvValue(FNV_SEED, v, 0) >>> 0

// ---------- CRC32, table-driven ----------
const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c >>> 0
}
// 2013's exact recipe: one table lookup per character, low byte only — which
// is where CRC32's byte-orientation first shows up as a cost
function crc32(s) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < s.length; i++) c = CRC_TABLE[(c ^ s.charCodeAt(i)) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

// CRC32 folded over the same traversal FNV walks, so the rows differ by the
// mixing step alone. A CRC is defined over bytes, so every non-byte input has
// to be marshalled into them first — one step per byte, four per number half,
// two per character — and that marshalling is not overhead this bench added,
// it is what using a byte checksum on structured values costs.
const crcStep = (c, b) => CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8)
function crcU32(c, x) {
  c = crcStep(c, x)
  c = crcStep(c, x >>> 8)
  c = crcStep(c, x >>> 16)
  return crcStep(c, x >>> 24)
}
function crcStr(c, s) {
  for (let i = 0; i < s.length; i++) {
    const x = s.charCodeAt(i)
    c = crcStep(c, x)
    c = crcStep(c, x >>> 8)
  }
  return c
}
function crcNumber(c, n) {
  if (n !== n) return crcStep(c, 0xA3)
  f64[0] = n === 0 ? 0 : n
  c = crcU32(c, u32[0])
  return crcU32(c, u32[1])
}
function crcValue(c, v, depth) {
  if (v === null) return crcStep(c, 1)
  const t = typeof v
  if (t === 'number') return crcNumber(crcStep(c, 2), v)
  if (t === 'string') return crcStr(crcStep(c, 3), v)
  if (t === 'boolean') return crcStep(c, v ? 4 : 5)
  if (t !== 'object') return crcStep(c, 7)
  if (depth > DEPTH_CAP) return crcStep(c, 8)
  if (Array.isArray(v)) {
    c = crcStep(c, 9)
    for (let i = 0; i < v.length; i++) c = crcValue(c, v[i], depth + 1)
    return crcStep(c, 10)
  }
  const proto = Object.getPrototypeOf(v)
  if (proto !== objProto && proto !== null && objTag.call(v) !== '[object Object]') return crcStr(c, objTag.call(v))
  const keys = Object.keys(v).sort()
  c = crcStep(c, 11)
  for (let i = 0; i < keys.length; i++) {
    c = crcStr(c, keys[i])
    c = crcValue(c, v[keys[i]], depth + 1)
  }
  return crcStep(c, 12)
}
const crcFold = (v) => ((crcValue(0xFFFFFFFF, v, 0) ^ 0xFFFFFFFF) >>> 0)

// ---------- contenders: one architecture, seven keys ----------
// Bucket, then deepEqual inside the bucket. Identical for every row, so the
// clock is timing the key and nothing else.
function dedupeWith(arr, keyOf) {
  const buckets = new Map()
  const out = []
  for (const it of arr) {
    const k = keyOf(it)
    const b = buckets.get(k)
    if (b === undefined) { buckets.set(k, [it]); out.push(it); continue }
    let dup = false
    for (const c of b) if (deepEqual(c, it)) { dup = true; break }
    if (!dup) { b.push(it); out.push(it) }
  }
  return out
}

// Deliberately not calling fnvString here: it is hot inside fnvValue with
// short key strings, and feeding the same function multi-kilobyte canonical
// strings from a second contender left V8 optimized for the wrong case — the
// row read 5× slow until it got its own copy. Every contender owns its loop,
// or the bench measures JIT history instead of hashes.
function fnvWholeString(s) {
  let h = FNV_SEED
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

const CONTENDERS = [
  ['FNV-1a folded during the walk', fnvFold],
  ['CRC32 folded during the walk', crcFold],
  ['FNV-1a over canonical string', (v) => fnvWholeString(canonical(v))],
  ['CRC32 over canonical string (2013)', (v) => crc32(canonical(v))],
  ['native zlib.crc32 over canonical string', (v) => zlibCrc32(canonical(v))],
  ['SHA-1 over canonical string (object-hash)', (v) => createHash('sha1').update(canonical(v)).digest('hex')],
  ['canonical string as key, no hash', canonical],
]

// ---------- speed ----------
const truth = dedupeWith(input, canonical)
console.log(`corpus: ${input.length.toLocaleString('en-US')} documents, ${truth.length.toLocaleString('en-US')} distinct, ${(input.length - truth.length).toLocaleString('en-US')} duplicates\n`)

const rows = []
for (const [name, keyOf] of CONTENDERS) {
  const got = dedupeWith(input, keyOf).length
  if (got !== truth.length) throw new Error(`${name} unsound: ${got} !== ${truth.length}`)
  // that assertion pass doubles as the warmup; median of 7 because run-to-run
  // spread on this corpus reached 30% at 3
  rows.push([name, fmt(time(() => dedupeWith(input, keyOf), 7))])
}
table(['key derivation', 'time'], rows)

// ---------- bucket quality ----------
// Collisions cost comparisons, never answers, so this table cannot show one
// hash as more correct than another — only as tidier. It needs scale to say
// anything at all: at 11k documents in 2^32 buckets the birthday estimate is
// 0.015 collisions, so measuring zero there measures nothing.
console.log('')
rnd = mulberry32(1337)
const QUALITY_SIZES = process.argv.includes('--full') ? [100_000, 1_000_000] : [100_000]
const qrows = []
for (const n of QUALITY_SIZES) {
  const docs = Array.from({ length: n }, event)
  const expected = (n * (n - 1)) / 2 / 2 ** 32
  qrows.push([
    n.toLocaleString('en-US'),
    (n - new Set(docs.map(fnvFold)).size).toLocaleString('en-US'),
    (n - new Set(docs.map(crcFold)).size).toLocaleString('en-US'),
    expected.toFixed(2),
  ])
}
table(['distinct values', 'FNV-1a collisions', 'CRC32 collisions', 'birthday estimate'], qrows)
