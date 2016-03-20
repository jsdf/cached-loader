var fs = require('fs');
var test = require('tap').test;
var path = require('path');
var webpack = require('webpack');

var testUtils = require('../support/testUtils');
var entry = path.join(testUtils.projectRoot, 'fixtures/test-module/index.js');

test('it builds valid bundles when using cache', (t) => {
  t.plan(3);

  var bundleFile1 = 'bundle-1.js';
  var bundleFile2 = 'bundle-2.js';
  var moduleWhichChangesPath = path.join(testUtils.testOutputDir, 'moduleWhichChanges.js');
  var expectedContent1 = 'console.log(1)';
  var expectedContent2 = 'console.log(2)';

  testUtils.cleanupTestOutputDir((err) => {
    t.notOk(err, 'clean up test output dir');

    writeModuleWhichChanges(expectedContent1);
    doBuild(bundleFile1, () => {
      var output1 = fs.readFileSync(path.join(testUtils.testOutputDir, bundleFile1), {encoding: 'utf8'});

      t.match(output1, expectedContent1, 'built once');

      writeModuleWhichChanges(expectedContent2);
      doBuild(bundleFile2, () => {
        var output2 = fs.readFileSync(path.join(testUtils.testOutputDir, bundleFile2), {encoding: 'utf8'});
        t.match(output2, expectedContent2, 'built twice');

        t.end();
      });
    });
  });

  function writeModuleWhichChanges(content) {
    fs.writeFileSync(moduleWhichChangesPath, content, {encoding: 'utf8'});
  }

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

