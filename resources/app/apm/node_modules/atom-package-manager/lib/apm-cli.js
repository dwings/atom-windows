(function() {
  var colors, commandClass, commandClasses, commands, name, optimist, parseOptions, wordwrap, _, _i, _j, _len, _len1, _ref, _ref1;

  _ = require('underscore-plus');

  colors = require('colors');

  optimist = require('optimist');

  wordwrap = require('wordwrap');

  commandClasses = [require('./clean'), require('./dedupe'), require('./develop'), require('./docs'), require('./featured'), require('./init'), require('./install'), require('./links'), require('./link'), require('./list'), require('./login'), require('./publish'), require('./rebuild'), require('./search'), require('./test'), require('./uninstall'), require('./unlink'), require('./unpublish'), require('./update'), require('./upgrade'), require('./view')];

  commands = {};

  for (_i = 0, _len = commandClasses.length; _i < _len; _i++) {
    commandClass = commandClasses[_i];
    _ref1 = (_ref = commandClass.commandNames) != null ? _ref : [];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      name = _ref1[_j];
      commands[name] = commandClass;
    }
  }

  parseOptions = function(args) {
    var arg, index, options, _k, _len2;
    if (args == null) {
      args = [];
    }
    options = optimist(args);
    options.usage("\napm - Atom Package Manager powered by https://atom.io\n\nUsage: apm <command>\n\nwhere <command> is one of:\n" + (wordwrap(4, 80)(Object.keys(commands).sort().join(', '))) + ".\n\nRun `apm help <command>` to see the more details about a specific command.");
    options.alias('v', 'version').describe('version', 'Print the apm version');
    options.alias('h', 'help').describe('help', 'Print this usage message');
    options.boolean('color')["default"]('color', true).describe('color', 'Enable colored output');
    options.command = options.argv._[0];
    for (index = _k = 0, _len2 = args.length; _k < _len2; index = ++_k) {
      arg = args[index];
      if (!(arg === options.command)) {
        continue;
      }
      options.commandArgs = args.slice(index + 1);
      break;
    }
    return options;
  };

  module.exports = {
    run: function(args, callback) {
      var Command, apmVersion, callbackCalled, command, nodeVersion, npmVersion, options, _ref2, _ref3, _ref4;
      options = parseOptions(args);
      if (!options.argv.color) {
        colors.setTheme({
          blue: 'stripColors',
          cyan: 'stripColors',
          green: 'stripColors',
          red: 'stripColors',
          yellow: 'stripColors',
          rainbow: 'stripColors'
        });
      }
      callbackCalled = false;
      options.callback = function(error) {
        var message, _ref2;
        if (callbackCalled) {
          return;
        }
        callbackCalled = true;
        if (error != null) {
          if (typeof callback === "function") {
            callback(error);
          }
          if (_.isString(error)) {
            message = error;
          } else {
            message = (_ref2 = error.message) != null ? _ref2 : error;
          }
          if (message === 'canceled') {
            console.log();
          } else if (message) {
            console.error(message.red);
          }
          return process.exit(1);
        } else {
          return typeof callback === "function" ? callback() : void 0;
        }
      };
      args = options.argv;
      command = options.command;
      if (args.version) {
        apmVersion = (_ref2 = require('../package.json').version) != null ? _ref2 : '';
        npmVersion = (_ref3 = require('npm/package.json').version) != null ? _ref3 : '';
        nodeVersion = (_ref4 = process.versions.node) != null ? _ref4 : '';
        if (args.json) {
          return console.log(JSON.stringify({
            apm: apmVersion,
            npm: npmVersion,
            node: nodeVersion
          }));
        } else {
          return console.log("" + 'apm'.red + "  " + apmVersion.red + "\n" + 'npm'.green + "  " + npmVersion.green + "\n" + 'node'.blue + " " + nodeVersion.blue);
        }
      } else if (args.help) {
        if (Command = commands[options.command]) {
          return new Command().showHelp(options.command);
        } else {
          return options.showHelp();
        }
      } else if (command) {
        if (command === 'help') {
          if (Command = commands[options.commandArgs]) {
            return new Command().showHelp(options.commandArgs);
          } else {
            return options.showHelp();
          }
        } else if (Command = commands[command]) {
          return new Command().run(options);
        } else {
          return options.callback("Unrecognized command: " + command);
        }
      } else {
        return options.showHelp();
      }
    }
  };

}).call(this);
