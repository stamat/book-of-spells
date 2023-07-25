# 📖 Stamat's Book of JavaScript Spells
[![npm version](https://img.shields.io/npm/v/book-of-spells)](https://www.npmjs.com/package/book-of-spells)

A collection of JavaScript functions and snippets that I use in my projects in **ESM format**. This is mainly for my own reference, but I hope it can be useful to others as well.

> The problem, Bernard, is that what you and I do is so complicated. We practice witchcraft. We speak the right words. Then we create life itself… out of chaos. - Dr. Robert Ford, Westworld S01E02

## Installation

```bash
npm i book-of-spells
```

## Usage

[📖 Documentation](https://stamat.github.io/book-of-spells/)

```js
  import { clone } from 'book-of-spells' // if your bundler doesn't resolve npm packages use the full path: import { clone } from './node_modules/book-of-spells/index.mjs'

  const a = { a: 1, b: 2, c: { d: 3, e: 4} }
  const b = clone(a)

  console.log( a.c === b.c ) // false
```

## Why

After 14+ years of JavaScript and copy-pasting my own undocumented code, I've decided to start documenting it. I'm not sure why I didn't do it sooner. Actually, I'm lying, I do know why. I am so lazy that I'd rather copy or write the same code over and over again than document it - which is, of course, much more work than keeping and maintaining it in one place and distributing it as a package.

It's not only laziness, if you think about it. It is this omnipresent fear of change, of the unknown, of the new. But change is good. Being unconformable is good. It means you're growing. It means you're learning. It means you're alive.

## Contributing

If you have a function or a snippet that you think is useful, please open a PR. I'd love to see what you've got.


## To do / Migrate from the old code and other thoughts

Migrate from the old code
* [ ] iOS and Safari detection
* [ ] Slugify function, like the one used in WordPress
* [ ] my "decorate with zeros" function
* [ ] hash change event

----

With love 💖,
Stamat
