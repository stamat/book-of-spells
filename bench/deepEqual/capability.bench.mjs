// What each implementation can actually answer, which is the half of a
// comparison a speed table cannot show — a walk that skips a shape is faster
// than one that reads it, so timing alone rewards the contender that does the
// least. This file has no clock in it on purpose; ecosystem.bench.mjs races
// only the shapes every contender here gets right, and this table is the
// reason that restriction is fair rather than convenient.
//
// Two sections, and the split is the editorial position:
//
//   CORRECTNESS — the pair either is or is not structurally the same, and no
//   reasonable library gets to choose. Two WeakMaps whose contents cannot be
//   enumerated are not knowably equal; a Set holding {a:1} does hold a value
//   deep-equal to {a:1}. A ❌ here is a defect, and the cell shows the wrong
//   answer rather than hiding it behind a mark.
//
//   SEMANTICS — genuine design choices, where two libraries disagree and both
//   are defensible. Whether a class instance equals a plain object with the
//   same own properties is a decision about what equality is for, not a bug in
//   whoever decided the other way. These rows report and are not scored, and
//   book-of-spells is not the reference column in them.
//
// Scoring only the first section is what stops this being a table that
// flatters the home team. The correctness rows book-of-spells loses stay in,
// and at the time of writing it loses one: nothing here survives 20,000 levels
// of nesting, this library included.
//
// Every cell runs in a child process. That is not caution: at least one
// contender neither answers nor throws on at least one of these pairs, and a
// hang cannot be caught in the process it happens in. The boundary is what
// turns "the bench never finished" into a row that says which cell and how
// long it was given. One child per contender rather than per cell, resumed
// past whichever case killed it — eight processes when nothing hangs, one
// more per hang, against 296 if every cell paid its own node startup.
//
// Deliberately not covered: Proxy targets, cross-realm objects (a Date from a
// vm context reads [object Date] but fails instanceof — a Node-only concern
// this library makes no claim about), and getters with side effects. Each
// needs its own fixture and none of them changes which package a caller should
// install.
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { table } from '../harness.mjs'
import { requireRivals, describe, COUNT } from './contenders.mjs'
import { CASES } from './cases.mjs'

if (!requireRivals()) process.exit(0)

// Generous enough that a slow-but-finishing answer is never called a hang:
// the dearest honest cell here is 20,000 levels of nesting, which the
// contenders that survive it finish in well under a second.
const CELL_TIMEOUT_MS = 15_000

const CONTENDERS = await describe()
// fileURLToPath, not URL.pathname: on Windows the latter yields "/C:/..."
// with a leading slash, which spawn cannot find.
const child = fileURLToPath(new URL('cell.mjs', import.meta.url))

// Restarts past whatever killed the child, so one unanswerable cell costs one
// row rather than the rest of the column. A child that dies without producing
// a line died on the case after the last one it reported — there is no other
// candidate, since it writes each answer synchronously before starting the
// next.
function run(index) {
  const answers = []
  while (answers.length < CASES.length) {
    const result = spawnSync(process.execPath, [child, String(index), String(answers.length)], {
      timeout: CELL_TIMEOUT_MS,
      encoding: 'utf8',
      maxBuffer: 1 << 20,
    })
    for (const line of (result.stdout || '').split('\n')) {
      if (line) answers.push(JSON.parse(line))
    }
    if (answers.length < CASES.length) {
      answers.push({ error: result.signal ? `hung >${CELL_TIMEOUT_MS / 1000}s` : 'died' })
    }
  }
  return answers
}

const results = Array.from({ length: COUNT }, (_, i) => run(i))

function cell(answer, expected) {
  if (answer.error !== undefined) return '⚠️ ' + answer.error
  if (expected === undefined) return String(answer.value)
  return answer.value === expected ? '✅' : '❌ ' + answer.value
}

const header = ['case', ...CONTENDERS.map((c) => c.name)]
const rows = (section) => CASES
  .map((c, i) => [c, i])
  .filter(([c]) => c.section === section)
  .map(([c, i]) => [c.label, ...results.map((r) => cell(r[i], c.expected))])

console.log('correctness — ❌ is a wrong answer, and the cell shows what was answered\n')
table(header, rows('correctness'))

const scored = CASES.filter((c) => c.section === 'correctness').length
console.log('')
table(['contender', 'correct', 'of', 'install'], CONTENDERS.map((contender, i) => [
  contender.name,
  String(CASES.reduce((n, c, j) => n + (c.section === 'correctness' && results[i][j].value === c.expected ? 1 : 0), 0)),
  String(scored),
  contender.pkg === null ? '—' : contender.pkg,
]))

console.log('\nsemantics — a disagreement here is a design position, not a defect; no column is the reference\n')
table(header, rows('semantics'))
