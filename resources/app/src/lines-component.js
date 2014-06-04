(function() {
  var $$, AcceptFilter, DummyLineNode, LinesComponent, React, SelectionsComponent, WrapperDiv, debounce, div, isEqual, isEqualForProperties, multiplyString, span, toArray, _ref, _ref1;

  React = require('react-atom-fork');

  _ref = require('reactionary-atom-fork'), div = _ref.div, span = _ref.span;

  _ref1 = require('underscore-plus'), debounce = _ref1.debounce, isEqual = _ref1.isEqual, isEqualForProperties = _ref1.isEqualForProperties, multiplyString = _ref1.multiplyString, toArray = _ref1.toArray;

  $$ = require('space-pen').$$;

  SelectionsComponent = require('./selections-component');

  DummyLineNode = $$(function() {
    return this.div({
      className: 'line',
      style: 'position: absolute; visibility: hidden;'
    }, (function(_this) {
      return function() {
        return _this.span('x');
      };
    })(this));
  })[0];

  AcceptFilter = {
    acceptNode: function() {
      return NodeFilter.FILTER_ACCEPT;
    }
  };

  WrapperDiv = document.createElement('div');

  module.exports = LinesComponent = React.createClass({
    displayName: 'LinesComponent',
    render: function() {
      var defaultCharWidth, editor, lineHeightInPixels, scrollHeight, scrollLeft, scrollTop, scrollViewHeight, scrollWidth, selectionScreenRanges, style, _ref2;
      if (this.isMounted()) {
        _ref2 = this.props, editor = _ref2.editor, selectionScreenRanges = _ref2.selectionScreenRanges, scrollTop = _ref2.scrollTop, scrollLeft = _ref2.scrollLeft, scrollHeight = _ref2.scrollHeight, scrollWidth = _ref2.scrollWidth, lineHeightInPixels = _ref2.lineHeightInPixels, defaultCharWidth = _ref2.defaultCharWidth, scrollViewHeight = _ref2.scrollViewHeight;
        style = {
          height: Math.max(scrollHeight, scrollViewHeight),
          width: scrollWidth,
          WebkitTransform: "translate3d(" + (-scrollLeft) + "px, " + (-scrollTop) + "px, 0px)"
        };
      }
      return div({
        className: 'lines',
        style: style
      }, this.isMounted() ? SelectionsComponent({
        editor: editor,
        selectionScreenRanges: selectionScreenRanges,
        lineHeightInPixels: lineHeightInPixels,
        defaultCharWidth: defaultCharWidth
      }) : void 0);
    },
    componentWillMount: function() {
      this.measuredLines = new WeakSet;
      this.lineNodesByLineId = {};
      this.screenRowsByLineId = {};
      return this.lineIdsByScreenRow = {};
    },
    shouldComponentUpdate: function(newProps) {
      var change, pendingChanges, renderedEndRow, renderedRowRange, renderedStartRow, _i, _len;
      if (!isEqualForProperties(newProps, this.props, 'renderedRowRange', 'selectionScreenRanges', 'lineHeightInPixels', 'defaultCharWidth', 'scrollTop', 'scrollLeft', 'showIndentGuide', 'scrollingVertically', 'invisibles', 'visible', 'scrollViewHeight', 'mouseWheelScreenRow')) {
        return true;
      }
      renderedRowRange = newProps.renderedRowRange, pendingChanges = newProps.pendingChanges;
      renderedStartRow = renderedRowRange[0], renderedEndRow = renderedRowRange[1];
      for (_i = 0, _len = pendingChanges.length; _i < _len; _i++) {
        change = pendingChanges[_i];
        if (!(change.end < renderedStartRow || renderedEndRow <= change.start)) {
          return true;
        }
      }
      return false;
    },
    componentDidUpdate: function(prevProps) {
      var scrollingVertically, visible, _ref2;
      _ref2 = this.props, visible = _ref2.visible, scrollingVertically = _ref2.scrollingVertically;
      if (prevProps.lineHeightInPixels !== this.props.lineHeightInPixels) {
        this.clearScreenRowCaches();
      }
      if (!isEqualForProperties(prevProps, this.props, 'showIndentGuide', 'invisibles')) {
        this.removeLineNodes();
      }
      this.updateLines();
      if (visible && !scrollingVertically) {
        return this.measureCharactersInNewLines();
      }
    },
    clearScreenRowCaches: function() {
      this.screenRowsByLineId = {};
      return this.lineIdsByScreenRow = {};
    },
    updateLines: function() {
      var editor, endRow, renderedRowRange, selectionChanged, showIndentGuide, startRow, visibleLines, _ref2;
      _ref2 = this.props, editor = _ref2.editor, renderedRowRange = _ref2.renderedRowRange, showIndentGuide = _ref2.showIndentGuide, selectionChanged = _ref2.selectionChanged;
      startRow = renderedRowRange[0], endRow = renderedRowRange[1];
      visibleLines = editor.linesForScreenRows(startRow, endRow - 1);
      this.removeLineNodes(visibleLines);
      return this.appendOrUpdateVisibleLineNodes(visibleLines, startRow);
    },
    removeLineNodes: function(visibleLines) {
      var line, lineId, lineNode, mouseWheelScreenRow, node, screenRow, visibleLineIds, _i, _len, _ref2, _results;
      if (visibleLines == null) {
        visibleLines = [];
      }
      mouseWheelScreenRow = this.props.mouseWheelScreenRow;
      visibleLineIds = new Set;
      for (_i = 0, _len = visibleLines.length; _i < _len; _i++) {
        line = visibleLines[_i];
        visibleLineIds.add(line.id.toString());
      }
      node = this.getDOMNode();
      _ref2 = this.lineNodesByLineId;
      _results = [];
      for (lineId in _ref2) {
        lineNode = _ref2[lineId];
        if (!(!visibleLineIds.has(lineId))) {
          continue;
        }
        screenRow = this.screenRowsByLineId[lineId];
        if ((screenRow == null) || screenRow !== mouseWheelScreenRow) {
          delete this.lineNodesByLineId[lineId];
          if (this.lineIdsByScreenRow[screenRow] === lineId) {
            delete this.lineIdsByScreenRow[screenRow];
          }
          delete this.screenRowsByLineId[lineId];
          _results.push(node.removeChild(lineNode));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    },
    appendOrUpdateVisibleLineNodes: function(visibleLines, startRow) {
      var i, index, line, lineNode, newLineNodes, newLines, newLinesHTML, node, screenRow, _i, _j, _len, _len1, _results;
      newLines = null;
      newLinesHTML = null;
      for (index = _i = 0, _len = visibleLines.length; _i < _len; index = ++_i) {
        line = visibleLines[index];
        screenRow = startRow + index;
        if (this.hasLineNode(line.id)) {
          this.updateLineNode(line, screenRow);
        } else {
          if (newLines == null) {
            newLines = [];
          }
          if (newLinesHTML == null) {
            newLinesHTML = "";
          }
          newLines.push(line);
          newLinesHTML += this.buildLineHTML(line, screenRow);
          this.screenRowsByLineId[line.id] = screenRow;
          this.lineIdsByScreenRow[screenRow] = line.id;
        }
      }
      if (newLines == null) {
        return;
      }
      WrapperDiv.innerHTML = newLinesHTML;
      newLineNodes = toArray(WrapperDiv.children);
      node = this.getDOMNode();
      _results = [];
      for (i = _j = 0, _len1 = newLines.length; _j < _len1; i = ++_j) {
        line = newLines[i];
        lineNode = newLineNodes[i];
        this.lineNodesByLineId[line.id] = lineNode;
        _results.push(node.appendChild(lineNode));
      }
      return _results;
    },
    hasLineNode: function(lineId) {
      return this.lineNodesByLineId.hasOwnProperty(lineId);
    },
    buildLineHTML: function(line, screenRow) {
      var editor, fold, indentLevel, isSoftWrapped, lineEnding, lineHTML, lineHeightInPixels, mini, showIndentGuide, text, tokens, top, _ref2;
      _ref2 = this.props, editor = _ref2.editor, mini = _ref2.mini, showIndentGuide = _ref2.showIndentGuide, lineHeightInPixels = _ref2.lineHeightInPixels;
      tokens = line.tokens, text = line.text, lineEnding = line.lineEnding, fold = line.fold, isSoftWrapped = line.isSoftWrapped, indentLevel = line.indentLevel;
      top = screenRow * lineHeightInPixels;
      lineHTML = "<div class=\"line\" style=\"position: absolute; top: " + top + "px;\" data-screen-row=\"" + screenRow + "\">";
      if (text === "") {
        lineHTML += this.buildEmptyLineInnerHTML(line);
      } else {
        lineHTML += this.buildLineInnerHTML(line);
      }
      lineHTML += "</div>";
      return lineHTML;
    },
    buildEmptyLineInnerHTML: function(line) {
      var indentLevel, indentSpan, showIndentGuide, tabLength;
      showIndentGuide = this.props.showIndentGuide;
      indentLevel = line.indentLevel, tabLength = line.tabLength;
      if (showIndentGuide && indentLevel > 0) {
        indentSpan = "<span class='indent-guide'>" + (multiplyString(' ', tabLength)) + "</span>";
        return multiplyString(indentSpan, indentLevel + 1);
      } else {
        return "&nbsp;";
      }
    },
    buildLineInnerHTML: function(line) {
      var firstTrailingWhitespacePosition, hasIndentGuide, innerHTML, invisibles, lineIsWhitespaceOnly, mini, scopeStack, showIndentGuide, text, token, tokens, _i, _len, _ref2;
      _ref2 = this.props, invisibles = _ref2.invisibles, mini = _ref2.mini, showIndentGuide = _ref2.showIndentGuide, invisibles = _ref2.invisibles;
      tokens = line.tokens, text = line.text;
      innerHTML = "";
      scopeStack = [];
      firstTrailingWhitespacePosition = text.search(/\s*$/);
      lineIsWhitespaceOnly = firstTrailingWhitespacePosition === 0;
      for (_i = 0, _len = tokens.length; _i < _len; _i++) {
        token = tokens[_i];
        innerHTML += this.updateScopeStack(scopeStack, token.scopes);
        hasIndentGuide = !mini && showIndentGuide && token.hasLeadingWhitespace || (token.hasTrailingWhitespace && lineIsWhitespaceOnly);
        innerHTML += token.getValueAsHtml({
          invisibles: invisibles,
          hasIndentGuide: hasIndentGuide
        });
      }
      while (scopeStack.length > 0) {
        innerHTML += this.popScope(scopeStack);
      }
      innerHTML += this.buildEndOfLineHTML(line, invisibles);
      return innerHTML;
    },
    buildEndOfLineHTML: function(line, invisibles) {
      var html;
      if (this.props.mini || line.isSoftWrapped()) {
        return '';
      }
      html = '';
      if ((invisibles.cr != null) && line.lineEnding === '\r\n') {
        html += "<span class='invisible-character'>" + invisibles.cr + "</span>";
      }
      if (invisibles.eol != null) {
        html += "<span class='invisible-character'>" + invisibles.eol + "</span>";
      }
      return html;
    },
    updateScopeStack: function(scopeStack, desiredScopes) {
      var html, i, j, scope, _i, _j, _len, _ref2, _ref3;
      html = "";
      for (i = _i = 0, _len = desiredScopes.length; _i < _len; i = ++_i) {
        scope = desiredScopes[i];
        if (((_ref2 = scopeStack[i]) != null ? _ref2.scope : void 0) !== desiredScopes[i]) {
          break;
        }
      }
      while (scopeStack.length !== i) {
        html += this.popScope(scopeStack);
      }
      for (j = _j = i, _ref3 = desiredScopes.length; i <= _ref3 ? _j < _ref3 : _j > _ref3; j = i <= _ref3 ? ++_j : --_j) {
        html += this.pushScope(scopeStack, desiredScopes[j]);
      }
      return html;
    },
    popScope: function(scopeStack) {
      scopeStack.pop();
      return "</span>";
    },
    pushScope: function(scopeStack, scope) {
      scopeStack.push(scope);
      return "<span class=\"" + (scope.replace(/\.+/g, ' ')) + "\">";
    },
    updateLineNode: function(line, screenRow) {
      var lineHeightInPixels, lineNode;
      if (this.screenRowsByLineId[line.id] !== screenRow) {
        lineHeightInPixels = this.props.lineHeightInPixels;
        lineNode = this.lineNodesByLineId[line.id];
        lineNode.style.top = screenRow * lineHeightInPixels + 'px';
        lineNode.dataset.screenRow = screenRow;
        this.screenRowsByLineId[line.id] = screenRow;
        return this.lineIdsByScreenRow[screenRow] = line.id;
      }
    },
    lineNodeForScreenRow: function(screenRow) {
      return this.lineNodesByLineId[this.lineIdsByScreenRow[screenRow]];
    },
    measureLineHeightAndDefaultCharWidth: function() {
      var charWidth, editor, lineHeightInPixels, node;
      node = this.getDOMNode();
      node.appendChild(DummyLineNode);
      lineHeightInPixels = DummyLineNode.getBoundingClientRect().height;
      charWidth = DummyLineNode.firstChild.getBoundingClientRect().width;
      node.removeChild(DummyLineNode);
      editor = this.props.editor;
      return editor.batchUpdates(function() {
        editor.setLineHeightInPixels(lineHeightInPixels);
        return editor.setDefaultCharWidth(charWidth);
      });
    },
    remeasureCharacterWidths: function() {
      this.clearScopedCharWidths();
      return this.measureCharactersInNewLines();
    },
    measureCharactersInNewLines: function() {
      var lineNode, node, tokenizedLine, visibleEndRow, visibleStartRow, _i, _len, _ref2, _ref3, _results;
      _ref2 = this.props.renderedRowRange, visibleStartRow = _ref2[0], visibleEndRow = _ref2[1];
      node = this.getDOMNode();
      _ref3 = this.props.editor.linesForScreenRows(visibleStartRow, visibleEndRow - 1);
      _results = [];
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        tokenizedLine = _ref3[_i];
        if (!this.measuredLines.has(tokenizedLine)) {
          lineNode = this.lineNodesByLineId[tokenizedLine.id];
          _results.push(this.measureCharactersInLine(tokenizedLine, lineNode));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    },
    measureCharactersInLine: function(tokenizedLine, lineNode) {
      var char, charIndex, charWidth, charWidths, editor, i, iterator, nextTextNodeIndex, rangeForMeasurement, scopes, textNode, textNodeIndex, tokenIndex, value, _i, _j, _len, _len1, _ref2, _ref3;
      editor = this.props.editor;
      rangeForMeasurement = null;
      iterator = null;
      charIndex = 0;
      _ref2 = tokenizedLine.tokens;
      for (tokenIndex = _i = 0, _len = _ref2.length; _i < _len; tokenIndex = ++_i) {
        _ref3 = _ref2[tokenIndex], value = _ref3.value, scopes = _ref3.scopes;
        charWidths = editor.getScopedCharWidths(scopes);
        for (_j = 0, _len1 = value.length; _j < _len1; _j++) {
          char = value[_j];
          if (charWidths[char] == null) {
            if (typeof textNode === "undefined" || textNode === null) {
              if (rangeForMeasurement == null) {
                rangeForMeasurement = document.createRange();
              }
              iterator = document.createNodeIterator(lineNode, NodeFilter.SHOW_TEXT, AcceptFilter);
              textNode = iterator.nextNode();
              textNodeIndex = 0;
              nextTextNodeIndex = textNode.textContent.length;
            }
            while (nextTextNodeIndex <= charIndex) {
              textNode = iterator.nextNode();
              textNodeIndex = nextTextNodeIndex;
              nextTextNodeIndex = textNodeIndex + textNode.textContent.length;
            }
            i = charIndex - textNodeIndex;
            rangeForMeasurement.setStart(textNode, i);
            rangeForMeasurement.setEnd(textNode, i + 1);
            charWidth = rangeForMeasurement.getBoundingClientRect().width;
            editor.setScopedCharWidth(scopes, char, charWidth);
          }
          charIndex++;
        }
      }
      return this.measuredLines.add(tokenizedLine);
    },
    clearScopedCharWidths: function() {
      this.measuredLines.clear();
      return this.props.editor.clearScopedCharWidths();
    }
  });

}).call(this);
