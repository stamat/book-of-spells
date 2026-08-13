// dedupe() against what people actually npm install for this job, on the same
// corpus and the same oracle as dedupe.bench.mjs — so the two tables can be
// read side by side.
//
// This is the one bench in the repo with dependencies, which is why the
// directory carries its own package.json: `npm run setup` installs the four
// rivals at pinned versions, `npm run teardown` deletes them again. The
// library itself stays dependency-free, and a checkout that never runs setup
// never sees them.
//
// Measured: lodash and es-toolkit `uniqWith(isEqual)` and ramda `uniq` — all
// three the O(N²) pairwise scan every uniqWith on npm performs — and
// object-hash as a Map key, the only rival in dedupe's own architectural
// class (hash-keyed, linear, but treating the hash as the verdict rather than
// as a routing hint).
// Deliberately not measured: memory, browser engines, and the quadratic rows
// past 10k uniques — those are skipped by declaration below, because
// extrapolating a curve two measured points already prove buys arithmetic,
// not information.
//
// Generated corpus by default; `--corpus <file>` takes a JSON array or NDJSON
// instead — `npm run setup` downloads an hour of real GitHub events, where
// the pile is 11,351 documents with no duplicates in it at all and the three
// quadratic rows sit above the cap, so that run is two rows, not five.
//
// `--collections` runs Sets and Maps of equal size instead, with Dates as the
// control. It was written to lose — the docs claimed a rival owned this shape,
// and a claim with no number under it is an argument — and it did: equal-size
// collections folded on `size` alone, shared one bucket, and the in-bucket
// scan was the O(N²) back again. The fold reads members now, so this run is
// the guard on that rather than the confession. One size only, 4,000, picked
// when the quadratic still had to finish; the growth curve is not measured.
//
// Watch the ramda cell: `equals` over 4,000 Maps is an hour, not a minute. It
// is left in and left running because the row is the finding.
//
// Versions are read from the installed packages rather than written into this
// comment: a version in prose is a version that goes stale silently.
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { dedupe } from '../../src/helpers.mjs'
import { time, fmt, table } from '../harness.mjs'
import { makeCorpus, makeCollectionCorpus, loadCorpus, canonical, dedupByKey } from './corpus.mjs'

const RIVALS = ['lodash', 'es-toolkit', 'ramda', 'object-hash']

const dir = new URL('.', import.meta.url)
const local = (p) => new URL('node_modules/' + p, dir)
const missing = RIVALS.filter((n) => !existsSync(local(n + '/package.json')))
if (missing.length) {
  console.log(`skipped — ${missing.join(', ')} not installed. Run \`npm run setup\` in ${dir.pathname}`)
  process.exit(0)
}

const versions = Object.fromEntries(await Promise.all(RIVALS.map(async (n) =>
  [n, JSON.parse(await readFile(local(n + '/package.json'), 'utf8')).version])))

// Node resolution walks up, so a rival hoisted into the repo root as some
// other package's transitive dependency would load silently and be reported
// under the pinned version it is not. Refuse rather than misreport.
function resolveLocal(name) {
  const url = import.meta.resolve(name)
  if (!url.startsWith(dir.href)) throw new Error(`${name} resolved outside ${dir.pathname} — that is a hoisted copy, not the pinned one: ${url}`)
  return url
}

const lodash = (await import(resolveLocal('lodash'))).default
const esToolkit = await import(resolveLocal('es-toolkit'))
const ramda = await import(resolveLocal('ramda'))
const objectHash = (await import(resolveLocal('object-hash'))).default
const ramdaUniq = ramda.uniq ?? ramda.default.uniq

const corpusArg = process.argv.indexOf('--corpus')
const corpusFile = corpusArg === -1 ? null : process.argv[corpusArg + 1]
const full = process.argv.includes('--full')
const SIZES = full ? [2_000, 10_000, 100_000, 1_000_000] : [2_000, 10_000]
// Above this the three pairwise rows are minutes to days per run. Measured at
// both 2k and 10k so the quadratic shape is shown, not asserted.
const QUADRATIC_CAP = 10_000

const CONTENDERS = [
  ['`dedupe` (book-of-spells)', (a) => dedupe(a), false],
  [`lodash \`uniqWith(isEqual)\` ${versions.lodash}`, (a) => lodash.uniqWith(a, lodash.isEqual), true],
  [`es-toolkit \`uniqWith(isEqual)\` ${versions['es-toolkit']}`, (a) => esToolkit.uniqWith(a, esToolkit.isEqual), true],
  [`ramda \`uniq\` ${versions.ramda}`, (a) => ramdaUniq(a), true],
  [`object-hash ${versions['object-hash']} as Map key`, (a) => dedupByKey(a, objectHash), false],
]

// A real corpus is one pile, not a curve: its size is whatever the file holds.
// `--collections` swaps the JSON documents for the shapes the fold cannot
// separate, at a size small enough that the quadratic it collapses into still
// finishes.
const COLLECTION_SIZE = 4_000
const RUNS = corpusFile
  ? [{ label: corpusFile.replace(/^.*\//, ''), input: loadCorpus(corpusFile) }]
  : process.argv.includes('--collections')
    ? ['set', 'map', 'date'].map((kind) => ({ label: `${kind}s, ${COLLECTION_SIZE.toLocaleString('en-US')}`, input: makeCollectionCorpus(COLLECTION_SIZE, kind) }))
    : SIZES.map((n) => ({ label: n.toLocaleString('en-US') + ' uniques', input: makeCorpus(n, 0.1) }))

const cells = CONTENDERS.map(() => [])
for (const { input } of RUNS) {
  const truth = dedupByKey(input, canonical).length
  CONTENDERS.forEach(([name, run, quadratic], i) => {
    // Against the distinct count, not the pile: a pairwise scan compares each
    // value against the survivors, so duplicates are the cheap part and it is
    // the uniques that set the size of the quadratic.
    if (quadratic && truth > QUADRATIC_CAP) { cells[i].push('skipped'); return }
    // Soundness before speed, every contender, every size — a bench that
    // times wrong code measures nothing.
    const got = run(input).length
    if (got !== truth) throw new Error(`${name} unsound on ${input.length} documents: kept ${got}, truth ${truth}`)
    cells[i].push(fmt(time(() => run(input))))
  })
}

table(['contender', ...RUNS.map((r) => r.label)], CONTENDERS.map(([name], i) => [name, ...cells[i]]))
if (corpusFile) console.log(`\n${RUNS[0].input.length.toLocaleString('en-US')} documents, ${dedupByKey(RUNS[0].input, canonical).length.toLocaleString('en-US')} unique`)
