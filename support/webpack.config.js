var path = require('path');
var testUtils = require('./testUtils');
var entry = path.join(testUtils.projectRoot, 'fixtures/test-module/index.js');

module.exports = {
  entry: entry,
  output: {
    path: testUtils.testOutputDir,
    filename: 'example-bundle.js',
  },
  module: {
    loaders: [
      {
        test: /\.dep$/,
        loader: path.resolve(testUtils.projectRoot, './index.js'), // cached-loader
        query: {
          cacheDirectory: path.join(testUtils.testOutputDir, 'cached-loader'),
        },
      },
      {
        test: /\.dep$/,
        loader: path.resolve(testUtils.projectRoot, './support/depLoader.js'), // dep-loader
        query: {
          fileToInclude: path.resolve(testUtils.projectRoot, 'fixtures/test-module/stuff.txt'),
        },
      },
    ],
  },
};
