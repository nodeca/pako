pako
==========================================

[![Build Status](https://travis-ci.org/nodeca/pako.svg?branch=master)](https://travis-ci.org/nodeca/pako)
[![NPM version](https://img.shields.io/npm/v/pako.svg)](https://www.npmjs.org/package/pako)

> zlib port to javascript, very fast!

__Why pako is cool:__

- Results are binary equal to well known [zlib](http://www.zlib.net/) (now contains ported zlib v1.2.8).
- Almost as fast in modern JS engines as C implementation (see benchmarks).
- Works in browsers, you can browserify any separate component.

This project was done to understand how fast JS can be and is it necessary to
develop native C modules for CPU-intensive tasks. Enjoy the result!


__Benchmarks:__

```
node v0.10.26, 1mb sample:

   deflate-dankogai x 4.73 ops/sec ±0.82% (15 runs sampled)
   deflate-gildas x 4.58 ops/sec ±2.33% (15 runs sampled)
   deflate-imaya x 3.22 ops/sec ±3.95% (12 runs sampled)
 ! deflate-pako x 6.99 ops/sec ±0.51% (21 runs sampled)
   deflate-pako-string x 5.89 ops/sec ±0.77% (18 runs sampled)
   deflate-pako-untyped x 4.39 ops/sec ±1.58% (14 runs sampled)
 * deflate-zlib x 14.71 ops/sec ±4.23% (59 runs sampled)
   inflate-dankogai x 32.16 ops/sec ±0.13% (56 runs sampled)
   inflate-imaya x 30.35 ops/sec ±0.92% (53 runs sampled)
 ! inflate-pako x 69.89 ops/sec ±1.46% (71 runs sampled)
   inflate-pako-string x 19.22 ops/sec ±1.86% (49 runs sampled)
   inflate-pako-untyped x 17.19 ops/sec ±0.85% (32 runs sampled)
 * inflate-zlib x 70.03 ops/sec ±1.64% (81 runs sampled)

node v0.11.12, 1mb sample:

   deflate-dankogai x 5.60 ops/sec ±0.49% (17 runs sampled)
   deflate-gildas x 5.06 ops/sec ±6.00% (16 runs sampled)
   deflate-imaya x 3.52 ops/sec ±3.71% (13 runs sampled)
 ! deflate-pako x 11.52 ops/sec ±0.22% (32 runs sampled)
   deflate-pako-string x 9.53 ops/sec ±1.12% (27 runs sampled)
   deflate-pako-untyped x 5.44 ops/sec ±0.72% (17 runs sampled)
 * deflate-zlib x 14.05 ops/sec ±3.34% (63 runs sampled)
   inflate-dankogai x 42.19 ops/sec ±0.09% (56 runs sampled)
   inflate-imaya x 79.68 ops/sec ±1.07% (68 runs sampled)
 ! inflate-pako x 97.52 ops/sec ±0.83% (80 runs sampled)
   inflate-pako-string x 45.19 ops/sec ±1.69% (57 runs sampled)
   inflate-pako-untyped x 24.35 ops/sec ±2.59% (40 runs sampled)
 * inflate-zlib x 60.32 ops/sec ±1.36% (69 runs sampled)
```

zlib's test is partially affected by marshalling (that make sense for inflate only).
You can change deflate level to 0 in benchmark source, to investigate details.
For deflate level 6 results can be considered as correct.

__Install:__

```
npm install pako
```


Examples / API
--------------

Full docs - http://nodeca.github.io/pako/

```javascript
const pako = require('pako');

// Deflate
//
const input = new Uint8Array();
//... fill input data here
const output = pako.deflate(input);

// Inflate (simple wrapper can throw exception on broken stream)
//
const compressed = new Uint8Array();
//... fill data to uncompress here
try {
  const result = pako.inflate(compressed);
  // ... continue processing
} catch (err) {
  console.log(err);
}

//
// Alternate interface for chunking & without exceptions
//

const deflator = new pako.Deflate();

deflator.push(chunk1, false);
deflator.push(chunk2), false;
...
deflator.push(chunk_last, true); // `true` says this chunk is last

if (deflator.err) {
  console.log(deflator.msg);
}

const output = deflator.result;


const inflator = new pako.Inflate();

inflator.push(chunk1);
inflator.push(chunk2);
...
inflator.push(chunk_last); // no second param because end is auto-detected

if (inflator.err) {
  console.log(inflator.msg);
}

const output = inflator.result;
```

Sometime you can wish to work with strings. For example, to send
stringified objects to server. Pako's deflate detects input data type, and
automatically recode strings to utf-8 prior to compress. Inflate has special
option, to say compressed data has utf-8 encoding and should be recoded to
javascript's utf-16.

```javascript
const pako = require('pako');

const test = { my: 'super', puper: [456, 567], awesome: 'pako' };

const compressed = pako.deflate(JSON.stringify(test));

const restored = JSON.parse(pako.inflate(compressed, { to: 'string' }));
```


Notes
-----

Pako does not contain some specific zlib functions:

- __deflate__ -  methods `deflateCopy`, `deflateBound`, `deflateParams`,
  `deflatePending`, `deflatePrime`, `deflateTune`.
- __inflate__ - methods `inflateCopy`, `inflateMark`,
  `inflatePrime`, `inflateGetDictionary`, `inflateSync`, `inflateSyncPoint`, `inflateUndermine`.
- High level inflate/deflate wrappers (classes) may not support some flush
  modes.


pako for enterprise
-------------------

Available as part of the Tidelift Subscription

The maintainers of pako and thousands of other packages are working with Tidelift to deliver commercial support and maintenance for the open source dependencies you use to build your applications. Save time, reduce risk, and improve code health, while paying the maintainers of the exact dependencies you use. [Learn more.](https://tidelift.com/subscription/pkg/npm-pako?utm_source=npm-pako&utm_medium=referral&utm_campaign=enterprise&utm_term=repo)


Authors
-------

- Andrey Tupitsin [@anrd83](https://github.com/andr83)
- Vitaly Puzrin [@puzrin](https://github.com/puzrin)

Personal thanks to:

- Vyacheslav Egorov ([@mraleph](https://github.com/mraleph)) for his awesome
  tutorials about optimising JS code for v8, [IRHydra](http://mrale.ph/irhydra/)
  tool and his advices.
- David Duponchel ([@dduponchel](https://github.com/dduponchel)) for help with
  testing.

Original implementation (in C):

- [zlib](http://zlib.net/) by Jean-loup Gailly and Mark Adler.


License
-------

- MIT - all files, except `/lib/zlib` folder
- ZLIB - `/lib/zlib` content
