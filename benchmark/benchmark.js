#!/usr/bin/env node

'use strict';

const LEVEL = 6;

const path      = require('path');
const fs        = require('fs');
const util      = require('util');
const Benchmark = require('benchmark');
const ansi      = require('ansi');
const cursor    = ansi(process.stdout);

const pako      = require('../');


const IMPLS_DIRECTORY = path.join(__dirname, 'implementations');
const IMPLS_PATHS = {};
const IMPLS = [];


fs.readdirSync(IMPLS_DIRECTORY).sort().forEach(function (name) {
  const file = path.join(IMPLS_DIRECTORY, name);
  const code = require(file);

  IMPLS_PATHS[name] = file;
  IMPLS.push({
    name: name,
    code: code
  });
});

/* eslint-disable no-console */

const SAMPLES_DIRECTORY = path.join(__dirname, 'samples');
const SAMPLES = [];

fs.readdirSync(SAMPLES_DIRECTORY).sort().forEach(function (sample) {
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
});


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

module.exports.IMPLS_DIRECTORY   = IMPLS_DIRECTORY;
module.exports.IMPLS_PATHS       = IMPLS_PATHS;
module.exports.IMPLS             = IMPLS;
module.exports.SAMPLES_DIRECTORY = SAMPLES_DIRECTORY;
module.exports.SAMPLES           = SAMPLES;
module.exports.select            = select;
module.exports.run               = run;

run(process.argv.slice(2).map(function (source) {
  return new RegExp(source, 'i');
}));
