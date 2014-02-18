pako
====

[![Build Status](https://travis-ci.org/nodeca/pako.png?branch=master)](https://travis-ci.org/nodeca/pako)

zlib port to javascript. _Very fast!_

__Why pako is cool:__

- Almost as fast im modern browsers as C implementation (see benchmarks)
- Works in browser
- Modular - you can browserify any separate component
- Both Sync & streamable interfaces (streamable is for big blobs)
- It's fresh - ports the latest zlib version (now 1.2.8)
- Tested - result is binary equal to zlib's one
- No restrictions - MIT licence

__Benchmarks:__


```
node v0.11, 10mb sample:

   deflate-gildas x 2.82 ops/sec ±1.21% (11 runs sampled)
   deflate-imaya x 2.25 ops/sec ±0.59% (9 runs sampled)
 ! deflate-pako x 6.09 ops/sec ±0.98% (19 runs sampled)
   deflate-zlib x 9.13 ops/sec ±0.92% (46 runs sampled)

node v0.11, 10mb sample:

   deflate-gildas x 3.39 ops/sec ±6.58% (12 runs sampled)
   deflate-imaya x 2.14 ops/sec ±4.29% (9 runs sampled)
 ! deflate-pako x 6.61 ops/sec ±0.66% (20 runs sampled)
   deflate-zlib x 9.28 ops/sec ±1.98% (47 runs sampled)
```


API
---

TBD


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
- Vitaly Puzrin [@puzrin](https://github.com/andr83)

Special thanks to Vyacheslav Egorov ([@mraleph](https://github.com/mraleph)) for
his awesome tutoruals about optimising code for v8, [IRHydra](http://mrale.ph/irhydra/)
tool and personal advices.


License
-------

MIT