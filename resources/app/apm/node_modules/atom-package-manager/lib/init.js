(function() {
  var Command, Init, fs, optimist, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  optimist = require('optimist');

  Command = require('./command');

  fs = require('./fs');

  module.exports = Init = (function(_super) {
    __extends(Init, _super);

    function Init() {
      return Init.__super__.constructor.apply(this, arguments);
    }

    Init.commandNames = ['init'];

    Init.prototype.parseOptions = function(argv) {
      var options;
      options = optimist(argv);
      options.usage("Usage:\n  apm init -p <package-name>\n  apm init -p <package-name> -c ~/Downloads/r.tmbundle\n  apm init -p <package-name> -c https://github.com/textmate/r.tmbundle\n\n  apm init -t <theme-name>\n  apm init -t <theme-name> -c ~/Downloads/Dawn.tmTheme\n  apm init -t <theme-name> -c https://raw.github.com/chriskempson/tomorrow-theme/master/textmate/Tomorrow-Night-Eighties.tmTheme\n\nGenerates code scaffolding for either a theme or package depending\non the option selected.");
      options.alias('p', 'package').string('package').describe('package', 'Generates a basic package');
      options.alias('t', 'theme').string('theme').describe('theme', 'Generates a basic theme');
      options.alias('c', 'convert').string('convert').describe('convert', 'Path or URL to TextMate bundle/theme to convert');
      return options.alias('h', 'help').describe('help', 'Print this usage message');
    };

    Init.prototype.run = function(options) {
      var callback, packagePath, templatePath, themePath, _ref, _ref1;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      if (((_ref = options.argv["package"]) != null ? _ref.length : void 0) > 0) {
        if (options.argv.convert) {
          return this.convertPackage(options.argv.convert, options.argv["package"], callback);
        } else {
          packagePath = path.resolve(options.argv["package"]);
          templatePath = path.resolve(__dirname, '..', 'templates', 'package');
          this.generateFromTemplate(packagePath, templatePath);
          return callback();
        }
      } else if (((_ref1 = options.argv.theme) != null ? _ref1.length : void 0) > 0) {
        if (options.argv.convert) {
          return this.convertTheme(options.argv.convert, options.argv.theme, callback);
        } else {
          themePath = path.resolve(options.argv.theme);
          templatePath = path.resolve(__dirname, '..', 'templates', 'theme');
          this.generateFromTemplate(themePath, templatePath);
          return callback();
        }
      } else if (options.argv["package"] != null) {
        return callback('You must specify a path after the --package argument');
      } else if (options.argv.theme != null) {
        return callback('You must specify a path after the --theme argument');
      } else {
        return callback('You must specify either --package or --theme to `apm init`');
      }
    };

    Init.prototype.convertPackage = function(sourcePath, destinationPath, callback) {
      var PackageConverter, converter;
      if (!destinationPath) {
        callback("Specify directory to create package in using --package");
        return;
      }
      PackageConverter = require('./package-converter');
      converter = new PackageConverter(sourcePath, destinationPath);
      return converter.convert((function(_this) {
        return function(error) {
          var templatePath;
          if (error != null) {
            return callback(error);
          } else {
            destinationPath = path.resolve(destinationPath);
            templatePath = path.resolve(__dirname, '..', 'templates', 'bundle');
            _this.generateFromTemplate(destinationPath, templatePath);
            return callback();
          }
        };
      })(this));
    };

    Init.prototype.convertTheme = function(sourcePath, destinationPath, callback) {
      var ThemeConverter, converter;
      if (!destinationPath) {
        callback("Specify directory to create theme in using --theme");
        return;
      }
      ThemeConverter = require('./theme-converter');
      converter = new ThemeConverter(sourcePath, destinationPath);
      return converter.convert((function(_this) {
        return function(error) {
          var templatePath;
          if (error != null) {
            return callback(error);
          } else {
            destinationPath = path.resolve(destinationPath);
            templatePath = path.resolve(__dirname, '..', 'templates', 'theme');
            _this.generateFromTemplate(destinationPath, templatePath);
            fs.removeSync(path.join(destinationPath, 'stylesheets', 'colors.less'));
            fs.removeSync(path.join(destinationPath, 'LICENSE.md'));
            return callback();
          }
        };
      })(this));
    };

    Init.prototype.generateFromTemplate = function(packagePath, templatePath) {
      var childPath, content, contents, packageName, relativePath, sourcePath, templateChildPath, _i, _len, _ref, _results;
      packageName = path.basename(packagePath);
      fs.makeTreeSync(packagePath);
      _ref = fs.listRecursive(templatePath);
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        childPath = _ref[_i];
        templateChildPath = path.resolve(templatePath, childPath);
        relativePath = templateChildPath.replace(templatePath, "");
        relativePath = relativePath.replace(/^\//, '');
        relativePath = relativePath.replace(/\.template$/, '');
        relativePath = this.replacePackageNamePlaceholders(relativePath, packageName);
        sourcePath = path.join(packagePath, relativePath);
        if (fs.existsSync(sourcePath)) {
          continue;
        }
        if (fs.isDirectorySync(templateChildPath)) {
          _results.push(fs.makeTreeSync(sourcePath));
        } else if (fs.isFileSync(templateChildPath)) {
          fs.makeTreeSync(path.dirname(sourcePath));
          contents = fs.readFileSync(templateChildPath).toString();
          content = this.replacePackageNamePlaceholders(contents, packageName);
          _results.push(fs.writeFileSync(sourcePath, content));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Init.prototype.replacePackageNamePlaceholders = function(string, packageName) {
      var placeholderRegex;
      placeholderRegex = /__(?:(package-name)|([pP]ackageName)|(package_name))__/g;
      return string = string.replace(placeholderRegex, (function(_this) {
        return function(match, dash, camel, underscore) {
          if (dash) {
            return _this.dasherize(packageName);
          } else if (camel) {
            if (/[a-z]/.test(camel[0])) {
              packageName = packageName[0].toLowerCase() + packageName.slice(1);
            } else if (/[A-Z]/.test(camel[0])) {
              packageName = packageName[0].toUpperCase() + packageName.slice(1);
            }
            return _this.camelize(packageName);
          } else if (underscore) {
            return _this.underscore(packageName);
          }
        };
      })(this));
    };

    Init.prototype.dasherize = function(string) {
      string = string[0].toLowerCase() + string.slice(1);
      return string.replace(/([A-Z])|(_)/g, function(m, letter, underscore) {
        if (letter) {
          return "-" + letter.toLowerCase();
        } else {
          return "-";
        }
      });
    };

    Init.prototype.camelize = function(string) {
      return string.replace(/[_-]+(\w)/g, function(m) {
        return m[1].toUpperCase();
      });
    };

    Init.prototype.underscore = function(string) {
      string = string[0].toLowerCase() + string.slice(1);
      return string.replace(/([A-Z])|(-)/g, function(m, letter, dash) {
        if (letter) {
          return "_" + letter.toLowerCase();
        } else {
          return "_";
        }
      });
    };

    return Init;

  })(Command);

}).call(this);
