var fs = require('fs');
var test = require('tap').test;
var path = require('path');
var webpack = require('webpack');

var webpackConfig = require('../support/webpack.config.js');
var cacheLoader = webpackConfig.module.loaders[0];
var depLoader = webpackConfig.module.loaders[1];
var testUtils = require('../support/testUtils');

var entry = path.join(testUtils.testOutputDir, 'depWithChanges.dep');

test('it builds valid bundles when files change', (t) => {
  t.plan(3);

  var bundleFile1 = 'bundle-1.js';
  var bundleFile2 = 'bundle-2.js';

  var dependency1 = path.join(testUtils.testOutputDir, 'stuff.txt');
  var dependency2 = path.join(testUtils.testOutputDir, 'stuff2.txt');
  var inputContent1 = '123';
  var inputContent2 = '567';

  testUtils.cleanupTestOutputDir((err) => {
    t.notOk(err, 'clean up test output dir');

    writeFile(entry, dependency1);
    writeFile(dependency1, inputContent1);
    writeFile(dependency2, inputContent2);
    doBuild(bundleFile1, (err) => {
      if (err) return t.notOk(err);

      var output1 = readFile(path.join(testUtils.testOutputDir, bundleFile1));
      t.match(output1, JSON.stringify(inputContent1), 'built bundle containing initial content');

      writeFile(entry, dependency2);
      doBuild(bundleFile2, err => {
        if (err) return t.notOk(err);

        var output2 = readFile(path.join(testUtils.testOutputDir, bundleFile2));
        t.match(output2, JSON.stringify(inputContent2), 'built bundle containing changed content');

        t.end();
      });
    });
  });
});


test('it builds valid bundles when do not change', (t) => {
  t.plan(3);

  var bundleFile1 = 'bundle-1.js';
  var bundleFile2 = 'bundle-2.js';

  var dependency1 = path.join(testUtils.testOutputDir, 'stuff.txt');
  var inputContent1 = '123';

  testUtils.cleanupTestOutputDir((err) => {
    t.notOk(err, 'clean up test output dir');

    writeFile(entry, dependency1);
    writeFile(dependency1, inputContent1);
    doBuild(bundleFile1, (err) => {
      if (err) return t.notOk(err);

      var output1 = readFile(path.join(testUtils.testOutputDir, bundleFile1));
      t.match(output1, JSON.stringify(inputContent1), 'built bundle containing initial content');

      doBuild(bundleFile2, err => {
        if (err) return t.notOk(err);

        var output2 = readFile(path.join(testUtils.testOutputDir, bundleFile2));
        t.match(output2, JSON.stringify(inputContent1), 'built bundle containing same content');

        t.end();
      });
    });
  });
});

function readFile(filepath) {
  return fs.readFileSync(filepath, {encoding: 'utf8'});
}

function writeFile(filepath, content) {
  fs.writeFileSync(filepath, content, {encoding: 'utf8'});
}

function doBuild(filename, done) {
  var webpackConfigForBuild = {
    entry: entry,
    output: {
      path: testUtils.testOutputDir,
      filename: filename,
    },
    module: {
      loaders: [
        cacheLoader,
        depLoader,
      ],
    },
  };

  webpack(webpackConfigForBuild, function(err, stats) {
    if (err) return done(err);
    var jsonStats = stats.toJson();
    if (jsonStats.errors.length > 0) {
      console.error.apply(console, jsonStats.errors);
      console.error.apply(console, jsonStats.errorDetails);
      return done(new Error(jsonStats.errors));
    }
    if (jsonStats.warnings.length > 0) {
      console.error.apply(console, jsonStats.warnings);
    }

    testUtils.waitForIOSettle(done);
  });
}
