(function() {
  var CursorComponent, CursorsComponent, React, SubscriberMixin, debounce, div, isEqual, isEqualForProperties, toArray, _ref;

  React = require('react-atom-fork');

  div = require('reactionary-atom-fork').div;

  _ref = require('underscore-plus'), debounce = _ref.debounce, toArray = _ref.toArray, isEqualForProperties = _ref.isEqualForProperties, isEqual = _ref.isEqual;

  SubscriberMixin = require('./subscriber-mixin');

  CursorComponent = require('./cursor-component');

  module.exports = CursorsComponent = React.createClass({
    displayName: 'CursorsComponent',
    mixins: [SubscriberMixin],
    cursorBlinkIntervalHandle: null,
    render: function() {
      var blinkOff, className, cursorScreenRanges, editor, key, screenRange, scrollLeft, scrollTop, _ref1;
      _ref1 = this.props, editor = _ref1.editor, cursorScreenRanges = _ref1.cursorScreenRanges, scrollTop = _ref1.scrollTop, scrollLeft = _ref1.scrollLeft;
      blinkOff = this.state.blinkOff;
      className = 'cursors';
      if (blinkOff) {
        className += ' blink-off';
      }
      return div({
        className: className
      }, (function() {
        var _results;
        if (this.isMounted()) {
          _results = [];
          for (key in cursorScreenRanges) {
            screenRange = cursorScreenRanges[key];
            _results.push(CursorComponent({
              key: key,
              editor: editor,
              screenRange: screenRange,
              scrollTop: scrollTop,
              scrollLeft: scrollLeft
            }));
          }
          return _results;
        }
      }).call(this));
    },
    getInitialState: function() {
      return {
        blinkOff: false
      };
    },
    componentDidMount: function() {
      return this.startBlinkingCursors();
    },
    componentWillUnmount: function() {
      return this.stopBlinkingCursors();
    },
    shouldComponentUpdate: function(newProps, newState) {
      return !newState.blinkOff === this.state.blinkOff || !isEqualForProperties(newProps, this.props, 'cursorScreenRanges', 'scrollTop', 'scrollLeft', 'lineHeightInPixels', 'defaultCharWidth');
    },
    componentWillUpdate: function(newProps) {
      if (this.props.cursorScreenRanges && !isEqual(newProps.cursorScreenRanges, this.props.cursorScreenRanges)) {
        return this.pauseCursorBlinking();
      }
    },
    startBlinkingCursors: function() {
      if (this.isMounted()) {
        return this.toggleCursorBlinkHandle = setInterval(this.toggleCursorBlink, this.props.cursorBlinkPeriod / 2);
      }
    },
    startBlinkingCursorsAfterDelay: null,
    stopBlinkingCursors: function() {
      return clearInterval(this.toggleCursorBlinkHandle);
    },
    toggleCursorBlink: function() {
      return this.setState({
        blinkOff: !this.state.blinkOff
      });
    },
    pauseCursorBlinking: function() {
      this.state.blinkOff = false;
      this.stopBlinkingCursors();
      if (this.startBlinkingCursorsAfterDelay == null) {
        this.startBlinkingCursorsAfterDelay = debounce(this.startBlinkingCursors, this.props.cursorBlinkResumeDelay);
      }
      return this.startBlinkingCursorsAfterDelay();
    }
  });

}).call(this);
