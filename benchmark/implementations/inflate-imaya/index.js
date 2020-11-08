'use strict';

const inflateSync = require('zlibjs').inflateSync;

exports.run = (data/*, level*/) => {
  // Compression levels not supported. Use unknown defaults always
  return inflateSync(data.deflateTyped);
};
