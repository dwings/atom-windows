(function() {
  var CSON, KeymapManager, fs, jQuery, path;

  fs = require('fs-plus');

  path = require('path');

  KeymapManager = require('atom-keymap');

  CSON = require('season');

  jQuery = require('space-pen').jQuery;

  KeymapManager.prototype.loadBundledKeymaps = function() {
    this.loadKeymap(path.join(this.resourcePath, 'keymaps'));
    return this.emit('bundled-keymaps-loaded');
  };

  KeymapManager.prototype.getUserKeymapPath = function() {
    var userKeymapPath;
    if (userKeymapPath = CSON.resolve(path.join(this.configDirPath, 'keymap'))) {
      return userKeymapPath;
    } else {
      return path.join(this.configDirPath, 'keymap.cson');
    }
  };

  KeymapManager.prototype.loadUserKeymap = function() {
    var userKeymapPath;
    userKeymapPath = this.getUserKeymapPath();
    if (fs.isFileSync(userKeymapPath)) {
      return this.loadKeymap(userKeymapPath, {
        watch: true,
        suppressErrors: true
      });
    }
  };

  jQuery.Event.prototype.abortKeyBinding = function() {
    var _ref;
    return (_ref = this.originalEvent) != null ? typeof _ref.abortKeyBinding === "function" ? _ref.abortKeyBinding() : void 0 : void 0;
  };

  module.exports = KeymapManager;

}).call(this);
