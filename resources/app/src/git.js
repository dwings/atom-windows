(function() {
  var Emitter, Git, GitUtils, Subscriber, Task, fs, join, _, _ref;

  join = require('path').join;

  _ = require('underscore-plus');

  _ref = require('emissary'), Emitter = _ref.Emitter, Subscriber = _ref.Subscriber;

  fs = require('fs-plus');

  GitUtils = require('git-utils');

  Task = require('./task');

  module.exports = Git = (function() {
    Emitter.includeInto(Git);

    Subscriber.includeInto(Git);

    Git.open = function(path, options) {
      if (!path) {
        return null;
      }
      try {
        return new Git(path, options);
      } catch (_error) {
        return null;
      }
    };

    Git.exists = function(path) {
      var git;
      if (git = this.open(path)) {
        git.destroy();
        return true;
      } else {
        return false;
      }
    };

    function Git(path, options) {
      var $, refreshOnWindowFocus, submodulePath, submoduleRepo, _ref1;
      if (options == null) {
        options = {};
      }
      this.repo = GitUtils.open(path);
      if (this.repo == null) {
        throw new Error("No Git repository found searching path: " + path);
      }
      this.statuses = {};
      this.upstream = {
        ahead: 0,
        behind: 0
      };
      _ref1 = this.repo.submodules;
      for (submodulePath in _ref1) {
        submoduleRepo = _ref1[submodulePath];
        submoduleRepo.upstream = {
          ahead: 0,
          behind: 0
        };
      }
      this.project = options.project, refreshOnWindowFocus = options.refreshOnWindowFocus;
      if (refreshOnWindowFocus == null) {
        refreshOnWindowFocus = true;
      }
      if (refreshOnWindowFocus) {
        $ = require('./space-pen-extensions').$;
        this.subscribe($(window), 'focus', (function(_this) {
          return function() {
            _this.refreshIndex();
            return _this.refreshStatus();
          };
        })(this));
      }
      if (this.project != null) {
        this.subscribe(this.project.eachBuffer((function(_this) {
          return function(buffer) {
            return _this.subscribeToBuffer(buffer);
          };
        })(this)));
      }
    }

    Git.prototype.subscribeToBuffer = function(buffer) {
      this.subscribe(buffer, 'saved reloaded path-changed', (function(_this) {
        return function() {
          var path;
          if (path = buffer.getPath()) {
            return _this.getPathStatus(path);
          }
        };
      })(this));
      return this.subscribe(buffer, 'destroyed', (function(_this) {
        return function() {
          return _this.unsubscribe(buffer);
        };
      })(this));
    };

    Git.prototype.destroy = function() {
      if (this.statusTask != null) {
        this.statusTask.terminate();
        this.statusTask = null;
      }
      if (this.repo != null) {
        this.repo.release();
        this.repo = null;
      }
      return this.unsubscribe();
    };

    Git.prototype.getRepo = function(path) {
      var _ref1;
      if (this.repo != null) {
        return (_ref1 = this.repo.submoduleForPath(path)) != null ? _ref1 : this.repo;
      } else {
        throw new Error("Repository has been destroyed");
      }
    };

    Git.prototype.refreshIndex = function() {
      return this.getRepo().refreshIndex();
    };

    Git.prototype.getPath = function() {
      return this.path != null ? this.path : this.path = fs.absolute(this.getRepo().getPath());
    };

    Git.prototype.getWorkingDirectory = function() {
      return this.getRepo().getWorkingDirectory();
    };

    Git.prototype.getPathStatus = function(path) {
      var currentPathStatus, pathStatus, relativePath, repo, _ref1, _ref2;
      repo = this.getRepo(path);
      relativePath = this.relativize(path);
      currentPathStatus = (_ref1 = this.statuses[relativePath]) != null ? _ref1 : 0;
      pathStatus = (_ref2 = repo.getStatus(repo.relativize(path))) != null ? _ref2 : 0;
      if (repo.isStatusIgnored(pathStatus)) {
        pathStatus = 0;
      }
      if (pathStatus > 0) {
        this.statuses[relativePath] = pathStatus;
      } else {
        delete this.statuses[relativePath];
      }
      if (currentPathStatus !== pathStatus) {
        this.emit('status-changed', path, pathStatus);
      }
      return pathStatus;
    };

    Git.prototype.isPathIgnored = function(path) {
      return this.getRepo().isIgnored(this.relativize(path));
    };

    Git.prototype.isStatusModified = function(status) {
      return this.getRepo().isStatusModified(status);
    };

    Git.prototype.isPathModified = function(path) {
      return this.isStatusModified(this.getPathStatus(path));
    };

    Git.prototype.isStatusNew = function(status) {
      return this.getRepo().isStatusNew(status);
    };

    Git.prototype.isPathNew = function(path) {
      return this.isStatusNew(this.getPathStatus(path));
    };

    Git.prototype.isProjectAtRoot = function() {
      var _ref1;
      return this.projectAtRoot != null ? this.projectAtRoot : this.projectAtRoot = ((_ref1 = this.project) != null ? _ref1.relativize(this.getWorkingDirectory()) : void 0) === '';
    };

    Git.prototype.relativize = function(path) {
      return this.getRepo().relativize(path);
    };

    Git.prototype.getShortHead = function(path) {
      return this.getRepo(path).getShortHead();
    };

    Git.prototype.checkoutHead = function(path) {
      var headCheckedOut, repo;
      repo = this.getRepo(path);
      headCheckedOut = repo.checkoutHead(repo.relativize(path));
      if (headCheckedOut) {
        this.getPathStatus(path);
      }
      return headCheckedOut;
    };

    Git.prototype.checkoutReference = function(reference, create) {
      return this.getRepo().checkoutReference(reference, create);
    };

    Git.prototype.getDiffStats = function(path) {
      var repo;
      repo = this.getRepo(path);
      return repo.getDiffStats(repo.relativize(path));
    };

    Git.prototype.isSubmodule = function(path) {
      var repo;
      if (!path) {
        return false;
      }
      repo = this.getRepo(path);
      if (repo.isSubmodule(repo.relativize(path))) {
        return true;
      } else {
        return repo !== this.getRepo() && repo.relativize(join(path, 'dir')) === 'dir';
      }
    };

    Git.prototype.getDirectoryStatus = function(directoryPath) {
      var directoryStatus, path, status, _ref1;
      directoryPath = "" + (this.relativize(directoryPath)) + "/";
      directoryStatus = 0;
      _ref1 = this.statuses;
      for (path in _ref1) {
        status = _ref1[path];
        if (path.indexOf(directoryPath) === 0) {
          directoryStatus |= status;
        }
      }
      return directoryStatus;
    };

    Git.prototype.getLineDiffs = function(path, text) {
      var options, repo;
      options = {
        ignoreEolWhitespace: process.platform === 'win32'
      };
      repo = this.getRepo(path);
      return repo.getLineDiffs(repo.relativize(path), text, options);
    };

    Git.prototype.getConfigValue = function(key, path) {
      return this.getRepo(path).getConfigValue(key);
    };

    Git.prototype.getOriginUrl = function(path) {
      return this.getConfigValue('remote.origin.url', path);
    };

    Git.prototype.getUpstreamBranch = function(path) {
      return this.getRepo(path).getUpstreamBranch();
    };

    Git.prototype.getReferenceTarget = function(reference, path) {
      return this.getRepo(path).getReferenceTarget(reference);
    };

    Git.prototype.getReferences = function(path) {
      return this.getRepo(path).getReferences();
    };

    Git.prototype.getAheadBehindCount = function(reference, path) {
      return this.getRepo(path).getAheadBehindCount(reference);
    };

    Git.prototype.getCachedUpstreamAheadBehindCount = function(path) {
      var _ref1;
      return (_ref1 = this.getRepo(path).upstream) != null ? _ref1 : this.upstream;
    };

    Git.prototype.getCachedPathStatus = function(path) {
      return this.statuses[this.relativize(path)];
    };

    Git.prototype.hasBranch = function(branch) {
      return this.getReferenceTarget("refs/heads/" + branch) != null;
    };

    Git.prototype.refreshStatus = function() {
      var _ref1;
      if (this.handlerPath == null) {
        this.handlerPath = require.resolve('./repository-status-handler');
      }
      if ((_ref1 = this.statusTask) != null) {
        _ref1.terminate();
      }
      return this.statusTask = Task.once(this.handlerPath, this.getPath(), (function(_this) {
        return function(_arg) {
          var branch, statuses, statusesUnchanged, submodulePath, submoduleRepo, submodules, upstream, _ref2, _ref3, _ref4;
          statuses = _arg.statuses, upstream = _arg.upstream, branch = _arg.branch, submodules = _arg.submodules;
          statusesUnchanged = _.isEqual(statuses, _this.statuses) && _.isEqual(upstream, _this.upstream) && _.isEqual(branch, _this.branch) && _.isEqual(submodules, _this.submodules);
          _this.statuses = statuses;
          _this.upstream = upstream;
          _this.branch = branch;
          _this.submodules = submodules;
          _ref2 = _this.getRepo().submodules;
          for (submodulePath in _ref2) {
            submoduleRepo = _ref2[submodulePath];
            submoduleRepo.upstream = (_ref3 = (_ref4 = submodules[submodulePath]) != null ? _ref4.upstream : void 0) != null ? _ref3 : {
              ahead: 0,
              behind: 0
            };
          }
          if (!statusesUnchanged) {
            return _this.emit('statuses-changed');
          }
        };
      })(this));
    };

    return Git;

  })();

}).call(this);
