(function() {
  var AutoUpdateManager, CHECKING_STATE, DOWNLOADING_STATE, ERROR_STATE, EventEmitter, IDLE_STATE, NO_UPDATE_AVAILABLE_STATE, UPDATE_AVAILABLE_STATE, autoUpdater, dialog, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  autoUpdater = require('auto-updater');

  dialog = require('dialog');

  _ = require('underscore-plus');

  EventEmitter = require('events').EventEmitter;

  IDLE_STATE = 'idle';

  CHECKING_STATE = 'checking';

  DOWNLOADING_STATE = 'downloading';

  UPDATE_AVAILABLE_STATE = 'update-available';

  NO_UPDATE_AVAILABLE_STATE = 'no-update-available';

  ERROR_STATE = 'error';

  module.exports = AutoUpdateManager = (function() {
    _.extend(AutoUpdateManager.prototype, EventEmitter.prototype);

    function AutoUpdateManager(version) {
      this.version = version;
      this.onUpdateError = __bind(this.onUpdateError, this);
      this.onUpdateNotAvailable = __bind(this.onUpdateNotAvailable, this);
      this.state = IDLE_STATE;
      if (/\w{7}/.test(this.version)) {
        return;
      }
      autoUpdater.setFeedUrl("https://atom.io/api/updates?version=" + this.version);
      autoUpdater.on('checking-for-update', (function(_this) {
        return function() {
          return _this.setState(CHECKING_STATE);
        };
      })(this));
      autoUpdater.on('update-not-available', (function(_this) {
        return function() {
          return _this.setState(NO_UPDATE_AVAILABLE_STATE);
        };
      })(this));
      autoUpdater.on('update-available', (function(_this) {
        return function() {
          return _this.setState(DOWNLOADING_STATE);
        };
      })(this));
      autoUpdater.on('error', (function(_this) {
        return function(event, message) {
          _this.setState(ERROR_STATE);
          return console.error("Error Downloading Update: " + message);
        };
      })(this));
      autoUpdater.on('update-downloaded', (function(_this) {
        return function(event, releaseNotes, releaseVersion) {
          _this.releaseNotes = releaseNotes;
          _this.releaseVersion = releaseVersion;
          _this.setState(UPDATE_AVAILABLE_STATE);
          return _this.emitUpdateAvailableEvent.apply(_this, _this.getWindows());
        };
      })(this));
      this.check({
        hidePopups: true
      });
    }

    AutoUpdateManager.prototype.emitUpdateAvailableEvent = function() {
      var atomWindow, windows, _i, _len, _results;
      windows = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (!((this.releaseVersion != null) && this.releaseNotes)) {
        return;
      }
      _results = [];
      for (_i = 0, _len = windows.length; _i < _len; _i++) {
        atomWindow = windows[_i];
        _results.push(atomWindow.sendCommand('window:update-available', [this.releaseVersion, this.releaseNotes]));
      }
      return _results;
    };

    AutoUpdateManager.prototype.setState = function(state) {
      if (this.state === state) {
        return;
      }
      this.state = state;
      return this.emit('state-changed', this.state);
    };

    AutoUpdateManager.prototype.getState = function() {
      return this.state;
    };

    AutoUpdateManager.prototype.check = function(_arg) {
      var hidePopups;
      hidePopups = (_arg != null ? _arg : {}).hidePopups;
      if (!hidePopups) {
        autoUpdater.once('update-not-available', this.onUpdateNotAvailable);
        autoUpdater.once('error', this.onUpdateError);
      }
      return autoUpdater.checkForUpdates();
    };

    AutoUpdateManager.prototype.install = function() {
      return autoUpdater.quitAndInstall();
    };

    AutoUpdateManager.prototype.onUpdateNotAvailable = function() {
      autoUpdater.removeListener('error', this.onUpdateError);
      return dialog.showMessageBox({
        type: 'info',
        buttons: ['OK'],
        message: 'No update available.',
        detail: "Version " + this.version + " is the latest version."
      });
    };

    AutoUpdateManager.prototype.onUpdateError = function(event, message) {
      autoUpdater.removeListener('update-not-available', this.onUpdateNotAvailable);
      return dialog.showMessageBox({
        type: 'warning',
        buttons: ['OK'],
        message: 'There was an error checking for updates.',
        detail: message
      });
    };

    AutoUpdateManager.prototype.getWindows = function() {
      return global.atomApplication.windows;
    };

    return AutoUpdateManager;

  })();

}).call(this);
