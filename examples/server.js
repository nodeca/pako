'use strict';

/*eslint-disable no-console*/

const http = require('http');
const pako = require('../');

////////////////////////////////////////////////////////////////////////////////
// This is the main part of example

function processData(bin) {
  // Decompress binary content or POST request
  let uncompressed = pako.inflate(new Uint8Array(bin), { to: 'string' });

  // Convert utf8 -> utf16
  let decoded = decodeURIComponent(escape(uncompressed));

  console.log(decoded);
}

////////////////////////////////////////////////////////////////////////////////

const server = http.createServer((req, res) => {
  var buf = [];

  req.on('data', data => buf.push(data));

  req.on('end', () => {
    let bin = Buffer.concat(buf);

    processData(bin);

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
