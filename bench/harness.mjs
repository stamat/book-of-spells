// The bench convention, mirroring src/__tests__: every bench/*.bench.mjs is a
// self-contained node script run by script/bench, and every contender's
// output is asserted correct before its timing is reported — a bench that
// times wrong code measures nothing. This file is the whole harness; if a
// second repo ever wants it, that is the moment it becomes a package, not
// before.

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

// GitHub-flavored markdown table to stdout — paste-ready for a changelog or
// an issue, because a number that stays in a terminal scrollback is a number
// nobody checks twice.
export function table(header, rows) {
  console.log('| ' + header.join(' | ') + ' |')
  console.log('|' + header.map(() => '---').join('|') + '|')
  for (const row of rows) console.log('| ' + row.join(' | ') + ' |')
}
