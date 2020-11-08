// Top level file is just a mixin of submodules & constants
'use strict';

const assign    = require('./lib/utils/common').assign;

const deflate   = require('./lib/deflate');
const inflate   = require('./lib/inflate');
const constants = require('./lib/zlib/constants');

let pako = {};

assign(pako, deflate, inflate, constants);

module.exports = pako;
