// What each implementation can actually copy, which is the half of a
// comparison a speed table cannot show — a walk that skips a shape is faster
// than one that reads it, and the cheapest clone of all is the one that drops
// what it does not understand. This file has no clock in it on purpose;
// ecosystem.bench.mjs races only the shapes every contender here gets right,
// and this table is the reason that restriction is fair rather than
// convenient.
//
// The JSDoc on clone() carries a smaller version of this table. It was written
// by hand from one session's probing, which is a claim nobody but its author
// can check. This is that table with a command under it.
//
// Every cell runs in this process, unlike bench/deepEqual's, which needs a
// child per contender because a contender there hangs on a pair. Nothing here
// hangs: the dangerous inputs are a cycle and 20,000 levels of nesting, and an
// implementation that cannot survive either exhausts the stack and throws,
// which is catchable. If a future rival does hang, this file grows the child
// process that bench borrowed from — until then it would be machinery paid for
// by nobody.
import { table } from '../harness.mjs'
import { requireRivals, load } from './contenders.mjs'
import { CASES } from './cases.mjs'

if (!requireRivals()) process.exit(0)

const CONTENDERS = await load()

const answers = CONTENDERS.map(({ fn }) => CASES.map((c) => {
  try {
    return { value: c.probe(fn) }
  } catch (error) {
    // A correctness row that throws is a row the contender got wrong, and the
    // name of the throw says more about why than a bare ❌ would. Semantics
    // rows catch their own throws, because there a refusal is the answer.
    return { error: error.name || error.constructor.name }
  }
}))

function cell(answer, expected) {
  if (answer.error !== undefined) return '⚠️ ' + answer.error
  if (expected === undefined) return String(answer.value)
  return answer.value === expected ? '✅' : '❌ ' + answer.value
}

const header = ['case', ...CONTENDERS.map((c) => c.name)]
const rows = (section) => CASES
  .map((c, i) => [c, i])
  .filter(([c]) => c.section === section)
  .map(([c, i]) => [c.label, ...answers.map((a) => cell(a[i], c.expected))])

console.log('correctness — ❌ is a copy that lost the data, and the cell shows what came back\n')
table(header, rows('correctness'))

const scored = CASES.filter((c) => c.section === 'correctness').length
console.log('')
table(['contender', 'correct', 'of', 'install'], CONTENDERS.map((contender, i) => [
  contender.name,
  String(CASES.reduce((n, c, j) => n + (c.section === 'correctness' && answers[i][j].value === c.expected ? 1 : 0), 0)),
  String(scored),
  contender.pkg === null ? '—' : contender.pkg,
]))

console.log('\nsemantics — a disagreement here is a design position, not a defect; no column is the reference\n')
table(header, rows('semantics'))
