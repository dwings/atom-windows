(function() {
  var config, configureRequest, loadNpm, npm, request;

  npm = require('npm');

  request = require('request');

  config = require('./config');

  loadNpm = function(callback) {
    var npmOptions;
    npmOptions = {
      userconfig: config.getUserConfigPath(),
      globalconfig: config.getGlobalConfigPath()
    };
    return npm.load(npmOptions, callback);
  };

  configureRequest = function(requestOptions, callback) {
    return loadNpm(function() {
      if (requestOptions.proxy == null) {
        requestOptions.proxy = npm.config.get('https-proxy') || npm.config.get('proxy');
      }
      if (requestOptions.strictSSL == null) {
        requestOptions.strictSSL = npm.config.get('strict-ssl');
      }
      return callback();
    });
  };

  module.exports = {
    get: function(requestOptions, callback) {
      return configureRequest(requestOptions, function() {
        return request.get(requestOptions, callback);
      });
    },
    del: function(requestOptions, callback) {
      return configureRequest(requestOptions, function() {
        return request.del(requestOptions, callback);
      });
    },
    post: function(requestOptions, callback) {
      return configureRequest(requestOptions, function() {
        return request.post(requestOptions, callback);
      });
    },
    createReadStream: function(requestOptions, callback) {
      return configureRequest(requestOptions, function() {
        return callback(request.get(requestOptions));
      });
    },
    useStrictSsl: function(callback) {
      return loadNpm(function() {
        return callback(null, npm.config.get('strict-ssl'));
      });
    }
  };

}).call(this);
