(function() {
  var Model, Point, Range, Selection, pick, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('text-buffer'), Point = _ref.Point, Range = _ref.Range;

  Model = require('theorist').Model;

  pick = require('underscore-plus').pick;

  module.exports = Selection = (function(_super) {
    __extends(Selection, _super);

    Selection.prototype.cursor = null;

    Selection.prototype.marker = null;

    Selection.prototype.editor = null;

    Selection.prototype.initialScreenRange = null;

    Selection.prototype.wordwise = false;

    Selection.prototype.needsAutoscroll = null;

    function Selection(_arg) {
      var id;
      this.cursor = _arg.cursor, this.marker = _arg.marker, this.editor = _arg.editor, id = _arg.id;
      this.assignId(id);
      this.cursor.selection = this;
      this.marker.on('changed', (function(_this) {
        return function() {
          return _this.screenRangeChanged();
        };
      })(this));
      this.marker.on('destroyed', (function(_this) {
        return function() {
          _this.destroyed = true;
          _this.editor.removeSelection(_this);
          if (!_this.editor.isDestroyed()) {
            return _this.emit('destroyed');
          }
        };
      })(this));
    }

    Selection.prototype.destroy = function() {
      return this.marker.destroy();
    };

    Selection.prototype.finalize = function() {
      var _ref1;
      if (!((_ref1 = this.initialScreenRange) != null ? _ref1.isEqual(this.getScreenRange()) : void 0)) {
        this.initialScreenRange = null;
      }
      if (this.isEmpty()) {
        this.wordwise = false;
        return this.linewise = false;
      }
    };

    Selection.prototype.clearAutoscroll = function() {
      return this.needsAutoscroll = null;
    };

    Selection.prototype.isEmpty = function() {
      return this.getBufferRange().isEmpty();
    };

    Selection.prototype.isReversed = function() {
      return this.marker.isReversed();
    };

    Selection.prototype.isSingleScreenLine = function() {
      return this.getScreenRange().isSingleLine();
    };

    Selection.prototype.getScreenRange = function() {
      return this.marker.getScreenRange();
    };

    Selection.prototype.setScreenRange = function(screenRange, options) {
      return this.setBufferRange(this.editor.bufferRangeForScreenRange(screenRange), options);
    };

    Selection.prototype.getBufferRange = function() {
      return this.marker.getBufferRange();
    };

    Selection.prototype.setBufferRange = function(bufferRange, options) {
      if (options == null) {
        options = {};
      }
      bufferRange = Range.fromObject(bufferRange);
      this.needsAutoscroll = options.autoscroll;
      if (options.reversed == null) {
        options.reversed = this.isReversed();
      }
      if (!options.preserveFolds) {
        this.editor.destroyFoldsIntersectingBufferRange(bufferRange);
      }
      return this.modifySelection((function(_this) {
        return function() {
          if (_this.needsAutoscroll != null) {
            _this.cursor.needsAutoscroll = false;
          }
          _this.marker.setBufferRange(bufferRange, options);
          if (_this.needsAutoscroll && _this.editor.manageScrollPosition) {
            return _this.autoscroll();
          }
        };
      })(this));
    };

    Selection.prototype.getBufferRowRange = function() {
      var end, range, start;
      range = this.getBufferRange();
      start = range.start.row;
      end = range.end.row;
      if (range.end.column === 0) {
        end = Math.max(start, end - 1);
      }
      return [start, end];
    };

    Selection.prototype.autoscroll = function() {
      return this.editor.scrollToScreenRange(this.getScreenRange());
    };

    Selection.prototype.getText = function() {
      return this.editor.buffer.getTextInRange(this.getBufferRange());
    };

    Selection.prototype.clear = function() {
      this.marker.setAttributes({
        goalBufferRange: null
      });
      if (!this.retainSelection) {
        this.marker.clearTail();
      }
      return this.finalize();
    };

    Selection.prototype.selectWord = function() {
      var options;
      options = {};
      if (this.cursor.isSurroundedByWhitespace()) {
        options.wordRegex = /[\t ]*/;
      }
      if (this.cursor.isBetweenWordAndNonWord()) {
        options.includeNonWordCharacters = false;
      }
      this.setBufferRange(this.cursor.getCurrentWordBufferRange(options));
      this.wordwise = true;
      return this.initialScreenRange = this.getScreenRange();
    };

    Selection.prototype.expandOverWord = function() {
      return this.setBufferRange(this.getBufferRange().union(this.cursor.getCurrentWordBufferRange()));
    };

    Selection.prototype.selectLine = function(row) {
      var range;
      if (row == null) {
        row = this.cursor.getBufferPosition().row;
      }
      range = this.editor.bufferRangeForBufferRow(row, {
        includeNewline: true
      });
      this.setBufferRange(this.getBufferRange().union(range));
      this.linewise = true;
      this.wordwise = false;
      return this.initialScreenRange = this.getScreenRange();
    };

    Selection.prototype.expandOverLine = function() {
      var range;
      range = this.getBufferRange().union(this.cursor.getCurrentLineBufferRange({
        includeNewline: true
      }));
      return this.setBufferRange(range);
    };

    Selection.prototype.selectToScreenPosition = function(position) {
      position = Point.fromObject(position);
      return this.modifySelection((function(_this) {
        return function() {
          if (_this.initialScreenRange) {
            if (position.isLessThan(_this.initialScreenRange.start)) {
              _this.marker.setScreenRange([position, _this.initialScreenRange.end], {
                reversed: true
              });
            } else {
              _this.marker.setScreenRange([_this.initialScreenRange.start, position]);
            }
          } else {
            _this.cursor.setScreenPosition(position);
          }
          if (_this.linewise) {
            return _this.expandOverLine();
          } else if (_this.wordwise) {
            return _this.expandOverWord();
          }
        };
      })(this));
    };

    Selection.prototype.selectToBufferPosition = function(position) {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.setBufferPosition(position);
        };
      })(this));
    };

    Selection.prototype.selectRight = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveRight();
        };
      })(this));
    };

    Selection.prototype.selectLeft = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveLeft();
        };
      })(this));
    };

    Selection.prototype.selectUp = function(rowCount) {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveUp(rowCount);
        };
      })(this));
    };

    Selection.prototype.selectDown = function(rowCount) {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveDown(rowCount);
        };
      })(this));
    };

    Selection.prototype.selectToTop = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToTop();
        };
      })(this));
    };

    Selection.prototype.selectToBottom = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBottom();
        };
      })(this));
    };

    Selection.prototype.selectAll = function() {
      return this.setBufferRange(this.editor.buffer.getRange(), {
        autoscroll: false
      });
    };

    Selection.prototype.selectToBeginningOfLine = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBeginningOfLine();
        };
      })(this));
    };

    Selection.prototype.selectToFirstCharacterOfLine = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToFirstCharacterOfLine();
        };
      })(this));
    };

    Selection.prototype.selectToEndOfLine = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToEndOfScreenLine();
        };
      })(this));
    };

    Selection.prototype.selectToBeginningOfWord = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBeginningOfWord();
        };
      })(this));
    };

    Selection.prototype.selectToEndOfWord = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToEndOfWord();
        };
      })(this));
    };

    Selection.prototype.selectToBeginningOfNextWord = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToBeginningOfNextWord();
        };
      })(this));
    };

    Selection.prototype.selectToPreviousWordBoundary = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToPreviousWordBoundary();
        };
      })(this));
    };

    Selection.prototype.selectToNextWordBoundary = function() {
      return this.modifySelection((function(_this) {
        return function() {
          return _this.cursor.moveToNextWordBoundary();
        };
      })(this));
    };

    Selection.prototype.addSelectionBelow = function() {
      var clippedRange, nextRow, range, row, _i, _ref1, _ref2, _results;
      range = ((_ref1 = this.getGoalBufferRange()) != null ? _ref1 : this.getBufferRange()).copy();
      nextRow = range.end.row + 1;
      _results = [];
      for (row = _i = nextRow, _ref2 = this.editor.getLastBufferRow(); nextRow <= _ref2 ? _i <= _ref2 : _i >= _ref2; row = nextRow <= _ref2 ? ++_i : --_i) {
        range.start.row = row;
        range.end.row = row;
        clippedRange = this.editor.clipBufferRange(range);
        if (range.isEmpty()) {
          if (range.end.column > 0 && clippedRange.end.column === 0) {
            continue;
          }
        } else {
          if (clippedRange.isEmpty()) {
            continue;
          }
        }
        this.editor.addSelectionForBufferRange(range, {
          goalBufferRange: range
        });
        break;
      }
      return _results;
    };

    Selection.prototype.getGoalBufferRange = function() {
      return this.marker.getAttributes().goalBufferRange;
    };

    Selection.prototype.addSelectionAbove = function() {
      var clippedRange, previousRow, range, row, _i, _ref1, _results;
      range = ((_ref1 = this.getGoalBufferRange()) != null ? _ref1 : this.getBufferRange()).copy();
      previousRow = range.end.row - 1;
      _results = [];
      for (row = _i = previousRow; previousRow <= 0 ? _i <= 0 : _i >= 0; row = previousRow <= 0 ? ++_i : --_i) {
        range.start.row = row;
        range.end.row = row;
        clippedRange = this.editor.clipBufferRange(range);
        if (range.isEmpty()) {
          if (range.end.column > 0 && clippedRange.end.column === 0) {
            continue;
          }
        } else {
          if (clippedRange.isEmpty()) {
            continue;
          }
        }
        this.editor.addSelectionForBufferRange(range, {
          goalBufferRange: range
        });
        break;
      }
      return _results;
    };

    Selection.prototype.insertText = function(text, options) {
      var currentIndentation, newBufferRange, oldBufferRange, row, wasReversed, _i, _len, _ref1;
      if (options == null) {
        options = {};
      }
      oldBufferRange = this.getBufferRange();
      this.editor.unfoldBufferRow(oldBufferRange.end.row);
      wasReversed = this.isReversed();
      this.clear();
      this.cursor.needsAutoscroll = this.cursor.isLastCursor();
      if ((options.indentBasis != null) && !options.autoIndent) {
        text = this.normalizeIndents(text, options.indentBasis);
      }
      newBufferRange = this.editor.buffer.setTextInRange(oldBufferRange, text, pick(options, 'undo'));
      if (options.select) {
        this.setBufferRange(newBufferRange, {
          reversed: wasReversed
        });
      } else {
        if (wasReversed) {
          this.cursor.setBufferPosition(newBufferRange.end, {
            skipAtomicTokens: true
          });
        }
      }
      if (options.autoIndent) {
        _ref1 = newBufferRange.getRows();
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          row = _ref1[_i];
          this.editor.autoIndentBufferRow(row);
        }
      } else if (options.autoIndentNewline && text === '\n') {
        currentIndentation = this.editor.indentationForBufferRow(newBufferRange.start.row);
        this.editor.autoIndentBufferRow(newBufferRange.end.row, {
          preserveLeadingWhitespace: true
        });
        if (this.editor.indentationForBufferRow(newBufferRange.end.row) < currentIndentation) {
          this.editor.setIndentationForBufferRow(newBufferRange.end.row, currentIndentation);
        }
      } else if (options.autoDecreaseIndent && /\S/.test(text)) {
        this.editor.autoDecreaseIndentForBufferRow(newBufferRange.start.row);
      }
      return newBufferRange;
    };

    Selection.prototype.normalizeIndents = function(text, indentBasis) {
      var firstLineIndentLevel, i, indentLevel, isCursorInsideExistingLine, line, lineIndentLevel, lines, minimumIndentLevel, normalizedLines, textPrecedingCursor, _i, _len;
      textPrecedingCursor = this.cursor.getCurrentBufferLine().slice(0, this.cursor.getBufferColumn());
      isCursorInsideExistingLine = /\S/.test(textPrecedingCursor);
      lines = text.split('\n');
      firstLineIndentLevel = this.editor.indentLevelForLine(lines[0]);
      if (isCursorInsideExistingLine) {
        minimumIndentLevel = this.editor.indentationForBufferRow(this.cursor.getBufferRow());
      } else {
        minimumIndentLevel = this.cursor.getIndentLevel();
      }
      normalizedLines = [];
      for (i = _i = 0, _len = lines.length; _i < _len; i = ++_i) {
        line = lines[i];
        if (i === 0) {
          indentLevel = 0;
        } else if (line === '') {
          indentLevel = 0;
        } else {
          lineIndentLevel = this.editor.indentLevelForLine(lines[i]);
          indentLevel = minimumIndentLevel + (lineIndentLevel - indentBasis);
        }
        normalizedLines.push(this.setIndentationForLine(line, indentLevel));
      }
      return normalizedLines.join('\n');
    };

    Selection.prototype.indent = function(_arg) {
      var autoIndent, column, delta, desiredIndent, row, _ref1;
      autoIndent = (_arg != null ? _arg : {}).autoIndent;
      _ref1 = this.cursor.getBufferPosition(), row = _ref1.row, column = _ref1.column;
      if (this.isEmpty()) {
        this.cursor.skipLeadingWhitespace();
        desiredIndent = this.editor.suggestedIndentForBufferRow(row);
        delta = desiredIndent - this.cursor.getIndentLevel();
        if (autoIndent && delta > 0) {
          return this.insertText(this.editor.buildIndentString(delta));
        } else {
          return this.insertText(this.editor.getTabText());
        }
      } else {
        return this.indentSelectedRows();
      }
    };

    Selection.prototype.indentSelectedRows = function() {
      var end, row, start, _i, _ref1, _results;
      _ref1 = this.getBufferRowRange(), start = _ref1[0], end = _ref1[1];
      _results = [];
      for (row = _i = start; start <= end ? _i <= end : _i >= end; row = start <= end ? ++_i : --_i) {
        if (this.editor.buffer.lineLengthForRow(row) !== 0) {
          _results.push(this.editor.buffer.insert([row, 0], this.editor.getTabText()));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Selection.prototype.setIndentationForLine = function(line, indentLevel) {
      var desiredIndentLevel, desiredIndentString;
      desiredIndentLevel = Math.max(0, indentLevel);
      desiredIndentString = this.editor.buildIndentString(desiredIndentLevel);
      return line.replace(/^[\t ]*/, desiredIndentString);
    };

    Selection.prototype.backspace = function() {
      if (this.isEmpty() && !this.editor.isFoldedAtScreenRow(this.cursor.getScreenRow())) {
        this.selectLeft();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.backspaceToBeginningOfWord = function() {
      deprecate("Use Selection::deleteToBeginningOfWord() instead");
      return this.deleteToBeginningOfWord();
    };

    Selection.prototype.backspaceToBeginningOfLine = function() {
      deprecate("Use Selection::deleteToBeginningOfLine() instead");
      return this.deleteToBeginningOfLine();
    };

    Selection.prototype.deleteToBeginningOfWord = function() {
      if (this.isEmpty()) {
        this.selectToBeginningOfWord();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToBeginningOfLine = function() {
      if (this.isEmpty() && this.cursor.isAtBeginningOfLine()) {
        this.selectLeft();
      } else {
        this.selectToBeginningOfLine();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype["delete"] = function() {
      var fold;
      if (this.isEmpty()) {
        if (this.cursor.isAtEndOfLine() && (fold = this.editor.largestFoldStartingAtScreenRow(this.cursor.getScreenRow() + 1))) {
          this.selectToBufferPosition(fold.getBufferRange().end);
        } else {
          this.selectRight();
        }
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteToEndOfWord = function() {
      if (this.isEmpty()) {
        this.selectToEndOfWord();
      }
      return this.deleteSelectedText();
    };

    Selection.prototype.deleteSelectedText = function() {
      var bufferRange, fold, _ref1;
      bufferRange = this.getBufferRange();
      if (bufferRange.isEmpty() && (fold = this.editor.largestFoldContainingBufferRow(bufferRange.start.row))) {
        bufferRange = bufferRange.union(fold.getBufferRange({
          includeNewline: true
        }));
      }
      if (!bufferRange.isEmpty()) {
        this.editor.buffer["delete"](bufferRange);
      }
      return (_ref1 = this.cursor) != null ? _ref1.setBufferPosition(bufferRange.start) : void 0;
    };

    Selection.prototype.deleteLine = function() {
      var end, range, start;
      if (this.isEmpty()) {
        start = this.cursor.getScreenRow();
        range = this.editor.bufferRowsForScreenRows(start, start + 1);
        if (range[1] > range[0]) {
          return this.editor.buffer.deleteRows(range[0], range[1] - 1);
        } else {
          return this.editor.buffer.deleteRow(range[0]);
        }
      } else {
        range = this.getBufferRange();
        start = range.start.row;
        end = range.end.row;
        if (end !== this.editor.buffer.getLastRow() && range.end.column === 0) {
          end--;
        }
        return this.editor.buffer.deleteRows(start, end);
      }
    };

    Selection.prototype.joinLines = function() {
      var joinMarker, newSelectedRange, nextRow, row, rowCount, selectedRange, _i;
      selectedRange = this.getBufferRange();
      if (selectedRange.isEmpty()) {
        if (selectedRange.start.row === this.editor.buffer.getLastRow()) {
          return;
        }
      } else {
        joinMarker = this.editor.markBufferRange(selectedRange, {
          invalidationStrategy: 'never'
        });
      }
      rowCount = Math.max(1, selectedRange.getRowCount() - 1);
      for (row = _i = 0; 0 <= rowCount ? _i < rowCount : _i > rowCount; row = 0 <= rowCount ? ++_i : --_i) {
        this.cursor.setBufferPosition([selectedRange.start.row]);
        this.cursor.moveToEndOfLine();
        nextRow = selectedRange.start.row + 1;
        if (nextRow <= this.editor.buffer.getLastRow() && this.editor.buffer.lineLengthForRow(nextRow) > 0) {
          this.insertText(' ');
          this.cursor.moveToEndOfLine();
        }
        this.modifySelection((function(_this) {
          return function() {
            _this.cursor.moveRight();
            return _this.cursor.moveToFirstCharacterOfLine();
          };
        })(this));
        this.deleteSelectedText();
      }
      if (joinMarker != null) {
        newSelectedRange = joinMarker.getBufferRange();
        this.setBufferRange(newSelectedRange);
        return joinMarker.destroy();
      }
    };

    Selection.prototype.outdentSelectedRows = function() {
      var buffer, end, leadingTabRegex, matchLength, row, start, _i, _ref1, _ref2, _results;
      _ref1 = this.getBufferRowRange(), start = _ref1[0], end = _ref1[1];
      buffer = this.editor.buffer;
      leadingTabRegex = new RegExp("^ {1," + (this.editor.getTabLength()) + "}|\t");
      _results = [];
      for (row = _i = start; start <= end ? _i <= end : _i >= end; row = start <= end ? ++_i : --_i) {
        if (matchLength = (_ref2 = buffer.lineForRow(row).match(leadingTabRegex)) != null ? _ref2[0].length : void 0) {
          _results.push(buffer["delete"]([[row, 0], [row, matchLength]]));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Selection.prototype.autoIndentSelectedRows = function() {
      var end, start, _ref1;
      _ref1 = this.getBufferRowRange(), start = _ref1[0], end = _ref1[1];
      return this.editor.autoIndentBufferRows(start, end);
    };

    Selection.prototype.toggleLineComments = function() {
      var _ref1;
      return (_ref1 = this.editor).toggleLineCommentsForBufferRows.apply(_ref1, this.getBufferRowRange());
    };

    Selection.prototype.cutToEndOfLine = function(maintainClipboard) {
      if (this.isEmpty()) {
        this.selectToEndOfLine();
      }
      return this.cut(maintainClipboard);
    };

    Selection.prototype.cut = function(maintainClipboard) {
      if (maintainClipboard == null) {
        maintainClipboard = false;
      }
      this.copy(maintainClipboard);
      return this["delete"]();
    };

    Selection.prototype.copy = function(maintainClipboard) {
      var clipboardText, metadata, text, _ref1;
      if (maintainClipboard == null) {
        maintainClipboard = false;
      }
      if (this.isEmpty()) {
        return;
      }
      text = this.editor.buffer.getTextInRange(this.getBufferRange());
      if (maintainClipboard) {
        _ref1 = atom.clipboard.readWithMetadata(), clipboardText = _ref1.text, metadata = _ref1.metadata;
        if ((metadata != null ? metadata.selections : void 0) != null) {
          metadata.selections.push(text);
        } else {
          metadata = {
            selections: [clipboardText, text]
          };
        }
        text = "" + clipboardText + "\n" + text;
      } else {
        metadata = {
          indentBasis: this.editor.indentationForBufferRow(this.getBufferRange().start.row)
        };
      }
      return atom.clipboard.write(text, metadata);
    };

    Selection.prototype.fold = function() {
      var range;
      range = this.getBufferRange();
      this.editor.createFold(range.start.row, range.end.row);
      return this.cursor.setBufferPosition([range.end.row + 1, 0]);
    };

    Selection.prototype.modifySelection = function(fn) {
      this.retainSelection = true;
      this.plantTail();
      fn();
      return this.retainSelection = false;
    };

    Selection.prototype.plantTail = function() {
      return this.marker.plantTail();
    };

    Selection.prototype.intersectsBufferRange = function(bufferRange) {
      return this.getBufferRange().intersectsWith(bufferRange);
    };

    Selection.prototype.intersectsScreenRowRange = function(startRow, endRow) {
      return this.getScreenRange().intersectsRowRange(startRow, endRow);
    };

    Selection.prototype.intersectsScreenRow = function(screenRow) {
      return this.getScreenRange().intersectsRow(screenRow);
    };

    Selection.prototype.intersectsWith = function(otherSelection) {
      return this.getBufferRange().intersectsWith(otherSelection.getBufferRange());
    };

    Selection.prototype.merge = function(otherSelection, options) {
      var myGoalBufferRange, otherGoalBufferRange;
      myGoalBufferRange = this.getGoalBufferRange();
      otherGoalBufferRange = otherSelection.getGoalBufferRange();
      if ((myGoalBufferRange != null) && (otherGoalBufferRange != null)) {
        options.goalBufferRange = myGoalBufferRange.union(otherGoalBufferRange);
      } else {
        options.goalBufferRange = myGoalBufferRange != null ? myGoalBufferRange : otherGoalBufferRange;
      }
      this.setBufferRange(this.getBufferRange().union(otherSelection.getBufferRange()), options);
      return otherSelection.destroy();
    };

    Selection.prototype.compare = function(otherSelection) {
      return this.getBufferRange().compare(otherSelection.getBufferRange());
    };

    Selection.prototype.screenRangeChanged = function() {
      var screenRange;
      screenRange = this.getScreenRange();
      this.emit('screen-range-changed', screenRange);
      return this.editor.selectionScreenRangeChanged(this);
    };

    return Selection;

  })(Model);

}).call(this);
