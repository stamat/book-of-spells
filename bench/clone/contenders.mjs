// The rival set, shared by both clone benches so the two tables name the same
// eight implementations in the same order and can be read side by side.
//
// Chosen one per architectural class rather than one per npm listing:
// structuredClone is the platform and the reason not to install anything;
// a JSON round-trip is what most code actually does, however much it loses;
// rfdc is the speed reference every other README benchmarks against, and ships
// in two tiers because its defaults trade correctness for that speed; lodash
// is what most projects already have; es-toolkit is its modern replacement;
// and ramda is the FP lineage.
//
// rfdc appears twice on purpose. `rfdc()` is what a caller gets by reaching
// for the package, and it neither survives a cycle nor keeps a prototype;
// `rfdc({ circles: true, proto: true })` is the same package asked to. Pricing
// only the fast tier would credit it for work it declined to do, and pricing
// only the safe tier would hide that its headline number comes from the other
// one.
//
// Deliberately left out: `clone` (pvorb) and `deepcopy`, whose semantics land
// between lodash and ramda closely enough that the rows would repeat rather
// than inform, and `just-clone`, which is rfdc's design with fewer users.
//
// Versions are read from the installed packages rather than written into this
// comment: a version in prose is a version that goes stale silently.
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { clone } from '../../src/helpers.mjs'

const RIVALS = ['rfdc', 'lodash', 'es-toolkit', 'ramda']

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

// `pkg` is the install the row speaks for — null for the three that cost
// nothing to use, which is the column the capability table exists to price.
// The order is the column order of every table in this directory.
const SPEC = [
  { pkg: null, label: () => '`clone` (book-of-spells)', get: async () => clone },
  { pkg: null, label: () => '`structuredClone` (platform)', get: async () => structuredClone },
  { pkg: null, label: () => 'JSON round-trip', get: async () => (v) => JSON.parse(JSON.stringify(v)) },
  { pkg: 'rfdc', label: (v) => `rfdc ${v.rfdc}`, get: async () => (await import(resolveLocal('rfdc'))).default() },
  { pkg: 'rfdc', label: (v) => `rfdc ${v.rfdc} \`{circles,proto}\``, get: async () => (await import(resolveLocal('rfdc'))).default({ circles: true, proto: true }) },
  { pkg: 'lodash', label: (v) => `lodash \`cloneDeep\` ${v.lodash}`, get: async () => (await import(resolveLocal('lodash'))).default.cloneDeep },
  { pkg: 'es-toolkit', label: (v) => `es-toolkit \`cloneDeep\` ${v['es-toolkit']}`, get: async () => (await import(resolveLocal('es-toolkit'))).cloneDeep },
  { pkg: 'ramda', label: (v) => `ramda \`clone\` ${v.ramda}`, get: async () => { const r = await import(resolveLocal('ramda')); return r.clone ?? r.default.clone } },
]

export const COUNT = SPEC.length

async function versions() {
  return Object.fromEntries(await Promise.all(RIVALS.map(async (n) =>
    [n, JSON.parse(await readFile(local(n + '/package.json'), 'utf8')).version])))
}

export async function load() {
  const v = await versions()
  return Promise.all(SPEC.map(async (s) => ({ name: s.label(v), pkg: s.pkg, fn: await s.get() })))
}

// Deterministic corpus generation. Seeded rather than Math.random: a bench
// whose input changes between runs cannot be compared against its own previous
// output. Duplicated from bench/deepEqual rather than shared, because a bench
// directory owning its own fixtures is what lets either one change its corpus
// without silently moving the other's numbers.
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
// contender in the list copies identically, which is what makes a timing
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

// The check every timed row passes before its number is reported: the copy
// holds the same data and shares none of the objects holding it. deepEqual
// answers the first half and is itself scored in bench/deepEqual — an oracle
// with its own capability table, not an assertion that we are right because we
// said so. The second half is what deepEqual cannot see: a "clone" that
// returns its argument is structurally equal to it and is not a clone.
export function sharesNothing(copy, original, seen = new Set()) {
  if (original === null || typeof original !== 'object') return true
  if (copy === original) return false
  if (seen.has(original)) return true
  seen.add(original)
  for (const key of Object.keys(original)) {
    if (!sharesNothing(copy?.[key], original[key], seen)) return false
  }
  return true
}
