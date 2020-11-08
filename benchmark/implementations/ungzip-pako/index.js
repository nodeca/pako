'use strict';

const pako = require('../../../');

exports.run = (data) => {
  return pako.ungzip(data.gzipTyped, {
  });
};
