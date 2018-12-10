import { terser } from "rollup-plugin-terser";
import pkg from './package.json';

export default [
  {
    input: 'lib/pako.js',
    output: [
      { file: pkg.browser, format: 'umd', name: 'pako' }
    ]
  },
  {
    input: 'lib/inflate.js',
    output: [
      { file: 'dist/inflate.js', format: 'umd', name: 'pako', exports: 'named' }
    ]
  },
  {
    input: 'lib/deflate.js',
    output: [
      { file: 'dist/deflate.js', format: 'umd', name: 'pako', exports: 'named' }
    ]
  },
  {
    input: 'lib/pako.js',
    output: [
      { file: 'dist/pako.min.js', format: 'umd', name: 'pako' }
    ],
    plugins: [terser()]
  },
  {
    input: 'lib/inflate.js',
    output: [
      { file: 'dist/inflate.js', format: 'umd', name: 'pako', exports: 'named' }
    ],
    plugins: [terser()]
  },
  {
    input: 'lib/deflate.js',
    output: [
      { file: 'dist/deflate.min.js', format: 'umd', name: 'pako', exports: 'named' }
    ],
    plugins: [terser()]
  },
  {
    input: 'lib/pako.js',
    output: [
      { file: pkg.main, format: 'cjs' }
    ]
  },
  {
    input: 'lib/inflate.js',
    output: [
      { file: 'dist/inflate.cjs.js', format: 'cjs' }
    ]
  },
  {
    input: 'lib/deflate.js',
    output: [
      { file: 'dist/deflate.cjs.js', format: 'cjs' }
    ]
  }
];