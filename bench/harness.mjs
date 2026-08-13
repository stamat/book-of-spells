// The bench convention, mirroring src/__tests__: every
// bench/<function>/*.bench.mjs is a node script run by script/bench, and every
// contender's output is asserted correct before its timing is reported — a
// bench that times wrong code measures nothing. Timing and formatting are
// shared from here; a corpus, a fixture or a rival dependency belongs to the
// one directory that benches it. This file is the whole harness; if a second
// repo ever wants it, that is the moment it becomes a package, not before.

// Median of `runs` single executions, in milliseconds. Single runs, not an
// ops-loop: these benches process corpora large enough that one pass is
// milliseconds to seconds, where looping would only add GC noise.
export function time(fn, runs = 3) {
  const t = []
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now()
    fn()
    t.push(performance.now() - t0)
  }
  return t.sort((a, b) => a - b)[Math.floor(t.length / 2)]
}

export function fmt(ms) {
  return ms >= 1000 ? (ms / 1000).toFixed(1) + ' s' : ms.toFixed(0) + ' ms'
}

// Throughput under a wall-clock budget, for benches whose operations span
// nanoseconds (an early exit on the first key) to milliseconds (a full walk of
// megabytes). A fixed iteration count cannot serve both ends of that range:
// enough runs to time the fast case is hours of the slow one. One untimed call
// first, so a cold JIT is not charged to the measurement.
export function opsPerSec(fn, budgetMs = 1000) {
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

export function rate(n) {
  return n >= 1e6 ? (n / 1e6).toFixed(1) + 'M ops/s'
    : n >= 1e3 ? Math.round(n / 1e3) + 'k ops/s'
    : Math.round(n) + ' ops/s'
}

// GitHub-flavored markdown table to stdout — paste-ready for a changelog or
// an issue, because a number that stays in a terminal scrollback is a number
// nobody checks twice.
export function table(header, rows) {
  console.log('| ' + header.join(' | ') + ' |')
  console.log('|' + header.map(() => '---').join('|') + '|')
  for (const row of rows) console.log('| ' + row.join(' | ') + ' |')
}
