// The bench convention, mirroring src/__tests__: every
// bench/<function>/*.bench.mjs is a node script run by script/bench, and every
// contender's output is asserted correct before its timing is reported — a
// bench that times wrong code measures nothing. Timing and formatting are
// shared from here; a corpus, a fixture or a rival dependency belongs to the
// one directory that benches it. This file is the whole harness; if a second
// repo ever wants it, that is the moment it becomes a package, not before.
import { mkdirSync, writeFileSync } from 'node:fs'
import { cpus } from 'node:os'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

// Every bench already prints GitHub-flavored markdown, so the committed result
// is the run itself rather than a transcription of it: stdout is teed into
// bench/results/ as it is written, which is why a bench needs no edit to
// produce one. A number left in a terminal scrollback is a number nobody
// checks twice; a number in a committed file is one a diff argues with.
const captured = []
const passthrough = process.stdout.write.bind(process.stdout)
process.stdout.write = (chunk, ...rest) => {
  captured.push(String(chunk))
  return passthrough(chunk, ...rest)
}

let usedMs = false
let usedOps = false
let wroteTable = false

// A contender whose return value nothing reads is a body the optimiser is free
// to drop, and a dropped body benchmarks as infinitely fast. Every result lands
// in `sink`, and the branch below reads it, so the call has an effect that
// cannot be proven dead. The branch never fires: `never` is module-local and
// handed to nothing, so no contender can return it.
const never = Symbol('sink')
let sink
function keep() {
  if (sink === never) console.log(sink)
}

// Median of `runs` single executions, in milliseconds. Single runs, not an
// ops-loop: these benches process corpora large enough that one pass is
// milliseconds to seconds, where looping would only add GC noise. One untimed
// pass first, matching `opsPerSec`, so a cold JIT is not charged to the
// measurement — a median cannot discard it at `runs` of 1 or 2, where the
// warm-up run is the one it picks.
export function time(fn, runs = 3) {
  usedMs = true
  sink = fn()
  const t = []
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now()
    sink = fn()
    t.push(performance.now() - t0)
  }
  keep()
  return t.sort((a, b) => a - b)[Math.floor(t.length / 2)]
}

export function fmt(ms) {
  usedMs = true
  return ms >= 1000 ? (ms / 1000).toFixed(1) + ' s' : ms.toFixed(0) + ' ms'
}

// Throughput under a wall-clock budget, for benches whose operations span
// nanoseconds (an early exit on the first key) to milliseconds (a full walk of
// megabytes). A fixed iteration count cannot serve both ends of that range:
// enough runs to time the fast case is hours of the slow one. One untimed call
// first, so a cold JIT is not charged to the measurement.
export function opsPerSec(fn, budgetMs = 1000) {
  sink = fn()
  let n = 0
  const t0 = performance.now()
  let elapsed = 0
  while ((elapsed = performance.now() - t0) < budgetMs) {
    sink = fn()
    n++
  }
  keep()
  return (n / elapsed) * 1000
}

export function rate(n) {
  usedOps = true
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M ops/s'
    : n >= 1e3 ? Math.round(n / 1e3) + 'k ops/s'
    : Math.round(n) + ' ops/s'
}

// GitHub-flavored markdown table to stdout, which is what makes the tee above
// a document rather than a transcript.
export function table(header, rows) {
  wroteTable = true
  console.log('| ' + header.join(' | ') + ' |')
  console.log('|' + header.map(() => '---').join('|') + '|')
  for (const row of rows) console.log('| ' + row.join(' | ') + ' |')
}

// A legend the reader does not have to have run the bench to use: what the
// unit is and which direction is good. Only the units this run actually
// printed are listed — a capability bench answers in ✅ and ❌ and would be
// lying to carry a row about milliseconds.
function legend() {
  const rows = []
  if (usedMs) rows.push(['`ms`, `s`', 'wall clock for one pass over the input, median of repeated runs', '**lower**'])
  if (usedOps) rows.push(['`ops/s`', 'passes completed within a fixed wall-clock budget', '**higher**'])
  if (!rows.length) return ''
  return ['| unit | means | better |', '|---|---|---|', ...rows.map((r) => '| ' + r.join(' | ') + ' |')].join('\n')
}

// Written on exit rather than at the end of each bench, so a bench needs no
// line of its own to be recorded. Guarded on a table having been printed: a
// bench that skipped for missing rivals has nothing to say, and must not blank
// the result somebody committed from a run that did.
process.on('exit', () => {
  if (!wroteTable) return
  const script = process.argv[1]
  const subject = basename(dirname(script))
  const name = basename(script).replace(/\.bench\.mjs$/, '')
  const root = fileURLToPath(new URL('..', import.meta.url))
  const dir = fileURLToPath(new URL('results/', import.meta.url))
  const body = captured.join('').trim()
  // Separators, not the OS's: this string is read on GitHub, where a
  // backslash in a path is a character and not a directory.
  const command = ['node', relative(root, script).split(/[\\/]/).join('/'), ...process.argv.slice(2)].join(' ')
  const machine = [process.version, cpus()[0]?.model, `${process.platform} ${process.arch}`].filter(Boolean).join(', ')
  const symbols = /[✅❌⚠️]|unsound|never/.test(body)
    ? 'Cells that are not timings are explained above the table they appear in.'
    : ''
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${subject}-${name}.md`), [
    `# ${subject} — ${name}`,
    body,
    '---',
    legend(),
    symbols,
    'Generated by `script/bench` — edit the bench, not this file.',
    `\`${command}\` on ${machine}, ${new Date().toISOString().slice(0, 10)}.`,
  ].filter(Boolean).join('\n\n') + '\n')
})
