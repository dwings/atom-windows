(function() {
  var CSON, CoffeeScript, cacheDir, coffeeCacheDir, compileCoffeeScript, crypto, fs, getCachePath, getCachedJavaScript, path, requireCoffeeScript;

  crypto = require('crypto');

  path = require('path');

  CoffeeScript = require('coffee-script');

  CSON = require('season');

  fs = require('fs-plus');

  cacheDir = path.join(fs.absolute('~/.atom'), 'compile-cache');

  coffeeCacheDir = path.join(cacheDir, 'coffee');

  CSON.setCacheDir(path.join(cacheDir, 'cson'));

  getCachePath = function(coffee) {
    var digest;
    digest = crypto.createHash('sha1').update(coffee, 'utf8').digest('hex');
    return path.join(coffeeCacheDir, "" + digest + ".js");
  };

  getCachedJavaScript = function(cachePath) {
    if (fs.isFileSync(cachePath)) {
      try {
        return fs.readFileSync(cachePath, 'utf8');
      } catch (_error) {}
    }
  };

  compileCoffeeScript = function(coffee, filePath, cachePath) {
    var js, v3SourceMap, _ref;
    _ref = CoffeeScript.compile(coffee, {
      filename: filePath,
      sourceMap: true
    }), js = _ref.js, v3SourceMap = _ref.v3SourceMap;
    if ((typeof btoa !== "undefined" && btoa !== null) && (typeof JSON !== "undefined" && JSON !== null) && (typeof unescape !== "undefined" && unescape !== null) && (typeof encodeURIComponent !== "undefined" && encodeURIComponent !== null)) {
      js = "" + js + "\n//# sourceMappingURL=data:application/json;base64," + (btoa(unescape(encodeURIComponent(v3SourceMap)))) + "\n//# sourceURL=" + filePath;
    }
    try {
      fs.writeFileSync(cachePath, js);
    } catch (_error) {}
    return js;
  };

  requireCoffeeScript = function(module, filePath) {
    var cachePath, coffee, js, _ref;
    coffee = fs.readFileSync(filePath, 'utf8');
    cachePath = getCachePath(coffee);
    js = (_ref = getCachedJavaScript(cachePath)) != null ? _ref : compileCoffeeScript(coffee, filePath, cachePath);
    return module._compile(js, filePath);
  };

  module.exports = {
    cacheDir: cacheDir,
    register: function() {
      return Object.defineProperty(require.extensions, '.coffee', {
        writable: false,
        value: requireCoffeeScript
      });
    }
  };

}).call(this);
