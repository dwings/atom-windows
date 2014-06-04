(function() {
  var $, EditorComponent, React, ReactEditorView, View, defaults, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('space-pen'), View = _ref.View, $ = _ref.$;

  React = require('react-atom-fork');

  EditorComponent = require('./editor-component');

  defaults = require('underscore-plus').defaults;

  module.exports = ReactEditorView = (function(_super) {
    __extends(ReactEditorView, _super);

    ReactEditorView.content = function() {
      return this.div({
        "class": 'react-wrapper overlayer'
      });
    };

    ReactEditorView.prototype.focusOnAttach = false;

    function ReactEditorView(editor, props) {
      this.editor = editor;
      this.props = props;
      ReactEditorView.__super__.constructor.apply(this, arguments);
    }

    ReactEditorView.prototype.getEditor = function() {
      return this.editor;
    };

    Object.defineProperty(ReactEditorView.prototype, 'lineHeight', {
      get: function() {
        return this.editor.getLineHeightInPixels();
      }
    });

    Object.defineProperty(ReactEditorView.prototype, 'charWidth', {
      get: function() {
        return this.editor.getDefaultCharWidth();
      }
    });

    Object.defineProperty(ReactEditorView.prototype, 'firstRenderedScreenRow', {
      get: function() {
        return this.component.getRenderedRowRange()[0];
      }
    });

    Object.defineProperty(ReactEditorView.prototype, 'lastRenderedScreenRow', {
      get: function() {
        return this.component.getRenderedRowRange()[1];
      }
    });

    ReactEditorView.prototype.scrollTop = function(scrollTop) {
      if (scrollTop != null) {
        return this.editor.setScrollTop(scrollTop);
      } else {
        return this.editor.getScrollTop();
      }
    };

    ReactEditorView.prototype.scrollLeft = function(scrollLeft) {
      if (scrollLeft != null) {
        return this.editor.setScrollLeft(scrollLeft);
      } else {
        return this.editor.getScrollLeft();
      }
    };

    ReactEditorView.prototype.scrollToScreenPosition = function(screenPosition) {
      return this.editor.scrollToScreenPosition(screenPosition);
    };

    ReactEditorView.prototype.scrollToBufferPosition = function(bufferPosition) {
      return this.editor.scrollToBufferPosition(bufferPosition);
    };

    ReactEditorView.prototype.afterAttach = function(onDom) {
      var node, props;
      if (!onDom) {
        return;
      }
      this.attached = true;
      props = defaults({
        editor: this.editor,
        parentView: this
      }, this.props);
      this.component = React.renderComponent(EditorComponent(props), this.element);
      node = this.component.getDOMNode();
      this.underlayer = $(node).find('.selections');
      this.gutter = $(node).find('.gutter');
      this.gutter.removeClassFromAllLines = (function(_this) {
        return function(klass) {
          return _this.gutter.find('.line-number').removeClass(klass);
        };
      })(this);
      this.gutter.addClassToLine = (function(_this) {
        return function(bufferRow, klass) {
          var lines;
          lines = _this.gutter.find("[data-buffer-row='" + bufferRow + "']");
          lines.addClass(klass);
          return lines.length > 0;
        };
      })(this);
      if (this.focusOnAttach) {
        this.focus();
      }
      return this.trigger('editor:attached', [this]);
    };

    ReactEditorView.prototype.pixelPositionForBufferPosition = function(bufferPosition) {
      return this.editor.pixelPositionForBufferPosition(bufferPosition);
    };

    ReactEditorView.prototype.pixelPositionForScreenPosition = function(screenPosition) {
      return this.editor.pixelPositionForScreenPosition(screenPosition);
    };

    ReactEditorView.prototype.appendToLinesView = function(view) {
      view.css('position', 'absolute');
      view.css('z-index', 1);
      return this.find('.lines').prepend(view);
    };

    ReactEditorView.prototype.beforeRemove = function() {
      React.unmountComponentAtNode(this.element);
      this.attached = false;
      return this.trigger('editor:detached', this);
    };

    ReactEditorView.prototype.getPane = function() {
      return this.closest('.pane').view();
    };

    ReactEditorView.prototype.focus = function() {
      if (this.component != null) {
        return this.component.onFocus();
      } else {
        return this.focusOnAttach = true;
      }
    };

    ReactEditorView.prototype.hide = function() {
      ReactEditorView.__super__.hide.apply(this, arguments);
      return this.component.hide();
    };

    ReactEditorView.prototype.show = function() {
      ReactEditorView.__super__.show.apply(this, arguments);
      return this.component.show();
    };

    ReactEditorView.prototype.requestDisplayUpdate = function() {};

    return ReactEditorView;

  })(View);

}).call(this);
