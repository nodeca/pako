import { rm } from 'node:fs/promises';
import { build } from 'vite';

const common = {
  configFile: false,
  logLevel: 'info',
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: true
  }
};

await rm('dist', { recursive: true, force: true });

await build({
  ...common,
  build: {
    ...common.build,
    target: 'es2015',
    minify: false,
    lib: {
      entry: 'src/index.ts',
      formats: [ 'cjs' ],
      fileName: () => 'pako.cjs.js'
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  }
});

await build({
  ...common,
  build: {
    ...common.build,
    minify: false,
    lib: {
      entry: 'src/index.ts',
      formats: [ 'es' ],
      fileName: () => 'pako.mjs'
    },
    rollupOptions: {
      output: {}
    }
  }
});

for (const [ entry, name ] of [
  [ 'src/index.ts', 'pako' ],
  [ 'src/deflate.ts', 'pako_deflate' ],
  [ 'src/inflate.ts', 'pako_inflate' ]
]) {
  await build({
    ...common,
    build: {
      ...common.build,
      target: 'es2015',
      outDir: 'dist/browser',
      minify: true,
      lib: {
        entry,
        name: 'pako',
        formats: [ 'umd' ],
        fileName: () => `${name}.umd.min.js`
      },
      rollupOptions: {
        output: {
          exports: 'named',
          name: 'pako'
        }
      }
    }
  });

  await build({
    ...common,
    build: {
      ...common.build,
      target: 'es2015',
      outDir: 'dist/browser',
      minify: true,
      lib: {
        entry,
        formats: [ 'es' ],
        fileName: () => `${name}.esm.min.mjs`
      },
      rollupOptions: {
        output: { minify: true }
      }
    }
  });
}
