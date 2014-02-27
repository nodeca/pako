'use strict';


module.exports = function(grunt) {
  var browsers = [{
    browserName: 'iphone',
    platform: 'OS X 10.8',
    version: '6'
  }, {
    browserName: 'android',
    platform: 'Linux',
    version: '4.0'
  }, {
    browserName: 'firefox',
    platform: 'XP'
  }, {
    browserName: 'chrome',
    platform: 'XP'
  }, {
    browserName: 'internet explorer',
    platform: 'WIN8',
    version: '10'
  }, {
    browserName: 'internet explorer',
    platform: 'VISTA',
    version: '9'
  }, {
    browserName: 'internet explorer',
    platform: 'Windows 7',
    version: '8'
  }, {
    browserName: 'internet explorer',
    platform: 'XP',
    version: '7'
  }, {
    browserName: 'opera',
    platform: 'Windows 2008',
    version: '12'
  }, {
    browserName: 'safari',
    platform: 'OS X 10.8',
    version: '6'
  }];


  grunt.initConfig({
    connect: {
      server: {
        options: {
          base: '',
          port: 9999
        }
      }
    },
    'saucelabs-mocha': {
      all: {
        options: {
          urls: ['http://127.0.0.1:9999/test/browser/test.html'],
          tunnelTimeout: 5,
          build: process.env.TRAVIS_JOB_ID,
          concurrency: 3,
          browsers: browsers,
          testname: process.env.SAUCE_PROJ || 'mocha tests',
          tags: ['master']
        }
      }
    },
    watch: {}
  });

  // Loading dependencies
  for (var key in grunt.file.readJSON('package.json').devDependencies) {
    if (key !== 'grunt' && key.indexOf('grunt') === 0) { grunt.loadNpmTasks(key); }
  }

  //grunt.registerTask('dev', ['connect', 'watch']);
  grunt.registerTask('test', ['connect', 'saucelabs-mocha']);
};
