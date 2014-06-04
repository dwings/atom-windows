(function() {
  var ApplicationMenu, AtomApplication, AtomProtocolHandler, AtomWindow, AutoUpdateManager, BrowserWindow, EventEmitter, Menu, app, dialog, fs, ipc, net, os, path, shell, socketPath, url, _,
    __slice = [].slice;

  AtomWindow = require('./atom-window');

  ApplicationMenu = require('./application-menu');

  AtomProtocolHandler = require('./atom-protocol-handler');

  AutoUpdateManager = require('./auto-update-manager');

  BrowserWindow = require('browser-window');

  Menu = require('menu');

  app = require('app');

  dialog = require('dialog');

  fs = require('fs');

  ipc = require('ipc');

  path = require('path');

  os = require('os');

  net = require('net');

  shell = require('shell');

  url = require('url');

  EventEmitter = require('events').EventEmitter;

  _ = require('underscore-plus');

  socketPath = process.platform === 'win32' ? '\\\\.\\pipe\\atom-sock' : path.join(os.tmpdir(), 'atom.sock');

  module.exports = AtomApplication = (function() {
    _.extend(AtomApplication.prototype, EventEmitter.prototype);

    AtomApplication.open = function(options) {
      var client, createAtomApplication;
      createAtomApplication = function() {
        return new AtomApplication(options);
      };
      if ((process.platform !== 'win32' && !fs.existsSync(socketPath)) || options.test) {
        createAtomApplication();
        return;
      }
      client = net.connect({
        path: socketPath
      }, function() {
        return client.write(JSON.stringify(options), function() {
          client.end();
          return app.terminate();
        });
      });
      return client.on('error', createAtomApplication);
    };

    AtomApplication.prototype.windows = null;

    AtomApplication.prototype.applicationMenu = null;

    AtomApplication.prototype.atomProtocolHandler = null;

    AtomApplication.prototype.resourcePath = null;

    AtomApplication.prototype.version = null;

    AtomApplication.prototype.exit = function(status) {
      return app.exit(status);
    };

    function AtomApplication(options) {
      this.resourcePath = options.resourcePath, this.version = options.version, this.devMode = options.devMode, this.safeMode = options.safeMode;
      global.atomApplication = this;
      this.pidsToOpenWindows = {};
      if (this.pathsToOpen == null) {
        this.pathsToOpen = [];
      }
      this.windows = [];
      this.autoUpdateManager = new AutoUpdateManager(this.version);
      this.applicationMenu = new ApplicationMenu(this.version);
      this.atomProtocolHandler = new AtomProtocolHandler(this.resourcePath);
      this.listenForArgumentsFromNewProcess();
      this.setupJavaScriptArguments();
      this.handleEvents();
      this.openWithOptions(options);
    }

    AtomApplication.prototype.openWithOptions = function(_arg) {
      var devMode, logFile, newWindow, pathsToOpen, pidToKillWhenClosed, safeMode, specDirectory, test, urlToOpen, urlsToOpen, _i, _len, _results;
      pathsToOpen = _arg.pathsToOpen, urlsToOpen = _arg.urlsToOpen, test = _arg.test, pidToKillWhenClosed = _arg.pidToKillWhenClosed, devMode = _arg.devMode, safeMode = _arg.safeMode, newWindow = _arg.newWindow, specDirectory = _arg.specDirectory, logFile = _arg.logFile;
      if (test) {
        return this.runSpecs({
          exitWhenDone: true,
          resourcePath: this.resourcePath,
          specDirectory: specDirectory,
          logFile: logFile
        });
      } else if (pathsToOpen.length > 0) {
        return this.openPaths({
          pathsToOpen: pathsToOpen,
          pidToKillWhenClosed: pidToKillWhenClosed,
          newWindow: newWindow,
          devMode: devMode,
          safeMode: safeMode
        });
      } else if (urlsToOpen.length > 0) {
        _results = [];
        for (_i = 0, _len = urlsToOpen.length; _i < _len; _i++) {
          urlToOpen = urlsToOpen[_i];
          _results.push(this.openUrl({
            urlToOpen: urlToOpen,
            devMode: devMode,
            safeMode: safeMode
          }));
        }
        return _results;
      } else {
        return this.openPath({
          pidToKillWhenClosed: pidToKillWhenClosed,
          newWindow: newWindow,
          devMode: devMode,
          safeMode: safeMode
        });
      }
    };

    AtomApplication.prototype.removeWindow = function(window) {
      var _ref;
      this.windows.splice(this.windows.indexOf(window), 1);
      if (this.windows.length === 0) {
        return (_ref = this.applicationMenu) != null ? _ref.enableWindowSpecificItems(false) : void 0;
      }
    };

    AtomApplication.prototype.addWindow = function(window) {
      var _ref;
      this.windows.push(window);
      if ((_ref = this.applicationMenu) != null) {
        _ref.enableWindowSpecificItems(true);
      }
      return window.once('window:loaded', (function(_this) {
        return function() {
          return _this.autoUpdateManager.emitUpdateAvailableEvent(window);
        };
      })(this));
    };

    AtomApplication.prototype.listenForArgumentsFromNewProcess = function() {
      var server;
      this.deleteSocketFile();
      server = net.createServer((function(_this) {
        return function(connection) {
          return connection.on('data', function(data) {
            return _this.openWithOptions(JSON.parse(data));
          });
        };
      })(this));
      server.listen(socketPath);
      return server.on('error', function(error) {
        return console.error('Application server failed', error);
      });
    };

    AtomApplication.prototype.deleteSocketFile = function() {
      var error;
      if (process.platform === 'win32') {
        return;
      }
      if (fs.existsSync(socketPath)) {
        try {
          return fs.unlinkSync(socketPath);
        } catch (_error) {
          error = _error;
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
    };

    AtomApplication.prototype.setupJavaScriptArguments = function() {
      return app.commandLine.appendSwitch('js-flags', '--harmony');
    };

    AtomApplication.prototype.handleEvents = function() {
      this.on('application:run-all-specs', function() {
        return this.runSpecs({
          exitWhenDone: false,
          resourcePath: global.devResourcePath
        });
      });
      this.on('application:run-benchmarks', function() {
        return this.runBenchmarks();
      });
      this.on('application:quit', function() {
        return app.quit();
      });
      this.on('application:new-window', function() {
        var _ref;
        return this.openPath({
          windowDimensions: (_ref = this.focusedWindow()) != null ? _ref.getDimensions() : void 0
        });
      });
      this.on('application:new-file', function() {
        var _ref;
        return ((_ref = this.focusedWindow()) != null ? _ref : this).openPath();
      });
      this.on('application:open', function() {
        return this.promptForPath({
          type: 'all'
        });
      });
      this.on('application:open-file', function() {
        return this.promptForPath({
          type: 'file'
        });
      });
      this.on('application:open-folder', function() {
        return this.promptForPath({
          type: 'folder'
        });
      });
      this.on('application:open-dev', function() {
        return this.promptForPath({
          devMode: true
        });
      });
      this.on('application:open-safe', function() {
        return this.promptForPath({
          safeMode: true
        });
      });
      this.on('application:inspect', function(_arg) {
        var atomWindow, x, y;
        x = _arg.x, y = _arg.y, atomWindow = _arg.atomWindow;
        if (atomWindow == null) {
          atomWindow = this.focusedWindow();
        }
        return atomWindow != null ? atomWindow.browserWindow.inspectElement(x, y) : void 0;
      });
      this.on('application:open-documentation', function() {
        return shell.openExternal('https://atom.io/docs/latest/?app');
      });
      this.on('application:open-terms-of-use', function() {
        return shell.openExternal('https://atom.io/terms');
      });
      this.on('application:install-update', function() {
        return this.autoUpdateManager.install();
      });
      this.on('application:check-for-update', (function(_this) {
        return function() {
          return _this.autoUpdateManager.check();
        };
      })(this));
      if (process.platform === 'darwin') {
        this.on('application:about', function() {
          return Menu.sendActionToFirstResponder('orderFrontStandardAboutPanel:');
        });
        this.on('application:bring-all-windows-to-front', function() {
          return Menu.sendActionToFirstResponder('arrangeInFront:');
        });
        this.on('application:hide', function() {
          return Menu.sendActionToFirstResponder('hide:');
        });
        this.on('application:hide-other-applications', function() {
          return Menu.sendActionToFirstResponder('hideOtherApplications:');
        });
        this.on('application:minimize', function() {
          return Menu.sendActionToFirstResponder('performMiniaturize:');
        });
        this.on('application:unhide-all-applications', function() {
          return Menu.sendActionToFirstResponder('unhideAllApplications:');
        });
        this.on('application:zoom', function() {
          return Menu.sendActionToFirstResponder('zoom:');
        });
      } else {
        this.on('application:minimize', function() {
          var _ref;
          return (_ref = this.focusedWindow()) != null ? _ref.minimize() : void 0;
        });
        this.on('application:zoom', function() {
          var _ref;
          return (_ref = this.focusedWindow()) != null ? _ref.maximize() : void 0;
        });
      }
      this.openPathOnEvent('application:show-settings', 'atom://config');
      this.openPathOnEvent('application:open-your-config', 'atom://.atom/config');
      this.openPathOnEvent('application:open-your-init-script', 'atom://.atom/init-script');
      this.openPathOnEvent('application:open-your-keymap', 'atom://.atom/keymap');
      this.openPathOnEvent('application:open-your-snippets', 'atom://.atom/snippets');
      this.openPathOnEvent('application:open-your-stylesheet', 'atom://.atom/stylesheet');
      this.openPathOnEvent('application:open-license', path.join(this.resourcePath, 'LICENSE.md'));
      app.on('window-all-closed', function() {
        var _ref;
        if ((_ref = process.platform) === 'win32' || _ref === 'linux') {
          return app.quit();
        }
      });
      app.on('will-quit', (function(_this) {
        return function() {
          _this.killAllProcesses();
          return _this.deleteSocketFile();
        };
      })(this));
      app.on('will-exit', (function(_this) {
        return function() {
          _this.killAllProcesses();
          return _this.deleteSocketFile();
        };
      })(this));
      app.on('open-file', (function(_this) {
        return function(event, pathToOpen) {
          event.preventDefault();
          return _this.openPath({
            pathToOpen: pathToOpen
          });
        };
      })(this));
      app.on('open-url', (function(_this) {
        return function(event, urlToOpen) {
          event.preventDefault();
          return _this.openUrl({
            urlToOpen: urlToOpen,
            devMode: _this.devMode,
            safeMode: _this.safeMode
          });
        };
      })(this));
      app.on('activate-with-no-open-windows', (function(_this) {
        return function(event) {
          event.preventDefault();
          return _this.emit('application:new-window');
        };
      })(this));
      ipc.on('open', (function(_this) {
        return function(event, options) {
          var _ref;
          if (options != null) {
            if (((_ref = options.pathsToOpen) != null ? _ref.length : void 0) > 0) {
              return _this.openPaths(options);
            } else {
              return new AtomWindow(options);
            }
          } else {
            return _this.promptForPath();
          }
        };
      })(this));
      ipc.on('update-application-menu', (function(_this) {
        return function(event, template, keystrokesByCommand) {
          return _this.applicationMenu.update(template, keystrokesByCommand);
        };
      })(this));
      ipc.on('run-package-specs', (function(_this) {
        return function(event, specDirectory) {
          return _this.runSpecs({
            resourcePath: global.devResourcePath,
            specDirectory: specDirectory,
            exitWhenDone: false
          });
        };
      })(this));
      ipc.on('command', (function(_this) {
        return function(event, command) {
          return _this.emit(command);
        };
      })(this));
      ipc.on('window-command', function() {
        var args, command, event, win;
        event = arguments[0], command = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
        win = BrowserWindow.fromWebContents(event.sender);
        return win.emit.apply(win, [command].concat(__slice.call(args)));
      });
      return ipc.on('call-window-method', function() {
        var args, event, method, win;
        event = arguments[0], method = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
        win = BrowserWindow.fromWebContents(event.sender);
        return win[method].apply(win, args);
      });
    };

    AtomApplication.prototype.sendCommand = function() {
      var args, command, focusedWindow;
      command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      if (!this.emit.apply(this, [command].concat(__slice.call(args)))) {
        focusedWindow = this.focusedWindow();
        if (focusedWindow != null) {
          return focusedWindow.sendCommand.apply(focusedWindow, [command].concat(__slice.call(args)));
        } else {
          return this.sendCommandToFirstResponder(command);
        }
      }
    };

    AtomApplication.prototype.sendCommandToWindow = function() {
      var args, atomWindow, command;
      command = arguments[0], atomWindow = arguments[1], args = 3 <= arguments.length ? __slice.call(arguments, 2) : [];
      if (!this.emit.apply(this, [command].concat(__slice.call(args)))) {
        if (atomWindow != null) {
          return atomWindow.sendCommand.apply(atomWindow, [command].concat(__slice.call(args)));
        } else {
          return this.sendCommandToFirstResponder(command);
        }
      }
    };

    AtomApplication.prototype.sendCommandToFirstResponder = function(command) {
      if (process.platform !== 'darwin') {
        return false;
      }
      switch (command) {
        case 'core:undo':
          Menu.sendActionToFirstResponder('undo:');
          break;
        case 'core:redo':
          Menu.sendActionToFirstResponder('redo:');
          break;
        case 'core:copy':
          Menu.sendActionToFirstResponder('copy:');
          break;
        case 'core:cut':
          Menu.sendActionToFirstResponder('cut:');
          break;
        case 'core:paste':
          Menu.sendActionToFirstResponder('paste:');
          break;
        case 'core:select-all':
          Menu.sendActionToFirstResponder('selectAll:');
          break;
        default:
          return false;
      }
      return true;
    };

    AtomApplication.prototype.openPathOnEvent = function(eventName, pathToOpen) {
      return this.on(eventName, function() {
        var window;
        if (window = this.focusedWindow()) {
          return window.openPath(pathToOpen);
        } else {
          return this.openPath({
            pathToOpen: pathToOpen
          });
        }
      });
    };

    AtomApplication.prototype.windowForPath = function(pathToOpen) {
      var atomWindow, _i, _len, _ref;
      _ref = this.windows;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        atomWindow = _ref[_i];
        if (atomWindow.containsPath(pathToOpen)) {
          return atomWindow;
        }
      }
    };

    AtomApplication.prototype.focusedWindow = function() {
      return _.find(this.windows, function(atomWindow) {
        return atomWindow.isFocused();
      });
    };

    AtomApplication.prototype.openPaths = function(_arg) {
      var devMode, newWindow, pathToOpen, pathsToOpen, pidToKillWhenClosed, safeMode, _i, _len, _ref, _results;
      pathsToOpen = _arg.pathsToOpen, pidToKillWhenClosed = _arg.pidToKillWhenClosed, newWindow = _arg.newWindow, devMode = _arg.devMode, safeMode = _arg.safeMode;
      _ref = pathsToOpen != null ? pathsToOpen : [];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pathToOpen = _ref[_i];
        _results.push(this.openPath({
          pathToOpen: pathToOpen,
          pidToKillWhenClosed: pidToKillWhenClosed,
          newWindow: newWindow,
          devMode: devMode,
          safeMode: safeMode
        }));
      }
      return _results;
    };

    AtomApplication.prototype.openPath = function(_arg) {
      var bootstrapScript, devMode, existingWindow, initialColumn, initialLine, newWindow, openedWindow, pathToOpen, pidToKillWhenClosed, resourcePath, safeMode, windowDimensions, _ref, _ref1;
      _ref = _arg != null ? _arg : {}, pathToOpen = _ref.pathToOpen, pidToKillWhenClosed = _ref.pidToKillWhenClosed, newWindow = _ref.newWindow, devMode = _ref.devMode, safeMode = _ref.safeMode, windowDimensions = _ref.windowDimensions;
      _ref1 = this.locationForPathToOpen(pathToOpen), pathToOpen = _ref1.pathToOpen, initialLine = _ref1.initialLine, initialColumn = _ref1.initialColumn;
      if (!devMode) {
        if (!(pidToKillWhenClosed || newWindow)) {
          existingWindow = this.windowForPath(pathToOpen);
        }
      }
      if (existingWindow) {
        openedWindow = existingWindow;
        openedWindow.openPath(pathToOpen, initialLine);
        openedWindow.restore();
      } else {
        if (devMode) {
          try {
            bootstrapScript = require.resolve(path.join(global.devResourcePath, 'src', 'window-bootstrap'));
            resourcePath = global.devResourcePath;
          } catch (_error) {}
        }
        if (bootstrapScript == null) {
          bootstrapScript = require.resolve('../window-bootstrap');
        }
        if (resourcePath == null) {
          resourcePath = this.resourcePath;
        }
        openedWindow = new AtomWindow({
          pathToOpen: pathToOpen,
          initialLine: initialLine,
          initialColumn: initialColumn,
          bootstrapScript: bootstrapScript,
          resourcePath: resourcePath,
          devMode: devMode,
          safeMode: safeMode,
          windowDimensions: windowDimensions
        });
      }
      if (pidToKillWhenClosed != null) {
        this.pidsToOpenWindows[pidToKillWhenClosed] = openedWindow;
      }
      return openedWindow.browserWindow.on('closed', (function(_this) {
        return function() {
          return _this.killProcessForWindow(openedWindow);
        };
      })(this));
    };

    AtomApplication.prototype.killAllProcesses = function() {
      var pid, _results;
      _results = [];
      for (pid in this.pidsToOpenWindows) {
        _results.push(this.killProcess(pid));
      }
      return _results;
    };

    AtomApplication.prototype.killProcessForWindow = function(openedWindow) {
      var pid, trackedWindow, _ref, _results;
      _ref = this.pidsToOpenWindows;
      _results = [];
      for (pid in _ref) {
        trackedWindow = _ref[pid];
        if (trackedWindow === openedWindow) {
          _results.push(this.killProcess(pid));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AtomApplication.prototype.killProcess = function(pid) {
      var error;
      try {
        process.kill(pid);
      } catch (_error) {
        error = _error;
        if (error.code !== 'ESRCH') {
          console.log("Killing process " + pid + " failed: " + error.code);
        }
      }
      return delete this.pidsToOpenWindows[pid];
    };

    AtomApplication.prototype.openUrl = function(_arg) {
      var PackageManager, bootstrapScript, devMode, pack, packageName, packagePath, safeMode, urlToOpen, windowDimensions, _ref;
      urlToOpen = _arg.urlToOpen, devMode = _arg.devMode, safeMode = _arg.safeMode;
      if (this.packages == null) {
        PackageManager = require('../package-manager');
        fs = require('fs-plus');
        this.packages = new PackageManager({
          configDirPath: fs.absolute('~/.atom'),
          devMode: devMode,
          resourcePath: this.resourcePath
        });
      }
      packageName = url.parse(urlToOpen).host;
      pack = _.find(this.packages.getAvailablePackageMetadata(), function(_arg1) {
        var name;
        name = _arg1.name;
        return name === packageName;
      });
      if (pack != null) {
        if (pack.urlMain) {
          packagePath = this.packages.resolvePackagePath(packageName);
          bootstrapScript = path.resolve(packagePath, pack.urlMain);
          windowDimensions = (_ref = this.focusedWindow()) != null ? _ref.getDimensions() : void 0;
          return new AtomWindow({
            bootstrapScript: bootstrapScript,
            resourcePath: this.resourcePath,
            devMode: devMode,
            safeMode: safeMode,
            urlToOpen: urlToOpen,
            windowDimensions: windowDimensions
          });
        } else {
          return console.log("Package '" + pack.name + "' does not have a url main: " + urlToOpen);
        }
      } else {
        return console.log("Opening unknown url: " + urlToOpen);
      }
    };

    AtomApplication.prototype.runSpecs = function(_arg) {
      var bootstrapScript, devMode, error, exitWhenDone, isSpec, logFile, resourcePath, specDirectory;
      exitWhenDone = _arg.exitWhenDone, resourcePath = _arg.resourcePath, specDirectory = _arg.specDirectory, logFile = _arg.logFile;
      if (resourcePath !== this.resourcePath && !fs.existsSync(resourcePath)) {
        resourcePath = this.resourcePath;
      }
      try {
        bootstrapScript = require.resolve(path.resolve(global.devResourcePath, 'spec', 'spec-bootstrap'));
      } catch (_error) {
        error = _error;
        bootstrapScript = require.resolve(path.resolve(__dirname, '..', '..', 'spec', 'spec-bootstrap'));
      }
      isSpec = true;
      devMode = true;
      return new AtomWindow({
        bootstrapScript: bootstrapScript,
        resourcePath: resourcePath,
        exitWhenDone: exitWhenDone,
        isSpec: isSpec,
        devMode: devMode,
        specDirectory: specDirectory,
        logFile: logFile
      });
    };

    AtomApplication.prototype.runBenchmarks = function() {
      var bootstrapScript, error, isSpec;
      try {
        bootstrapScript = require.resolve(path.resolve(global.devResourcePath, 'benchmark', 'benchmark-bootstrap'));
      } catch (_error) {
        error = _error;
        bootstrapScript = require.resolve(path.resolve(__dirname, '..', '..', 'benchmark', 'benchmark-bootstrap'));
      }
      isSpec = true;
      return new AtomWindow({
        bootstrapScript: bootstrapScript,
        resourcePath: this.resourcePath,
        isSpec: isSpec
      });
    };

    AtomApplication.prototype.locationForPathToOpen = function(pathToOpen) {
      var fileToOpen, initialColumn, initialLine, _ref;
      if (!pathToOpen) {
        return {
          pathToOpen: pathToOpen
        };
      }
      if (fs.existsSync(pathToOpen)) {
        return {
          pathToOpen: pathToOpen
        };
      }
      _ref = path.basename(pathToOpen).split(':'), fileToOpen = _ref[0], initialLine = _ref[1], initialColumn = _ref[2];
      if (!initialLine) {
        return {
          pathToOpen: pathToOpen
        };
      }
      if (!(parseInt(initialLine) > 0)) {
        return {
          pathToOpen: pathToOpen
        };
      }
      if (initialLine) {
        initialLine -= 1;
      }
      if (initialColumn) {
        initialColumn -= 1;
      }
      pathToOpen = path.join(path.dirname(pathToOpen), fileToOpen);
      return {
        pathToOpen: pathToOpen,
        initialLine: initialLine,
        initialColumn: initialColumn
      };
    };

    AtomApplication.prototype.promptForPath = function(_arg) {
      var devMode, properties, safeMode, type, _ref;
      _ref = _arg != null ? _arg : {}, type = _ref.type, devMode = _ref.devMode, safeMode = _ref.safeMode;
      if (type == null) {
        type = 'all';
      }
      properties = (function() {
        switch (type) {
          case 'file':
            return ['openFile'];
          case 'folder':
            return ['openDirectory'];
          case 'all':
            return ['openFile', 'openDirectory'];
          default:
            throw new Error("" + type + " is an invalid type for promptForPath");
        }
      })();
      return dialog.showOpenDialog({
        title: 'Open',
        properties: properties.concat(['multiSelections', 'createDirectory'])
      }, (function(_this) {
        return function(pathsToOpen) {
          return _this.openPaths({
            pathsToOpen: pathsToOpen,
            devMode: devMode,
            safeMode: safeMode
          });
        };
      })(this));
    };

    return AtomApplication;

  })();

}).call(this);
