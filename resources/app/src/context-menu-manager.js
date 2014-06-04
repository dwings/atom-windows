(function() {
  var $, ContextMenuManager, remote, _;

  $ = require('./space-pen-extensions').$;

  _ = require('underscore-plus');

  remote = require('remote');

  module.exports = ContextMenuManager = (function() {
    function ContextMenuManager(devMode) {
      this.devMode = devMode != null ? devMode : false;
      this.definitions = {};
      this.devModeDefinitions = {};
      this.activeElement = null;
      this.devModeDefinitions['.workspace'] = [
        {
          label: 'Inspect Element',
          command: 'application:inspect',
          executeAtBuild: function(e) {
            return this.commandOptions = {
              x: e.pageX,
              y: e.pageY
            };
          }
        }
      ];
    }

    ContextMenuManager.prototype.add = function(name, object, _arg) {
      var command, commandOrSubmenu, devMode, items, label, menuItem, selector, submenu, submenuLabel, _results;
      devMode = (_arg != null ? _arg : {}).devMode;
      _results = [];
      for (selector in object) {
        items = object[selector];
        _results.push((function() {
          var _results1;
          _results1 = [];
          for (label in items) {
            commandOrSubmenu = items[label];
            if (typeof commandOrSubmenu === 'object') {
              submenu = [];
              for (submenuLabel in commandOrSubmenu) {
                command = commandOrSubmenu[submenuLabel];
                submenu.push(this.buildMenuItem(submenuLabel, command));
              }
              _results1.push(this.addBySelector(selector, {
                label: label,
                submenu: submenu
              }, {
                devMode: devMode
              }));
            } else {
              menuItem = this.buildMenuItem(label, commandOrSubmenu);
              _results1.push(this.addBySelector(selector, menuItem, {
                devMode: devMode
              }));
            }
          }
          return _results1;
        }).call(this));
      }
      return _results;
    };

    ContextMenuManager.prototype.buildMenuItem = function(label, command) {
      if ((label === command && command === '-')) {
        return {
          type: 'separator'
        };
      } else {
        return {
          label: label,
          command: command
        };
      }
    };

    ContextMenuManager.prototype.addBySelector = function(selector, definition, _arg) {
      var definitions, devMode;
      devMode = (_arg != null ? _arg : {}).devMode;
      definitions = devMode ? this.devModeDefinitions : this.definitions;
      return (definitions[selector] != null ? definitions[selector] : definitions[selector] = []).push(definition);
    };

    ContextMenuManager.prototype.definitionsForElement = function(element, _arg) {
      var definitions, devMode, item, items, matchedDefinitions, selector, _i, _len;
      devMode = (_arg != null ? _arg : {}).devMode;
      definitions = devMode ? this.devModeDefinitions : this.definitions;
      matchedDefinitions = [];
      for (selector in definitions) {
        items = definitions[selector];
        if (element.webkitMatchesSelector(selector)) {
          for (_i = 0, _len = items.length; _i < _len; _i++) {
            item = items[_i];
            matchedDefinitions.push(_.clone(item));
          }
        }
      }
      return matchedDefinitions;
    };

    ContextMenuManager.prototype.menuTemplateForMostSpecificElement = function(element, _arg) {
      var devMode, menuTemplate;
      devMode = (_arg != null ? _arg : {}).devMode;
      menuTemplate = this.definitionsForElement(element, {
        devMode: devMode
      });
      if (element.parentElement) {
        return menuTemplate.concat(this.menuTemplateForMostSpecificElement(element.parentElement, {
          devMode: devMode
        }));
      } else {
        return menuTemplate;
      }
    };

    ContextMenuManager.prototype.combinedMenuTemplateForElement = function(element) {
      var devItems, menuTemplate, normalItems;
      normalItems = this.menuTemplateForMostSpecificElement(element);
      devItems = this.devMode ? this.menuTemplateForMostSpecificElement(element, {
        devMode: true
      }) : [];
      menuTemplate = normalItems;
      if (normalItems.length > 0 && devItems.length > 0) {
        menuTemplate.push({
          type: 'separator'
        });
      }
      return menuTemplate.concat(devItems);
    };

    ContextMenuManager.prototype.executeBuildHandlers = function(event, menuTemplate) {
      var template, _i, _len, _ref, _results;
      _results = [];
      for (_i = 0, _len = menuTemplate.length; _i < _len; _i++) {
        template = menuTemplate[_i];
        if (template != null) {
          if ((_ref = template.executeAtBuild) != null) {
            _ref.call(template, event);
          }
        }
        _results.push(delete template.executeAtBuild);
      }
      return _results;
    };

    ContextMenuManager.prototype.showForEvent = function(event) {
      var menuTemplate;
      this.activeElement = event.target;
      menuTemplate = this.combinedMenuTemplateForElement(event.target);
      if (!((menuTemplate != null ? menuTemplate.length : void 0) > 0)) {
        return;
      }
      this.executeBuildHandlers(event, menuTemplate);
      return remote.getCurrentWindow().emit('context-menu', menuTemplate);
    };

    return ContextMenuManager;

  })();

}).call(this);
