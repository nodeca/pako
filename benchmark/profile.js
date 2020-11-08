'use strict';

const fs   = require('fs');
const path = require('path');
const pako = require('../');

const data = new Uint8Array(fs.readFileSync(path.join(__dirname, '/samples/lorem_1mb.txt')));

const deflated = pako.deflate(data, { level: 6/*, to: 'string'*/ });

for (let i = 0; i < 200; i++) {
  pako.inflate(deflated, { to: 'string' });
}
