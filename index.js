var caching = require('./caching');

var loaderUtils = require('loader-utils');

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

  caching.ensureCacheDir(query.cacheDirectory)
    .then(function() {
      return caching.readCache(
        query.cacheIdentifier,
        query.cacheDirectory,
        this.resourcePath,
        query.debug ? logToStderr : logToNull
      );
    }.bind(this))
    .then(function(cacheRecord) {
      if (cacheRecord) {
        Object.keys(cacheRecord.dependencies)
          .forEach(function(depFile) {
            this.dependency(depFile);
          }.bind(this));

        return cacheRecord.content;
      }
    }.bind(this))
    .then(callback);
}

function cachedLoader(content) {
  this.cacheable && this.cacheable();

  if (!this.data.cacheDirectory) {
    throw new Error('required query arg "cacheDirectory" not set');
  }

  var callback = this.async();

  caching.ensureCacheDir(this.data.cacheDirectory)
    .then(function() {
      return caching.writeCache(
        this.data.cacheIdentifier,
        this.data.cacheDirectory,
        this.resourcePath,
        content,
        this._module.fileDependencies,
        this.data.debug ? logToStderr : logToNull
      );
    }.bind(this))
    .then(function() {
      callback(null, content);
    })
    .catch(callback);
}

function logToStderr() {
  console.error.apply(console, ['cached-loader:'].concat([].slice.call(arguments)));
}

function logToNull() {}

cachedLoader.pitch = cachedLoaderPitch;

module.exports = cachedLoader;
