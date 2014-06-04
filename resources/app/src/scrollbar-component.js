(function() {
  var React, ScrollbarComponent, div, extend, isEqualForProperties, _ref;

  React = require('react-atom-fork');

  div = require('reactionary-atom-fork').div;

  _ref = require('underscore-plus'), extend = _ref.extend, isEqualForProperties = _ref.isEqualForProperties;

  module.exports = ScrollbarComponent = React.createClass({
    displayName: 'ScrollbarComponent',
    render: function() {
      var className, horizontalScrollbarHeight, orientation, scrollHeight, scrollWidth, scrollableInOppositeDirection, style, verticalScrollbarWidth, visible, _ref1, _ref2;
      _ref1 = this.props, orientation = _ref1.orientation, className = _ref1.className, scrollHeight = _ref1.scrollHeight, scrollWidth = _ref1.scrollWidth, visible = _ref1.visible;
      _ref2 = this.props, scrollableInOppositeDirection = _ref2.scrollableInOppositeDirection, horizontalScrollbarHeight = _ref2.horizontalScrollbarHeight, verticalScrollbarWidth = _ref2.verticalScrollbarWidth;
      style = {};
      if (!visible) {
        style.display = 'none';
      }
      switch (orientation) {
        case 'vertical':
          style.width = verticalScrollbarWidth;
          if (scrollableInOppositeDirection) {
            style.bottom = horizontalScrollbarHeight;
          }
          break;
        case 'horizontal':
          style.height = horizontalScrollbarHeight;
          if (scrollableInOppositeDirection) {
            style.right = verticalScrollbarWidth;
          }
      }
      return div({
        className: className,
        style: style,
        onScroll: this.onScroll
      }, (function() {
        switch (orientation) {
          case 'vertical':
            return div({
              className: 'scrollbar-content',
              style: {
                height: scrollHeight
              }
            });
          case 'horizontal':
            return div({
              className: 'scrollbar-content',
              style: {
                width: scrollWidth
              }
            });
        }
      })());
    },
    componentDidMount: function() {
      var orientation;
      orientation = this.props.orientation;
      if (!(orientation === 'vertical' || orientation === 'horizontal')) {
        throw new Error("Must specify an orientation property of 'vertical' or 'horizontal'");
      }
    },
    shouldComponentUpdate: function(newProps) {
      if (newProps.visible !== this.props.visible) {
        return true;
      }
      switch (this.props.orientation) {
        case 'vertical':
          return !isEqualForProperties(newProps, this.props, 'scrollHeight', 'scrollTop', 'scrollableInOppositeDirection');
        case 'horizontal':
          return !isEqualForProperties(newProps, this.props, 'scrollWidth', 'scrollLeft', 'scrollableInOppositeDirection');
      }
    },
    componentDidUpdate: function() {
      var node, orientation, scrollLeft, scrollTop, _ref1;
      _ref1 = this.props, orientation = _ref1.orientation, scrollTop = _ref1.scrollTop, scrollLeft = _ref1.scrollLeft;
      node = this.getDOMNode();
      switch (orientation) {
        case 'vertical':
          node.scrollTop = scrollTop;
          return this.props.scrollTop = node.scrollTop;
        case 'horizontal':
          node.scrollLeft = scrollLeft;
          return this.props.scrollLeft = node.scrollLeft;
      }
    },
    onScroll: function() {
      var node, onScroll, orientation, scrollLeft, scrollTop, _ref1;
      _ref1 = this.props, orientation = _ref1.orientation, onScroll = _ref1.onScroll;
      node = this.getDOMNode();
      switch (orientation) {
        case 'vertical':
          scrollTop = node.scrollTop;
          this.props.scrollTop = scrollTop;
          return onScroll(scrollTop);
        case 'horizontal':
          scrollLeft = node.scrollLeft;
          this.props.scrollLeft = scrollLeft;
          return onScroll(scrollLeft);
      }
    }
  });

}).call(this);
