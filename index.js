var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var loaderUtils = require('loader-utils');
var crypto = require('crypto');

function cachedLoaderPitch(remainingRequest, precedingRequest, data) {
  this.cacheable && this.cacheable();

  var query = loaderUtils.parseQuery(this.query);
  if (!query.cacheDirectory) {
    throw new Error('required query arg "cacheDirectory" not set');
  }

  data.cacheDirectory = query.cacheDirectory;
  data.cacheIdentifier = query.cacheIdentifier || '';
  data.debug = query.debug;

  var callback = this.async();

  ensureCacheDir(query.cacheDirectory)
    .then(() => {
      return readCache(
        query.cacheIdentifier,
        query.cacheDirectory,
        this.resourcePath,
        query.debug ? logToStderr : logToNull
      );
    })
    .then(cacheRecord => {
      if (cacheRecord) {
        Object.keys(cacheRecord.dependencies).forEach(function(depFile) {
          this.dependency(depFile);
        }.bind(this));
        return cacheRecord.content;
      }
    })
    .then(callback);
}

function cachedLoader(content) {
  this.cacheable && this.cacheable();

  if (!this.data.cacheDirectory) {
    throw new Error('required query arg "cacheDirectory" not set');
  }

  var callback = this.async();

  ensureCacheDir(this.data.cacheDirectory)
    .then(() => {
      writeCache(
        this.data.cacheIdentifier,
        this.data.cacheDirectory,
        this.resourcePath,
        content,
        this._module.fileDependencies,
        this.data.debug ? logToStderr : logToNull
      );
    })
    .then(callback);
}

function digest(content) {
  var shasum = crypto.createHash('sha1');
  shasum.update(content);
  return shasum.digest('hex');
}

function writeCache(cacheIdentifier, cacheDirectory, resourcePath, content, fileDependencies, log) {
  var key = null;
  var cacheRecord = {
    resourcePath: resourcePath,
    dependencies: null,
    content: content,
  };

  readFile(resourcePath)
    .then(content => {
      key = digest(cacheIdentifier + content);

      var dependencies = {};

      return Promise.all(
        fileDependencies.map((depFile) => {
          return readFile(depFile)
            .then(depFileContents => {
              dependencies[depFile] = digest(cacheIdentifier + depFileContents);
            });
        })
      )
        .then(() => {
          cacheRecord.dependencies = dependencies;
        });
    })
    .then(() => {
      log('writeCache', key, resourcePath);

      return writeFile(path.join(cacheDirectory, key), JSON.stringify(cacheRecord));
    });
}

function readCache(cacheIdentifier, cacheDirectory, resourcePath, log) {
  var key = null;
  var cacheRecord = null;

  readFile(resourcePath)
    .then(currentContent => {
      key = digest(cacheIdentifier + currentContent);

      log('readCache', key, resourcePath);

      return readFile(path.join(cacheDirectory, key));
    })
    .then(cacheFileContent => {
      cacheRecord = JSON.parse(cacheFileContent);
    })
    .then(() => {
      var depFiles = Object.keys(cacheRecord.dependencies);

      Promise.all(
        depFiles.map((depFile) => {
          var depFile = depFiles[i];
          var cachedVersionDigest = cacheRecord.dependencies[depFiles[i]];
          var currentDigest = digest(cacheIdentifier + readFile(depFile));

          // if digest of any dependency has changed, the cached version is invalid
          if (cachedVersionDigest !== currentDigest) {
            log('readCache miss', key, resourcePath, depFile, cachedVersionDigest, currentDigest);
            return null;
          }
        })
      )

      log('readCache hit', key, resourcePath);
      return cacheRecord;
    })




    .catch((err) => {
      log('readCache miss', err + '');
      if (err.code === 'ENOENT') return null;
      return Promise.reject(err);
    }
}

function readFile(filepath) {
  return makePromise(done => fs.readFile(filepath, {encoding: 'utf8'}, done));
}

function writeFile(filepath, content) {
  return makePromise(done => fs.writeFile(filepath, content, {encoding: 'utf8'}, done));
}

function ensureCacheDir(dirpath) {
  makePromise(done => mkdirp(dirpath, done));
}

function logToStderr() {
  console.error.apply(console, ['cached-loader:'].concat([].slice.call(arguments)));
}

function logToNull() {}

function makePromise(fn) {
  return new Promise((resolve, reject) => {
    fn((err, data) => {
      if (err) return reject(err);
      return data;
    });
  });
}

cachedLoader.pitch = cachedLoaderPitch;

module.exports = cachedLoader;
