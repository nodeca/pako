// Join array of chunks to single array.
export const flattenChunks = (chunks: Uint8Array[]): Uint8Array => {
  const result = new Uint8Array(chunks.reduce((len, chunk) => len + chunk.length, 0));
  let pos = 0;

  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }

  return result;
};
