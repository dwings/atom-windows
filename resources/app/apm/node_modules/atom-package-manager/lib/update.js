(function() {
  var Clean, Command, Install, Update, optimist,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  optimist = require('optimist');

  Clean = require('./clean');

  Command = require('./command');

  Install = require('./install');

  module.exports = Update = (function(_super) {
    __extends(Update, _super);

    function Update() {
      return Update.__super__.constructor.apply(this, arguments);
    }

    Update.commandNames = ['update'];

    Update.prototype.parseOptions = function(argv) {
      var options;
      options = optimist(argv);
      options.usage("\nUsage: apm update\n\nRun `apm clean` followed by `apm install`.\n\nSee `apm help clean` and `apm help install` for more information.");
      return options.alias('h', 'help').describe('help', 'Print this usage message');
    };

    Update.prototype.run = function(options) {
      var finalCallback;
      finalCallback = options.callback;
      options.callback = function(error) {
        if (error != null) {
          return finalCallback(error);
        } else {
          return new Install().installDependencies(options, finalCallback);
        }
      };
      return new Clean().run(options);
    };

    return Update;

  })(Command);

}).call(this);
