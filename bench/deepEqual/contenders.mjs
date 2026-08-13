// The rival set, shared by both deepEqual benches so the two tables name the
// same eight implementations in the same order and can be read side by side.
//
// Chosen one per architectural class rather than one per npm listing:
// fast-deep-equal is the speed reference every other README benchmarks
// against and ships in two tiers (base, and /es6 which adds Map and Set);
// lodash is what most projects already have; es-toolkit is its modern
// replacement; ramda is the FP lineage; deep-eql is chai's engine, so it is
// already in most test suites; and node:util.isDeepStrictEqual is the reason
// to install nothing at all, which any honest table has to include.
//
// Deliberately left out: `deep-equal` (inspect-js), which would add ~25
// transitive packages to a directory whose whole point is that the library
// above it has none — its semantics are close enough to deep-eql that the row
// would repeat rather than inform.
//
// Versions are read from the installed packages rather than written into this
// comment: a version in prose is a version that goes stale silently.
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { isDeepStrictEqual } from 'node:util'
import { deepEqual } from '../../src/helpers.mjs'

const RIVALS = ['fast-deep-equal', 'deep-eql', 'lodash', 'es-toolkit', 'ramda']

const dir = new URL('.', import.meta.url)
const local = (p) => new URL('node_modules/' + p, dir)

// Both benches call this before anything else and exit quietly when the
// rivals are absent, so a fresh checkout running `script/bench` gets a line of
// instruction instead of a stack trace.
export function requireRivals() {
  const missing = RIVALS.filter((n) => !existsSync(local(n + '/package.json')))
  if (!missing.length) return true
  console.log(`skipped — ${missing.join(', ')} not installed. Run \`npm run setup\` in ${dir.pathname}`)
  return false
}

// Node resolution walks up, so a rival hoisted into the repo root as some
// other package's transitive dependency would load silently and be reported
// under the pinned version it is not. Refuse rather than misreport.
function resolveLocal(name) {
  const url = import.meta.resolve(name)
  if (!url.startsWith(dir.href)) throw new Error(`${name} resolved outside ${dir.pathname} — that is a hoisted copy, not the pinned one: ${url}`)
  return url
}

// `pkg` is the install the row speaks for — null for the two that cost
// nothing to use, which is the column the capability table exists to price.
// The order is the column order of every table in this directory; a child
// process is told which contender to run by its index here, so appending is
// safe and reordering renumbers the cells.
const SPEC = [
  { pkg: null, label: () => '`deepEqual` (book-of-spells)', get: async () => deepEqual },
  { pkg: 'fast-deep-equal', label: (v) => `fast-deep-equal ${v['fast-deep-equal']}`, get: async () => (await import(resolveLocal('fast-deep-equal'))).default },
  // The es6 build is a separate entry point of the same package, not a
  // separate package — bare `fast-deep-equal/es6` is a directory import and
  // fails under ESM, so the file is named outright.
  { pkg: 'fast-deep-equal', label: (v) => `fast-deep-equal/es6 ${v['fast-deep-equal']}`, get: async () => (await import(resolveLocal('fast-deep-equal/es6/index.js'))).default },
  { pkg: 'deep-eql', label: (v) => `deep-eql ${v['deep-eql']}`, get: async () => (await import(resolveLocal('deep-eql'))).default },
  { pkg: 'lodash', label: (v) => `lodash \`isEqual\` ${v.lodash}`, get: async () => (await import(resolveLocal('lodash'))).default.isEqual },
  { pkg: 'es-toolkit', label: (v) => `es-toolkit \`isEqual\` ${v['es-toolkit']}`, get: async () => (await import(resolveLocal('es-toolkit'))).isEqual },
  { pkg: 'ramda', label: (v) => `ramda \`equals\` ${v.ramda}`, get: async () => { const r = await import(resolveLocal('ramda')); return r.equals ?? r.default.equals } },
  { pkg: null, label: () => '`util.isDeepStrictEqual` (node)', get: async () => isDeepStrictEqual },
]

export const COUNT = SPEC.length

async function versions() {
  return Object.fromEntries(await Promise.all(RIVALS.map(async (n) =>
    [n, JSON.parse(await readFile(local(n + '/package.json'), 'utf8')).version])))
}

// Names only. The parent process of the capability bench never calls a
// contender, so it never imports one — loading eight equality libraries to
// print a table header is work with no output.
export async function describe() {
  const v = await versions()
  return SPEC.map((s) => ({ name: s.label(v), pkg: s.pkg }))
}

// One contender, for a child process that runs only that column.
export async function loadOne(index) {
  return SPEC[index].get()
}

// Every contender in one process, for benches that time rather than isolate.
export async function load() {
  const v = await versions()
  return Promise.all(SPEC.map(async (s) => ({ name: s.label(v), pkg: s.pkg, fn: await s.get() })))
}

// Deterministic corpus generation, shared so the speed bench and any future
// bench in this directory measure the same documents. Seeded rather than
// Math.random: a bench whose input changes between runs cannot be compared
// against its own previous output.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WORDS = ['alpha', 'beta', 'gamma', 'delta', 'sigma', 'omega']

// Plain objects, arrays, strings and numbers only — the shapes every
// contender in the list handles identically, which is what makes a timing
// column a fair race rather than a comparison of feature sets.
export function document(rnd, depth = 3) {
  const word = () => WORDS[(rnd() * WORDS.length) | 0] + ((rnd() * 1e6) | 0)
  const node = (d) => d === 0 ? { leaf: word(), n: (rnd() * 1e9) | 0 } : {
    id: (rnd() * 1e9) | 0,
    name: word(),
    tags: [word(), word(), word()],
    scores: [rnd(), rnd(), rnd()],
    child: node(d - 1),
  }
  return node(depth)
}
