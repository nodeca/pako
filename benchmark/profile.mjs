import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { deflate, inflate } from '../src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const data = new Uint8Array(fs.readFileSync(path.join(__dirname, '/samples/lorem_1mb.txt')));

const deflated = deflate(data, { level: 6/*, to: 'string'*/ });

for (let i = 0; i < 200; i++) {
  inflate(deflated, { to: 'string' });
}
