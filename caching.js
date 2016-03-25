'use strict';

var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

function writeCache(cacheIdentifier, cacheDirectory, resourcePath, transformedContent, fileDependencies, log) {
  var key = null;
  var cacheRecord = {
    resourcePath: resourcePath,
    dependencies: null,
    content: transformedContent,
  };

  return readFile(resourcePath)
    .then(function(resourceContent) {
      key = digest(cacheIdentifier + resourceContent);

      var dependencies = {};

      return Promise.all(
        fileDependencies.map(function(depFile) {
          return readFile(depFile)
            .then(function(depFileContents) {
              dependencies[depFile] = digest(cacheIdentifier + depFileContents);
            });
        })
      )
        .then(function() {
          cacheRecord.dependencies = dependencies;
        });
    })
    .then(function() {
      log('writeCache', key, resourcePath);

      return writeFile(path.join(cacheDirectory, key), JSON.stringify(cacheRecord));
    });
}

function readCache(cacheIdentifier, cacheDirectory, resourcePath, log) {
  var key = null;
  var cacheRecord = null;

  return readFile(resourcePath)
    .then(function(currentContent) {
      key = digest(cacheIdentifier + currentContent);

      log('readCache', key, resourcePath);
      return readFile(path.join(cacheDirectory, key));
    })
    .then(function(cacheFileContent) {
      cacheRecord = JSON.parse(cacheFileContent);
    })
    .then(function() {
      return checkDependenciesFresh(cacheRecord.dependencies, cacheIdentifier);
    })
    .then(function() {
      log('readCache hit', key, resourcePath);
      return cacheRecord;
    })
    .catch(function(err) {
      if (err.name === 'CacheMissError') {
        log('readCache miss', key, resourcePath, err.depFile, err.cachedDigest, err.currentDigest);
        return null;
      }
      log('readCache miss', err + '');
      if (err.code === 'ENOENT') return null;
      return Promise.reject(err);
    });
}

function checkDependenciesFresh(dependencies, cacheIdentifier) {
  var depFiles = Object.keys(dependencies);

  function checkDepFileFresh(depFile) {
    return readFile(depFile)
      .then(function(depFileContents) {
        var cachedDigest = dependencies[depFile];
        var currentDigest = digest(cacheIdentifier + depFileContents);

        // if digest of any dependency has changed, the cached version is invalid
        if (cachedDigest !== currentDigest) {
          return Promise.reject(CacheMissError(depFile, cachedDigest, currentDigest));
        }
      });
  }

  return Promise.all(depFiles.map(checkDepFileFresh));
}

function digest(content) {
  var shasum = crypto.createHash('sha1');
  shasum.update(content);
  return shasum.digest('hex');
}

function readFile(filepath) {
  return makePromise(function(done) {
    fs.readFile(filepath, {encoding: 'utf8'}, done);
  });
}

function writeFile(filepath, content) {
  return makePromise(function(done) {
    fs.writeFile(filepath, content, {encoding: 'utf8'}, done);
  });
}

function ensureCacheDir(dirpath) {
  return makePromise(function(done) {
    mkdirp(dirpath, done);
  });
}

function makePromise(fn) {
  return new Promise(function(resolve, reject) {
    fn(function(err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  });
}

function CacheMissError(depFile, cachedDigest, currentDigest) {
  var err = new Error(`${depFile} ${cachedDigest} ${currentDigest}`);
  err.name = 'CacheMissError';
  err.depFile = depFile;
  err.cachedDigest = cachedDigest;
  err.currentDigest = currentDigest;
  return err;
}

module.exports = {
  readCache: readCache,
  writeCache: writeCache,
  ensureCacheDir: ensureCacheDir,
};
