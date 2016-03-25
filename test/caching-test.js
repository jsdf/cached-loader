var fs = require('fs');
var path = require('path');
var test = require('tap').test;
var mkdirp = require('mkdirp');
var testUtils = require('../support/testUtils');
var caching = require('../caching');

var cacheIdentifier = '123';
var resourcePath = path.join(testUtils.fixturesDir, 'test-module/test.dep');
var depPath = path.join(testUtils.fixturesDir, 'test-module/stuff.txt');
var cacheDirectory = path.join(testUtils.testOutputDir, 'caching-test');

test('writeCache', (t) => {
  var transformedContent = fs.readFileSync(depPath, {encoding: 'utf8'}) + 'abc';
  var fileDependencies = [resourcePath, depPath];

  testUtils.cleanupTestOutputDir((err) => {
    t.notOk(err, 'clean up test output dir');

    mkdirp.sync(cacheDirectory);

    caching.writeCache(
      cacheIdentifier,
      cacheDirectory,
      resourcePath,
      transformedContent,
      fileDependencies,
      logToNull
    )
      .then(() => {
        var expected = {
          resourcePath: resourcePath,
          dependencies: {
            [resourcePath]: 'f77368ab914263916760734103c1ba29190568a3',
            [depPath]: 'b63c7c3a7543014bd34d99d31a85606d485837f9',
          },
          content: 'abc\nabc',
        };

        var actual = JSON.parse(
          fs.readFileSync(
            path.join(
              cacheDirectory,
              expected.dependencies[resourcePath]
            ),
            {encoding: 'utf8'}
          )
        );

        t.deepEqual(actual, expected, 'cache record written correctly');
        t.end();
      })
      .catch(writeErr => {
        t.notOk(writeErr, writeErr);
      });
  });
});

test('readCache valid', (t) => {
  var cacheRecord = {
    resourcePath: resourcePath,
    dependencies: {
      [resourcePath]: 'f77368ab914263916760734103c1ba29190568a3',
      [depPath]: 'b63c7c3a7543014bd34d99d31a85606d485837f9',
    },
    content: 'abc\nabc',
  };

  testUtils.cleanupTestOutputDir((err) => {
    t.notOk(err, 'clean up test output dir');

    mkdirp.sync(cacheDirectory);

    fs.writeFileSync(
      path.join(cacheDirectory, cacheRecord.dependencies[resourcePath]),
      JSON.stringify(cacheRecord)
    );

    caching.readCache(
      cacheIdentifier,
      cacheDirectory,
      resourcePath,
      logToNull
    )
      .then(loadedCacheRecord => {
        t.deepEqual(cacheRecord, loadedCacheRecord, 'loaded cache record matches');
        t.end();
      })
      .catch(writeErr => {
        t.notOk(writeErr, writeErr);
      });
  });
});

test('readCache invalid', (t) => {
  var cacheRecord = {
    resourcePath: resourcePath,
    dependencies: {
      [resourcePath]: 'f77368ab914263916760734103c1ba29190568a3',
      [depPath]: 'invalid',
    },
    content: 'abc\nabc',
  };

  testUtils.cleanupTestOutputDir((err) => {
    t.notOk(err, 'clean up test output dir');

    mkdirp.sync(cacheDirectory);

    fs.writeFileSync(
      path.join(cacheDirectory, cacheRecord.dependencies[resourcePath]),
      JSON.stringify(cacheRecord)
    );

    caching.readCache(
      cacheIdentifier,
      cacheDirectory,
      resourcePath,
      logToNull
    )
      .then(result => {
        t.equal(result, null, 'result is cache miss');
        t.end();
      })
      .catch(writeErr => {
        t.notOk(writeErr, writeErr);
      });
  });
});

function logToNull() {}
