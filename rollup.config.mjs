import nodeResolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import { babel } from '@rollup/plugin-babel';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));


const banner = {
  banner() {
    return `/*! ${pkg.name} ${pkg.version} https://github.com/${pkg.repository} @license ${pkg.license} */`;
  }
};

const plugins = [ nodeResolve(), banner ];
const plugins_es5 = [
  nodeResolve(),
  babel({
    babelHelpers: 'bundled',
    presets: [
      [ '@babel/preset-env' ]
    ]
  }),
  banner
];

const umd_out_base = { format: 'umd', name: 'pako', exports: 'named' };


export default [
  // es6
  {
    input: 'src/index.mjs',
    output: [
      { ...umd_out_base, file: 'dist/pako.js' },
      { ...umd_out_base, file: 'dist/pako.min.js', plugins: [ terser() ] }
    ],
    plugins: plugins
  },
  {
    input: 'src/deflate.mjs',
    output: [
      { ...umd_out_base, file: 'dist/pako_deflate.js' },
      { ...umd_out_base, file: 'dist/pako_deflate.min.js', plugins: [ terser() ] }
    ],
    plugins: plugins
  },
  {
    input: 'src/inflate.mjs',
    output: [
      { ...umd_out_base, file: 'dist/pako_inflate.js' },
      { ...umd_out_base, file: 'dist/pako_inflate.min.js', plugins: [ terser() ] }
    ],
    plugins: plugins
  },
  // es5
  {
    input: 'src/index.mjs',
    output: [
      { ...umd_out_base, file: 'dist/pako.es5.js' },
      { ...umd_out_base, file: 'dist/pako.es5.min.js', plugins: [ terser() ] }
    ],
    plugins: plugins_es5
  },
  {
    input: 'src/deflate.mjs',
    output: [
      { ...umd_out_base, file: 'dist/pako_deflate.es5.js' },
      { ...umd_out_base, file: 'dist/pako_deflate.es5.min.js', plugins: [ terser() ] }
    ],
    plugins: plugins_es5
  },
  {
    input: 'src/inflate.mjs',
    output: [
      { ...umd_out_base, file: 'dist/pako_inflate.es5.js' },
      { ...umd_out_base, file: 'dist/pako_inflate.es5.min.js', plugins: [ terser() ] }
    ],
    plugins: plugins_es5
  },
  // esm
  {
    input: 'src/index.mjs',
    output: [
      { file: 'dist/pako.esm.mjs', format: 'esm' }
    ],
    plugins: plugins
  },
  // cjs (entry for `require('pako')`)
  {
    input: 'src/index.mjs',
    output: [
      { file: 'dist/pako.cjs', format: 'cjs', exports: 'named' }
    ],
    plugins: plugins
  }
];
