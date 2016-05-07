# cached-loader

Adds persistent on-disk caching to webpack loaders

## Example

```js
var path = require('path');
var combineLoaders = require('webpack-combine-loaders');

// some external config
var sassConfig = require('./sassConfig');

// some environmental config
var opts = {
  rootDir: process.cwd(),
  cssSourcemaps: Boolean(process.env.NODE_ENV !== 'production'),
};

module.exports = {
  module: {
    loaders: [
     {
        test: /\.scss$/,
        loader: combineLoaders([
          {
            loader: 'cached-loader',
            query: {
              cacheDirectory: path.join(opts.rootDir, 'tmp/cache/cached-loader'),
              cacheIdentifier: JSON.stringify(opts) + JSON.stringify(sassConfig),
            },
          },
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            query: {
              sourceMap: opts.cssSourcemaps,
            },
          },
          {
            loader: 'postcss-loader',
          },
          {
            loader: 'sass-loader',
            query: Object.assign({}, sassConfig, {
              sourceMap: opts.cssSourcemaps,
            }),
          },
        ]),
      },
    ],
  },
};
```
Now webpack should be faster from a cold start.


### See also

- [only-if-changed-webpack-plugin](https://github.com/jsdf/only-if-changed-webpack-plugin) – Webpack plugin to only run build if dependent files have changed

