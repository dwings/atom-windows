(function() {
  var $, Atom, Model, WindowEventHandler, crypto, deprecated, fs, ipc, os, path, remote, screen, shell, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  crypto = require('crypto');

  ipc = require('ipc');

  os = require('os');

  path = require('path');

  remote = require('remote');

  screen = require('screen');

  shell = require('shell');

  _ = require('underscore-plus');

  deprecated = require('grim').deprecated;

  Model = require('theorist').Model;

  fs = require('fs-plus');

  $ = require('./space-pen-extensions').$;

  WindowEventHandler = require('./window-event-handler');

  module.exports = Atom = (function(_super) {
    __extends(Atom, _super);

    Atom.version = 1;

    Atom.loadOrCreate = function(mode) {
      var _ref;
      return (_ref = this.deserialize(this.loadState(mode))) != null ? _ref : new this({
        mode: mode,
        version: this.version
      });
    };

    Atom.deserialize = function(state) {
      if ((state != null ? state.version : void 0) === this.version) {
        return new this(state);
      }
    };

    Atom.loadState = function(mode) {
      var error, statePath, stateString;
      statePath = this.getStatePath(mode);
      if (fs.existsSync(statePath)) {
        try {
          stateString = fs.readFileSync(statePath, 'utf8');
        } catch (_error) {
          error = _error;
          console.warn("Error reading window state: " + statePath, error.stack, error);
        }
      } else {
        stateString = this.getLoadSettings().windowState;
      }
      try {
        if (stateString != null) {
          return JSON.parse(stateString);
        }
      } catch (_error) {
        error = _error;
        return console.warn("Error parsing window state: " + statePath + " " + error.stack, error);
      }
    };

    Atom.getStatePath = function(mode) {
      var filename, initialPath, sha1;
      switch (mode) {
        case 'spec':
          filename = 'spec';
          break;
        case 'editor':
          initialPath = this.getLoadSettings().initialPath;
          if (initialPath) {
            sha1 = crypto.createHash('sha1').update(initialPath).digest('hex');
            filename = "editor-" + sha1;
          }
      }
      if (filename) {
        return path.join(this.getStorageDirPath(), filename);
      } else {
        return null;
      }
    };

    Atom.getConfigDirPath = function() {
      return this.configDirPath != null ? this.configDirPath : this.configDirPath = fs.absolute('~/.atom');
    };

    Atom.getStorageDirPath = function() {
      return this.storageDirPath != null ? this.storageDirPath : this.storageDirPath = path.join(this.getConfigDirPath(), 'storage');
    };

    Atom.getLoadSettings = function() {
      var cloned;
      if (this.loadSettings == null) {
        this.loadSettings = JSON.parse(decodeURIComponent(location.search.substr(14)));
      }
      cloned = _.deepClone(this.loadSettings);
      cloned.__defineGetter__('windowState', (function(_this) {
        return function() {
          return _this.getCurrentWindow().loadSettings.windowState;
        };
      })(this));
      cloned.__defineSetter__('windowState', (function(_this) {
        return function(value) {
          return _this.getCurrentWindow().loadSettings.windowState = value;
        };
      })(this));
      return cloned;
    };

    Atom.getCurrentWindow = function() {
      return remote.getCurrentWindow();
    };

    Atom.getVersion = function() {
      return this.appVersion != null ? this.appVersion : this.appVersion = this.getLoadSettings().appVersion;
    };

    Atom.isReleasedVersion = function() {
      return !/\w{7}/.test(this.getVersion());
    };

    Atom.prototype.workspaceViewParentSelector = 'body';

    function Atom(state) {
      var DeserializerManager;
      this.state = state;
      this.mode = this.state.mode;
      DeserializerManager = require('./deserializer-manager');
      this.deserializers = new DeserializerManager();
    }

    Atom.prototype.initialize = function() {
      var Clipboard, Config, ContextMenuManager, DisplayBuffer, Editor, KeymapManager, MenuManager, PackageManager, Project, Syntax, TextBuffer, ThemeManager, TokenizedBuffer, configDirPath, devMode, exportsPath, resourcePath, safeMode, _base, _ref, _ref1;
      window.onerror = (function(_this) {
        return function() {
          _this.openDevTools();
          _this.executeJavaScriptInDevTools('InspectorFrontendAPI.showConsole()');
          return _this.emit.apply(_this, ['uncaught-error'].concat(__slice.call(arguments)));
        };
      })(this);
      this.unsubscribe();
      this.setBodyPlatformClass();
      this.loadTime = null;
      Config = require('./config');
      KeymapManager = require('./keymap-extensions');
      PackageManager = require('./package-manager');
      Clipboard = require('./clipboard');
      Syntax = require('./syntax');
      ThemeManager = require('./theme-manager');
      ContextMenuManager = require('./context-menu-manager');
      MenuManager = require('./menu-manager');
      _ref = this.getLoadSettings(), devMode = _ref.devMode, safeMode = _ref.safeMode, resourcePath = _ref.resourcePath;
      configDirPath = this.getConfigDirPath();
      exportsPath = path.join(resourcePath, 'exports');
      require('module').globalPaths.push(exportsPath);
      process.env.NODE_PATH = exportsPath;
      if ((_base = process.env).NODE_ENV == null) {
        _base.NODE_ENV = 'production';
      }
      this.config = new Config({
        configDirPath: configDirPath,
        resourcePath: resourcePath
      });
      this.keymaps = new KeymapManager({
        configDirPath: configDirPath,
        resourcePath: resourcePath
      });
      this.keymap = this.keymaps;
      this.packages = new PackageManager({
        devMode: devMode,
        configDirPath: configDirPath,
        resourcePath: resourcePath,
        safeMode: safeMode
      });
      this.themes = new ThemeManager({
        packageManager: this.packages,
        configDirPath: configDirPath,
        resourcePath: resourcePath
      });
      this.contextMenu = new ContextMenuManager(devMode);
      this.menu = new MenuManager({
        resourcePath: resourcePath
      });
      this.clipboard = new Clipboard();
      this.syntax = (_ref1 = this.deserializers.deserialize(this.state.syntax)) != null ? _ref1 : new Syntax();
      this.subscribe(this.packages, 'activated', (function(_this) {
        return function() {
          return _this.watchThemes();
        };
      })(this));
      Project = require('./project');
      TextBuffer = require('text-buffer');
      this.deserializers.add(TextBuffer);
      TokenizedBuffer = require('./tokenized-buffer');
      DisplayBuffer = require('./display-buffer');
      Editor = require('./editor');
      return this.windowEventHandler = new WindowEventHandler;
    };

    Atom.prototype.registerRepresentationClass = function() {
      return deprecated("Callers should be converted to use atom.deserializers");
    };

    Atom.prototype.registerRepresentationClasses = function() {
      return deprecated("Callers should be converted to use atom.deserializers");
    };

    Atom.prototype.setBodyPlatformClass = function() {
      return document.body.classList.add("platform-" + process.platform);
    };

    Atom.prototype.getCurrentWindow = function() {
      return this.constructor.getCurrentWindow();
    };

    Atom.prototype.getWindowDimensions = function() {
      var browserWindow, height, width, x, y, _ref, _ref1;
      browserWindow = this.getCurrentWindow();
      _ref = browserWindow.getPosition(), x = _ref[0], y = _ref[1];
      _ref1 = browserWindow.getSize(), width = _ref1[0], height = _ref1[1];
      return {
        x: x,
        y: y,
        width: width,
        height: height
      };
    };

    Atom.prototype.setWindowDimensions = function(_arg) {
      var height, width, x, y;
      x = _arg.x, y = _arg.y, width = _arg.width, height = _arg.height;
      if ((width != null) && (height != null)) {
        this.setSize(width, height);
      }
      if ((x != null) && (y != null)) {
        return this.setPosition(x, y);
      } else {
        return this.center();
      }
    };

    Atom.prototype.storeDefaultWindowDimensions = function() {
      var dimensions;
      dimensions = JSON.stringify(atom.getWindowDimensions());
      return localStorage.setItem("defaultWindowDimensions", dimensions);
    };

    Atom.prototype.getDefaultWindowDimensions = function() {
      var dimensions, error, height, width, windowDimensions, _ref;
      windowDimensions = this.getLoadSettings().windowDimensions;
      if (windowDimensions != null) {
        return windowDimensions;
      }
      dimensions = null;
      try {
        dimensions = JSON.parse(localStorage.getItem("defaultWindowDimensions"));
      } catch (_error) {
        error = _error;
        console.warn("Error parsing default window dimensions", error);
        localStorage.removeItem("defaultWindowDimensions");
      }
      _ref = screen.getPrimaryDisplay().workAreaSize, width = _ref.width, height = _ref.height;
      return dimensions != null ? dimensions : {
        x: 0,
        y: 0,
        width: Math.min(1024, width),
        height: height
      };
    };

    Atom.prototype.restoreWindowDimensions = function() {
      var windowDimensions, _ref;
      windowDimensions = (_ref = this.state.windowDimensions) != null ? _ref : this.getDefaultWindowDimensions();
      return this.setWindowDimensions(windowDimensions);
    };

    Atom.prototype.storeWindowDimensions = function() {
      return this.state.windowDimensions = this.getWindowDimensions();
    };

    Atom.prototype.getLoadSettings = function() {
      return this.constructor.getLoadSettings();
    };

    Atom.prototype.deserializeProject = function() {
      var Project, _ref;
      Project = require('./project');
      return this.project != null ? this.project : this.project = (_ref = this.deserializers.deserialize(this.state.project)) != null ? _ref : new Project({
        path: this.getLoadSettings().initialPath
      });
    };

    Atom.prototype.deserializeWorkspaceView = function() {
      var Workspace, WorkspaceView, _ref;
      Workspace = require('./workspace');
      WorkspaceView = require('./workspace-view');
      this.workspace = (_ref = Workspace.deserialize(this.state.workspace)) != null ? _ref : new Workspace;
      this.workspaceView = new WorkspaceView(this.workspace);
      this.keymaps.defaultTarget = this.workspaceView[0];
      return $(this.workspaceViewParentSelector).append(this.workspaceView);
    };

    Atom.prototype.deserializePackageStates = function() {
      var _ref;
      this.packages.packageStates = (_ref = this.state.packageStates) != null ? _ref : {};
      return delete this.state.packageStates;
    };

    Atom.prototype.deserializeEditorWindow = function() {
      this.deserializePackageStates();
      this.deserializeProject();
      return this.deserializeWorkspaceView();
    };

    Atom.prototype.startEditorWindow = function() {
      var CommandInstaller, resourcePath;
      CommandInstaller = require('./command-installer');
      resourcePath = atom.getLoadSettings().resourcePath;
      CommandInstaller.installAtomCommand(resourcePath, false, function(error) {
        if (error != null) {
          return console.warn(error.message);
        }
      });
      CommandInstaller.installApmCommand(resourcePath, false, function(error) {
        if (error != null) {
          return console.warn(error.message);
        }
      });
      this.restoreWindowDimensions();
      this.config.load();
      this.config.setDefaults('core', require('./workspace-view').configDefaults);
      this.config.setDefaults('editor', require('./editor-view').configDefaults);
      this.keymaps.loadBundledKeymaps();
      this.themes.loadBaseStylesheets();
      this.packages.loadPackages();
      this.deserializeEditorWindow();
      this.packages.activate();
      this.keymaps.loadUserKeymap();
      this.requireUserInitScript();
      this.menu.update();
      $(window).on('unload', (function(_this) {
        return function() {
          $(document.body).css('visibility', 'hidden');
          _this.unloadEditorWindow();
          return false;
        };
      })(this));
      return this.displayWindow();
    };

    Atom.prototype.unloadEditorWindow = function() {
      var _ref;
      if (!this.project && !this.workspaceView) {
        return;
      }
      this.state.syntax = this.syntax.serialize();
      this.state.project = this.project.serialize();
      this.state.workspace = this.workspace.serialize();
      this.packages.deactivatePackages();
      this.state.packageStates = this.packages.packageStates;
      this.saveSync();
      this.workspaceView.remove();
      this.workspaceView = null;
      this.project.destroy();
      if ((_ref = this.windowEventHandler) != null) {
        _ref.unsubscribe();
      }
      this.keymaps.destroy();
      return this.windowState = null;
    };

    Atom.prototype.loadThemes = function() {
      return this.themes.load();
    };

    Atom.prototype.watchThemes = function() {
      return this.themes.on('reloaded', (function(_this) {
        return function() {
          var pack, _i, _len, _ref;
          _ref = _this.packages.getActivePackages();
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            pack = _ref[_i];
            if (pack.getType() !== 'theme') {
              if (typeof pack.reloadStylesheets === "function") {
                pack.reloadStylesheets();
              }
            }
          }
          return null;
        };
      })(this));
    };

    Atom.prototype.open = function(options) {
      return ipc.send('open', options);
    };

    Atom.prototype.confirm = function(_arg) {
      var buttonLabels, buttons, callback, chosen, detailedMessage, dialog, message, _ref;
      _ref = _arg != null ? _arg : {}, message = _ref.message, detailedMessage = _ref.detailedMessage, buttons = _ref.buttons;
      if (buttons == null) {
        buttons = {};
      }
      if (_.isArray(buttons)) {
        buttonLabels = buttons;
      } else {
        buttonLabels = Object.keys(buttons);
      }
      dialog = remote.require('dialog');
      chosen = dialog.showMessageBox(this.getCurrentWindow(), {
        type: 'info',
        message: message,
        detail: detailedMessage,
        buttons: buttonLabels
      });
      if (_.isArray(buttons)) {
        return chosen;
      } else {
        callback = buttons[buttonLabels[chosen]];
        return typeof callback === "function" ? callback() : void 0;
      }
    };

    Atom.prototype.showSaveDialog = function(callback) {
      return callback(showSaveDialogSync());
    };

    Atom.prototype.showSaveDialogSync = function(defaultPath) {
      var currentWindow, dialog, _ref;
      if (defaultPath == null) {
        defaultPath = (_ref = this.project) != null ? _ref.getPath() : void 0;
      }
      currentWindow = this.getCurrentWindow();
      dialog = remote.require('dialog');
      return dialog.showSaveDialog(currentWindow, {
        title: 'Save File',
        defaultPath: defaultPath
      });
    };

    Atom.prototype.openDevTools = function() {
      return ipc.send('call-window-method', 'openDevTools');
    };

    Atom.prototype.toggleDevTools = function() {
      return ipc.send('call-window-method', 'toggleDevTools');
    };

    Atom.prototype.executeJavaScriptInDevTools = function(code) {
      return ipc.send('call-window-method', 'executeJavaScriptInDevTools', code);
    };

    Atom.prototype.reload = function() {
      return ipc.send('call-window-method', 'restart');
    };

    Atom.prototype.focus = function() {
      ipc.send('call-window-method', 'focus');
      return $(window).focus();
    };

    Atom.prototype.show = function() {
      return ipc.send('call-window-method', 'show');
    };

    Atom.prototype.hide = function() {
      return ipc.send('call-window-method', 'hide');
    };

    Atom.prototype.setSize = function(width, height) {
      return ipc.send('call-window-method', 'setSize', width, height);
    };

    Atom.prototype.setPosition = function(x, y) {
      return ipc.send('call-window-method', 'setPosition', x, y);
    };

    Atom.prototype.center = function() {
      return ipc.send('call-window-method', 'center');
    };

    Atom.prototype.displayWindow = function() {
      return setImmediate((function(_this) {
        return function() {
          _this.show();
          _this.focus();
          if (_this.workspaceView.fullScreen) {
            return _this.setFullScreen(true);
          }
        };
      })(this));
    };

    Atom.prototype.close = function() {
      return this.getCurrentWindow().close();
    };

    Atom.prototype.exit = function(status) {
      var app;
      app = remote.require('app');
      app.emit('will-exit');
      return remote.process.exit(status);
    };

    Atom.prototype.inDevMode = function() {
      return this.getLoadSettings().devMode;
    };

    Atom.prototype.inSpecMode = function() {
      return this.getLoadSettings().isSpec;
    };

    Atom.prototype.toggleFullScreen = function() {
      return this.setFullScreen(!this.isFullScreen());
    };

    Atom.prototype.setFullScreen = function(fullScreen) {
      if (fullScreen == null) {
        fullScreen = false;
      }
      ipc.send('call-window-method', 'setFullScreen', fullScreen);
      if (fullScreen) {
        return document.body.classList.add("fullscreen");
      } else {
        return document.body.classList.remove("fullscreen");
      }
    };

    Atom.prototype.isFullScreen = function() {
      return this.getCurrentWindow().isFullScreen();
    };

    Atom.prototype.getVersion = function() {
      return this.constructor.getVersion();
    };

    Atom.prototype.isReleasedVersion = function() {
      return this.constructor.isReleasedVersion();
    };

    Atom.prototype.getConfigDirPath = function() {
      return this.constructor.getConfigDirPath();
    };

    Atom.prototype.saveSync = function() {
      var statePath, stateString;
      stateString = JSON.stringify(this.state);
      if (statePath = this.constructor.getStatePath(this.mode)) {
        return fs.writeFileSync(statePath, stateString, 'utf8');
      } else {
        return this.getCurrentWindow().loadSettings.windowState = stateString;
      }
    };

    Atom.prototype.getWindowLoadTime = function() {
      return this.loadTime;
    };

    Atom.prototype.crashMainProcess = function() {
      return remote.process.crash();
    };

    Atom.prototype.crashRenderProcess = function() {
      return process.crash();
    };

    Atom.prototype.beep = function() {
      if (this.config.get('core.audioBeep')) {
        shell.beep();
      }
      return this.workspaceView.trigger('beep');
    };

    Atom.prototype.getUserInitScriptPath = function() {
      var initScriptPath;
      initScriptPath = fs.resolve(this.getConfigDirPath(), 'init', ['js', 'coffee']);
      return initScriptPath != null ? initScriptPath : path.join(this.getConfigDirPath(), 'init.coffee');
    };

    Atom.prototype.requireUserInitScript = function() {
      var error, userInitScriptPath;
      if (userInitScriptPath = this.getUserInitScriptPath()) {
        try {
          if (fs.isFileSync(userInitScriptPath)) {
            return require(userInitScriptPath);
          }
        } catch (_error) {
          error = _error;
          return console.error("Failed to load `" + userInitScriptPath + "`", error.stack, error);
        }
      }
    };

    Atom.prototype.requireWithGlobals = function(id, globals) {
      var existingGlobals, key, value, _results;
      if (globals == null) {
        globals = {};
      }
      existingGlobals = {};
      for (key in globals) {
        value = globals[key];
        existingGlobals[key] = window[key];
        window[key] = value;
      }
      require(id);
      _results = [];
      for (key in existingGlobals) {
        value = existingGlobals[key];
        if (value === void 0) {
          _results.push(delete window[key]);
        } else {
          _results.push(window[key] = value);
        }
      }
      return _results;
    };

    return Atom;

  })(Model);

}).call(this);
