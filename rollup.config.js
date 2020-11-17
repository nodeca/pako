import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';


const banner = {
  banner() {
    return `/*! ${pkg.name} ${pkg.version} https://github.com/${pkg.repository} @license ${pkg.license} */`;
  }
}

const plugins = [ nodeResolve(), commonjs(), banner ];
const plugins_es5 = [
  nodeResolve(),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    presets: [
      [ "@babel/preset-env" ]
    ]
  }),
  banner
];


export default [
  // es6
  {
    input: 'index.js',
    output: [
      { file: 'dist/pako.js', format: 'umd', name: 'pako' },
      { file: 'dist/pako.min.js', format: 'umd', name: 'pako', plugins: [ terser() ] }
    ],
    plugins: plugins
  },
  {
    input: 'lib/deflate.js',
    output: [
      { file: 'dist/pako_deflate.js', format: 'umd', name: 'pako' },
      { file: 'dist/pako_deflate.min.js', format: 'umd', name: 'pako', plugins: [ terser() ] }
    ],
    plugins: plugins
  },
  {
    input: 'lib/inflate.js',
    output: [
      { file: 'dist/pako_inflate.js', format: 'umd', name: 'pako' },
      { file: 'dist/pako_inflate.min.js', format: 'umd', name: 'pako', plugins: [ terser() ] }
    ],
    plugins: plugins
  },
  // es5
  {
    input: 'index.js',
    output: [
      { file: 'dist/pako.es5.js', format: 'umd', name: 'pako' },
      { file: 'dist/pako.es5.min.js', format: 'umd', name: 'pako', plugins: [ terser() ] }
    ],
    plugins: plugins_es5
  },
  {
    input: 'lib/deflate.js',
    output: [
      { file: 'dist/pako_deflate.es5.js', format: 'umd', name: 'pako' },
      { file: 'dist/pako_deflate.es5.min.js', format: 'umd', name: 'pako', plugins: [ terser() ] }
    ],
    plugins: plugins_es5
  },
  {
    input: 'lib/inflate.js',
    output: [
      { file: 'dist/pako_inflate.es5.js', format: 'umd', name: 'pako' },
      { file: 'dist/pako_inflate.es5.min.js', format: 'umd', name: 'pako', plugins: [ terser() ] }
    ],
    plugins: plugins_es5
  },
  // esm
  {
    input: 'index.js',
    output: [
      { file: 'dist/pako.esm.mjs', format: 'esm' }
    ],
    plugins: plugins
  }
];
