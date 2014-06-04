(function() {
  var Command, Test, optimist, path,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  path = require('path');

  optimist = require('optimist');

  Command = require('./command');

  module.exports = Test = (function(_super) {
    __extends(Test, _super);

    function Test() {
      return Test.__super__.constructor.apply(this, arguments);
    }

    Test.commandNames = ['test'];

    Test.prototype.parseOptions = function(argv) {
      var options;
      options = optimist(argv);
      options.usage("Usage:\n  apm test\n\nRuns the package's tests contained within the spec directory (relative\nto the current working directory).");
      options.alias('h', 'help').describe('help', 'Print this usage message');
      return options.alias('p', 'path').string('path').describe('path', 'Path to atom command').string('path');
    };

    Test.prototype.showHelp = function(argv) {
      return this.parseOptions(argv).showHelp();
    };

    Test.prototype.run = function(options) {
      var args, atomCommand, callback, env, _ref;
      callback = options.callback;
      args = this.parseOptions(options.commandArgs);
      env = process.env;
      atomCommand = (_ref = args.argv.path) != null ? _ref : 'atom';
      return this.spawn(atomCommand, ['--dev', '--test', "--spec-directory=" + (path.join(process.cwd(), 'spec'))], {
        env: env,
        streaming: true
      }, function(code) {
        if (code === 0) {
          process.stdout.write('Tests passed\n'.green);
          return callback();
        } else {
          return callback('Tests failed');
        }
      });
    };

    return Test;

  })(Command);

}).call(this);
