#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

await rm('doc', { recursive: true, force: true });

const head = execFileSync('git', [ 'rev-parse', '--short=6', 'HEAD' ], { encoding: 'utf8' }).trim();
const linkFormat = `https://github.com/{package.repository}/blob/${head}/{file}#L{line}`;
const ndoc = require.resolve('ndoc/bin/ndoc.js');

execFileSync(process.execPath, [ ndoc, '--link-format', linkFormat ], { stdio: 'inherit' });
