(function() {
  var CursorComponent, React, div;

  React = require('react-atom-fork');

  div = require('reactionary-atom-fork').div;

  module.exports = CursorComponent = React.createClass({
    displayName: 'CursorComponent',
    render: function() {
      var WebkitTransform, editor, height, left, screenRange, scrollLeft, scrollTop, top, width, _ref, _ref1;
      _ref = this.props, editor = _ref.editor, screenRange = _ref.screenRange, scrollTop = _ref.scrollTop, scrollLeft = _ref.scrollLeft;
      _ref1 = editor.pixelRectForScreenRange(screenRange), top = _ref1.top, left = _ref1.left, height = _ref1.height, width = _ref1.width;
      top -= scrollTop;
      left -= scrollLeft;
      WebkitTransform = "translate3d(" + left + "px, " + top + "px, 0px)";
      return div({
        className: 'cursor',
        style: {
          height: height,
          width: width,
          WebkitTransform: WebkitTransform
        }
      });
    }
  });

}).call(this);
