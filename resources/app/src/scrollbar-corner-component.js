(function() {
  var React, ScrollbarCornerComponent, div, isEqualForProperties;

  React = require('react-atom-fork');

  div = require('reactionary-atom-fork').div;

  isEqualForProperties = require('underscore-plus').isEqualForProperties;

  module.exports = ScrollbarCornerComponent = React.createClass({
    displayName: 'ScrollbarCornerComponent',
    render: function() {
      var display, height, measuringScrollbars, visible, width, _ref;
      _ref = this.props, visible = _ref.visible, measuringScrollbars = _ref.measuringScrollbars, width = _ref.width, height = _ref.height;
      if (measuringScrollbars) {
        height = 25;
        width = 25;
      }
      if (!visible) {
        display = 'none';
      }
      return div({
        className: 'scrollbar-corner',
        style: {
          display: display,
          width: width,
          height: height
        }
      }, div({
        style: {
          height: height + 1,
          width: width + 1
        }
      }));
    },
    shouldComponentUpdate: function(newProps) {
      return !isEqualForProperties(newProps, this.props, 'measuringScrollbars', 'visible', 'width', 'height');
    }
  });

}).call(this);
