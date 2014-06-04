(function() {
  var React, SelectionComponent, SelectionsComponent, div, isEqualForProperties;

  React = require('react-atom-fork');

  div = require('reactionary-atom-fork').div;

  isEqualForProperties = require('underscore-plus').isEqualForProperties;

  SelectionComponent = require('./selection-component');

  module.exports = SelectionsComponent = React.createClass({
    displayName: 'SelectionsComponent',
    render: function() {
      return div({
        className: 'selections'
      }, this.renderSelections());
    },
    renderSelections: function() {
      var editor, lineHeightInPixels, screenRange, selectionComponents, selectionId, selectionScreenRanges, _ref;
      _ref = this.props, editor = _ref.editor, selectionScreenRanges = _ref.selectionScreenRanges, lineHeightInPixels = _ref.lineHeightInPixels;
      selectionComponents = [];
      for (selectionId in selectionScreenRanges) {
        screenRange = selectionScreenRanges[selectionId];
        selectionComponents.push(SelectionComponent({
          key: selectionId,
          screenRange: screenRange,
          editor: editor,
          lineHeightInPixels: lineHeightInPixels
        }));
      }
      return selectionComponents;
    },
    componentWillMount: function() {
      return this.selectionRanges = {};
    },
    shouldComponentUpdate: function(newProps) {
      return !isEqualForProperties(newProps, this.props, 'selectionScreenRanges', 'lineHeightInPixels', 'defaultCharWidth');
    }
  });

}).call(this);
