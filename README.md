pako - zlib port to javascript, very fast!
==========================================

[![Build Status](https://travis-ci.org/nodeca/pako.png?branch=master)](https://travis-ci.org/nodeca/pako)

__Why pako is cool:__

- Almost as fast in modern JS engines as C implementation (see benchmarks).
- Works in browsers, you can browserify any separate component.
- Both Sync & streamable (for big blobs) interfaces.
- It's fresh - ports the latest zlib version (now 1.2.8), results are binary equal.

This project was done to understand how fast JS can be and is it necessary to
develop native C modules for CPU-intensive tasks. Enjoy the result!

__Benchmarks:__

```
node v0.10.26, 1mb sample:

   deflate-dankogai x 4.74 ops/sec ±0.68% (15 runs sampled)
   deflate-gildas x 4.61 ops/sec ±1.73% (15 runs sampled)
   deflate-imaya x 3.10 ops/sec ±3.73% (11 runs sampled)
 ! deflate-pako x 7.11 ops/sec ±0.26% (21 runs sampled)
   deflate-pako-untyped x 4.34 ops/sec ±1.35% (14 runs sampled)
   deflate-zlib x 14.34 ops/sec ±2.90% (68 runs sampled)
   inflate-dankogai x 31.29 ops/sec ±0.72% (56 runs sampled)
   inflate-imaya x 30.49 ops/sec ±0.84% (53 runs sampled)
 ! inflate-pako x 70.00 ops/sec ±1.60% (71 runs sampled)
   inflate-pako-untyped x 17.67 ops/sec ±1.27% (33 runs sampled)
   inflate-zlib x 70.82 ops/sec ±1.69% (81 runs sampled)

node v0.11.11, 1mb sample:

   deflate-dankogai x 5.61 ops/sec ±0.30% (17 runs sampled)
   deflate-gildas x 4.97 ops/sec ±5.68% (16 runs sampled)
   deflate-imaya x 3.53 ops/sec ±4.19% (12 runs sampled)
 ! deflate-pako x 11.52 ops/sec ±0.23% (32 runs sampled)
   deflate-pako-untyped x 5.12 ops/sec ±1.44% (17 runs sampled)
   deflate-zlib x 14.33 ops/sec ±3.34% (63 runs sampled)
   inflate-dankogai x 42.96 ops/sec ±0.19% (57 runs sampled)
   inflate-imaya x 85.05 ops/sec ±1.07% (71 runs sampled)
 ! inflate-pako x 97.58 ops/sec ±0.69% (80 runs sampled)
   inflate-pako-untyped x 18.06 ops/sec ±0.65% (56 runs sampled)
   inflate-zlib x 60.60 ops/sec ±2.04% (67 runs sampled)
```

zlib's test is partialy afferted by marshling (that make sense for inflate only).
You can change deflate level to 0 in benchmark source, to investigate details.
For deflate level 6 results can be considered as correct.

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
catch (err) {
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


Notes
-----

Pako does not contain some specific zlib functions:

- __deflate__ - writing custom gzip headers and methods `deflateSetDictionary`,
  `deflateParams`, `deflateSetHeader`, `deflateBound`, `deflatePending`.
- __inflate__ - getting custom gzip headers and methods `inflateGetDictionary`,
  `inflateGetHeader`, `inflateSetDictionary`, `inflateSync`, `inflateSyncPoint`,
  `inflateCopy`, `inflateUndermine`, `inflateMark`.


Authors
-------

- Andrey Tupitsin [@anrd83](https://github.com/andr83)
- Vitaly Puzrin [@puzrin](https://github.com/puzrin)

Personal thanks to Vyacheslav Egorov ([@mraleph](https://github.com/mraleph))
for his awesome tutoruals about optimising JS code for v8,
[IRHydra](http://mrale.ph/irhydra/) tool and his advices.


License
-------

MIT
