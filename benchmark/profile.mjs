import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import pako from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const data = new Uint8Array(fs.readFileSync(path.join(__dirname, '/samples/lorem_1mb.txt')));

const deflated = pako.deflate(data, { level: 6/*, to: 'string'*/ });

for (let i = 0; i < 200; i++) {
  pako.inflate(deflated, { to: 'string' });
}
