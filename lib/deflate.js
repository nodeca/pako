'use strict';


//var zlib_deflate = require('./zlib/deflate.js');
var utils = require('./zlib/utils');


/**
 * Deflate
 *
 * @param {Object} [options] zlib options
 * @constructor
 */
var Deflate = function(/*options*/) {

};


/**
 * Compresses the input data and fills output buffer with compressed data.
 * @return {Array|Uint8Array} compressed data
 */
Deflate.prototype.push = function(/*data_in*/) {

};

Deflate.prototype.flush = function() {

};

Deflate.prototype.finish = function() {

};

Deflate.prototype.onData = function(/*data_out*/) {

};

Deflate.prototype.onEnd = function(/*err*/) {

};


exports.Deflate = Deflate;


/**
 * Compresses the input data
 * @param input
 * @param [options]
 * @returns {Array|Uint8Array}
 */
function deflate(input, options) {
  var result;
  var chains = [];
  var deflator = new Deflate(options);

  deflator.onData = function(data_out) {
    chains.push(data_out);
  };

  deflator.onEnd = function(error) {
    var i, l, len, pos, chain;

    if (error) { throw error; }

    // calculate data length
    len = 0;
    for (i=0, l=chains.length; i<l; i++) {
      len += chains[i].length;
    }

    // join chains
    result = utils.arrayCreate(len);
    pos = 0;

    for (i=0, l=chains.length; i<l; i++) {
      chain = chains[i];
      len = chain.length;
      utils.arraySet(result, chain, 0, len, pos);
      pos += len;
    }
  };

  deflator.push(input);

  return result;
}


function deflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return deflate(input, options);
}


exports.Deflate = Deflate;
exports.deflate = deflate;
exports.deflateRaw = deflateRaw;