import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { build } from 'vite';

const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const outDir = process.env.PAKO_BUILD_OUT_DIR || 'dist';
const banner = `/*! ${pkg.name} ${pkg.version} https://github.com/${pkg.repository} @license ${pkg.license} */`;

const entries = [
  [ 'src/index.mjs', 'pako' ],
  [ 'src/deflate.mjs', 'pako_deflate' ],
  [ 'src/inflate.mjs', 'pako_inflate' ]
];

async function buildBundle({ entry, fileName, format, minify = false }) {
  await build({
    configFile: false,
    build: {
      outDir,
      emptyOutDir: false,
      minify,
      lib: {
        entry,
        name: 'pako',
        formats: [ format ],
        fileName: () => fileName
      },
      rollupOptions: {
        output: {
          banner,
          exports: 'named'
        }
      }
    }
  });
}

async function main() {
  await rm(outDir, { recursive: true, force: true });

  for (const [ entry, name ] of entries) {
    await buildBundle({ entry, fileName: `${name}.js`, format: 'umd' });
    await buildBundle({ entry, fileName: `${name}.min.js`, format: 'umd', minify: true });
  }

  await buildBundle({ entry: 'src/index.mjs', fileName: 'pako.esm.mjs', format: 'es' });
  await buildBundle({ entry: 'src/index.mjs', fileName: 'pako.cjs', format: 'cjs' });
}

main();
