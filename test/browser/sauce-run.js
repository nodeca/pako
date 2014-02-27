#!/usr/bin/env node

/* You have to setup 3 enviroment variables to run this script:
 *
 * SAUCE_PROJ - project name
 * SAUCE_USER - saucelabs user name
 * SAUCE_AUTH - saucelabs authorisation token
 */

'use strict';

var Cloud = require('mocha-cloud');
/*  , Canvas = require('term-canvas')
  , size = process.stdout.getWindowSize()
  , GridView = require('mocha-cloud-grid-view');*/

/*if (!process.env.SAUCE_PROJ || !process.env.SAUCE_USER || !process.env.SAUCE_AUTH) {
  console.err('You must set enviroment variables SAUCE_PROJ, SAUCE_USER and SAUCE_AUTH');
  process.exit(1);
}*/

var cloud = new Cloud(process.env.SAUCE_PROJ, process.env.SAUCE_USER, process.env.SAUCE_AUTH);

// the browsers to test

var browsers = require('./browsers.json');

browsers.forEach(function(browser) {
  cloud.browser(browser.browserName, browser.version, browser.platform);
});

// the local url to test

cloud.url('http://localhost:3000/test/browser/');

// setup

/*var canvas = new Canvas(size[0], size[1]);
var ctx = canvas.getContext('2d');
var grid = new GridView(cloud, ctx);
grid.size(canvas.width, canvas.height);
ctx.hideCursor();

// trap SIGINT

process.on('SIGINT', function(){
  ctx.reset();
  process.nextTick(function(){
    process.exit();
  });
});

// output failure messages
// once complete, and exit > 0
// accordingly

cloud.start(function(){
  grid.showFailures();
  setTimeout(function(){
    ctx.showCursor();
    process.exit(grid.totalFailures());
  }, 100);
});*/

cloud.on('init', function(browser){
  console.log('  init : %s %s', browser.browserName, browser.version);
});

cloud.on('start', function(browser){
  console.log('  start : %s %s', browser.browserName, browser.version);
});

cloud.on('end', function(browser, res){
  console.log('  end : %s %s : %d failures', browser.browserName, browser.version, res.failures);
});

cloud.start();
