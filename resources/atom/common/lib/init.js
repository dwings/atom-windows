// Generated by CoffeeScript 1.7.1
(function() {
  var Module, globalPaths, path, timers, wrapWithActivateUvLoop;

  path = require('path');

  timers = require('timers');

  Module = require('module');

  globalPaths = Module.globalPaths;

  globalPaths.push(path.join(process.resourcesPath, 'atom', 'common', 'api', 'lib'));

  wrapWithActivateUvLoop = function(func) {
    return function() {
      process.activateUvLoop();
      return func.apply(this, arguments);
    };
  };

  process.nextTick = wrapWithActivateUvLoop(process.nextTick);

  global.setImmediate = wrapWithActivateUvLoop(timers.setImmediate);

  global.clearImmediate = timers.clearImmediate;

}).call(this);
