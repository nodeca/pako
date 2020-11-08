'use strict';

const pako = require('../../../');

exports.run = (data, level) => {
  return pako.deflate(data.typed, { level: level });
};
