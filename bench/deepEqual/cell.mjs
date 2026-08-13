// One contender against the case list, from a given index onward, one NDJSON
// line per answer. Run as a child process by capability.bench.mjs and not
// useful on its own.
//
// Why a child at all: at least one contender does not return on at least one
// of these pairs — it neither answers nor throws, it runs. A hang cannot be
// caught in the process it happens in, so the only way to report that cell as
// data rather than as the bench never finishing is to put a process boundary
// around it and let the parent kill it.
//
// fs.writeSync rather than console.log: stdout to a pipe is buffered, and a
// child killed on a timeout loses whatever is still in the buffer. Every line
// has to be on the wire before the next case starts, or the parent cannot tell
// which case hung.
import { writeSync } from 'node:fs'
import { loadOne } from './contenders.mjs'
import { CASES } from './cases.mjs'

const [indexArg, fromArg] = process.argv.slice(2)
const fn = await loadOne(Number(indexArg))

for (let i = Number(fromArg); i < CASES.length; i++) {
  let line
  try {
    const [a, b] = CASES[i].make()
    // The answer is stringified before the next case builds anything, so a
    // fixture that exhausts memory cannot swallow the result already computed.
    line = JSON.stringify({ value: fn(a, b) })
  } catch (error) {
    line = JSON.stringify({ error: error.constructor.name })
  }
  writeSync(1, line + '\n')
}
