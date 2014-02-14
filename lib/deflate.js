'use strict';


var zlib_deflate = require('./zlib/deflate.js');
var utils = require('./zlib/utils');
var c = require('./zlib/constants');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');


/**
 * Deflate
 *
 * @param {Object} [options] zlib options
 * @constructor
 */
var Deflate = function(options) {

  this.options = utils.assign({
    level: 6,
    method: c.Z_DEFLATED,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: c.Z_DEFAULT_STRATEGY
  }, options || {});

  this.strm = new zstream();
  this.strm.next_out = utils.arrayCreate(this.options.chunkSize);

  var status = zlib_deflate.deflateInit2(
    this.strm,
    this.options.level,
    this.options.method,
    this.options.windowBits,
    this.options.memLevel,
    this.options.strategy
  );

  if (status !== c.Z_OK) {
    throw new Error(msg[status]);
  }
};

/**
 * Compresses the input data and fills output buffer with compressed data.
 */
Deflate.prototype.push = function(data_in) {
  var strm = this.strm;
  var out;

  strm.next_in = data_in;
  strm.next_in_index = 0;
  strm.avail_in = strm.next_in.length;

  /* run deflate() on input until output buffer not full, finish
   compression if all of source has been read in */
  do {
    strm.avail_out = this.options.chunkSize;
    strm.next_out_index = 0;
    zlib_deflate.deflate(strm, c.Z_NO_FLUSH);
    // TODO: check logic & why onEnd called. Check that onEnd not called twice.
    //var ret = zlib_deflate.deflate(strm, c.Z_NO_FLUSH);    /* no bad return value */
    //if (ret !== c.Z_STREAM_END && ret !== c.Z_OK) {
    //  this.onEnd(ret);
    //}
    if(strm.next_out_index) {
      out = utils.arrayCreate(strm.next_out_index);
      utils.arraySet(out, strm.next_out, 0, strm.next_out_index, 0);
      this.onData(out);
    }
  } while (strm.avail_in > 0 || strm.avail_out === 0);
};

Deflate.prototype.flush = function() {
  var strm = this.strm;
  var out, status;

  do {
    strm.avail_out = this.options.chunkSize;
    strm.next_out_index = 0;
    status = zlib_deflate.deflate(strm, c.Z_FINISH);    /* no bad return value */
    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
      this.onEnd(status);
    }

    if(strm.next_out_index) {
      out = utils.arrayCreate(strm.next_out_index);
      utils.arraySet(out, strm.next_out, 0, strm.next_out_index, 0);
      this.onData(out);
    }
  } while (strm.avail_out === 0);
};

Deflate.prototype.finish = function() {
  this.flush();
  zlib_deflate.deflateEnd(this.strm);
  this.onEnd(c.Z_OK);
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
  var chunks = [];
  var deflator = new Deflate(options);

  deflator.onData = function(data_out) {
    chunks.push(data_out);
  };

  deflator.onEnd = function(error) {
    var i, l, len, pos, chunk;

    if (error) { throw error; }

    // calculate data length
    len = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = utils.arrayCreate(len);
    pos = 0;

    for (i=0, l=chunks.length; i<l; i++) {
      chunk = chunks[i];
      len = chunk.length;
      utils.arraySet(result, chunk, 0, len, pos);
      pos += len;
    }
  };

  deflator.push(input);
  deflator.finish();

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