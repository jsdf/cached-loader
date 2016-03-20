var test = require('tap').test;
var path = require('path');
var webpack = require('webpack');

var testUtils = require('../support/testUtils');
var entry = path.join(testUtils.projectRoot, 'fixtures/test-module/index.js');

test('it builds valid bundles when using cache', (t) => {
  t.plan(3);

  var firstBundleFile = 'bundle-1.js';
  var secondBundleFile = 'bundle-2.js';

  testUtils.cleanupTestOutputDir((err) => {
    t.notOk(err, 'clean up test output dir');

    doBuild(firstBundleFile, () => {
      t.ok(true, 'built once');

      doBuild(secondBundleFile, () => {
        t.ok(true, 'built twice');

        // var output = fs.readFileSync(secondBundleFile, {encoding: 'utf8'});

        t.end();
      });
    });
  });

  function doBuild(filename, done) {
    webpack({
      entry: entry,
      output: {
        path: testUtils.testOutputDir,
        filename: filename,
      },
    }, function(err) {
      if (err) t.notOk(err);
      testUtils.waitForMtimeTick(done);
    });
  }
});

