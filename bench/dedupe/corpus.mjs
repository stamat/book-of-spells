// The corpus every dedupe bench in this directory runs on, and the oracle
// every contender is asserted against. Shared rather than copied because the
// scale table and the ecosystem table are only comparable if the input is the
// same input — two generators that drift apart turn one claim into two.
//
// Seeded PRNG, no Math.random: the same call sequence regenerates the same
// documents on any machine, so a number published here can be rerun by
// someone else. Corpus size is the only knob. `loadCorpus` below is the way
// out of the generated world when realism matters more than reproducibility.
import { readFileSync } from 'node:fs'

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
// serialization-order different. That shuffle is what separates a sound
// contender from an unsound one: a raw JSON.stringify key keeps almost all of
// these as distinct.
export function shuffledClone(v) {
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

export function makeCorpus(uniques, dupRate = 0.1) {
  const base = Array.from({ length: uniques }, () => pick(GENS)())
  const input = []
  for (let i = 0; i < base.length; i++) {
    input.push(base[i])
    if (rnd() < dupRate) input.push(shuffledClone(base[(rnd() * (i + 1)) | 0]))
  }
  return input
}

// The corpus that used to be hostile to the fold, kept as the guard against
// it coming back. Sets and Maps of equal size once folded on `size` alone, so
// every one of them landed in a single bucket and the in-bucket deepEqual scan
// became the whole algorithm again, quadratic: 4,000 Sets took 5.0 s against
// object-hash's 36 ms, which is what put members into the fold. Dates are the
// control — they always folded on their timestamp, and the row exists to show
// the difference between a value the hash can see into and one it cannot.
export function makeCollectionCorpus(uniques, kind, dupRate = 0.1) {
  const members = (i, n) => Array.from({ length: n }, (_, j) => WORDS[(i + j) % WORDS.length] + (i * n + j))
  const make = {
    set: (i) => new Set(members(i, 8)),
    map: (i) => new Map(members(i, 8).map((m, j) => ['k' + j, m])),
    date: (i) => new Date(1420070400000 + i * 1000),
  }[kind]
  if (!make) throw new Error(`unknown collection kind ${kind} — expected set, map or date`)

  // A duplicate is rebuilt from the same members in a different order, which
  // is the only way to be structurally equal and not byte-identical here.
  const clone = {
    set: (v) => new Set([...v].reverse()),
    map: (v) => new Map([...v].reverse()),
    date: (v) => new Date(v.getTime()),
  }[kind]

  const base = Array.from({ length: uniques }, (_, i) => make(i))
  const input = []
  for (let i = 0; i < base.length; i++) {
    input.push(base[i])
    if (rnd() < dupRate) input.push(clone(base[(rnd() * (i + 1)) | 0]))
  }
  return input
}

// Sorted-key serialization: the ground truth. Sound by construction for JSON
// data and independent of everything under test, which is the only reason a
// contender's count can be called right or wrong.
//
// Collections serialize unordered — members sorted, Map entries sorted — to
// match what deepEqual means by equal, since a Set is equal to itself in any
// order. An oracle disagreeing with the definition under test would fail every
// contender rather than judge one.
export function canonical(v) {
  if (v instanceof Date) return 'D' + v.getTime()
  if (v instanceof Set) return 'S[' + [...v].map(canonical).sort().join(',') + ']'
  if (v instanceof Map) return 'M[' + [...v].map(([k, val]) => canonical(k) + ':' + canonical(val)).sort().join(',') + ']'
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

// A real pile instead of a generated one: `--corpus <file>` on the benches
// that take it, where the file is a JSON array or one JSON document per line
// (NDJSON, what GH Archive serves). `npm run setup` downloads one hour of
// GitHub events into this directory; `npm run teardown` deletes it.
//
// Real events are almost entirely unique, which is the point of running them:
// the generated corpus is 10% duplicates, and a duplicate is the cheap case —
// found in a bucket, never compared against the whole pile. Near-zero
// duplicates is the fold's worst case, every document paying for a hash that
// saves nothing.
export function loadCorpus(file) {
  const text = readFileSync(file, 'utf8')
  const first = text.trimStart()[0]
  if (first === '[') return JSON.parse(text)
  const out = []
  for (const line of text.split('\n')) if (line.trim()) out.push(JSON.parse(line))
  if (!out.length) throw new Error(`${file} holds no documents — expected a JSON array or one JSON document per line`)
  return out
}

export function dedupByKey(arr, keyOf) {
  const seen = new Set()
  const out = []
  for (const it of arr) {
    const k = keyOf(it)
    if (!seen.has(k)) { seen.add(k); out.push(it) }
  }
  return out
}
