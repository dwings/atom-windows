(function() {
  var $, Emitter, File, Package, Q, ThemeManager, fs, path, _;

  path = require('path');

  _ = require('underscore-plus');

  Emitter = require('emissary').Emitter;

  fs = require('fs-plus');

  Q = require('q');

  $ = require('./space-pen-extensions').$;

  Package = require('./package');

  File = require('pathwatcher').File;

  module.exports = ThemeManager = (function() {
    Emitter.includeInto(ThemeManager);

    function ThemeManager(_arg) {
      this.packageManager = _arg.packageManager, this.resourcePath = _arg.resourcePath, this.configDirPath = _arg.configDirPath;
      this.lessCache = null;
      this.packageManager.registerPackageActivator(this, ['theme']);
    }

    ThemeManager.prototype.getAvailableNames = function() {
      return this.getLoadedNames();
    };

    ThemeManager.prototype.getLoadedNames = function() {
      var theme, _i, _len, _ref, _results;
      _ref = this.getLoadedThemes();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        theme = _ref[_i];
        _results.push(theme.name);
      }
      return _results;
    };

    ThemeManager.prototype.getActiveNames = function() {
      var theme, _i, _len, _ref, _results;
      _ref = this.getActiveThemes();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        theme = _ref[_i];
        _results.push(theme.name);
      }
      return _results;
    };

    ThemeManager.prototype.getActiveThemes = function() {
      var pack, _i, _len, _ref, _results;
      _ref = this.packageManager.getActivePackages();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pack = _ref[_i];
        if (pack.isTheme()) {
          _results.push(pack);
        }
      }
      return _results;
    };

    ThemeManager.prototype.getLoadedThemes = function() {
      var pack, _i, _len, _ref, _results;
      _ref = this.packageManager.getLoadedPackages();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pack = _ref[_i];
        if (pack.isTheme()) {
          _results.push(pack);
        }
      }
      return _results;
    };

    ThemeManager.prototype.activatePackages = function(themePackages) {
      return this.activateThemes();
    };

    ThemeManager.prototype.getEnabledThemeNames = function() {
      var themeNames, _ref;
      themeNames = (_ref = atom.config.get('core.themes')) != null ? _ref : [];
      if (!_.isArray(themeNames)) {
        themeNames = [themeNames];
      }
      themeNames = themeNames.filter(function(themeName) {
        return themeName && typeof themeName === 'string';
      });
      return themeNames.reverse();
    };

    ThemeManager.prototype.activateThemes = function() {
      var deferred;
      deferred = Q.defer();
      atom.config.observe('core.themes', (function(_this) {
        return function() {
          var promises, themeName, _i, _len, _ref;
          _this.deactivateThemes();
          _this.refreshLessCache();
          promises = [];
          _ref = _this.getEnabledThemeNames();
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            themeName = _ref[_i];
            if (_this.packageManager.resolvePackagePath(themeName)) {
              promises.push(_this.packageManager.activatePackage(themeName));
            } else {
              console.warn("Failed to activate theme '" + themeName + "' because it isn't installed.");
            }
          }
          return Q.all(promises).then(function() {
            _this.refreshLessCache();
            _this.loadUserStylesheet();
            _this.reloadBaseStylesheets();
            _this.emit('reloaded');
            return deferred.resolve();
          });
        };
      })(this));
      return deferred.promise;
    };

    ThemeManager.prototype.deactivateThemes = function() {
      var pack, _i, _len, _ref;
      this.unwatchUserStylesheet();
      _ref = this.getActiveThemes();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pack = _ref[_i];
        this.packageManager.deactivatePackage(pack.name);
      }
      return null;
    };

    ThemeManager.prototype.refreshLessCache = function() {
      var _ref;
      return (_ref = this.lessCache) != null ? _ref.setImportPaths(this.getImportPaths()) : void 0;
    };

    ThemeManager.prototype.setEnabledThemes = function(enabledThemeNames) {
      return atom.config.set('core.themes', enabledThemeNames);
    };

    ThemeManager.prototype.getImportPaths = function() {
      var activeThemes, theme, themeName, themePath, themePaths, _i, _len, _ref;
      activeThemes = this.getActiveThemes();
      if (activeThemes.length > 0) {
        themePaths = (function() {
          var _i, _len, _results;
          _results = [];
          for (_i = 0, _len = activeThemes.length; _i < _len; _i++) {
            theme = activeThemes[_i];
            if (theme) {
              _results.push(theme.getStylesheetsPath());
            }
          }
          return _results;
        })();
      } else {
        themePaths = [];
        _ref = this.getEnabledThemeNames();
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          themeName = _ref[_i];
          if (themePath = this.packageManager.resolvePackagePath(themeName)) {
            themePaths.push(path.join(themePath, Package.stylesheetsDir));
          }
        }
      }
      return themePaths.filter(function(themePath) {
        return fs.isDirectorySync(themePath);
      });
    };

    ThemeManager.prototype.getUserStylesheetPath = function() {
      var stylesheetPath;
      stylesheetPath = fs.resolve(path.join(this.configDirPath, 'styles'), ['css', 'less']);
      if (fs.isFileSync(stylesheetPath)) {
        return stylesheetPath;
      } else {
        return path.join(this.configDirPath, 'styles.less');
      }
    };

    ThemeManager.prototype.unwatchUserStylesheet = function() {
      var _ref;
      if ((_ref = this.userStylesheetFile) != null) {
        _ref.off();
      }
      this.userStylesheetFile = null;
      if (this.userStylesheetPath != null) {
        return this.removeStylesheet(this.userStylesheetPath);
      }
    };

    ThemeManager.prototype.loadUserStylesheet = function() {
      var userStylesheetContents, userStylesheetPath;
      this.unwatchUserStylesheet();
      userStylesheetPath = this.getUserStylesheetPath();
      if (!fs.isFileSync(userStylesheetPath)) {
        return;
      }
      this.userStylesheetPath = userStylesheetPath;
      this.userStylesheetFile = new File(userStylesheetPath);
      this.userStylesheetFile.on('contents-changed moved removed', (function(_this) {
        return function() {
          return _this.loadUserStylesheet();
        };
      })(this));
      userStylesheetContents = this.loadStylesheet(userStylesheetPath);
      return this.applyStylesheet(userStylesheetPath, userStylesheetContents, 'userTheme');
    };

    ThemeManager.prototype.loadBaseStylesheets = function() {
      this.requireStylesheet('bootstrap/less/bootstrap');
      return this.reloadBaseStylesheets();
    };

    ThemeManager.prototype.reloadBaseStylesheets = function() {
      var nativeStylesheetPath;
      this.requireStylesheet('../static/atom');
      if (nativeStylesheetPath = fs.resolveOnLoadPath(process.platform, ['css', 'less'])) {
        return this.requireStylesheet(nativeStylesheetPath);
      }
    };

    ThemeManager.prototype.stylesheetElementForId = function(id, htmlElement) {
      if (htmlElement == null) {
        htmlElement = $('html');
      }
      return htmlElement.find("head style[id=\"" + id + "\"]");
    };

    ThemeManager.prototype.resolveStylesheet = function(stylesheetPath) {
      if (path.extname(stylesheetPath).length > 0) {
        return fs.resolveOnLoadPath(stylesheetPath);
      } else {
        return fs.resolveOnLoadPath(stylesheetPath, ['css', 'less']);
      }
    };

    ThemeManager.prototype.requireStylesheet = function(stylesheetPath, type, htmlElement) {
      var content, fullPath;
      if (type == null) {
        type = 'bundled';
      }
      if (fullPath = this.resolveStylesheet(stylesheetPath)) {
        content = this.loadStylesheet(fullPath);
        this.applyStylesheet(fullPath, content, type = 'bundled', htmlElement);
      } else {
        throw new Error("Could not find a file at path '" + stylesheetPath + "'");
      }
      return fullPath;
    };

    ThemeManager.prototype.loadStylesheet = function(stylesheetPath) {
      if (path.extname(stylesheetPath) === '.less') {
        return this.loadLessStylesheet(stylesheetPath);
      } else {
        return fs.readFileSync(stylesheetPath, 'utf8');
      }
    };

    ThemeManager.prototype.loadLessStylesheet = function(lessStylesheetPath) {
      var LessCompileCache, e;
      if (this.lessCache == null) {
        LessCompileCache = require('./less-compile-cache');
        this.lessCache = new LessCompileCache({
          resourcePath: this.resourcePath,
          importPaths: this.getImportPaths()
        });
      }
      try {
        return this.lessCache.read(lessStylesheetPath);
      } catch (_error) {
        e = _error;
        return console.error("Error compiling less stylesheet: " + lessStylesheetPath + "\nLine number: " + e.line + "\n" + e.message);
      }
    };

    ThemeManager.prototype.stringToId = function(string) {
      return string.replace(/\\/g, '/');
    };

    ThemeManager.prototype.removeStylesheet = function(stylesheetPath) {
      var element, fullPath, stylesheet, _ref;
      fullPath = (_ref = this.resolveStylesheet(stylesheetPath)) != null ? _ref : stylesheetPath;
      element = this.stylesheetElementForId(this.stringToId(fullPath));
      if (element.length > 0) {
        stylesheet = element[0].sheet;
        element.remove();
        this.emit('stylesheet-removed', stylesheet);
        return this.emit('stylesheets-changed');
      }
    };

    ThemeManager.prototype.applyStylesheet = function(path, text, type, htmlElement) {
      var styleElement;
      if (type == null) {
        type = 'bundled';
      }
      if (htmlElement == null) {
        htmlElement = $('html');
      }
      styleElement = this.stylesheetElementForId(this.stringToId(path), htmlElement);
      if (styleElement.length) {
        this.emit('stylesheet-removed', styleElement[0].sheet);
        styleElement.text(text);
      } else {
        styleElement = $("<style class='" + type + "' id='" + (this.stringToId(path)) + "'>" + text + "</style>");
        if (htmlElement.find("head style." + type).length) {
          htmlElement.find("head style." + type + ":last").after(styleElement);
        } else {
          htmlElement.find("head").append(styleElement);
        }
      }
      this.emit('stylesheet-added', styleElement[0].sheet);
      return this.emit('stylesheets-changed');
    };

    return ThemeManager;

  })();

}).call(this);
