'use strict';

const pako = require('../../../');

exports.run = (data, level) => {
  return pako.gzip(data.typed, { level: level });
};
