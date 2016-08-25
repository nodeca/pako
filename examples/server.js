'use strict';

/*eslint-disable no-console*/

const http = require('http');
const pako = require('../');


const server = http.createServer((req, res) => {
  var buf = [];

  req.on('data', data => buf.push(data));

  req.on('end', () => {
    console.log('--- received request');

    // In ideal world, we should process data as stream to minimize memory use
    // on big data (and use node's `zlib` inflate).
    //
    // But that's just a quick sample to explain data reencoding steps from
    // browser to server. Feel free to improve.

    // Join all pending chunks.
    let bin = Buffer.concat(buf);

    // Test header to understand if data was sent as raw binary (modern browser)
    // or string (utf8) format. If utf8 - reencode to binary.
    //
    // We could also use base64 encoding for strings on client side, but that
    // needs more libraries for old browsers (for unsupported `window.btoa()`).
    //
    // If you don't need IE8/9 support - just drop this part.
    if (/UTF-8/i.test(String(req.headers['content-type']))) {
      console.log('--- data has utf-8 encoding');

      bin = Buffer.from(bin.toString(), 'binary');
    }

    // Decompress binary content
    // Note! Can throw error on bad data
    let uncompressed = pako.inflate(new Uint8Array(bin), { to: 'string' });

    // Convert utf8 -> utf16 (native JavaScript string format)
    let decoded = decodeURIComponent(escape(uncompressed));

    // Finally, create an object
    // Note! Can throw error on bad data
    let obj = JSON.parse(decoded);

    console.log('--- received object is: ', obj);

    // Quick hack to bypass security restrictions when demo html is opened from
    // file system. Don't do such things on production.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('ok');
  });

  req.on('error', () => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end('error');
  });
});

server.listen(8000);

console.log('Listening browser requests. Open `browser.html` to see');
