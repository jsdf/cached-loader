var caching = require('./caching');

var loaderUtils = require('loader-utils');

function cachedLoaderPitch(remainingRequest, precedingRequest, data) {
  this.cacheable && this.cacheable();
  var callback = this.async();

  var query = loaderUtils.parseQuery(this.query);
  if (!query.cacheDirectory) {
    return callback(new Error('required query arg "cacheDirectory" not set'));
  }

  data.cacheDirectory = query.cacheDirectory;
  data.cacheIdentifier = query.cacheIdentifier || '';
  data.debug = query.debug;

  var resourcePath = this.resourcePath;
  var pitchContext = this;
  caching.ensureCacheDir(query.cacheDirectory)
    .then(function() {
      return caching.readCache(
        query.cacheIdentifier,
        query.cacheDirectory,
        resourcePath,
        query.debug ? logToStderr : logToNull
      );
    })
    .then(function(cacheRecord) {
      if (cacheRecord != null) {
        Object.keys(cacheRecord.dependencies)
          .forEach(function(depFile) {
            pitchContext.addDependency(depFile);
          });

        callback(null, cacheRecord.content);
      } else {
        callback();
      }
    })
    .catch(function(err) {
      callback(err);
    });
}

function cachedLoader(content) {
  this.cacheable && this.cacheable();
  var callback = this.async();

  if (!this.data.cacheDirectory) {
    return callback(new Error('required query arg "cacheDirectory" not set'));
  }

  var resourcePath = this.resourcePath;
  var data = this.data;
  var fileDependencies = this._module.fileDependencies;
  caching.ensureCacheDir(this.data.cacheDirectory)
    .then(function() {
      return caching.writeCache(
        data.cacheIdentifier,
        data.cacheDirectory,
        resourcePath,
        content,
        fileDependencies,
        data.debug ? logToStderr : logToNull
      );
    })
    .then(function() {
      callback(null, content);
    })
    .catch(function(err) {
      callback(err);
    });
}

function logToStderr() {
  console.error.apply(console, ['cached-loader:'].concat([].slice.call(arguments)));
}

function logToNull() {}

cachedLoader.pitch = cachedLoaderPitch;

module.exports = cachedLoader;
