(function() {
  var CSON, Command, List, config, fs, optimist, path, tree, _,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  _ = require('underscore-plus');

  CSON = require('season');

  optimist = require('optimist');

  Command = require('./command');

  fs = require('./fs');

  config = require('./config');

  tree = require('./tree');

  module.exports = List = (function(_super) {
    __extends(List, _super);

    List.commandNames = ['list', 'ls'];

    function List() {
      var configPath, _ref, _ref1;
      this.userPackagesDirectory = path.join(config.getAtomDirectory(), 'packages');
      this.devPackagesDirectory = path.join(config.getAtomDirectory(), 'dev', 'packages');
      if (configPath = CSON.resolve(path.join(config.getAtomDirectory(), 'config'))) {
        try {
          this.disabledPackages = (_ref = CSON.readFileSync(configPath)) != null ? (_ref1 = _ref.core) != null ? _ref1.disabledPackages : void 0 : void 0;
        } catch (_error) {}
      }
      if (this.disabledPackages == null) {
        this.disabledPackages = [];
      }
    }

    List.prototype.parseOptions = function(argv) {
      var options;
      options = optimist(argv);
      options.usage("\nUsage: apm list\n       apm list --themes\n\nList all the installed packages and also the packages bundled with Atom.");
      options.alias('h', 'help').describe('help', 'Print this usage message');
      return options.alias('t', 'themes').boolean('themes').describe('themes', 'Only list themes');
    };

    List.prototype.isPackageDisabled = function(name) {
      return this.disabledPackages.indexOf(name) !== -1;
    };

    List.prototype.logPackages = function(packages) {
      tree(packages, (function(_this) {
        return function(pack) {
          var packageLine;
          packageLine = pack.name;
          if (pack.version != null) {
            packageLine += "@" + pack.version;
          }
          if (_this.isPackageDisabled(pack.name)) {
            packageLine += ' (disabled)';
          }
          return packageLine;
        };
      })(this));
      return console.log();
    };

    List.prototype.listPackages = function(directoryPath, options) {
      var child, manifest, manifestPath, packages, _i, _len, _ref;
      packages = [];
      _ref = fs.list(directoryPath);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        child = _ref[_i];
        if (!fs.isDirectorySync(path.join(directoryPath, child))) {
          continue;
        }
        manifest = null;
        if (manifestPath = CSON.resolve(path.join(directoryPath, child, 'package'))) {
          try {
            manifest = CSON.readFileSync(manifestPath);
          } catch (_error) {}
        }
        if (manifest == null) {
          manifest = {};
        }
        manifest.name = child;
        if (options.argv.themes) {
          if (manifest.theme) {
            packages.push(manifest);
          }
        } else {
          packages.push(manifest);
        }
      }
      return packages;
    };

    List.prototype.listUserPackages = function(options) {
      var userPackages;
      userPackages = this.listPackages(this.userPackagesDirectory, options);
      console.log("" + this.userPackagesDirectory.cyan + " (" + userPackages.length + ")");
      return this.logPackages(userPackages);
    };

    List.prototype.listDevPackages = function(options) {
      var devPackages;
      devPackages = this.listPackages(this.devPackagesDirectory, options);
      if (devPackages.length > 0) {
        console.log("" + this.devPackagesDirectory.cyan + " (" + devPackages.length + ")");
        return this.logPackages(devPackages);
      }
    };

    List.prototype.listBundledPackages = function(options, callback) {
      return config.getResourcePath((function(_this) {
        return function(resourcePath) {
          var metadataPath, nodeModulesDirectory, packageDependencies, packages, _ref;
          nodeModulesDirectory = path.join(resourcePath, 'node_modules');
          packages = _this.listPackages(nodeModulesDirectory, options);
          try {
            metadataPath = path.join(resourcePath, 'package.json');
            packageDependencies = ((_ref = JSON.parse(fs.readFileSync(metadataPath))) != null ? _ref : {}).packageDependencies;
          } catch (_error) {}
          if (packageDependencies == null) {
            packageDependencies = {};
          }
          packages = packages.filter(function(_arg) {
            var name;
            name = _arg.name;
            return packageDependencies.hasOwnProperty(name);
          });
          if (options.argv.themes) {
            console.log("" + 'Built-in Atom themes'.cyan + " (" + packages.length + ")");
          } else {
            console.log("" + 'Built-in Atom packages'.cyan + " (" + packages.length + ")");
          }
          _this.logPackages(packages);
          return callback();
        };
      })(this));
    };

    List.prototype.run = function(options) {
      var callback;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      return this.listBundledPackages(options, (function(_this) {
        return function() {
          _this.listDevPackages(options);
          _this.listUserPackages(options);
          return callback();
        };
      })(this));
    };

    return List;

  })(Command);

}).call(this);
