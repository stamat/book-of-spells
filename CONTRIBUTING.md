# Contributing to Book of Spells

Issues and pull requests are welcome. Taking part means keeping to the
[Code of Conduct](CODE_OF_CONDUCT.md).

This is a bag of small, dependency-free helpers, grouped by subject. Two things
keep it useful: it ships no dependencies, and every helper is general enough
that a second project would want it. A helper shaped around one project's data
belongs in that project.

## Getting set up

```bash
git clone https://github.com/stamat/book-of-spells.git
cd book-of-spells
npm install
```

```bash
script/test      # jest, under jsdom
script/build     # regenerates docs/ and types/
script/types     # type declarations only
```

## Reporting a bug

[Open an issue](../../issues/new/choose) — the form asks for the call and its
arguments, what you expected back, the version, and whether you hit it in Node
or in a browser. Several of these helpers touch the DOM, and those only
misbehave in one of the two.

## Pull requests

- **Add a test.** Tests live in `src/__tests__/` as `*.test.mjs`. A bug fix gets
  one that fails without the fix.
- **Write the JSDoc.** It is the documentation site and the type declarations —
  `@param`, `@returns` and an `@example` that runs. An export without them is an
  export nobody can use.
- **Regenerate `types/`.** It is committed and shipped, so a signature change
  is not finished until `script/types` has been run and the result committed.
- **Put it in the right module.** `dom`, `elements`, `parsers`, `helpers`,
  `regex`, `cookies`, `localstorage`, `animations`, `browser`, `entities` — a
  new subject module also goes into `index.mjs`.
- **No dependencies.** That is the whole point of the package.
- **Add a changelog entry** under `## [Unreleased]` in
  [CHANGELOG.md](CHANGELOG.md) — that file explains the format.

Commit messages are freeform, write something that says what changed.

## How a release works

`script/publish [version]` bumps `package.json`, runs `script/changelog` to cut
`[Unreleased]` into a released entry, builds, tags and pushes. Pushing the tag
triggers [publish.yml](.github/workflows/publish.yml), which publishes to npm
via trusted publishing — OIDC, no tokens stored anywhere. The changelog entry
becomes the body of the GitHub release verbatim.
