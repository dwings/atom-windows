(function() {
  var GutterComponent, React, SubscriberMixin, WrapperDiv, div, isEqual, isEqualForProperties, multiplyString, toArray, _ref;

  React = require('react-atom-fork');

  div = require('reactionary-atom-fork').div;

  _ref = require('underscore-plus'), isEqual = _ref.isEqual, isEqualForProperties = _ref.isEqualForProperties, multiplyString = _ref.multiplyString, toArray = _ref.toArray;

  SubscriberMixin = require('./subscriber-mixin');

  WrapperDiv = document.createElement('div');

  module.exports = GutterComponent = React.createClass({
    displayName: 'GutterComponent',
    mixins: [SubscriberMixin],
    dummyLineNumberNode: null,
    render: function() {
      var scrollHeight, scrollTop, _ref1;
      _ref1 = this.props, scrollHeight = _ref1.scrollHeight, scrollTop = _ref1.scrollTop;
      return div({
        className: 'gutter'
      }, div({
        className: 'line-numbers',
        ref: 'lineNumbers',
        style: {
          height: scrollHeight,
          WebkitTransform: "translate3d(0px, " + (-scrollTop) + "px, 0px)"
        }
      }));
    },
    componentWillMount: function() {
      this.lineNumberNodesById = {};
      this.lineNumberIdsByScreenRow = {};
      return this.screenRowsByLineNumberId = {};
    },
    componentDidMount: function() {
      return this.appendDummyLineNumber();
    },
    shouldComponentUpdate: function(newProps) {
      var change, pendingChanges, renderedRowRange, _i, _len;
      if (!isEqualForProperties(newProps, this.props, 'renderedRowRange', 'scrollTop', 'lineHeightInPixels', 'mouseWheelScreenRow')) {
        return true;
      }
      renderedRowRange = newProps.renderedRowRange, pendingChanges = newProps.pendingChanges;
      for (_i = 0, _len = pendingChanges.length; _i < _len; _i++) {
        change = pendingChanges[_i];
        if (Math.abs(change.screenDelta) > 0 || Math.abs(change.bufferDelta) > 0) {
          if (!(change.end <= renderedRowRange.start || renderedRowRange.end <= change.start)) {
            return true;
          }
        }
      }
      return false;
    },
    componentDidUpdate: function(oldProps) {
      if (oldProps.maxLineNumberDigits !== this.props.maxLineNumberDigits) {
        this.updateDummyLineNumber();
        this.removeLineNumberNodes();
      }
      if (oldProps.lineHeightInPixels !== this.props.lineHeightInPixels) {
        this.clearScreenRowCaches();
      }
      return this.updateLineNumbers();
    },
    clearScreenRowCaches: function() {
      this.lineNumberIdsByScreenRow = {};
      return this.screenRowsByLineNumberId = {};
    },
    appendDummyLineNumber: function() {
      var maxLineNumberDigits;
      maxLineNumberDigits = this.props.maxLineNumberDigits;
      WrapperDiv.innerHTML = this.buildLineNumberHTML(0, false, maxLineNumberDigits);
      this.dummyLineNumberNode = WrapperDiv.children[0];
      return this.refs.lineNumbers.getDOMNode().appendChild(this.dummyLineNumberNode);
    },
    updateDummyLineNumber: function() {
      return this.dummyLineNumberNode.innerHTML = this.buildLineNumberInnerHTML(0, false, this.props.maxLineNumberDigits);
    },
    updateLineNumbers: function() {
      var lineNumberIdsToPreserve;
      lineNumberIdsToPreserve = this.appendOrUpdateVisibleLineNumberNodes();
      return this.removeLineNumberNodes(lineNumberIdsToPreserve);
    },
    appendOrUpdateVisibleLineNumberNodes: function() {
      var bufferRow, editor, endRow, i, id, index, lastBufferRow, lineNumberId, lineNumberNode, maxLineNumberDigits, newLineNumberIds, newLineNumberNodes, newLineNumbersHTML, node, renderedRowRange, screenRow, scrollTop, startRow, visibleLineNumberIds, wrapCount, _i, _j, _len, _len1, _ref1, _ref2;
      _ref1 = this.props, editor = _ref1.editor, renderedRowRange = _ref1.renderedRowRange, scrollTop = _ref1.scrollTop, maxLineNumberDigits = _ref1.maxLineNumberDigits;
      startRow = renderedRowRange[0], endRow = renderedRowRange[1];
      newLineNumberIds = null;
      newLineNumbersHTML = null;
      visibleLineNumberIds = new Set;
      wrapCount = 0;
      _ref2 = editor.bufferRowsForScreenRows(startRow, endRow - 1);
      for (index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
        bufferRow = _ref2[index];
        screenRow = startRow + index;
        if (bufferRow === lastBufferRow) {
          id = "" + bufferRow + "-" + (wrapCount++);
        } else {
          id = bufferRow.toString();
          lastBufferRow = bufferRow;
          wrapCount = 0;
        }
        visibleLineNumberIds.add(id);
        if (this.hasLineNumberNode(id)) {
          this.updateLineNumberNode(id, screenRow);
        } else {
          if (newLineNumberIds == null) {
            newLineNumberIds = [];
          }
          if (newLineNumbersHTML == null) {
            newLineNumbersHTML = "";
          }
          newLineNumberIds.push(id);
          newLineNumbersHTML += this.buildLineNumberHTML(bufferRow, wrapCount > 0, maxLineNumberDigits, screenRow);
          this.screenRowsByLineNumberId[id] = screenRow;
          this.lineNumberIdsByScreenRow[screenRow] = id;
        }
      }
      if (newLineNumberIds != null) {
        WrapperDiv.innerHTML = newLineNumbersHTML;
        newLineNumberNodes = toArray(WrapperDiv.children);
        node = this.refs.lineNumbers.getDOMNode();
        for (i = _j = 0, _len1 = newLineNumberIds.length; _j < _len1; i = ++_j) {
          lineNumberId = newLineNumberIds[i];
          lineNumberNode = newLineNumberNodes[i];
          this.lineNumberNodesById[lineNumberId] = lineNumberNode;
          node.appendChild(lineNumberNode);
        }
      }
      return visibleLineNumberIds;
    },
    removeLineNumberNodes: function(lineNumberIdsToPreserve) {
      var lineNumberId, lineNumberNode, mouseWheelScreenRow, node, screenRow, _ref1, _results;
      mouseWheelScreenRow = this.props.mouseWheelScreenRow;
      node = this.refs.lineNumbers.getDOMNode();
      _ref1 = this.lineNumberNodesById;
      _results = [];
      for (lineNumberId in _ref1) {
        lineNumberNode = _ref1[lineNumberId];
        if (!(!(lineNumberIdsToPreserve != null ? lineNumberIdsToPreserve.has(lineNumberId) : void 0))) {
          continue;
        }
        screenRow = this.screenRowsByLineNumberId[lineNumberId];
        if ((screenRow == null) || screenRow !== mouseWheelScreenRow) {
          delete this.lineNumberNodesById[lineNumberId];
          if (this.lineNumberIdsByScreenRow[screenRow] === lineNumberId) {
            delete this.lineNumberIdsByScreenRow[screenRow];
          }
          delete this.screenRowsByLineNumberId[lineNumberId];
          _results.push(node.removeChild(lineNumberNode));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    },
    buildLineNumberHTML: function(bufferRow, softWrapped, maxLineNumberDigits, screenRow) {
      var innerHTML, lineHeightInPixels, style;
      if (screenRow != null) {
        lineHeightInPixels = this.props.lineHeightInPixels;
        style = "position: absolute; top: " + (screenRow * lineHeightInPixels) + "px;";
      } else {
        style = "visibility: hidden;";
      }
      innerHTML = this.buildLineNumberInnerHTML(bufferRow, softWrapped, maxLineNumberDigits);
      return "<div class=\"line-number\" style=\"" + style + "\" data-buffer-row=\"" + bufferRow + "\" data-screen-row=\"" + screenRow + "\">" + innerHTML + "</div>";
    },
    buildLineNumberInnerHTML: function(bufferRow, softWrapped, maxLineNumberDigits) {
      var iconHTML, lineNumber, padding;
      if (softWrapped) {
        lineNumber = "•";
      } else {
        lineNumber = (bufferRow + 1).toString();
      }
      padding = multiplyString('&nbsp;', maxLineNumberDigits - lineNumber.length);
      iconHTML = '<div class="icon-right"></div>';
      return padding + lineNumber + iconHTML;
    },
    updateLineNumberNode: function(lineNumberId, screenRow) {
      var lineHeightInPixels;
      if (this.screenRowsByLineNumberId[lineNumberId] !== screenRow) {
        lineHeightInPixels = this.props.lineHeightInPixels;
        this.lineNumberNodesById[lineNumberId].style.top = screenRow * lineHeightInPixels + 'px';
        this.lineNumberNodesById[lineNumberId].dataset.screenRow = screenRow;
        this.screenRowsByLineNumberId[lineNumberId] = screenRow;
        return this.lineNumberIdsByScreenRow[screenRow] = lineNumberId;
      }
    },
    hasLineNumberNode: function(lineNumberId) {
      return this.lineNumberNodesById.hasOwnProperty(lineNumberId);
    },
    lineNumberNodeForScreenRow: function(screenRow) {
      return this.lineNumberNodesById[this.lineNumberIdsByScreenRow[screenRow]];
    }
  });

}).call(this);
