(function() {
  var child_process, fs, path;

  child_process = require('child_process');

  fs = require('fs');

  path = require('path');

  module.exports = {
    getHomeDirectory: function() {
      if (process.platform === 'win32') {
        return process.env.USERPROFILE;
      } else {
        return process.env.HOME;
      }
    },
    getAtomDirectory: function() {
      var _ref;
      return (_ref = process.env.ATOM_HOME) != null ? _ref : path.join(this.getHomeDirectory(), '.atom');
    },
    getPackageCacheDirectory: function() {
      return path.join(this.getAtomDirectory(), '.node-gyp', '.atom', '.apm');
    },
    getResourcePath: function(callback) {
      var apmFolder, appFolder;
      if (process.env.ATOM_RESOURCE_PATH) {
        return process.nextTick(function() {
          return callback(process.env.ATOM_RESOURCE_PATH);
        });
      } else {
        apmFolder = path.resolve(__dirname, '..', '..', '..');
        appFolder = path.dirname(apmFolder);
        if (path.basename(apmFolder) === 'apm' && path.basename(appFolder) === 'app') {
          return process.nextTick(function() {
            return callback(appFolder);
          });
        } else {
          switch (process.platform) {
            case 'darwin':
              return child_process.exec('mdfind "kMDItemCFBundleIdentifier == \'com.github.atom\'"', function(error, stdout, stderr) {
                var appLocation, _ref;
                if (stdout == null) {
                  stdout = '';
                }
                appLocation = (_ref = stdout.split('\n')[0]) != null ? _ref : '/Applications/Atom.app';
                return callback("" + appLocation + "/Contents/Resources/app");
              });
            case 'linux':
              return process.nextTick(function() {
                return callback('/usr/local/share/atom/resources/app');
              });
            case 'win32':
              return process.nextTick(function() {
                return callback(path.join(process.env.ProgramFiles, 'Atom', 'resources', 'app'));
              });
          }
        }
      }
    },
    getReposDirectory: function() {
      var _ref;
      return (_ref = process.env.ATOM_REPOS_HOME) != null ? _ref : path.join(this.getHomeDirectory(), 'github');
    },
    getNodeUrl: function() {
      var _ref;
      return (_ref = process.env.ATOM_NODE_URL) != null ? _ref : 'https://gh-contractor-zcbenz.s3.amazonaws.com/atom-shell/dist';
    },
    getAtomPackagesUrl: function() {
      var _ref;
      return (_ref = process.env.ATOM_PACKAGES_URL) != null ? _ref : 'https://atom.io/api/packages';
    },
    getNodeVersion: function() {
      var _ref;
      return (_ref = process.env.ATOM_NODE_VERSION) != null ? _ref : '0.11.10';
    },
    getNodeArch: function() {
      switch (process.platform) {
        case 'darwin':
          return 'x64';
        case 'win32':
          return 'ia32';
        default:
          return process.arch;
      }
    },
    getUserConfigPath: function() {
      return path.resolve(this.getAtomDirectory(), '.apmrc');
    },
    getGlobalConfigPath: function() {
      return path.resolve(__dirname, '..', '.apmrc');
    },
    isWin32: function() {
      return !!process.platform.match(/^win/);
    },
    isWindows64Bit: function() {
      return fs.existsSync("C:\\Windows\\SysWow64\\Notepad.exe");
    },
    x86ProgramFilesDirectory: function() {
      return process.env["ProgramFiles(x86)"] || process.env["ProgramFiles"];
    },
    getInstalledVisualStudioFlag: function() {
      var vs2010Path, vs2012Path, vs2013Path;
      if (!this.isWin32()) {
        return null;
      }
      vs2010Path = path.join(this.x86ProgramFilesDirectory(), "Microsoft Visual Studio 10.0", "Common7", "IDE");
      if (fs.existsSync(vs2010Path)) {
        return '2010';
      }
      vs2012Path = path.join(this.x86ProgramFilesDirectory(), "Microsoft Visual Studio 11.0", "Common7", "IDE");
      if (fs.existsSync(vs2012Path)) {
        return '2012';
      }
      vs2013Path = path.join(this.x86ProgramFilesDirectory(), "Microsoft Visual Studio 12.0", "Common7", "IDE");
      if (fs.existsSync(vs2013Path)) {
        return '2013';
      }
    }
  };

}).call(this);
