(function() {
  var keytar, tokenName;

  keytar = require('keytar');

  tokenName = 'Atom.io API Token';

  module.exports = {
    getToken: function(callback) {
      var token;
      if (token = process.env.ATOM_ACCESS_TOKEN) {
        callback(null, token);
        return;
      }
      if (token = keytar.findPassword(tokenName)) {
        callback(null, token);
        return;
      }
      return callback("No Atom.io API token in keychain\nRun `apm login` or set the `ATOM_ACCESS_TOKEN` environment variable.");
    },
    saveToken: function(token) {
      return keytar.replacePassword(tokenName, 'atom.io', token);
    }
  };

}).call(this);
