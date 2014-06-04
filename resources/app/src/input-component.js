(function() {
  var InputComponent, React, input, isEqual, last, punycode, _ref;

  punycode = require('punycode');

  _ref = require('underscore-plus'), last = _ref.last, isEqual = _ref.isEqual;

  React = require('react-atom-fork');

  input = require('reactionary-atom-fork').input;

  module.exports = InputComponent = React.createClass({
    displayName: 'InputComponent',
    render: function() {
      var className, onBlur, onFocus, style, _ref1;
      _ref1 = this.props, className = _ref1.className, style = _ref1.style, onFocus = _ref1.onFocus, onBlur = _ref1.onBlur;
      return input({
        className: className,
        style: style,
        onFocus: onFocus,
        onBlur: onBlur,
        'data-react-skip-selection-restoration': true
      });
    },
    getInitialState: function() {
      return {
        lastChar: ''
      };
    },
    componentDidMount: function() {
      this.getDOMNode().addEventListener('paste', this.onPaste);
      this.getDOMNode().addEventListener('input', this.onInput);
      return this.getDOMNode().addEventListener('compositionupdate', this.onCompositionUpdate);
    },
    componentDidUpdate: function() {
      if (this.lastValueLength > 500 && !this.isPressAndHoldCharacter(this.state.lastChar)) {
        this.getDOMNode().value = '';
        return this.lastValueLength = 0;
      }
    },
    isPressAndHoldCharacter: function(char) {
      return this.state.lastChar.match(/[aeiouAEIOU]/);
    },
    shouldComponentUpdate: function(newProps) {
      return !isEqual(newProps.style, this.props.style);
    },
    onPaste: function(e) {
      return e.preventDefault();
    },
    onInput: function(e) {
      var lastChar, replaceLastChar, valueCharCodes, valueLength, _base;
      e.stopPropagation();
      valueCharCodes = punycode.ucs2.decode(this.getDOMNode().value);
      valueLength = valueCharCodes.length;
      replaceLastChar = valueLength === this.lastValueLength;
      this.lastValueLength = valueLength;
      lastChar = String.fromCharCode(last(valueCharCodes));
      return typeof (_base = this.props).onInput === "function" ? _base.onInput(lastChar, replaceLastChar) : void 0;
    },
    onFocus: function() {
      var _base;
      return typeof (_base = this.props).onFocus === "function" ? _base.onFocus() : void 0;
    },
    onBlur: function() {
      var _base;
      return typeof (_base = this.props).onBlur === "function" ? _base.onBlur() : void 0;
    },
    focus: function() {
      return this.getDOMNode().focus();
    }
  });

}).call(this);
