(function() {
  var runas;

  runas = require('bindings')('runas.node');

  module.exports = function(command, args, options) {
    if (args == null) {
      args = [];
    }
    if (options == null) {
      options = {};
    }
    if (options.hide == null) {
      options.hide = false;
    }
    return runas.runas(command, args, options);
  };

}).call(this);
