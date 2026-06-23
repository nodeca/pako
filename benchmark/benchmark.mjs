#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs';
import util from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Benchmark from 'benchmark';
import ansi from 'ansi';

import pako from '../src/index.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LEVEL = 6;

const cursor    = ansi(process.stdout);


const IMPLS_DIRECTORY = path.join(__dirname, 'implementations');
const IMPLS_PATHS = {};
const IMPLS = [];

/* eslint-disable no-console */

const SAMPLES_DIRECTORY = path.join(__dirname, 'samples');
const SAMPLES = [];

function addSample(sample) {
  const filepath = path.join(SAMPLES_DIRECTORY, sample);
  const extname  = path.extname(filepath);
  const basename = path.basename(filepath, extname);

  const content = {}; // raw/compressed data in different formats

  content.buffer = fs.readFileSync(filepath);
  content.typed  = new Uint8Array(content.buffer);
  content.string = fs.readFileSync(filepath, 'utf8');

  content.deflateTyped = pako.deflate(content.typed, { level: LEVEL });
  content.gzipTyped = pako.gzip(content.typed, { level: LEVEL });

  content.deflateRawTyped = pako.deflateRaw(content.typed, { level: LEVEL });

  const title    = util.format('(%d bytes raw / ~%d bytes compressed)', content.typed.length, content.deflateTyped.length);


  function onComplete() {
    cursor.write('\n');
  }


  const suite = new Benchmark.Suite(title, {

    onStart: function onStart() {
      console.log('\nSample: %s %s', sample, title);
    },

    onComplete: onComplete

  });


  IMPLS.forEach(function (impl) {
    suite.add(impl.name, {

      onCycle: function onCycle(event) {
        cursor.horizontalAbsolute();
        cursor.eraseLine();
        cursor.write(' > ' + event.target);
      },

      onComplete: onComplete,

      defer: !!impl.code.async,

      fn: function (deferred) {
        if (impl.code.async) {
          impl.code.run(content, LEVEL, function () {
            deferred.resolve();
            return;
          });
        } else {
          impl.code.run(content, LEVEL);
          return;
        }
      }
    });
  });


  SAMPLES.push({
    name: basename,
    title: title,
    content: content,
    suite: suite
  });
}


function select(patterns) {
  const result = [];

  if (!(patterns instanceof Array)) {
    patterns = [ patterns ];
  }

  function checkName(name) {
    return patterns.length === 0 || patterns.some(function (regexp) {
      return regexp.test(name);
    });
  }

  SAMPLES.forEach(function (sample) {
    if (checkName(sample.name)) {
      result.push(sample);
    }
  });

  return result;
}


function run(files) {
  const selected = select(files);

  if (selected.length > 0) {
    console.log('Selected samples: (%d of %d)', selected.length, SAMPLES.length);
    selected.forEach(function (sample) {
      console.log(' > %s', sample.name);
    });
  } else {
    console.log('There isn\'t any sample matches any of these patterns: %s', util.inspect(files));
  }

  selected.forEach(function (sample) {
    sample.suite.run();
  });
}

export { IMPLS_DIRECTORY, IMPLS_PATHS, IMPLS, SAMPLES_DIRECTORY, SAMPLES, select, run };

// Load implementations (ESM, async), then build samples and run.
for (const name of fs.readdirSync(IMPLS_DIRECTORY).sort()) {
  const file = path.join(IMPLS_DIRECTORY, name, 'index.mjs');
  if (!fs.existsSync(file)) continue; // skip implementations without sources

  const code = await import(pathToFileURL(file));
  IMPLS_PATHS[name] = file;
  IMPLS.push({ name: name, code: code });
}

IMPLS.sort(function (a, b) { return a.name < b.name ? -1 : 1; });

fs.readdirSync(SAMPLES_DIRECTORY).sort().forEach(addSample);

run(process.argv.slice(2).map(function (source) {
  return new RegExp(source, 'i');
}));
