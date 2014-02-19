'use strict';

var fs   = require('fs');
var pako = require('../index.js');

var data = new Uint8Array(fs.readFileSync(__dirname +'/samples/lorem_1mb.txt'));


for (var i=0; i<50; i++) {
  pako.deflate(data, { level: 6 });
}
