import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import pkg from './package.json';
import { terser } from 'rollup-plugin-terser';

const banner = {
  banner() {
    return `/*! ${pkg.name} ${pkg.version} https://github.com/${pkg.repository} @license ${pkg.license} */`;
  }
}

const plugins = [ nodeResolve(), commonjs(), banner ];

export default [
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
  }
];
