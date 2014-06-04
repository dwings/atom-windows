(function() {
  var AtomWindow, BrowserWindow, ContextMenu, EventEmitter, app, dialog, fs, path, url, _,
    __slice = [].slice;

  BrowserWindow = require('browser-window');

  ContextMenu = require('./context-menu');

  app = require('app');

  dialog = require('dialog');

  path = require('path');

  fs = require('fs');

  url = require('url');

  _ = require('underscore-plus');

  EventEmitter = require('events').EventEmitter;

  module.exports = AtomWindow = (function() {
    _.extend(AtomWindow.prototype, EventEmitter.prototype);

    AtomWindow.iconPath = path.resolve(__dirname, '..', '..', 'resources', 'atom.png');

    AtomWindow.includeShellLoadTime = true;

    AtomWindow.prototype.browserWindow = null;

    AtomWindow.prototype.loaded = null;

    AtomWindow.prototype.isSpec = null;

    function AtomWindow(settings) {
      var initialColumn, initialLine, loadSettings, pathToOpen, _base;
      if (settings == null) {
        settings = {};
      }
      this.resourcePath = settings.resourcePath, pathToOpen = settings.pathToOpen, initialLine = settings.initialLine, initialColumn = settings.initialColumn, this.isSpec = settings.isSpec, this.exitWhenDone = settings.exitWhenDone;
      global.atomApplication.addWindow(this);
      this.browserWindow = new BrowserWindow({
        show: false,
        title: 'Atom',
        icon: this.constructor.iconPath
      });
      this.handleEvents();
      loadSettings = _.extend({}, settings);
      if (loadSettings.windowState == null) {
        loadSettings.windowState = '{}';
      }
      loadSettings.appVersion = app.getVersion();
      if (this.constructor.includeShellLoadTime && !this.isSpec) {
        this.constructor.includeShellLoadTime = false;
        if (loadSettings.shellLoadTime == null) {
          loadSettings.shellLoadTime = Date.now() - global.shellStartTime;
        }
      }
      loadSettings.initialPath = pathToOpen;
      if (typeof (_base = fs.statSyncNoException(pathToOpen)).isFile === "function" ? _base.isFile() : void 0) {
        loadSettings.initialPath = path.dirname(pathToOpen);
      }
      this.browserWindow.loadSettings = loadSettings;
      this.browserWindow.once('window:loaded', (function(_this) {
        return function() {
          _this.emit('window:loaded');
          return _this.loaded = true;
        };
      })(this));
      this.browserWindow.loadUrl(this.getUrl(loadSettings));
      if (this.isSpec) {
        this.browserWindow.focusOnWebView();
      }
      this.openPath(pathToOpen, initialLine, initialColumn);
    }

    AtomWindow.prototype.getUrl = function(loadSettingsObj) {
      var loadSettings;
      loadSettings = _.clone(loadSettingsObj);
      delete loadSettings['windowState'];
      return url.format({
        protocol: 'file',
        pathname: "" + this.resourcePath + "/static/index.html",
        slashes: true,
        query: {
          loadSettings: JSON.stringify(loadSettings)
        }
      });
    };

    AtomWindow.prototype.getInitialPath = function() {
      return this.browserWindow.loadSettings.initialPath;
    };

    AtomWindow.prototype.containsPath = function(pathToCheck) {
      var initialPath, _base;
      initialPath = this.getInitialPath();
      if (!initialPath) {
        return false;
      } else if (!pathToCheck) {
        return false;
      } else if (pathToCheck === initialPath) {
        return true;
      } else if (typeof (_base = fs.statSyncNoException(pathToCheck)).isDirectory === "function" ? _base.isDirectory() : void 0) {
        return false;
      } else if (pathToCheck.indexOf(path.join(initialPath, path.sep)) === 0) {
        return true;
      } else {
        return false;
      }
    };

    AtomWindow.prototype.handleEvents = function() {
      this.browserWindow.on('closed', (function(_this) {
        return function() {
          return global.atomApplication.removeWindow(_this);
        };
      })(this));
      this.browserWindow.on('unresponsive', (function(_this) {
        return function() {
          var chosen;
          if (_this.isSpec) {
            return;
          }
          chosen = dialog.showMessageBox(_this.browserWindow, {
            type: 'warning',
            buttons: ['Close', 'Keep Waiting'],
            message: 'Editor is not responding',
            detail: 'The editor is not responding. Would you like to force close it or just keep waiting?'
          });
          if (chosen === 0) {
            return _this.browserWindow.destroy();
          }
        };
      })(this));
      this.browserWindow.webContents.on('crashed', (function(_this) {
        return function() {
          var chosen;
          if (_this.exitWhenDone) {
            global.atomApplication.exit(100);
          }
          chosen = dialog.showMessageBox(_this.browserWindow, {
            type: 'warning',
            buttons: ['Close Window', 'Reload', 'Keep It Open'],
            message: 'The editor has crashed',
            detail: 'Please report this issue to atom@github.com'
          });
          switch (chosen) {
            case 0:
              return _this.browserWindow.destroy();
            case 1:
              return _this.browserWindow.restart();
          }
        };
      })(this));
      this.browserWindow.on('context-menu', (function(_this) {
        return function(menuTemplate) {
          return new ContextMenu(menuTemplate, _this);
        };
      })(this));
      if (this.isSpec) {
        return this.browserWindow.on('blur', (function(_this) {
          return function() {
            return _this.browserWindow.focusOnWebView();
          };
        })(this));
      }
    };

    AtomWindow.prototype.openPath = function(pathToOpen, initialLine, initialColumn) {
      if (this.loaded) {
        this.focus();
        return this.sendCommand('window:open-path', {
          pathToOpen: pathToOpen,
          initialLine: initialLine,
          initialColumn: initialColumn
        });
      } else {
        return this.browserWindow.once('window:loaded', (function(_this) {
          return function() {
            return _this.openPath(pathToOpen, initialLine, initialColumn);
          };
        })(this));
      }
    };

    AtomWindow.prototype.sendCommand = function() {
      var args, command;
      command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (this.isSpecWindow()) {
        if (!global.atomApplication.sendCommandToFirstResponder(command)) {
          switch (command) {
            case 'window:reload':
              return this.reload();
            case 'window:toggle-dev-tools':
              return this.toggleDevTools();
            case 'window:close':
              return this.close();
          }
        }
      } else if (this.isWebViewFocused()) {
        return this.sendCommandToBrowserWindow.apply(this, [command].concat(__slice.call(args)));
      } else {
        if (!global.atomApplication.sendCommandToFirstResponder(command)) {
          return this.sendCommandToBrowserWindow.apply(this, [command].concat(__slice.call(args)));
        }
      }
    };

    AtomWindow.prototype.sendCommandToBrowserWindow = function() {
      var action, args, command, _ref, _ref1;
      command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      action = ((_ref = args[0]) != null ? _ref.contextCommand : void 0) ? 'context-command' : 'command';
      return (_ref1 = this.browserWindow.webContents).send.apply(_ref1, [action, command].concat(__slice.call(args)));
    };

    AtomWindow.prototype.getDimensions = function() {
      var height, width, x, y, _ref, _ref1;
      _ref = this.browserWindow.getPosition(), x = _ref[0], y = _ref[1];
      _ref1 = this.browserWindow.getSize(), width = _ref1[0], height = _ref1[1];
      return {
        x: x,
        y: y,
        width: width,
        height: height
      };
    };

    AtomWindow.prototype.close = function() {
      return this.browserWindow.close();
    };

    AtomWindow.prototype.focus = function() {
      return this.browserWindow.focus();
    };

    AtomWindow.prototype.minimize = function() {
      return this.browserWindow.minimize();
    };

    AtomWindow.prototype.maximize = function() {
      return this.browserWindow.maximize();
    };

    AtomWindow.prototype.restore = function() {
      return this.browserWindow.restore();
    };

    AtomWindow.prototype.handlesAtomCommands = function() {
      return !this.isSpecWindow() && this.isWebViewFocused();
    };

    AtomWindow.prototype.isFocused = function() {
      return this.browserWindow.isFocused();
    };

    AtomWindow.prototype.isWebViewFocused = function() {
      return this.browserWindow.isWebViewFocused();
    };

    AtomWindow.prototype.isSpecWindow = function() {
      return this.isSpec;
    };

    AtomWindow.prototype.reload = function() {
      return this.browserWindow.restart();
    };

    AtomWindow.prototype.toggleDevTools = function() {
      return this.browserWindow.toggleDevTools();
    };

    return AtomWindow;

  })();

}).call(this);
