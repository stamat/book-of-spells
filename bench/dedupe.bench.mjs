// dedupe() at scale against its rivals, on a deterministic generated corpus.
//
// Measured: dedupe (fold + bucket + deepEqual verify) vs the two things
// people reach for instead — a canonical sorted-key string as Map key
// (sound, allocates the string), raw JSON.stringify as Map key (the folk
// solution — unsound, key order leaks into the key), a uniqWith-style
// pairwise deepEqual scan (sound, quadratic, small sizes only) — and the
// system dedupe descends from: HashCache
// (https://stamat.wordpress.com/2013/07/03/javascript-quickly-find-very-large-objects-in-a-large-array/,
// 2013) — table-driven CRC32 over the ordered stringify, buckets, deep
// equality inside the bucket. Its verifier here is today's deepEqual for
// every contender, so the race is between hashing systems, not between
// equality implementations.
// Deliberately not measured: real-world corpora (the numbers in the
// changelog used 11,351 GitHub events; this file trades that realism for a
// corpus that regenerates identically anywhere), and pairwise beyond 10k
// uniques — quadratic, minutes, proves nothing new.
//
// Duplicates are injected as deep clones with every object's key order
// reshuffled: structurally equal, byte-order different. That shuffle is what
// separates sound from unsound — json-key silently keeps almost all of them.
//
// Default run stays under ~15s. `script/bench --full` adds 500k and 1M
// uniques and takes minutes.
import { deepEqual, dedupe } from '../src/helpers.mjs'
import { time, fmt, table } from './harness.mjs'

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
const rnd = mulberry32(42)
const pick = (arr) => arr[(rnd() * arr.length) | 0]
const WORDS = ['alpha', 'beta', 'gamma', 'delta', 'sigma', 'omega', 'lambda', 'kappa', 'zeta', 'theta']
const word = () => pick(WORDS) + ((rnd() * 1e6) | 0)

const GENS = [
  function flat() {
    return { name: word(), value: rnd() * 1000, enabled: rnd() > 0.5, count: (rnd() * 100) | 0 }
  },
  function user() {
    return {
      id: (rnd() * 1e9) | 0,
      name: word(),
      email: word() + '@' + pick(WORDS) + '.io',
      tags: Array.from({ length: (rnd() * 5) | 0 }, word),
      address: { street: word(), city: pick(WORDS), zip: String((rnd() * 99999) | 0), geo: { lat: rnd() * 180 - 90, lng: rnd() * 360 - 180 } },
    }
  },
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
  },
  function deep() {
    let node = { leaf: word(), n: rnd() }
    const depth = 4 + ((rnd() * 5) | 0)
    for (let i = 0; i < depth; i++) node = { level: i, child: node, side: [rnd(), word()] }
    return node
  },
]

// deep clone with every object's key order reshuffled — structurally equal,
// serialization-order different
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

function makeCorpus(uniques, dupRate) {
  const base = Array.from({ length: uniques }, () => pick(GENS)())
  const input = []
  for (let i = 0; i < base.length; i++) {
    input.push(base[i])
    if (rnd() < dupRate) input.push(shuffledClone(base[(rnd() * (i + 1)) | 0]))
  }
  return input
}

// ---------- rivals ----------
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
function dedupByKey(arr, keyOf) {
  const seen = new Set()
  const out = []
  for (const it of arr) {
    const k = keyOf(it)
    if (!seen.has(k)) { seen.add(k); out.push(it) }
  }
  return out
}

// the 2013 HashCache: CRC32 of the ordered stringify, bucket, deep-compare
// inside the bucket
const CRC_TABLE = new Uint32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1
  CRC_TABLE[n] = c >>> 0
}
function crc32(s) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < s.length; i++) c = CRC_TABLE[(c ^ s.charCodeAt(i)) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
function dedupHashCache(arr) {
  const buckets = new Map()
  const out = []
  for (const it of arr) {
    const k = crc32(canonical(it))
    const b = buckets.get(k)
    if (!b) { buckets.set(k, [it]); out.push(it); continue }
    let dup = false
    for (const c of b) if (deepEqual(c, it)) { dup = true; break }
    if (!dup) { b.push(it); out.push(it) }
  }
  return out
}
function dedupPairwise(arr) {
  const u = []
  outer: for (const it of arr) {
    for (const x of u) if (deepEqual(x, it)) continue outer
    u.push(it)
  }
  return u
}

// ---------- run ----------
const full = process.argv.includes('--full')
const SIZES = full ? [10_000, 50_000, 100_000, 500_000, 1_000_000] : [2_000, 100_000]
const PAIRWISE_CAP = 10_000

const rows = []
for (const uniques of SIZES) {
  const input = makeCorpus(uniques, 0.1)
  // ground truth: canonical string identity — sound by construction for JSON
  // data, independent of everything under test
  const truth = dedupByKey(input, canonical).length
  const got = dedupe(input).length
  if (got !== truth) throw new Error(`dedupe unsound at ${uniques}: ${got} !== ${truth}`)
  const gotHC = dedupHashCache(input).length
  if (gotHC !== truth) throw new Error(`hashcache unsound at ${uniques}: ${gotHC} !== ${truth}`)
  const missed = dedupByKey(input, JSON.stringify).length - truth
  rows.push([
    input.length.toLocaleString('en-US'),
    truth.toLocaleString('en-US'),
    fmt(time(() => dedupe(input))),
    fmt(time(() => dedupHashCache(input))),
    fmt(time(() => dedupByKey(input, canonical))),
    `${fmt(time(() => dedupByKey(input, JSON.stringify)))} +${missed.toLocaleString('en-US')} kept dups`,
    uniques <= PAIRWISE_CAP ? fmt(time(() => dedupPairwise(input))) : '—',
  ])
}
table(['input', 'uniques', 'dedupe', 'HashCache 2013', 'canon-key', 'json-key (unsound)', 'pairwise deepEqual'], rows)
