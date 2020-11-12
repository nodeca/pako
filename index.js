// Top level file is just a mixin of submodules & constants
'use strict';

const { Deflate, deflate, deflateRaw, gzip } = require('./lib/deflate');

const { Inflate, inflate, inflateRaw, ungzip } = require('./lib/inflate');

const constants = require('./lib/zlib/constants');

module.exports = {
  Deflate, deflate, deflateRaw, gzip,
  Inflate, inflate, inflateRaw, ungzip,
  constants
};
