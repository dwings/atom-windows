(function() {
  var LessCache, LessCompileCache, Subscriber, fs, path;

  path = require('path');

  fs = require('fs-plus');

  LessCache = require('less-cache');

  Subscriber = require('emissary').Subscriber;

  module.exports = LessCompileCache = (function() {
    Subscriber.includeInto(LessCompileCache);

    LessCompileCache.cacheDir = path.join(atom.getConfigDirPath(), 'compile-cache', 'less');

    function LessCompileCache(_arg) {
      var importPaths, resourcePath;
      resourcePath = _arg.resourcePath, importPaths = _arg.importPaths;
      this.lessSearchPaths = [path.join(resourcePath, 'static', 'variables'), path.join(resourcePath, 'static')];
      if (importPaths != null) {
        importPaths = importPaths.concat(this.lessSearchPaths);
      } else {
        importPaths = this.lessSearchPaths;
      }
      this.cache = new LessCache({
        cacheDir: this.constructor.cacheDir,
        importPaths: importPaths,
        resourcePath: resourcePath,
        fallbackDir: path.join(resourcePath, 'less-compile-cache')
      });
    }

    LessCompileCache.prototype.setImportPaths = function(importPaths) {
      if (importPaths == null) {
        importPaths = [];
      }
      return this.cache.setImportPaths(importPaths.concat(this.lessSearchPaths));
    };

    LessCompileCache.prototype.read = function(stylesheetPath) {
      return this.cache.readFileSync(stylesheetPath);
    };

    LessCompileCache.prototype.destroy = function() {
      return this.unsubscribe();
    };

    return LessCompileCache;

  })();

}).call(this);
