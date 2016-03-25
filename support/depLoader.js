var fs = require('fs');
var path = require('path');

module.exports = function(content) {
  this.cacheable && this.cacheable();

  var fileToInclude = path.resolve(path.dirname(this.resourcePath), content.trim());
  this.dependency(fileToInclude);
  this.value = fs.readFileSync(fileToInclude, {encoding: 'utf8'});

  return 'module.exports = ' + JSON.stringify(this.value);
};
