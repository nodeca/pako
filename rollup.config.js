import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

export default [
  {
    input: 'lib/pako.js',
    output: [
      { file: pkg.browser, format: 'umd', name: 'pako' }
    ],
    plugins: [commonjs()]
  },
  {
    input: 'lib/inflate.js',
    output: [
      { file: 'dist/inflate.js', format: 'umd', name: 'pako', exports: 'named' }
    ],
    plugins: [commonjs()]
  },
  {
    input: 'lib/deflate.js',
    output: [
      { file: 'dist/deflate.js', format: 'umd', name: 'pako', exports: 'named' }
    ],
    plugins: [commonjs()]
  },
  {
    input: 'lib/pako.js',
    output: [
      { file: pkg.module, format: 'es' }
    ],
    plugins: [commonjs({
      namedExports: { 'lib/pako.js': [
        'Inflate',
        'inflate',
        'inflateRaw',
        'ungzip',
        'Deflate',
        'deflate',
        'deflateRaw',
        'gzip',
        'Z_NO_FLUSH',
        'Z_PARTIAL_FLUSH',
        'Z_SYNC_FLUSH',
        'Z_FULL_FLUSH',
        'Z_FINISH',
        'Z_BLOCK',
        'Z_TREES',
        'Z_OK',
        'Z_STREAM_END',
        'Z_NEED_DICT',
        'Z_ERRNO',
        'Z_STREAM_ERROR',
        'Z_DATA_ERROR',
        'Z_BUF_ERROR',
        'Z_NO_COMPRESSION',
        'Z_BEST_SPEED',
        'Z_BEST_COMPRESSION',
        'Z_DEFAULT_COMPRESSION',
        'Z_FILTERED',
        'Z_HUFFMAN_ONLY',
        'Z_RLE',
        'Z_FIXED',
        'Z_DEFAULT_STRATEGY',
        'Z_BINARY',
        'Z_TEXT',
        'Z_UNKNOWN',
        'Z_DEFLATED'
         ] }
    })]
  },
  {
    input: 'lib/inflate.js',
    output: [
      { file: 'dist/inflate.mjs', format: 'es' }
    ],
    plugins: [commonjs()]
  },
  {
    input: 'lib/deflate.js',
    output: [
      { file: 'dist/deflate.mjs', format: 'es' }
    ],
    plugins: [commonjs()]
  }
];