(function() {
  var $, $$, GrammarRegistry, PropertyAccessors, ScopeSelector, ScopedPropertyStore, Subscriber, Syntax, Token, deprecate, specificity, _, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  _ = require('underscore-plus');

  deprecate = require('grim').deprecate;

  specificity = require('clear-cut').specificity;

  Subscriber = require('emissary').Subscriber;

  _ref = require('first-mate'), GrammarRegistry = _ref.GrammarRegistry, ScopeSelector = _ref.ScopeSelector;

  ScopedPropertyStore = require('scoped-property-store');

  PropertyAccessors = require('property-accessors');

  _ref1 = require('./space-pen-extensions'), $ = _ref1.$, $$ = _ref1.$$;

  Token = require('./token');

  module.exports = Syntax = (function(_super) {
    __extends(Syntax, _super);

    PropertyAccessors.includeInto(Syntax);

    Subscriber.includeInto(Syntax);

    atom.deserializers.add(Syntax);

    Syntax.deserialize = function(_arg) {
      var grammarOverridesByPath, syntax;
      grammarOverridesByPath = _arg.grammarOverridesByPath;
      syntax = new Syntax();
      syntax.grammarOverridesByPath = grammarOverridesByPath;
      return syntax;
    };

    function Syntax() {
      Syntax.__super__.constructor.call(this, {
        maxTokensPerLine: 100
      });
      this.propertyStore = new ScopedPropertyStore;
    }

    Syntax.prototype.serialize = function() {
      return {
        deserializer: this.constructor.name,
        grammarOverridesByPath: this.grammarOverridesByPath
      };
    };

    Syntax.prototype.createToken = function(value, scopes) {
      return new Token({
        value: value,
        scopes: scopes
      });
    };

    Syntax.prototype.accessor('scopedProperties', function() {
      deprecate("Use Syntax::getProperty instead");
      return this.propertyStore.propertySets;
    });

    Syntax.prototype.addProperties = function() {
      var args, name, properties, propertiesBySelector, selector;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length > 2) {
        name = args.shift();
      }
      selector = args[0], properties = args[1];
      propertiesBySelector = {};
      propertiesBySelector[selector] = properties;
      return this.propertyStore.addProperties(name, propertiesBySelector);
    };

    Syntax.prototype.removeProperties = function(name) {
      return this.propertyStore.removeProperties(name);
    };

    Syntax.prototype.clearProperties = function() {
      return this.propertyStore = new ScopedPropertyStore;
    };

    Syntax.prototype.getProperty = function(scope, keyPath) {
      var scopeChain;
      scopeChain = scope.map(function(scope) {
        if (scope[0] !== '.') {
          scope = "." + scope;
        }
        return scope;
      }).join(' ');
      return this.propertyStore.getPropertyValue(scopeChain, keyPath);
    };

    Syntax.prototype.propertiesForScope = function(scope, keyPath) {
      var scopeChain;
      scopeChain = scope.map(function(scope) {
        if (scope[0] !== '.') {
          scope = "." + scope;
        }
        return scope;
      }).join(' ');
      return this.propertyStore.getProperties(scopeChain, keyPath);
    };

    Syntax.prototype.cssSelectorFromScopeSelector = function(scopeSelector) {
      return new ScopeSelector(scopeSelector).toCssSelector();
    };

    return Syntax;

  })(GrammarRegistry);

}).call(this);
