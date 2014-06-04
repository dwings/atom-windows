(function() {
  var Delegator, Editor, Model, Pane, PaneContainer, Q, Serializable, Workspace, deprecate, join, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  deprecate = require('grim').deprecate;

  _ = require('underscore-plus');

  join = require('path').join;

  Model = require('theorist').Model;

  Q = require('q');

  Serializable = require('serializable');

  Delegator = require('delegato');

  Editor = require('./editor');

  PaneContainer = require('./pane-container');

  Pane = require('./pane');

  module.exports = Workspace = (function(_super) {
    __extends(Workspace, _super);

    atom.deserializers.add(Workspace);

    Serializable.includeInto(Workspace);

    Workspace.delegatesProperty('activePane', 'activePaneItem', {
      toProperty: 'paneContainer'
    });

    Workspace.properties({
      paneContainer: function() {
        return new PaneContainer;
      },
      fullScreen: false,
      destroyedItemUris: function() {
        return [];
      }
    });

    function Workspace() {
      this.onPaneItemDestroyed = __bind(this.onPaneItemDestroyed, this);
      Workspace.__super__.constructor.apply(this, arguments);
      this.openers = [];
      this.subscribe(this.paneContainer, 'item-destroyed', this.onPaneItemDestroyed);
      this.registerOpener((function(_this) {
        return function(filePath) {
          switch (filePath) {
            case 'atom://.atom/stylesheet':
              return _this.open(atom.themes.getUserStylesheetPath());
            case 'atom://.atom/keymap':
              return _this.open(atom.keymaps.getUserKeymapPath());
            case 'atom://.atom/config':
              return _this.open(atom.config.getUserConfigPath());
            case 'atom://.atom/init-script':
              return _this.open(atom.getUserInitScriptPath());
          }
        };
      })(this));
    }

    Workspace.prototype.deserializeParams = function(params) {
      params.paneContainer = PaneContainer.deserialize(params.paneContainer);
      return params;
    };

    Workspace.prototype.serializeParams = function() {
      return {
        paneContainer: this.paneContainer.serialize(),
        fullScreen: atom.isFullScreen()
      };
    };

    Workspace.prototype.editorAdded = function(editor) {
      return this.emit('editor-created', editor);
    };

    Workspace.prototype.eachEditor = function(callback) {
      var editor, _i, _len, _ref;
      _ref = this.getEditors();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        editor = _ref[_i];
        callback(editor);
      }
      return this.subscribe(this, 'editor-created', function(editor) {
        return callback(editor);
      });
    };

    Workspace.prototype.getEditors = function() {
      var editors, item, pane, _i, _j, _len, _len1, _ref, _ref1;
      editors = [];
      _ref = this.paneContainer.getPanes();
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        pane = _ref[_i];
        _ref1 = pane.getItems();
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          item = _ref1[_j];
          if (item instanceof Editor) {
            editors.push(item);
          }
        }
      }
      return editors;
    };

    Workspace.prototype.open = function(uri, options) {
      var pane, searchAllPanes, split;
      if (options == null) {
        options = {};
      }
      searchAllPanes = options.searchAllPanes;
      split = options.split;
      uri = atom.project.resolve(uri);
      if (searchAllPanes) {
        pane = this.paneContainer.paneForUri(uri);
      }
      if (pane == null) {
        pane = (function() {
          switch (split) {
            case 'left':
              return this.activePane.findLeftmostSibling();
            case 'right':
              return this.activePane.findOrCreateRightmostSibling();
            default:
              return this.activePane;
          }
        }).call(this);
      }
      return this.openUriInPane(uri, pane, options);
    };

    Workspace.prototype.openLicense = function() {
      return this.open(join(atom.getLoadSettings().resourcePath, 'LICENSE.md'));
    };

    Workspace.prototype.openSync = function(uri, options) {
      var activatePane, initialColumn, initialLine, item, opener, _i, _len, _ref, _ref1, _ref2;
      if (uri == null) {
        uri = '';
      }
      if (options == null) {
        options = {};
      }
      if (options.changeFocus != null) {
        deprecate("Don't use the `changeFocus` option");
      }
      initialLine = options.initialLine, initialColumn = options.initialColumn;
      activatePane = (_ref = (_ref1 = options.activatePane) != null ? _ref1 : options.changeFocus) != null ? _ref : true;
      uri = atom.project.resolve(uri);
      item = this.activePane.itemForUri(uri);
      if (uri) {
        _ref2 = this.getOpeners();
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          opener = _ref2[_i];
          if (!item) {
            if (item == null) {
              item = opener(uri, options);
            }
          }
        }
      }
      if (item == null) {
        item = atom.project.openSync(uri, {
          initialLine: initialLine,
          initialColumn: initialColumn
        });
      }
      this.activePane.activateItem(item);
      this.itemOpened(item);
      if (activatePane) {
        this.activePane.activate();
      }
      return item;
    };

    Workspace.prototype.openUriInPane = function(uri, pane, options) {
      var changeFocus, item, opener, _i, _len, _ref, _ref1;
      if (options == null) {
        options = {};
      }
      changeFocus = (_ref = options.changeFocus) != null ? _ref : true;
      if (uri != null) {
        item = pane.itemForUri(uri);
        _ref1 = this.getOpeners();
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          opener = _ref1[_i];
          if (!item) {
            if (item == null) {
              item = opener(atom.project.resolve(uri), options);
            }
          }
        }
      }
      if (item == null) {
        item = atom.project.open(uri, options);
      }
      return Q(item).then((function(_this) {
        return function(item) {
          if (!pane) {
            pane = new Pane({
              items: [item]
            });
            _this.paneContainer.root = pane;
          }
          _this.itemOpened(item);
          pane.activateItem(item);
          if (changeFocus) {
            pane.activate();
          }
          _this.emit("uri-opened");
          return item;
        };
      })(this))["catch"](function(error) {
        var _ref2;
        return console.error((_ref2 = error.stack) != null ? _ref2 : error);
      });
    };

    Workspace.prototype.reopenItem = function() {
      var uri;
      if (uri = this.destroyedItemUris.pop()) {
        return this.open(uri);
      } else {
        return Q();
      }
    };

    Workspace.prototype.reopenItemSync = function() {
      var uri;
      deprecate("Use Workspace::reopenItem instead");
      if (uri = this.destroyedItemUris.pop()) {
        return this.openSync(uri);
      }
    };

    Workspace.prototype.registerOpener = function(opener) {
      return this.openers.push(opener);
    };

    Workspace.prototype.unregisterOpener = function(opener) {
      return _.remove(this.openers, opener);
    };

    Workspace.prototype.getOpeners = function() {
      return this.openers;
    };

    Workspace.prototype.getActivePane = function() {
      return this.paneContainer.activePane;
    };

    Workspace.prototype.getPanes = function() {
      return this.paneContainer.getPanes();
    };

    Workspace.prototype.saveAll = function() {
      return this.paneContainer.saveAll();
    };

    Workspace.prototype.activateNextPane = function() {
      return this.paneContainer.activateNextPane();
    };

    Workspace.prototype.activatePreviousPane = function() {
      return this.paneContainer.activatePreviousPane();
    };

    Workspace.prototype.paneForUri = function(uri) {
      return this.paneContainer.paneForUri(uri);
    };

    Workspace.prototype.getActivePaneItem = function() {
      return this.paneContainer.getActivePane().getActiveItem();
    };

    Workspace.prototype.saveActivePaneItem = function() {
      var _ref;
      return (_ref = this.activePane) != null ? _ref.saveActiveItem() : void 0;
    };

    Workspace.prototype.saveActivePaneItemAs = function() {
      var _ref;
      return (_ref = this.activePane) != null ? _ref.saveActiveItemAs() : void 0;
    };

    Workspace.prototype.destroyActivePaneItem = function() {
      var _ref;
      return (_ref = this.activePane) != null ? _ref.destroyActiveItem() : void 0;
    };

    Workspace.prototype.destroyActivePane = function() {
      var _ref;
      return (_ref = this.activePane) != null ? _ref.destroy() : void 0;
    };

    Workspace.prototype.getActiveEditor = function() {
      var _ref;
      return (_ref = this.activePane) != null ? _ref.getActiveEditor() : void 0;
    };

    Workspace.prototype.increaseFontSize = function() {
      return atom.config.set("editor.fontSize", atom.config.get("editor.fontSize") + 1);
    };

    Workspace.prototype.decreaseFontSize = function() {
      var fontSize;
      fontSize = atom.config.get("editor.fontSize");
      if (fontSize > 1) {
        return atom.config.set("editor.fontSize", fontSize - 1);
      }
    };

    Workspace.prototype.resetFontSize = function() {
      return atom.config.restoreDefault("editor.fontSize");
    };

    Workspace.prototype.itemOpened = function(item) {
      var uri;
      if (uri = typeof item.getUri === "function" ? item.getUri() : void 0) {
        return _.remove(this.destroyedItemUris, uri);
      }
    };

    Workspace.prototype.onPaneItemDestroyed = function(item) {
      var uri;
      if (uri = typeof item.getUri === "function" ? item.getUri() : void 0) {
        return this.destroyedItemUris.push(uri);
      }
    };

    Workspace.prototype.destroyed = function() {
      return this.paneContainer.destroy();
    };

    return Workspace;

  })(Model);

}).call(this);
