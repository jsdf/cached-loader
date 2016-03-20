module.exports = function(content) {
  return content;
};
module.exports.pitch = function(remainingRequest, precedingRequest, data) {
  // if (someCondition()) {
  //   // fast exit
  //   return "module.exports = require(" + JSON.stringify("-!" + remainingRequest) + ");";
  // }
  // data.value = 42;
  console.error(this)
};