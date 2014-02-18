'use strict';


var zlib_deflate = require('./zlib/deflate.js');
var utils = require('./zlib/utils');
var c = require('./zlib/constants');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');

// return sliced buffer, trying to avoid new objects creation and mem copy
function sliceBuf(buf, size) {
  if (buf.length === size) { return buf; }

  var sliced = utils.arrayCreate(size);
  utils.arraySet(sliced, buf, 0, size, 0);
  return sliced;
}

/**
 * new Deflate(ootions)
 *
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Supported options:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - chunkSize
 * - raw (boolean) - do raw deflate
 * - gzip (boolean) - create gzip wrapper
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

  var opt = this.options;

  if (opt.raw && (opt.windowBits > 0)) {
    opt.windowBits = -opt.windowBits;
  }

  else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
    opt.windowBits += 16;
  }

  this.ended = false; // used to avoid multiple onEnd() calls
  this.chunks = [];   // chunks of compressed data

  this.strm = new zstream();

  var status = zlib_deflate.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );

  if (status !== c.Z_OK) {
    throw new Error(msg[status]);
  }
};

/**
 * Deflate#push(data) -> boolean
 *
 * - data (Uint8Array|Array) input data
 *
 * Compress input data, generating [Deflate.onData] calls with new data chunks.
 * On fail call [Deflate.onEnd] and return false.
 **/
Deflate.prototype.push = function(data) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status;

  if (this.ended) { return false; }

  strm.next_in = data;
  strm.next_in_index = 0;
  strm.avail_in = strm.next_in.length;
  strm.next_out = utils.arrayCreate(chunkSize);

  do {
    strm.avail_out = this.options.chunkSize;
    strm.next_out_index = 0;
    status = zlib_deflate.deflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }
    if(strm.next_out_index) {
      this.onData(sliceBuf(strm.next_out, strm.next_out_index));
      // Allocate buffer for next chunk
      strm.next_out = utils.arrayCreate(this.options.chunkSize);
    }
  } while (strm.avail_in > 0 || strm.avail_out === 0);

  return true;
};

/**
 * Deflate#flush() -> boolean
 *
 * Flush internal deflate data to output buffer. Does [Deflate.onData] call on
 * success. On fail call [Deflate.onEnd] and return false.
 **/
Deflate.prototype.flush = function() {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status;

  if (this.ended) { return false; }

  strm.next_out = utils.arrayCreate(chunkSize);

  do {
    strm.avail_out = this.options.chunkSize;
    strm.next_out_index = 0;
    status = zlib_deflate.deflate(strm, c.Z_FINISH);    /* no bad return value */

    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }
    if(strm.next_out_index) {
      this.onData(sliceBuf(strm.next_out, strm.next_out_index));
      // Allocate buffer for next chunk
      strm.next_out = utils.arrayCreate(this.options.chunkSize);
    }
  } while (strm.avail_out === 0);

  return true;
};

/**
 * Deflate#finish() -> boolean
 *
 * Must be called when no more input data available. This function initiates
 * [Deflate#onEnd] call. Returns `false` if something gone wrong.
 **/
Deflate.prototype.finish = function() {
  if (this.ended) { return false; }
  this.flush();
  zlib_deflate.deflateEnd(this.strm);
  this.onEnd(c.Z_OK);
  this.ended = true;
  return true;
};


/**
 * Deflate#onData(chunk) -> Void
 *
 * - chunk (Uint8Array|Array)- ouput data. Type of array depends
 *   on js engine support.
 *
 * By default, it store chunks in [Deflate.chunks]. Override this handler, if
 *  you need another behaviour.
 **/
Deflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 *
 * - status (Number) - deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that input stream complete. See
 * [Deflate.finish]. By default - join collected chunks, free memory and fill
 * states properties.
 **/
Deflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === c.Z_OK) {
    this.result = utils.flattenChunks(this.chunks);
  }
  this.chunks = [];
  this.err = status;
  // TODO: detect message by status, if not set in zstream
  this.msg = this.strm.msg || msg[status];
  this.ended = true;
};


/**
 * deflate(data, options) -> (Uint8Array|Array)
 *
 * - data (Uint8Array|Array): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Simple [Deflate] wrapper to compress data with one call.
 *
 * Supported options:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these. 
 **/
function deflate(input, options) {
  var deflator = new Deflate(options);

  deflator.push(input);
  deflator.finish();

  if (deflator.err) { throw msg[deflator.err]; }

  return deflator.result;
}


/**
 * deflateRaw(data, options) -> (Uint8Array|Array)
 *
 * - data (Uint8Array|Array): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [deflate], but auoput raw data, without wrapper.
 **/
function deflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return deflate(input, options);
}


/**
 * gzip(data, options) -> (Uint8Array|Array)
 *
 * - data (Uint8Array|Array): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [deflate], but create gzip wrapper instead of deflate one.
 **/
function gzip(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate(input, options);
}


exports.Deflate = Deflate;
exports.deflate = deflate;
exports.deflateRaw = deflateRaw;
exports.gzip = gzip;