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
// Deliberately not measured: pairwise beyond 10k uniques — quadratic,
// minutes, proves nothing new.
//
// The generated corpus is the default because it regenerates identically
// anywhere, which is what makes a published number checkable. For realism
// instead, `--corpus <file>` takes a JSON array or NDJSON — `npm run setup`
// in this directory downloads one hour of GitHub events, the 11,351-document
// corpus the changelog's original numbers used.
//
// Duplicates are injected as deep clones with every object's key order
// reshuffled: structurally equal, byte-order different. That shuffle is what
// separates sound from unsound — json-key silently keeps almost all of them.
//
// Default run stays under ~15s. `script/bench --full` adds 500k and 1M
// uniques and takes minutes.
import { deepEqual, dedupe } from '../../src/helpers.mjs'
import { time, fmt, table } from '../harness.mjs'
import { makeCorpus, loadCorpus, canonical, dedupByKey } from './corpus.mjs'

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
const corpusArg = process.argv.indexOf('--corpus')
const SIZES = full ? [10_000, 50_000, 100_000, 500_000, 1_000_000] : [2_000, 100_000]
const PAIRWISE_CAP = 10_000

const INPUTS = corpusArg !== -1
  ? [loadCorpus(process.argv[corpusArg + 1])]
  : SIZES.map((n) => makeCorpus(n, 0.1))

const rows = []
for (const input of INPUTS) {
  // ground truth: canonical string identity — sound by construction for JSON
  // data, independent of everything under test
  const truth = dedupByKey(input, canonical).length
  const got = dedupe(input).length
  if (got !== truth) throw new Error(`dedupe unsound on ${input.length} documents: ${got} !== ${truth}`)
  const gotHC = dedupHashCache(input).length
  if (gotHC !== truth) throw new Error(`hashcache unsound on ${input.length} documents: ${gotHC} !== ${truth}`)
  const missed = dedupByKey(input, JSON.stringify).length - truth
  rows.push([
    input.length.toLocaleString('en-US'),
    truth.toLocaleString('en-US'),
    fmt(time(() => dedupe(input))),
    fmt(time(() => dedupHashCache(input))),
    fmt(time(() => dedupByKey(input, canonical))),
    `${fmt(time(() => dedupByKey(input, JSON.stringify)))} +${missed.toLocaleString('en-US')} kept dups`,
    truth <= PAIRWISE_CAP ? fmt(time(() => dedupPairwise(input))) : '—',
  ])
}
table(['input', 'uniques', 'dedupe', 'HashCache 2013', 'canon-key', 'json-key (unsound)', 'pairwise deepEqual'], rows)
