pako
==========================================

[![CI](https://github.com/nodeca/pako/workflows/CI/badge.svg)](https://github.com/nodeca/pako/actions)
[![NPM version](https://img.shields.io/npm/v/pako.svg)](https://www.npmjs.org/package/pako)

> Very fast zlib-compatible compression for JavaScript.

## Why pako is cool

- __Binary-equivalent output.__ Pako can produce the same deflate/gzip bytes as
  original [zlib](http://www.zlib.net/) (1.3.2) and Node.js' patched zlib.
- __Tiny browser bundles.__ Full minified bundle is under 15K gzipped.
  Deflate-only and inflate-only builds are smaller.
- __Very fast.__ Performance is comparable with native zlib in modern JavaScript
  engines (see benchmarks).


## Benchmarks

node v24, 1 MB input sample:

```
deflate-pako x 14.27 ops/sec ±3.41% (37 runs sampled)
deflate-pako-zlib-hash x 10.60 ops/sec ±0.50% (29 runs sampled)
deflate-zlib x 30.30 ops/sec ±0.61% (51 runs sampled)
gzip-pako x 13.48 ops/sec ±0.50% (36 runs sampled)
inflate-pako x 138 ops/sec ±1.26% (75 runs sampled)
inflate-zlib x 397 ops/sec ±1.37% (81 runs sampled)
ungzip-pako x 125 ops/sec ±1.46% (73 runs sampled)
```


## Install

```
npm install pako
```

> [!NOTE]
> For a quick look at `dist/` folder contents, see
> <https://unpkg.com/pako@latest/>.


Examples / API
--------------

Full docs - http://nodeca.github.io/pako/

```javascript
import { Deflate, Inflate, deflate, inflate } from 'pako';

// Deflate
//
const input = new Uint8Array();
//... fill input data here
const output = deflate(input);

// Inflate (simple wrapper can throw exception on broken stream)
//
const compressed = new Uint8Array();
//... fill data to uncompress here
try {
  const result = inflate(compressed);
  // ... continue processing
} catch (err) {
  console.log(err);
}

//
// Alternate interface for chunking & without exceptions
//

const deflator = new Deflate();

deflator.push(chunk1, false);
deflator.push(chunk2); // second param is false by default.
...
deflator.push(chunk_last, true); // `true` says this chunk is last

if (deflator.err) {
  console.log(deflator.msg);
}

const output = deflator.result;


const inflator = new Inflate();

inflator.push(chunk1);
inflator.push(chunk2);
...
inflator.push(chunk_last); // no second param because end is auto-detected

if (inflator.err) {
  console.log(inflator.msg);
}

const output = inflator.result;
```

For CommonJS:

```javascript
const { deflate, inflate } = require('pako');
```

If you need the whole API as an object, use namespace import:

```javascript
import * as pako from 'pako';
```

Sometimes you may wish to work with strings — for example, to send
stringified objects to a server. Pako's deflate detects the input data type and
automatically recodes strings to utf-8 prior to compression. High-level inflate
helpers can decode utf-8 output back to JavaScript strings with `toText: true`.

```javascript
import { deflate, inflate } from 'pako';

const test = { my: 'super', puper: [456, 567], awesome: 'pako' };

const compressed = deflate(JSON.stringify(test));

const restored = JSON.parse(inflate(compressed, { toText: true }));
```


## Notes

Pako does not contain some specific zlib functions:

- __deflate__ -  methods `deflateCopy`, `deflateBound`, `deflateParams`,
  `deflatePending`, `deflatePrime`, `deflateTune`.
- __inflate__ - methods `inflateCopy`, `inflateMark`,
  `inflatePrime`, `inflateGetDictionary`, `inflateSync`, `inflateSyncPoint`, `inflateUndermine`.
- High level inflate/deflate wrappers (classes) may not support some flush
  modes.


## Authors

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


## License

- MIT - all files, except `/src/zlib` folder
- ZLIB - `/src/zlib` content
