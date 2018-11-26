// Top level file is just a mixin of submodules & constants
'use strict';

var assign    = require('./utils/common').assign;

var deflate   = require('./deflate');
var inflate   = require('./inflate');
var constants = require('./zlib/constants');

var pako = {};

assign(pako, deflate, inflate, constants);

module.exports = pako;
