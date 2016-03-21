var fs = require('fs');

module.exports = function(content) {
  this.cacheable && this.cacheable();

  var fileToInclude = content.trim();
  this.dependency(fileToInclude);
  this.value = fs.readFileSync(fileToInclude, {encoding: 'utf8'});

  return 'module.exports = ' + JSON.stringify(this.value);
};
