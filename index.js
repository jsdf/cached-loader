var mkdirp = require('mkdirp');
var path = require('path');
var fs = require('fs');
var loaderUtils = require('loader-utils');
var crypto = require('crypto');
var dump = require('./dump');

function cachedLoaderPitch(remainingRequest, precedingRequest, data) {
  this.cacheable && this.cacheable();

  // dump('cachedLoaderPitch', this);
  var query = loaderUtils.parseQuery(this.query);
  if (!query.cacheDir) return;
  ensureCacheDir(query.cacheDir);
  data.cacheDir = query.cacheDir;
  // dump('cachedLoaderPitch .resourcePath', this.resourcePath);

  var content = readCache(query.cacheDir, this.resourcePath);
  if (content) return content;
}

function cachedLoader(content) {
  this.cacheable && this.cacheable();

  if (!this.data.cacheDir) return content;
  ensureCacheDir(this.data.cacheDir);

  // dump('cachedLoader', this);
  // dump('this._module.fileDependencies', this._module.fileDependencies);

  writeCache(this.data.cacheDir, this.resourcePath, content, this._module.fileDependencies);

  return content;
}


function digest(content) {
  var shasum = crypto.createHash('sha1');
  shasum.update(content);
  return shasum.digest('hex');
}

function writeCache(cacheDir, resourcePath, content, fileDependencies) {
  var key = digest(readFile(resourcePath));

  var dependencies = {};

  fileDependencies.forEach(function(depFile) {
    dependencies[depFile] = digest(readFile(depFile));
  });

  var cacheRecord = {
    resourcePath: resourcePath,
    dependencies: dependencies,
    content: content,
  };


  log('writeCache', cacheDir, key);

  writeFile(path.join(cacheDir, key), JSON.stringify(cacheRecord));
}

function readCache(cacheDir, resourcePath) {
  var key = digest(readFile(resourcePath));

  log('readCache', cacheDir, key, resourcePath);

  var cacheRecord;
  try {
    cacheRecord = JSON.parse(readFile(path.join(cacheDir, key)));
  } catch (err) {

    log('readCache miss', err + '');
    if (err.code === 'ENOENT') return null;
    throw err;
  }

  var depFiles = Object.keys(cacheRecord.dependencies);
  for (var i = 0; i < depFiles.length; i++) {
    var depFile = depFiles[i];
    var cachedVersionDigest = cacheRecord.dependencies[depFiles[i]];
    var currentDigest = digest(readFile(depFile));

    // if digest of any dependency has changed, the cached version is invalid
    if (cachedVersionDigest !== currentDigest) {

      log('readCache miss', cacheRecord, depFile, cachedVersionDigest, currentDigest);
      return null;
    }
  }

  log('readCache hit', cacheRecord);
  return cacheRecord.content;
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

function log() {
  console.error.apply(console, ['--- '].concat([].slice.call(arguments)));
}

cachedLoader.pitch = cachedLoaderPitch;

module.exports = cachedLoader;
