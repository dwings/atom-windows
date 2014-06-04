(function() {
  var fs, fsAdditions, runas, wrench, _;

  fs = require('fs-plus');

  _ = require('underscore-plus');

  runas = null;

  wrench = require('wrench');

  fsAdditions = {
    list: function(directoryPath) {
      var e;
      if (fs.isDirectorySync(directoryPath)) {
        try {
          return fs.readdirSync(directoryPath);
        } catch (_error) {
          e = _error;
          return [];
        }
      } else {
        return [];
      }
    },
    listRecursive: function(directoryPath) {
      return wrench.readdirSyncRecursive(directoryPath);
    },
    cp: function(sourcePath, destinationPath, options) {
      return wrench.copyDirSyncRecursive(sourcePath, destinationPath, options);
    },
    safeSymlinkSync: function(source, target) {
      if (process.platform === 'win32') {
        if (runas == null) {
          runas = require('runas');
        }
        return runas('cmd', ['/K', "mklink /d \"" + target + "\" \"" + source + "\" & exit"], {
          hide: true
        });
      } else {
        return fs.symlinkSync(source, target);
      }
    }
  };

  module.exports = _.extend({}, fs, fsAdditions);

}).call(this);
