(function() {
  var React, SelectionComponent, div;

  React = require('react-atom-fork');

  div = require('reactionary-atom-fork').div;

  module.exports = SelectionComponent = React.createClass({
    displayName: 'SelectionComponent',
    render: function() {
      var editor, end, endPixelPosition, lineHeightInPixels, rowCount, screenRange, start, startPixelPosition, _ref;
      _ref = this.props, editor = _ref.editor, screenRange = _ref.screenRange, lineHeightInPixels = _ref.lineHeightInPixels;
      start = screenRange.start, end = screenRange.end;
      rowCount = end.row - start.row + 1;
      startPixelPosition = editor.pixelPositionForScreenPosition(start);
      endPixelPosition = editor.pixelPositionForScreenPosition(end);
      return div({
        className: 'selection'
      }, rowCount === 1 ? this.renderSingleLineRegions(startPixelPosition, endPixelPosition) : this.renderMultiLineRegions(startPixelPosition, endPixelPosition, rowCount));
    },
    renderSingleLineRegions: function(startPixelPosition, endPixelPosition) {
      var lineHeightInPixels;
      lineHeightInPixels = this.props.lineHeightInPixels;
      return [
        div({
          className: 'region',
          key: 0,
          style: {
            top: startPixelPosition.top,
            height: lineHeightInPixels,
            left: startPixelPosition.left,
            width: endPixelPosition.left - startPixelPosition.left
          }
        })
      ];
    },
    renderMultiLineRegions: function(startPixelPosition, endPixelPosition, rowCount) {
      var index, lineHeightInPixels, regions;
      lineHeightInPixels = this.props.lineHeightInPixels;
      regions = [];
      index = 0;
      regions.push(div({
        className: 'region',
        key: index++,
        style: {
          top: startPixelPosition.top,
          left: startPixelPosition.left,
          height: lineHeightInPixels,
          right: 0
        }
      }));
      if (rowCount > 2) {
        regions.push(div({
          className: 'region',
          key: index++,
          style: {
            top: startPixelPosition.top + lineHeightInPixels,
            height: (rowCount - 2) * lineHeightInPixels,
            left: 0,
            right: 0
          }
        }));
      }
      regions.push(div({
        className: 'region',
        key: index,
        style: {
          top: endPixelPosition.top,
          height: lineHeightInPixels,
          left: 0,
          width: endPixelPosition.left
        }
      }));
      return regions;
    }
  });

}).call(this);
