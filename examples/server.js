'use strict';

/*eslint-disable no-console*/

const http       = require('http');
const pako       = require('../');
const multiparty = require('multiparty');
const Promise    = require('bluebird');
const fs         = require('fs');


const MULTIPART_RE    = /^multipart\/form-data(?:;|$)/i;
const MAX_FIELDS_SIZE = 100 * 1024;       // 100kb
const MAX_FILES_SIZE  = 10 * 1024 * 1024; // 10mb


function error(msg) {
  let e = new Error(msg);
  e.statusCode = 400;
  return e;
}



const server = http.createServer((req, res) => {

  console.log('--- received request');

  // Quick hack to bypass security restrictions when demo html is opened from
  // file system. Don't do such things on production.
  res.setHeader('Access-Control-Allow-Origin', '*');

  Promise.coroutine(function* () {
    //
    // Check request size early by header and terminate immediately for big data
    //
    let length = parseInt((req.headers['content-length'] || '0'), 10);

    if (!length || isNaN(length)) throw error('Length required');

    if (!MULTIPART_RE.test(req.headers['content-type'])) {
      throw error('Expect form data');
    }

    let err = null;

    let form = new multiparty.Form({
      maxFieldsSize: MAX_FIELDS_SIZE,
      maxFilesSize: MAX_FILES_SIZE
    });

    let files = yield new Promise(resolve => {
      form.parse(req, function (e, fields, files) {
        if (e) err = e;
        resolve(files);
      });
    });

    if (err) {
      err.statusCode = err.statusCode || 400;
      throw err;
    }

    // In ideal world, we should process data as stream to minimize memory use
    // on big data (and use node's `zlib` inflate).
    //
    // But that's just a quick sample to explain data reencoding steps from
    // browser to server. Feel free to improve.
    let bin = yield Promise.fromCallback(cb => {
      fs.readFile(files.binson[0].path, cb);
    });

    // Kludge - here we should cleanup all files
    fs.unlinkSync(files.binson[0].path);

    // Decompress binary content
    // Note! Can throw error on bad data
    let uncompressed = pako.inflate(new Uint8Array(bin), { to: 'string' });

    // Convert utf8 -> utf16 (native JavaScript string format)
    let decoded = decodeURIComponent(escape(uncompressed));

    // Finally, create an object
    // Note! Can throw error on bad data
    let obj = JSON.parse(decoded);

    console.log('--- received object is: ', obj);
    res.end('ok');
  })()
  .catch(err => {
    console.log(err);
    res.statusCode = err.statusCode || 400;
    res.end(err.message);
  });

});

server.listen(8000);

console.log('Listening browser requests. Open `browser.html` to see');
