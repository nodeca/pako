pako - zlib port to javascript, very fast!
==========================================

[![Build Status](https://travis-ci.org/nodeca/pako.png?branch=master)](https://travis-ci.org/nodeca/pako)

__Why pako is cool:__

- Almost as fast in modern browsers as C implementation (see benchmarks)
- Works in browser
- Modular - you can browserify any separate component
- Both Sync & streamable interfaces (streamable is for big blobs)
- It's fresh - ports the latest zlib version (now 1.2.8)
- Tested - result is binary equal to zlib's one
- No restrictions - MIT licence

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

```javascript
var pako = require('pako');

//
// Deflate
//

var input = new Uint8Array();
//... fill input data here
var output = pako.deflate(input);

//
// Inflate
//

var compressed = new Uint8Array();
//... fill data to uncompress here
var result = pako.inflate(compressed);
if (result.err) {
  console.log(result.err, result.msg);
}
var uncompressed = result.data;

```

See docs for full API specs.


Notes
-----

Since pako was done mostly for browser, some specific functions were left unported.

deflate:

- writing custom gzip headers (default is ok)
- `deflateSetDictionary`, `deflateParams`, `deflateSetHeader`, `deflateBound`, `deflatePending`

inflate:

TBD

We will probably provide more modular design, to keep significant part of code reasonably small.


Authors
-------

- Andrey Tupitsin [@anrd83](https://github.com/andr83)
- Vitaly Puzrin [@puzrin](https://github.com/puzrin)

Personal thanks to Vyacheslav Egorov ([@mraleph](https://github.com/mraleph)) for
his awesome tutoruals about optimising JS code for v8, [IRHydra](http://mrale.ph/irhydra/)
tool and his advices.


License
-------

MIT
