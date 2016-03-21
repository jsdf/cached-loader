var util = require('util');

function dump(name, obj) {
  var output;
  if (obj && typeof obj === 'object') {
    var props = {};
    for (var propName in obj) {
      props[propName] = obj[propName];
    }
    output = util.inspect(props, {depth: 1});
  } else {
    output = obj;
  }
  console.error(name, output);
}

module.exports = dump;
