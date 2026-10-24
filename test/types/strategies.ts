import {
  Deflate,
  ZStream,
  zlibDeflateInit2,
  Z_DEFAULT_STRATEGY,
  Z_FILTERED,
  Z_HUFFMAN_ONLY,
  Z_RLE,
  Z_FIXED
} from '../../src/index.ts';
import type { Z_Strategy } from '../../src/index.ts';

export function checkStrategyTypes() {
  const strategies: Z_Strategy[] = [
    Z_DEFAULT_STRATEGY, Z_FILTERED, Z_HUFFMAN_ONLY, Z_RLE, Z_FIXED
  ];

  for (const strategy of strategies) {
    new Deflate({ strategy });
    zlibDeflateInit2(new ZStream(), 6, 8, 15, 8, strategy);
  }

  // @ts-expect-error Strategies are restricted to the five supported constants.
  new Deflate({ strategy: 5 });
  // @ts-expect-error The low-level API accepts the same strategy values.
  zlibDeflateInit2(new ZStream(), 6, 8, 15, 8, 5);
}
