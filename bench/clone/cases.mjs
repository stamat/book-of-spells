// The questions capability.bench.mjs asks every contender, in one list so the
// table and the scoring agree on the numbering.
//
// A case is a probe rather than a value: it builds its own input, hands it to
// the contender, and reports what came back. Fresh input every call, so no
// contender inherits a mutation from the contender before it, and nothing
// short-circuits on a reference another row already cloned.
//
// `expected` is true for a case with an objectively right answer, and
// undefined for a design choice where two libraries may reasonably differ.
// The split is the whole editorial position of this bench: only the former is
// scored, so the table cannot be won by agreeing with book-of-spells.
//
//   CORRECTNESS — the copy either holds the data or it does not. A Date that
//   comes back as a string, a Map that comes back empty, two views over one
//   buffer that come back over two: nobody chose those, they are what a walk
//   that does not know the shape produces. A ❌ here is a defect.
//
//   SEMANTICS — genuine positions. Whether a class instance clones into an
//   instance, whether a function is shared or refused, whether a frozen object
//   comes back frozen: reasonable libraries differ, and the platform differs
//   from all of them. These rows report and are not scored, and book-of-spells
//   is not the reference column in them.
//
// Deliberately not covered: DOM nodes and Blobs (no DOM in a node bench, and
// the row would repeat what Promise and WeakMap already say about
// unclonables), getters with side effects, and cross-realm values. None of
// them changes which package a caller should install.

// A throw is an answer, not a crash — `structuredClone` refusing a function is
// the behaviour the row exists to report. DOMException carries the useful name
// on `.name` (DataCloneError) where an ordinary Error carries it on the
// constructor.
const thrown = (error) => error.name || error.constructor.name

const nest = (depth) => {
  let node = {}
  const root = node
  for (let i = 0; i < depth; i++) { node.n = {}; node = node.n }
  node.leaf = 1
  return root
}

const leafOf = (root) => {
  let node = root
  while (node && node.n) node = node.n
  return node && node.leaf
}

class Point { constructor(x) { this.x = x } double() { return this.x * 2 } }

const semantic = (probe) => (fn) => {
  try {
    return probe(fn)
  } catch (error) {
    return thrown(error)
  }
}

export const CASES = [
  // ---- correctness: the copy either holds the data or it does not ----
  {
    section: 'correctness', label: 'nested object, nothing shared', expected: true,
    probe: (fn) => {
      const v = { a: { b: { c: 1 } }, list: [{ x: 1 }] }
      const r = fn(v)
      return r.a.b.c === 1 && r.a !== v.a && r.list[0] !== v.list[0]
    },
  },
  {
    section: 'correctness', label: 'array of objects', expected: true,
    probe: (fn) => {
      const v = [{ x: 1 }, { x: 2 }]
      const r = fn(v)
      return Array.isArray(r) && r.length === 2 && r[1].x === 2 && r[1] !== v[1]
    },
  },
  {
    section: 'correctness', label: 'Date keeps its instant', expected: true,
    probe: (fn) => {
      const v = new Date(864e5)
      const r = fn(v)
      return r instanceof Date && r !== v && r.getTime() === 864e5
    },
  },
  {
    section: 'correctness', label: 'RegExp keeps source and flags', expected: true,
    probe: (fn) => {
      const r = fn(/a+/gi)
      return r instanceof RegExp && r.source === 'a+' && r.flags === 'gi'
    },
  },
  {
    section: 'correctness', label: 'Map members cloned', expected: true,
    probe: (fn) => {
      const v = new Map([['a', { n: 1 }]])
      const r = fn(v)
      return r instanceof Map && r.size === 1 && r.get('a')?.n === 1 && r.get('a') !== v.get('a')
    },
  },
  {
    section: 'correctness', label: 'Set members cloned', expected: true,
    probe: (fn) => {
      const member = { n: 1 }
      const r = fn(new Set([member]))
      return r instanceof Set && r.size === 1 && [...r][0]?.n === 1 && [...r][0] !== member
    },
  },
  {
    section: 'correctness', label: 'Uint8Array bytes copied', expected: true,
    probe: (fn) => {
      const v = new Uint8Array([1, 2, 3])
      const r = fn(v)
      return r instanceof Uint8Array && r.length === 3 && r[2] === 3 && r.buffer !== v.buffer
    },
  },
  {
    section: 'correctness', label: 'ArrayBuffer bytes copied', expected: true,
    probe: (fn) => {
      const v = new ArrayBuffer(4)
      new Uint8Array(v).set([1, 2, 3, 4])
      const r = fn(v)
      return r instanceof ArrayBuffer && r !== v && new Uint8Array(r)[3] === 4
    },
  },
  {
    section: 'correctness', label: 'DataView keeps offset and length', expected: true,
    probe: (fn) => {
      const r = fn(new DataView(new ArrayBuffer(8), 2, 4))
      return r instanceof DataView && r.byteOffset === 2 && r.byteLength === 4
    },
  },
  {
    // The row that separates copying a shape from copying a structure: two
    // views over one buffer are two windows onto the same bytes, and a copy
    // that gives them a buffer each has quietly cut the wire between them.
    section: 'correctness', label: 'two views over one buffer stay one buffer', expected: true,
    probe: (fn) => {
      const buffer = new ArrayBuffer(8)
      const v = { a: new Uint8Array(buffer), b: new Uint16Array(buffer) }
      const r = fn(v)
      // isView first, or a contender that turns both views into plain objects
      // passes on `undefined === undefined` — the copy shares one buffer by
      // having no buffer at all.
      return ArrayBuffer.isView(r.a) && ArrayBuffer.isView(r.b) &&
        r.a.buffer === r.b.buffer && r.a.buffer !== buffer
    },
  },
  {
    section: 'correctness', label: 'cycle terminates, and points at the copy', expected: true,
    probe: (fn) => {
      const v = { tag: 'a' }
      v.self = v
      const r = fn(v)
      return r !== v && r.self === r
    },
  },
  {
    section: 'correctness', label: 'repeated reference stays one object', expected: true,
    probe: (fn) => {
      const shared = { v: 1 }
      const r = fn({ a: shared, b: shared })
      return r.a === r.b && r.a !== shared
    },
  },
  {
    section: 'correctness', label: 'own undefined value kept', expected: true,
    probe: (fn) => 'u' in fn({ u: undefined }),
  },
  {
    section: 'correctness', label: 'Error keeps its type and message', expected: true,
    probe: (fn) => {
      const r = fn(new TypeError('boom'))
      return r instanceof TypeError && r.message === 'boom'
    },
  },
  {
    section: 'correctness', label: 'Error keeps an assigned `.code`', expected: true,
    probe: (fn) => fn(Object.assign(new RangeError('boom'), { code: 'ERR_X' })).code === 'ERR_X',
  },
  {
    section: 'correctness', label: 'BigInt value survives', expected: true,
    probe: (fn) => fn({ n: 10n }).n === 10n,
  },
  {
    section: 'correctness', label: 'nesting 200 deep', expected: true,
    probe: (fn) => leafOf(fn(nest(200))) === 1,
  },
  {
    // Deep enough that a recursive walk runs out of stack. Kept because a
    // caller cloning parsed input does not get to promise how deep it is —
    // and honest about the result: this library loses this row too.
    section: 'correctness', label: 'nesting 20,000 deep', expected: true,
    probe: (fn) => leafOf(fn(nest(20_000))) === 1,
  },

  // ---- semantics: a position, not a result; these rows are not scored ----
  {
    section: 'semantics', label: 'a function in a field',
    probe: semantic((fn) => {
      const f = () => 1
      const r = fn({ f })
      return r.f === f ? 'shared' : r.f === undefined ? 'dropped' : 'copied'
    }),
  },
  {
    section: 'semantics', label: 'a Promise in a field',
    probe: semantic((fn) => {
      const p = Promise.resolve(1)
      const r = fn({ p })
      return r.p === p ? 'shared' : r.p instanceof Promise ? 'copied' : 'lost'
    }),
  },
  {
    section: 'semantics', label: 'a WeakMap in a field',
    probe: semantic((fn) => {
      const w = new WeakMap()
      const r = fn({ w })
      return r.w === w ? 'shared' : r.w instanceof WeakMap ? 'copied' : 'lost'
    }),
  },
  {
    section: 'semantics', label: 'class instance',
    probe: semantic((fn) => {
      const r = fn(new Point(3))
      return r instanceof Point ? 'instance' : 'plain object'
    }),
  },
  {
    section: 'semantics', label: 'null-prototype object',
    probe: semantic((fn) => {
      const r = fn(Object.assign(Object.create(null), { x: 1 }))
      return Object.getPrototypeOf(r) === null ? 'null prototype' : 'Object.prototype'
    }),
  },
  {
    section: 'semantics', label: 'enumerable symbol key',
    probe: semantic((fn) => fn({ [Symbol.for('bench.k')]: 1 })[Symbol.for('bench.k')] === 1 ? 'kept' : 'dropped'),
  },
  {
    section: 'semantics', label: 'non-enumerable property',
    probe: semantic((fn) => 'q' in fn(Object.defineProperty({}, 'q', { value: 1 })) ? 'kept' : 'dropped'),
  },
  {
    section: 'semantics', label: 'enumerable accessor',
    probe: semantic((fn) => {
      const descriptor = Object.getOwnPropertyDescriptor(fn({ get g() { return 1 } }), 'g')
      return descriptor === undefined ? 'dropped' : descriptor.get ? 'accessor' : 'read as data'
    }),
  },
  {
    section: 'semantics', label: 'frozen object',
    probe: semantic((fn) => Object.isFrozen(fn(Object.freeze({ a: 1 }))) ? 'frozen' : 'thawed'),
  },
  {
    section: 'semantics', label: 'RegExp `lastIndex`',
    probe: semantic((fn) => {
      const v = /a/g
      v.lastIndex = 3
      const r = fn(v)
      return r instanceof RegExp ? (r.lastIndex === 3 ? 'kept' : 'reset') : 'not a RegExp'
    }),
  },
]
