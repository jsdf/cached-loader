var path = require('path');
var execFile = require('child_process').execFile;
var rimraf = require('rimraf');

var projectRoot = path.resolve(__dirname, '../');

// TODO: move this somewhere better
var testOutputDir = path.join(projectRoot, 'tmp/test');

// mtime resolution can be 1-2s depending on OS
// should wait that long between test builds
// TODO: investigate this
var minMtimeResolution = 0;

function waitForIOSettle(done) {
  setTimeout(done, minMtimeResolution);
}

function cleanupTestOutputDir(done) {
  rimraf(testOutputDir, {disableGlob: true}, (err) => {
    if (err) done(err);

    execFile('mkdir', ['-p', testOutputDir], (err) => {
      if (err) done(err);
      done();
    });
  });
}

module.exports = {
  waitForIOSettle,
  minMtimeResolution,
  testOutputDir,
  projectRoot,
  cleanupTestOutputDir,
};
