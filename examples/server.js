'use strict';

/* eslint-disable no-console */

const http       = require('http');
const multiparty = require('multiparty');
const fs         = require('fs');
const zlib       = require('zlib');
const util       = require('util');

const readFile = util.promisify(fs.readFile);
const inflate  = util.promisify(zlib.inflate);

const MULTIPART_RE    = /^multipart\/form-data(?:;|$)/i;
const MAX_FIELDS_SIZE = 100 * 1024;       // 100kb
const MAX_FILES_SIZE  = 10 * 1024 * 1024; // 10mb


function error(msg) {
  let e = new Error(msg);
  e.statusCode = 400;
  return e;
}


const server = http.createServer(async (req, res) => {

  console.log('--- received request');

  // Quick hack to bypass security restrictions when demo html is opened from
  // file system. Don't do such things on production.
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    //
    // Check request size early by header and terminate immediately for big data
    //
    const length = parseInt((req.headers['content-length'] || '0'), 10);

    if (!length || isNaN(length)) throw error('Length required');

    if (!MULTIPART_RE.test(req.headers['content-type'])) {
      throw error('Expect form data');
    }

    let err = null;

    const form = new multiparty.Form({
      maxFieldsSize: MAX_FIELDS_SIZE,
      maxFilesSize: MAX_FILES_SIZE
    });

    const files = await new Promise(resolve => {
      form.parse(req, function (e, fields, files) {
        if (e) err = e;
        resolve(files);
      });
    });

    if (err) {
      err.statusCode = err.statusCode || 400;
      throw err;
    }

    const bin = await readFile(files.binson[0].path);

    // Kludge - here we should cleanup all files
    fs.unlinkSync(files.binson[0].path);

    // Decompress binary content
    // Note! Can throw error on bad data
    const uncompressed = await inflate(bin);

    // Convert utf8 buffer -> utf16 string (native JavaScript string format)
    const decoded = uncompressed.toString();

    // Finally, create an object
    // Note! Can throw error on bad data
    const obj = JSON.parse(decoded);

    console.log('--- received object is: ', obj);
    res.end('ok');
  }
  catch (err) {
    console.log(err);
    res.statusCode = err.statusCode || 400;
    res.end(err.message);
  }

});

server.listen(8000);

console.log('Listening browser requests. Open `browser.html` to see');
