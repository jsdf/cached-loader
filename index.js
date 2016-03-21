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
  ensureCacheDir(query.cacheDirectory);
  data.cacheDirectory = query.cacheDirectory;
  data.cacheIdentifier = query.cacheIdentifier || '';
  data.debug = query.debug;

  var cacheRecord = readCache(
    query.cacheIdentifier,
    query.cacheDirectory,
    this.resourcePath,
    query.debug ? logToStderr : logToNull
  );

  if (cacheRecord) {
    Object.keys(cacheRecord.dependencies).forEach(function(depFile) {
      this.dependency(depFile);
    }.bind(this));
    return cacheRecord.content;
  }
}

function cachedLoader(content) {
  this.cacheable && this.cacheable();

  if (!this.data.cacheDirectory) return content;
  ensureCacheDir(this.data.cacheDirectory);

  writeCache(
    this.data.cacheIdentifier,
    this.data.cacheDirectory,
    this.resourcePath,
    content,
    this._module.fileDependencies,
    this.data.debug ? logToStderr : logToNull
  );

  return content;
}

function digest(content) {
  var shasum = crypto.createHash('sha1');
  shasum.update(content);
  return shasum.digest('hex');
}

function writeCache(cacheIdentifier, cacheDirectory, resourcePath, content, fileDependencies, log) {
  var key = digest(cacheIdentifier + readFile(resourcePath));

  var dependencies = {};

  fileDependencies.forEach(function(depFile) {
    dependencies[depFile] = digest(cacheIdentifier + readFile(depFile));
  });

  var cacheRecord = {
    resourcePath: resourcePath,
    dependencies: dependencies,
    content: content,
  };

  log('writeCache', key, resourcePath);

  writeFile(path.join(cacheDirectory, key), JSON.stringify(cacheRecord));
}

function readCache(cacheIdentifier, cacheDirectory, resourcePath, log) {
  var key = digest(cacheIdentifier + readFile(resourcePath));

  log('readCache', key, resourcePath);

  var cacheRecord;
  try {
    cacheRecord = JSON.parse(readFile(path.join(cacheDirectory, key)));
  } catch (err) {
    log('readCache miss', err + '');
    if (err.code === 'ENOENT') return null;
    throw err;
  }

  var depFiles = Object.keys(cacheRecord.dependencies);
  for (var i = 0; i < depFiles.length; i++) {
    var depFile = depFiles[i];
    var cachedVersionDigest = cacheRecord.dependencies[depFiles[i]];
    var currentDigest = digest(cacheIdentifier + readFile(depFile));

    // if digest of any dependency has changed, the cached version is invalid
    if (cachedVersionDigest !== currentDigest) {
      log('readCache miss', key, resourcePath, depFile, cachedVersionDigest, currentDigest);
      return null;
    }
  }

  log('readCache hit', key, resourcePath);
  return cacheRecord;
}

function readFile(filepath) {
  return fs.readFileSync(filepath, {encoding: 'utf8'});
}

function writeFile(filepath, content) {
  fs.writeFileSync(filepath, content, {encoding: 'utf8'});
}

function ensureCacheDir(dirpath) {
  mkdirp.sync(dirpath);
}

function logToStderr() {
  console.error.apply(console, ['cached-loader:'].concat([].slice.call(arguments)));
}

function logToNull() {}

cachedLoader.pitch = cachedLoaderPitch;

module.exports = cachedLoader;
