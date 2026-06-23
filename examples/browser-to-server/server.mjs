/* eslint-disable no-console */

import http from 'node:http';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const page = readFileSync(new URL('browser.html', import.meta.url));


function error(message, statusCode = 400) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}


function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}


const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(page);
      return;
    }

    if (req.method !== 'POST' || req.url !== '/data') {
      throw error('Not found', 404);
    }

    if (req.headers['content-type'] !== 'application/json') {
      throw error('Expected application/json');
    }

    if (req.headers['content-encoding'] !== 'deflate') {
      throw error('Expected deflate content encoding');
    }

    const compressed = await readBody(req);
    const uncompressed = inflateSync(compressed);
    const obj = JSON.parse(uncompressed.toString());

    console.log('--- received object is:', obj);
    res.end('ok');
  }
  catch (err) {
    console.log(err);
    res.statusCode = err.statusCode || 400;
    res.end(err.message);
  }
});

server.listen(8000);

console.log('Open http://localhost:8000/ in a browser');
