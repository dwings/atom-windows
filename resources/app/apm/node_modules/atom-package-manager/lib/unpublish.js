(function() {
  var Command, Unpublish, auth, fs, optimist, path, readline, request,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  readline = require('readline');

  optimist = require('optimist');

  auth = require('./auth');

  Command = require('./command');

  fs = require('./fs');

  request = require('./request');

  module.exports = Unpublish = (function(_super) {
    __extends(Unpublish, _super);

    function Unpublish() {
      return Unpublish.__super__.constructor.apply(this, arguments);
    }

    Unpublish.commandNames = ['unpublish'];

    Unpublish.prototype.parseOptions = function(argv) {
      var options;
      options = optimist(argv);
      options.usage("Usage: apm unpublish [<package_name>]\n\nRemove a published package from the atom.io registry. The package in the\ncurrent working directory will be unpublished if no package name is\nspecified.");
      options.alias('h', 'help').describe('help', 'Print this usage message');
      return options.alias('f', 'force').boolean('force').describe('force', 'Do not prompt for confirmation');
    };

    Unpublish.prototype.unpublishPackage = function(packageName, callback) {
      process.stdout.write("Unpublishing " + packageName + " ");
      return auth.getToken((function(_this) {
        return function(error, token) {
          var options;
          if (error != null) {
            _this.logFailure();
            callback(error);
            return;
          }
          options = {
            uri: "https://atom.io/api/packages/" + packageName,
            headers: {
              authorization: token
            },
            json: true
          };
          return request.del(options, function(error, response, body) {
            var message, _ref, _ref1;
            if (body == null) {
              body = {};
            }
            if (error != null) {
              _this.logFailure();
              return callback(error);
            } else if (response.statusCode !== 204) {
              _this.logFailure();
              message = (_ref = (_ref1 = body.message) != null ? _ref1 : body.error) != null ? _ref : body;
              return callback("Unpublishing failed: " + message);
            } else {
              _this.logSuccess();
              return callback();
            }
          });
        };
      })(this));
    };

    Unpublish.prototype.promptForConfirmation = function(packageName, callback) {
      var prompt;
      prompt = readline.createInterface(process.stdin, process.stdout);
      return prompt.question("Are you sure you want to unpublish " + packageName + "? (yes) ", (function(_this) {
        return function(answer) {
          prompt.close();
          answer = answer ? answer.trim().toLowerCase() : 'yes';
          if (answer === 'y' || answer === 'yes') {
            return _this.unpublishPackage(packageName, callback);
          }
        };
      })(this));
    };

    Unpublish.prototype.run = function(options) {
      var callback, name, _ref;
      callback = options.callback;
      options = this.parseOptions(options.commandArgs);
      name = options.argv._[0];
      if (name == null) {
        try {
          name = ((_ref = JSON.parse(fs.readFileSync('package.json'))) != null ? _ref : {}).name;
        } catch (_error) {}
        if (name == null) {
          name = path.basename(process.cwd());
        }
      }
      if (options.argv.force) {
        return this.unpublishPackage(name, callback);
      } else {
        return this.promptForConfirmation(name, callback);
      }
    };

    return Unpublish;

  })(Command);

}).call(this);
