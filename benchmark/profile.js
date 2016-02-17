'use strict';

var fs   = require('fs');
var path = require('path');
var pako = require('../');

var data = new Uint8Array(fs.readFileSync(path.join(__dirname, '/samples/lorem_1mb.txt')));

var deflated = pako.deflate(data, { level: 6/*, to: 'string'*/ });

for (var i = 0; i < 200; i++) {
  pako.inflate(deflated, { to: 'string' });
}
