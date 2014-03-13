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
node v0.10, 10mb sample:

   deflate-gildas x 4.62 ops/sec ±1.93% (15 runs sampled)
   deflate-imaya x 3.82 ops/sec ±1.31% (13 runs sampled)
 ! deflate-pako x 9.09 ops/sec ±0.42% (26 runs sampled)
   deflate-zlib x 14.16 ops/sec ±3.33% (63 runs sampled)

node v0.11, 10mb sample:

   deflate-gildas x 5.10 ops/sec ±4.94% (16 runs sampled)
   deflate-imaya x 3.42 ops/sec ±4.11% (12 runs sampled)
 ! deflate-pako x 11.28 ops/sec ±0.42% (32 runs sampled)
   deflate-zlib x 14.17 ops/sec ±3.34% (64 runs sampled)
```

If you doubt, that zlib is slow because of marshalling, try benchmark with `level 0`.
You will see, that node bindings don't add noticeable slowdown.

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

[Full docs](http://nodeca.github.io/pako/).

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
inflator.push(chunkN, true); // true -> last

if (inflator.err) {
  console.log(inflator.msg);
}

var output = inflator.result;

```


Notes
-----

Pako does not contains some specific zlib functions:

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
