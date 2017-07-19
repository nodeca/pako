pako - zlib port to javascript, very fast!
==========================================

[![Build Status](https://travis-ci.org/nodeca/pako.svg?branch=master)](https://travis-ci.org/nodeca/pako)
[![NPM version](https://img.shields.io/npm/v/pako.svg)](https://www.npmjs.org/package/pako)

__Why pako is cool:__

- Almost as fast in modern JS engines as C implementation (see benchmarks).
- Works in browsers, you can browserify any separate component.
- Chunking support for big blobs.
- Results are binary equal to well known [zlib](http://www.zlib.net/) (now contains ported zlib v1.2.8).

This project was done to understand how fast JS can be and is it necessary to
develop native C modules for CPU-intensive tasks. Enjoy the result!


__Famous projects, using pako:__

- [browserify](http://browserify.org/) (via [browserify-zlib](https://github.com/devongovett/browserify-zlib))
- [JSZip](http://stuk.github.io/jszip/)
- [mincer](https://github.com/nodeca/mincer)
- [JS-Git](https://github.com/creationix/js-git) and
  [Tedit](https://chrome.google.com/webstore/detail/tedit-development-environ/ooekdijbnbbjdfjocaiflnjgoohnblgf)
  by [@creatronix](https://github.com/creationix)


__Benchmarks:__

```
node v0.10.26, 1mb sample:

   deflate-imaya x 4.06 ops/sec ±2.89% (14 runs sampled)
 ! deflate-pako x 8.91 ops/sec ±0.62% (25 runs sampled)
   deflate-pako-string x 7.34 ops/sec ±1.04% (22 runs sampled)
   deflate-pako-untyped x 5.30 ops/sec ±1.28% (17 runs sampled)
 * deflate-zlib-async x 14.18 ops/sec ±4.62% (69 runs sampled)
   inflate-imaya x 38.80 ops/sec ±2.43% (65 runs sampled)
 ! inflate-pako x 86.23 ops/sec ±1.61% (70 runs sampled)
   inflate-pako-string x 22.23 ops/sec ±0.72% (40 runs sampled)
   inflate-pako-untyped x 22.67 ops/sec ±0.35% (41 runs sampled)
 * inflate-zlib-async x 218 ops/sec ±6.72% (62 runs sampled)

node v0.11.12, 1mb sample:

   deflate-imaya x 4.24 ops/sec ±3.39% (14 runs sampled)
 ! deflate-pako x 14.11 ops/sec ±0.35% (37 runs sampled)
   deflate-pako-string x 11.29 ops/sec ±1.71% (31 runs sampled)
   deflate-pako-untyped x 6.40 ops/sec ±1.04% (20 runs sampled)
 * deflate-zlib x 19.26 ops/sec ±0.22% (49 runs sampled)
   inflate-imaya x 93.92 ops/sec ±0.45% (71 runs sampled)
 ! inflate-pako x 111 ops/sec ±0.88% (70 runs sampled)
   inflate-pako-string x 46.76 ops/sec ±1.96% (64 runs sampled)
   inflate-pako-untyped x 27.50 ops/sec ±0.29% (48 runs sampled)
 * inflate-zlib x 258 ops/sec ±2.50% (70 runs sampled)

node v8.1.3, 1mb sample:

   deflate-imaya x 4.73 ops/sec ±1.78% (16 runs sampled)
 ! deflate-pako x 12.34 ops/sec ±0.23% (33 runs sampled)
   deflate-pako-string x 10.42 ops/sec ±0.46% (29 runs sampled)
   deflate-pako-untyped x 7.13 ops/sec ±0.66% (21 runs sampled)
 * deflate-zlib x 20.14 ops/sec ±0.46% (42 runs sampled)
   inflate-imaya x 73.29 ops/sec ±1.93% (68 runs sampled)
 ! inflate-pako x 116 ops/sec ±1.86% (70 runs sampled)
   inflate-pako-string x 60.04 ops/sec ±1.16% (59 runs sampled)
   inflate-pako-untyped x 22.81 ops/sec ±1.03% (39 runs sampled)
 * inflate-zlib x 281 ops/sec ±2.33% (78 runs sampled)
```

zlib's test is partially affected by marshalling (that make sense for inflate only).
You can change deflate level to 0 in benchmark source, to investigate details.
For deflate level 6 results can be considered as correct.

Also ther was no Sync functions in zlib before node v0.11.12, so for v0.10.11
benchmark async calls was used.

__Install:__

node.js:

```
npm install pako
```

browser:

```
bower install pako
```


Example & API
-------------

Full docs - http://nodeca.github.io/pako/

```javascript
var pako = require('pako');

// Deflate
//
var input = new Uint8Array();
//... fill input data here
var output = pako.deflate(input);

// Inflate (simple wrapper can throw exception on broken stream)
//
var compressed = new Uint8Array();
//... fill data to uncompress here
try {
  var result = pako.inflate(compressed);
} catch (err) {
  console.log(err);
}

//
// Alternate interface for chunking & without exceptions
//

var inflator = new pako.Inflate();

inflator.push(chunk1, false);
inflator.push(chunk2, false);
...
inflator.push(chunkN, true); // true -> last chunk

if (inflator.err) {
  console.log(inflator.msg);
}

var output = inflator.result;

```

Sometime you can wish to work with strings. For example, to send
big objects as json to server. Pako detects input data type. You can
force output to be string with option `{ to: 'string' }`.

```javascript
var pako = require('pako');

var test = { my: 'super', puper: [456, 567], awesome: 'pako' };

var binaryString = pako.deflate(JSON.stringify(test), { to: 'string' });

//
// Here you can do base64 encode, make xhr requests and so on.
//

var restored = JSON.parse(pako.inflate(binaryString, { to: 'string' }));
```


Notes
-----

Pako does not contain some specific zlib functions:

- __deflate__ -  methods `deflateCopy`, `deflateBound`, `deflateParams`,
  `deflatePending`, `deflatePrime`, `deflateTune`.
- __inflate__ - methods `inflateCopy`, `inflateMark`,
  `inflatePrime`, `inflateGetDictionary`, `inflateSync`, `inflateSyncPoint`, `inflateUndermine`.
- High level inflate/deflate wrappers (classes) may not support some flush
  modes. Those should work: Z_NO_FLUSH, Z_FINISH, Z_SYNC_FLUSH.


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

MIT
