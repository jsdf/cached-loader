var path = require('path');
var execFile = require('child_process').execFile;
var rimraf = require('rimraf');

var projectRoot = path.resolve(__dirname, '../');

// TODO: move this somewhere better
var testOutputDir = path.join(projectRoot, 'tmp/test');

// mtime resolution can be 1-2s depending on OS
// should wait that long between test builds
// TODO: investigate this
var minMtimeResolution = 2000;

function waitForMtimeTick(done) {
  setTimeout(done, minMtimeResolution);
}

function cleanupTestOutputDir(done) {
  rimraf(testOutputDir, {disableGlob: true}, function(err) {
    if (err) done(err);

    execFile('mkdir', ['-p', testOutputDir], function(err) {
      if (err) done(err);
      done();
    });
  });
}

module.exports = {
  waitForMtimeTick,
  minMtimeResolution,
  testOutputDir,
  projectRoot,
  cleanupTestOutputDir,
};
