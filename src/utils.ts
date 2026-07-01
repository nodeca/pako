// Handle Uint8Array (pre TS 5.9) vs. Uint8Array<ArrayBuffer> (TS 5.9+)
// https://github.com/microsoft/TypeScript/issues/62240#issuecomment-3288389211
/** @inline */
export type NonSharedUint8Array = ReturnType<typeof Uint8Array.from>;

// Join array of chunks to single array.
export const flattenChunks = (chunks: Uint8Array[]): NonSharedUint8Array => {
  const result = new Uint8Array(chunks.reduce((len, chunk) => len + chunk.length, 0));
  let pos = 0;

  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
};
