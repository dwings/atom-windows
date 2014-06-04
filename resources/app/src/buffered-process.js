(function() {
  var BufferedProcess, ChildProcess, _;

  _ = require('underscore-plus');

  ChildProcess = require('child_process');

  module.exports = BufferedProcess = (function() {
    function BufferedProcess(_arg) {
      var args, cmdArgs, cmdOptions, command, exit, exitCode, options, processExited, stderr, stderrClosed, stdout, stdoutClosed, triggerExitCallback, _ref;
      _ref = _arg != null ? _arg : {}, command = _ref.command, args = _ref.args, options = _ref.options, stdout = _ref.stdout, stderr = _ref.stderr, exit = _ref.exit;
      if (options == null) {
        options = {};
      }
      if (process.platform === "win32") {
        cmdArgs = args.map(function(arg) {
          return "\"" + (arg.replace(/"/g, '\\"')) + "\"";
        });
        cmdArgs.unshift("\"" + command + "\"");
        cmdArgs = ['/s', '/c', "\"" + (cmdArgs.join(' ')) + "\""];
        cmdOptions = _.clone(options);
        cmdOptions.windowsVerbatimArguments = true;
        this.process = ChildProcess.spawn(process.env.comspec || 'cmd.exe', cmdArgs, cmdOptions);
      } else {
        this.process = ChildProcess.spawn(command, args, options);
      }
      this.killed = false;
      stdoutClosed = true;
      stderrClosed = true;
      processExited = true;
      exitCode = 0;
      triggerExitCallback = function() {
        if (this.killed) {
          return;
        }
        if (stdoutClosed && stderrClosed && processExited) {
          return typeof exit === "function" ? exit(exitCode) : void 0;
        }
      };
      if (stdout) {
        stdoutClosed = false;
        this.bufferStream(this.process.stdout, stdout, function() {
          stdoutClosed = true;
          return triggerExitCallback();
        });
      }
      if (stderr) {
        stderrClosed = false;
        this.bufferStream(this.process.stderr, stderr, function() {
          stderrClosed = true;
          return triggerExitCallback();
        });
      }
      if (exit) {
        processExited = false;
        this.process.on('exit', function(code) {
          exitCode = code;
          processExited = true;
          return triggerExitCallback();
        });
      }
    }

    BufferedProcess.prototype.bufferStream = function(stream, onLines, onDone) {
      var buffered;
      stream.setEncoding('utf8');
      buffered = '';
      stream.on('data', (function(_this) {
        return function(data) {
          var lastNewlineIndex;
          if (_this.killed) {
            return;
          }
          buffered += data;
          lastNewlineIndex = buffered.lastIndexOf('\n');
          if (lastNewlineIndex !== -1) {
            onLines(buffered.substring(0, lastNewlineIndex + 1));
            return buffered = buffered.substring(lastNewlineIndex + 1);
          }
        };
      })(this));
      return stream.on('close', (function(_this) {
        return function() {
          if (_this.killed) {
            return;
          }
          if (buffered.length > 0) {
            onLines(buffered);
          }
          return onDone();
        };
      })(this));
    };

    BufferedProcess.prototype.kill = function() {
      this.killed = true;
      this.process.kill();
      return this.process = null;
    };

    return BufferedProcess;

  })();

}).call(this);
