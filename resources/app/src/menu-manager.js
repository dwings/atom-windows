(function() {
  var CSON, MenuManager, fs, ipc, path, _;

  path = require('path');

  _ = require('underscore-plus');

  ipc = require('ipc');

  CSON = require('season');

  fs = require('fs-plus');

  module.exports = MenuManager = (function() {
    function MenuManager(_arg) {
      this.resourcePath = _arg.resourcePath;
      this.pendingUpdateOperation = null;
      this.template = [];
      atom.keymaps.on('bundled-keymaps-loaded', (function(_this) {
        return function() {
          return _this.loadPlatformItems();
        };
      })(this));
    }

    MenuManager.prototype.add = function(items) {
      var item, _i, _len;
      for (_i = 0, _len = items.length; _i < _len; _i++) {
        item = items[_i];
        this.merge(this.template, item);
      }
      return this.update();
    };

    MenuManager.prototype.includeSelector = function(selector) {
      var element, error, testBody, testWorkspace, workspaceClasses, _ref, _ref1;
      try {
        if (document.body.webkitMatchesSelector(selector)) {
          return true;
        }
      } catch (_error) {
        error = _error;
        return false;
      }
      if (this.testEditor == null) {
        testBody = document.createElement('body');
        (_ref = testBody.classList).add.apply(_ref, this.classesForElement(document.body));
        testWorkspace = document.createElement('div');
        workspaceClasses = this.classesForElement(document.body.querySelector('.workspace'));
        if (workspaceClasses.length === 0) {
          workspaceClasses = ['workspace'];
        }
        (_ref1 = testWorkspace.classList).add.apply(_ref1, workspaceClasses);
        testBody.appendChild(testWorkspace);
        this.testEditor = document.createElement('div');
        this.testEditor.classList.add('editor');
        testWorkspace.appendChild(this.testEditor);
      }
      element = this.testEditor;
      while (element) {
        if (element.webkitMatchesSelector(selector)) {
          return true;
        }
        element = element.parentElement;
      }
      return false;
    };

    MenuManager.prototype.update = function() {
      if (this.pendingUpdateOperation != null) {
        clearImmediate(this.pendingUpdateOperation);
      }
      return this.pendingUpdateOperation = setImmediate((function(_this) {
        return function() {
          var binding, keystrokesByCommand, _i, _len, _name, _ref;
          keystrokesByCommand = {};
          _ref = atom.keymaps.getKeyBindings();
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            binding = _ref[_i];
            if (!(_this.includeSelector(binding.selector))) {
              continue;
            }
            if (keystrokesByCommand[_name = binding.command] == null) {
              keystrokesByCommand[_name] = [];
            }
            keystrokesByCommand[binding.command].unshift(binding.keystrokes);
          }
          return _this.sendToBrowserProcess(_this.template, keystrokesByCommand);
        };
      })(this));
    };

    MenuManager.prototype.loadPlatformItems = function() {
      var menu, menusDirPath, platformMenuPath;
      menusDirPath = path.join(this.resourcePath, 'menus');
      platformMenuPath = fs.resolve(menusDirPath, process.platform, ['cson', 'json']);
      menu = CSON.readFileSync(platformMenuPath).menu;
      return this.add(menu);
    };

    MenuManager.prototype.merge = function(menu, item) {
      var i, match, _i, _len, _ref, _results;
      item = _.deepClone(item);
      if ((item.submenu != null) && (match = _.find(menu, (function(_this) {
        return function(_arg) {
          var label, submenu;
          label = _arg.label, submenu = _arg.submenu;
          return (submenu != null) && label && _this.normalizeLabel(label) === _this.normalizeLabel(item.label);
        };
      })(this)))) {
        _ref = item.submenu;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _results.push(this.merge(match.submenu, i));
        }
        return _results;
      } else {
        if (!_.find(menu, (function(_this) {
          return function(_arg) {
            var label;
            label = _arg.label;
            return label && _this.normalizeLabel(label) === _this.normalizeLabel(item.label);
          };
        })(this))) {
          return menu.push(item);
        }
      }
    };

    MenuManager.prototype.filterMultipleKeystroke = function(keystrokesByCommand) {
      var binding, bindings, filtered, key, _i, _len;
      filtered = {};
      for (key in keystrokesByCommand) {
        bindings = keystrokesByCommand[key];
        for (_i = 0, _len = bindings.length; _i < _len; _i++) {
          binding = bindings[_i];
          if (binding.indexOf(' ') !== -1) {
            continue;
          }
          if (filtered[key] == null) {
            filtered[key] = [];
          }
          filtered[key].push(binding);
        }
      }
      return filtered;
    };

    MenuManager.prototype.sendToBrowserProcess = function(template, keystrokesByCommand) {
      keystrokesByCommand = this.filterMultipleKeystroke(keystrokesByCommand);
      return ipc.send('update-application-menu', template, keystrokesByCommand);
    };

    MenuManager.prototype.normalizeLabel = function(label) {
      if (label == null) {
        return void 0;
      }
      if (process.platform === 'darwin') {
        return label;
      } else {
        return label.replace(/\&/g, '');
      }
    };

    MenuManager.prototype.classesForElement = function(element) {
      var _ref;
      return (_ref = element != null ? element.classList.toString().split(' ') : void 0) != null ? _ref : [];
    };

    return MenuManager;

  })();

}).call(this);
