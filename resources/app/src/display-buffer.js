(function() {
  var BufferToScreenConversionError, DisplayBuffer, DisplayBufferMarker, Emitter, Fold, Model, Point, Range, RowMap, Serializable, Token, TokenizedBuffer, guid, _, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __slice = [].slice;

  _ = require('underscore-plus');

  Emitter = require('emissary').Emitter;

  guid = require('guid');

  Serializable = require('serializable');

  Model = require('theorist').Model;

  _ref = require('text-buffer'), Point = _ref.Point, Range = _ref.Range;

  TokenizedBuffer = require('./tokenized-buffer');

  RowMap = require('./row-map');

  Fold = require('./fold');

  Token = require('./token');

  DisplayBufferMarker = require('./display-buffer-marker');

  BufferToScreenConversionError = (function(_super) {
    __extends(BufferToScreenConversionError, _super);

    function BufferToScreenConversionError(message, metadata) {
      this.message = message;
      this.metadata = metadata;
      BufferToScreenConversionError.__super__.constructor.apply(this, arguments);
      Error.captureStackTrace(this, BufferToScreenConversionError);
    }

    return BufferToScreenConversionError;

  })(Error);

  module.exports = DisplayBuffer = (function(_super) {
    __extends(DisplayBuffer, _super);

    Serializable.includeInto(DisplayBuffer);

    DisplayBuffer.properties({
      manageScrollPosition: false,
      softWrap: null,
      editorWidthInChars: null,
      lineHeightInPixels: null,
      defaultCharWidth: null,
      height: null,
      width: null,
      scrollTop: 0,
      scrollLeft: 0
    });

    DisplayBuffer.prototype.verticalScrollMargin = 2;

    DisplayBuffer.prototype.horizontalScrollMargin = 6;

    DisplayBuffer.prototype.horizontalScrollbarHeight = 15;

    DisplayBuffer.prototype.verticalScrollbarWidth = 15;

    function DisplayBuffer(_arg) {
      var buffer, marker, tabLength, _i, _len, _ref1, _ref2, _ref3;
      _ref1 = _arg != null ? _arg : {}, tabLength = _ref1.tabLength, this.editorWidthInChars = _ref1.editorWidthInChars, this.tokenizedBuffer = _ref1.tokenizedBuffer, buffer = _ref1.buffer;
      this.handleBufferMarkerCreated = __bind(this.handleBufferMarkerCreated, this);
      this.handleBufferMarkersUpdated = __bind(this.handleBufferMarkersUpdated, this);
      this.handleTokenizedBufferChange = __bind(this.handleTokenizedBufferChange, this);
      DisplayBuffer.__super__.constructor.apply(this, arguments);
      if (this.softWrap == null) {
        this.softWrap = (_ref2 = atom.config.get('editor.softWrap')) != null ? _ref2 : false;
      }
      if (this.tokenizedBuffer == null) {
        this.tokenizedBuffer = new TokenizedBuffer({
          tabLength: tabLength,
          buffer: buffer
        });
      }
      this.buffer = this.tokenizedBuffer.buffer;
      this.charWidthsByScope = {};
      this.markers = {};
      this.foldsByMarkerId = {};
      this.updateAllScreenLines();
      _ref3 = this.buffer.findMarkers(this.getFoldMarkerAttributes());
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        marker = _ref3[_i];
        this.createFoldForMarker(marker);
      }
      this.subscribe(this.tokenizedBuffer, 'grammar-changed', (function(_this) {
        return function(grammar) {
          return _this.emit('grammar-changed', grammar);
        };
      })(this));
      this.subscribe(this.tokenizedBuffer, 'tokenized', (function(_this) {
        return function() {
          return _this.emit('tokenized');
        };
      })(this));
      this.subscribe(this.tokenizedBuffer, 'changed', this.handleTokenizedBufferChange);
      this.subscribe(this.buffer, 'markers-updated', this.handleBufferMarkersUpdated);
      this.subscribe(this.buffer, 'marker-created', this.handleBufferMarkerCreated);
      this.subscribe(this.$softWrap, (function(_this) {
        return function(softWrap) {
          _this.emit('soft-wrap-changed', softWrap);
          return _this.updateWrappedScreenLines();
        };
      })(this));
      this.subscribe(atom.config.observe('editor.preferredLineLength', {
        callNow: false
      }, (function(_this) {
        return function() {
          if (_this.softWrap && atom.config.get('editor.softWrapAtPreferredLineLength')) {
            return _this.updateWrappedScreenLines();
          }
        };
      })(this)));
      this.subscribe(atom.config.observe('editor.softWrapAtPreferredLineLength', {
        callNow: false
      }, (function(_this) {
        return function() {
          if (_this.softWrap) {
            return _this.updateWrappedScreenLines();
          }
        };
      })(this)));
    }

    DisplayBuffer.prototype.serializeParams = function() {
      return {
        id: this.id,
        softWrap: this.softWrap,
        editorWidthInChars: this.editorWidthInChars,
        scrollTop: this.scrollTop,
        scrollLeft: this.scrollLeft,
        tokenizedBuffer: this.tokenizedBuffer.serialize()
      };
    };

    DisplayBuffer.prototype.deserializeParams = function(params) {
      params.tokenizedBuffer = TokenizedBuffer.deserialize(params.tokenizedBuffer);
      return params;
    };

    DisplayBuffer.prototype.copy = function() {
      var marker, newDisplayBuffer, _i, _len, _ref1;
      newDisplayBuffer = new DisplayBuffer({
        buffer: this.buffer,
        tabLength: this.getTabLength()
      });
      newDisplayBuffer.setScrollTop(this.getScrollTop());
      newDisplayBuffer.setScrollLeft(this.getScrollLeft());
      _ref1 = this.findMarkers({
        displayBufferId: this.id
      });
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        marker.copy({
          displayBufferId: newDisplayBuffer.id
        });
      }
      return newDisplayBuffer;
    };

    DisplayBuffer.prototype.updateAllScreenLines = function() {
      this.maxLineLength = 0;
      this.screenLines = [];
      this.rowMap = new RowMap;
      return this.updateScreenLines(0, this.buffer.getLineCount(), null, {
        suppressChangeEvent: true
      });
    };

    DisplayBuffer.prototype.emitChanged = function(eventProperties, refreshMarkers) {
      if (refreshMarkers == null) {
        refreshMarkers = true;
      }
      if (refreshMarkers) {
        this.pauseMarkerObservers();
        this.refreshMarkerScreenPositions();
      }
      this.emit('changed', eventProperties);
      return this.resumeMarkerObservers();
    };

    DisplayBuffer.prototype.updateWrappedScreenLines = function() {
      var bufferDelta, end, screenDelta, start;
      start = 0;
      end = this.getLastRow();
      this.updateAllScreenLines();
      screenDelta = this.getLastRow() - end;
      bufferDelta = 0;
      return this.emitChanged({
        start: start,
        end: end,
        screenDelta: screenDelta,
        bufferDelta: bufferDelta
      });
    };

    DisplayBuffer.prototype.setVisible = function(visible) {
      return this.tokenizedBuffer.setVisible(visible);
    };

    DisplayBuffer.prototype.getVerticalScrollMargin = function() {
      return this.verticalScrollMargin;
    };

    DisplayBuffer.prototype.setVerticalScrollMargin = function(verticalScrollMargin) {
      this.verticalScrollMargin = verticalScrollMargin;
      return this.verticalScrollMargin;
    };

    DisplayBuffer.prototype.getHorizontalScrollMargin = function() {
      return this.horizontalScrollMargin;
    };

    DisplayBuffer.prototype.setHorizontalScrollMargin = function(horizontalScrollMargin) {
      this.horizontalScrollMargin = horizontalScrollMargin;
      return this.horizontalScrollMargin;
    };

    DisplayBuffer.prototype.getHorizontalScrollbarHeight = function() {
      return this.horizontalScrollbarHeight;
    };

    DisplayBuffer.prototype.setHorizontalScrollbarHeight = function(horizontalScrollbarHeight) {
      this.horizontalScrollbarHeight = horizontalScrollbarHeight;
      return this.horizontalScrollbarHeight;
    };

    DisplayBuffer.prototype.getVerticalScrollbarWidth = function() {
      return this.verticalScrollbarWidth;
    };

    DisplayBuffer.prototype.setVerticalScrollbarWidth = function(verticalScrollbarWidth) {
      this.verticalScrollbarWidth = verticalScrollbarWidth;
      return this.verticalScrollbarWidth;
    };

    DisplayBuffer.prototype.getHeight = function() {
      if (this.height != null) {
        return this.height;
      } else {
        if (this.horizontallyScrollable()) {
          return this.getScrollHeight() + this.getHorizontalScrollbarHeight();
        } else {
          return this.getScrollHeight();
        }
      }
    };

    DisplayBuffer.prototype.setHeight = function(height) {
      this.height = height;
      return this.height;
    };

    DisplayBuffer.prototype.getClientHeight = function(reentrant) {
      if (this.horizontallyScrollable(reentrant)) {
        return this.getHeight() - this.getHorizontalScrollbarHeight();
      } else {
        return this.getHeight();
      }
    };

    DisplayBuffer.prototype.getClientWidth = function(reentrant) {
      if (this.verticallyScrollable(reentrant)) {
        return this.getWidth() - this.getVerticalScrollbarWidth();
      } else {
        return this.getWidth();
      }
    };

    DisplayBuffer.prototype.horizontallyScrollable = function(reentrant) {
      if (this.width == null) {
        return false;
      }
      if (this.getSoftWrap()) {
        return false;
      }
      if (reentrant) {
        return this.getScrollWidth() > this.getWidth();
      } else {
        return this.getScrollWidth() > this.getClientWidth(true);
      }
    };

    DisplayBuffer.prototype.verticallyScrollable = function(reentrant) {
      if (this.height == null) {
        return false;
      }
      if (reentrant) {
        return this.getScrollHeight() > this.getHeight();
      } else {
        return this.getScrollHeight() > this.getClientHeight(true);
      }
    };

    DisplayBuffer.prototype.getWidth = function() {
      if (this.width != null) {
        return this.width;
      } else {
        if (this.verticallyScrollable()) {
          return this.getScrollWidth() + this.getVerticalScrollbarWidth();
        } else {
          return this.getScrollWidth();
        }
      }
    };

    DisplayBuffer.prototype.setWidth = function(newWidth) {
      var oldWidth;
      oldWidth = this.width;
      this.width = newWidth;
      if (newWidth !== oldWidth && this.softWrap) {
        this.updateWrappedScreenLines();
      }
      this.setScrollTop(this.getScrollTop());
      return this.width;
    };

    DisplayBuffer.prototype.getScrollTop = function() {
      return this.scrollTop;
    };

    DisplayBuffer.prototype.setScrollTop = function(scrollTop) {
      if (this.manageScrollPosition) {
        return this.scrollTop = Math.max(0, Math.min(this.getScrollHeight() - this.getClientHeight(), scrollTop));
      } else {
        return this.scrollTop = scrollTop;
      }
    };

    DisplayBuffer.prototype.getScrollBottom = function() {
      return this.scrollTop + this.height;
    };

    DisplayBuffer.prototype.setScrollBottom = function(scrollBottom) {
      this.setScrollTop(scrollBottom - this.getClientHeight());
      return this.getScrollBottom();
    };

    DisplayBuffer.prototype.getScrollLeft = function() {
      return this.scrollLeft;
    };

    DisplayBuffer.prototype.setScrollLeft = function(scrollLeft) {
      if (this.manageScrollPosition) {
        this.scrollLeft = Math.max(0, Math.min(this.getScrollWidth() - this.getClientWidth(), scrollLeft));
        return this.scrollLeft;
      } else {
        return this.scrollLeft = scrollLeft;
      }
    };

    DisplayBuffer.prototype.getScrollRight = function() {
      return this.scrollLeft + this.width;
    };

    DisplayBuffer.prototype.setScrollRight = function(scrollRight) {
      this.setScrollLeft(scrollRight - this.width);
      return this.getScrollRight();
    };

    DisplayBuffer.prototype.getLineHeightInPixels = function() {
      return this.lineHeightInPixels;
    };

    DisplayBuffer.prototype.setLineHeightInPixels = function(lineHeightInPixels) {
      this.lineHeightInPixels = lineHeightInPixels;
      return this.lineHeightInPixels;
    };

    DisplayBuffer.prototype.getDefaultCharWidth = function() {
      return this.defaultCharWidth;
    };

    DisplayBuffer.prototype.setDefaultCharWidth = function(defaultCharWidth) {
      this.defaultCharWidth = defaultCharWidth;
      return this.defaultCharWidth;
    };

    DisplayBuffer.prototype.getCursorWidth = function() {
      return 1;
    };

    DisplayBuffer.prototype.getScopedCharWidth = function(scopeNames, char) {
      return this.getScopedCharWidths(scopeNames)[char];
    };

    DisplayBuffer.prototype.getScopedCharWidths = function(scopeNames) {
      var scope, scopeName, _i, _len;
      scope = this.charWidthsByScope;
      for (_i = 0, _len = scopeNames.length; _i < _len; _i++) {
        scopeName = scopeNames[_i];
        if (scope[scopeName] == null) {
          scope[scopeName] = {};
        }
        scope = scope[scopeName];
      }
      if (scope.charWidths == null) {
        scope.charWidths = {};
      }
      return scope.charWidths;
    };

    DisplayBuffer.prototype.setScopedCharWidth = function(scopeNames, char, width) {
      return this.getScopedCharWidths(scopeNames)[char] = width;
    };

    DisplayBuffer.prototype.setScopedCharWidths = function(scopeNames, charWidths) {
      return _.extend(this.getScopedCharWidths(scopeNames), charWidths);
    };

    DisplayBuffer.prototype.clearScopedCharWidths = function() {
      return this.charWidthsByScope = {};
    };

    DisplayBuffer.prototype.getScrollHeight = function() {
      if (!(this.getLineHeightInPixels() > 0)) {
        throw new Error("You must assign lineHeightInPixels before calling ::getScrollHeight()");
      }
      return this.getLineCount() * this.getLineHeightInPixels();
    };

    DisplayBuffer.prototype.getScrollWidth = function() {
      return (this.getMaxLineLength() * this.getDefaultCharWidth()) + this.getCursorWidth();
    };

    DisplayBuffer.prototype.getVisibleRowRange = function() {
      var endRow, heightInLines, startRow;
      if (!(this.getLineHeightInPixels() > 0)) {
        throw new Error("You must assign a non-zero lineHeightInPixels before calling ::getVisibleRowRange()");
      }
      heightInLines = Math.ceil(this.getHeight() / this.getLineHeightInPixels()) + 1;
      startRow = Math.floor(this.getScrollTop() / this.getLineHeightInPixels());
      endRow = Math.min(this.getLineCount(), startRow + heightInLines);
      return [startRow, endRow];
    };

    DisplayBuffer.prototype.intersectsVisibleRowRange = function(startRow, endRow) {
      var visibleEnd, visibleStart, _ref1;
      _ref1 = this.getVisibleRowRange(), visibleStart = _ref1[0], visibleEnd = _ref1[1];
      return !(endRow <= visibleStart || visibleEnd <= startRow);
    };

    DisplayBuffer.prototype.selectionIntersectsVisibleRowRange = function(selection) {
      var end, start, _ref1;
      _ref1 = selection.getScreenRange(), start = _ref1.start, end = _ref1.end;
      return this.intersectsVisibleRowRange(start.row, end.row + 1);
    };

    DisplayBuffer.prototype.scrollToScreenRange = function(screenRange) {
      var bottom, desiredScrollBottom, desiredScrollLeft, desiredScrollRight, desiredScrollTop, height, horizontalScrollMarginInPixels, left, right, top, verticalScrollMarginInPixels, width, _ref1;
      verticalScrollMarginInPixels = this.getVerticalScrollMargin() * this.getLineHeightInPixels();
      horizontalScrollMarginInPixels = this.getHorizontalScrollMargin() * this.getDefaultCharWidth();
      _ref1 = this.pixelRectForScreenRange(screenRange), top = _ref1.top, left = _ref1.left, height = _ref1.height, width = _ref1.width;
      bottom = top + height;
      right = left + width;
      desiredScrollTop = top - verticalScrollMarginInPixels;
      desiredScrollBottom = bottom + verticalScrollMarginInPixels;
      desiredScrollLeft = left - horizontalScrollMarginInPixels;
      desiredScrollRight = right + horizontalScrollMarginInPixels;
      if (desiredScrollTop < this.getScrollTop()) {
        this.setScrollTop(desiredScrollTop);
      } else if (desiredScrollBottom > this.getScrollBottom()) {
        this.setScrollBottom(desiredScrollBottom);
      }
      if (desiredScrollLeft < this.getScrollLeft()) {
        return this.setScrollLeft(desiredScrollLeft);
      } else if (desiredScrollRight > this.getScrollRight()) {
        return this.setScrollRight(desiredScrollRight);
      }
    };

    DisplayBuffer.prototype.scrollToScreenPosition = function(screenPosition) {
      return this.scrollToScreenRange(new Range(screenPosition, screenPosition));
    };

    DisplayBuffer.prototype.scrollToBufferPosition = function(bufferPosition) {
      return this.scrollToScreenPosition(this.screenPositionForBufferPosition(bufferPosition));
    };

    DisplayBuffer.prototype.pixelRectForScreenRange = function(screenRange) {
      var height, left, top, width, _ref1;
      if (screenRange.end.row > screenRange.start.row) {
        top = this.pixelPositionForScreenPosition(screenRange.start).top;
        left = 0;
        height = (screenRange.end.row - screenRange.start.row + 1) * this.getLineHeightInPixels();
        width = this.getScrollWidth();
      } else {
        _ref1 = this.pixelPositionForScreenPosition(screenRange.start), top = _ref1.top, left = _ref1.left;
        height = this.getLineHeightInPixels();
        width = this.pixelPositionForScreenPosition(screenRange.end).left - left;
      }
      return {
        top: top,
        left: left,
        width: width,
        height: height
      };
    };

    DisplayBuffer.prototype.getTabLength = function() {
      return this.tokenizedBuffer.getTabLength();
    };

    DisplayBuffer.prototype.setTabLength = function(tabLength) {
      return this.tokenizedBuffer.setTabLength(tabLength);
    };

    DisplayBuffer.prototype.setSoftWrap = function(softWrap) {
      this.softWrap = softWrap;
      return this.softWrap;
    };

    DisplayBuffer.prototype.getSoftWrap = function() {
      return this.softWrap;
    };

    DisplayBuffer.prototype.setEditorWidthInChars = function(editorWidthInChars) {
      var previousWidthInChars;
      if (editorWidthInChars > 0) {
        previousWidthInChars = this.editorWidthInChars;
        this.editorWidthInChars = editorWidthInChars;
        if (editorWidthInChars !== previousWidthInChars && this.softWrap) {
          return this.updateWrappedScreenLines();
        }
      }
    };

    DisplayBuffer.prototype.getEditorWidthInChars = function() {
      var width;
      width = this.getWidth();
      if ((width != null) && this.defaultCharWidth > 0) {
        return Math.floor(width / this.defaultCharWidth);
      } else {
        return this.editorWidthInChars;
      }
    };

    DisplayBuffer.prototype.getSoftWrapColumn = function() {
      if (atom.config.get('editor.softWrapAtPreferredLineLength')) {
        return Math.min(this.getEditorWidthInChars(), atom.config.getPositiveInt('editor.preferredLineLength', this.getEditorWidthInChars()));
      } else {
        return this.getEditorWidthInChars();
      }
    };

    DisplayBuffer.prototype.lineForRow = function(row) {
      return this.screenLines[row];
    };

    DisplayBuffer.prototype.linesForRows = function(startRow, endRow) {
      return this.screenLines.slice(startRow, +endRow + 1 || 9e9);
    };

    DisplayBuffer.prototype.getLines = function() {
      return (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Array, this.screenLines, function(){});
    };

    DisplayBuffer.prototype.indentLevelForLine = function(line) {
      return this.tokenizedBuffer.indentLevelForLine(line);
    };

    DisplayBuffer.prototype.bufferRowsForScreenRows = function(startScreenRow, endScreenRow) {
      var screenRow, _i, _results;
      _results = [];
      for (screenRow = _i = startScreenRow; startScreenRow <= endScreenRow ? _i <= endScreenRow : _i >= endScreenRow; screenRow = startScreenRow <= endScreenRow ? ++_i : --_i) {
        _results.push(this.rowMap.bufferRowRangeForScreenRow(screenRow)[0]);
      }
      return _results;
    };

    DisplayBuffer.prototype.createFold = function(startRow, endRow) {
      var foldMarker, _ref1;
      foldMarker = (_ref1 = this.findFoldMarker({
        startRow: startRow,
        endRow: endRow
      })) != null ? _ref1 : this.buffer.markRange([[startRow, 0], [endRow, Infinity]], this.getFoldMarkerAttributes());
      return this.foldForMarker(foldMarker);
    };

    DisplayBuffer.prototype.isFoldedAtBufferRow = function(bufferRow) {
      return this.largestFoldContainingBufferRow(bufferRow) != null;
    };

    DisplayBuffer.prototype.isFoldedAtScreenRow = function(screenRow) {
      return this.largestFoldContainingBufferRow(this.bufferRowForScreenRow(screenRow)) != null;
    };

    DisplayBuffer.prototype.destroyFoldWithId = function(id) {
      var _ref1;
      return (_ref1 = this.foldsByMarkerId[id]) != null ? _ref1.destroy() : void 0;
    };

    DisplayBuffer.prototype.unfoldBufferRow = function(bufferRow) {
      var fold, _i, _len, _ref1, _results;
      _ref1 = this.foldsContainingBufferRow(bufferRow);
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        fold = _ref1[_i];
        _results.push(fold.destroy());
      }
      return _results;
    };

    DisplayBuffer.prototype.largestFoldStartingAtBufferRow = function(bufferRow) {
      return this.foldsStartingAtBufferRow(bufferRow)[0];
    };

    DisplayBuffer.prototype.foldsStartingAtBufferRow = function(bufferRow) {
      var marker, _i, _len, _ref1, _results;
      _ref1 = this.findFoldMarkers({
        startRow: bufferRow
      });
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        _results.push(this.foldForMarker(marker));
      }
      return _results;
    };

    DisplayBuffer.prototype.largestFoldStartingAtScreenRow = function(screenRow) {
      return this.largestFoldStartingAtBufferRow(this.bufferRowForScreenRow(screenRow));
    };

    DisplayBuffer.prototype.largestFoldContainingBufferRow = function(bufferRow) {
      return this.foldsContainingBufferRow(bufferRow)[0];
    };

    DisplayBuffer.prototype.outermostFoldsInBufferRowRange = function(startRow, endRow) {
      return this.findFoldMarkers({
        containedInRange: [[startRow, 0], [endRow, 0]]
      }).map((function(_this) {
        return function(marker) {
          return _this.foldForMarker(marker);
        };
      })(this)).filter(function(fold) {
        return !fold.isInsideLargerFold();
      });
    };

    DisplayBuffer.prototype.foldsContainingBufferRow = function(bufferRow) {
      var marker, _i, _len, _ref1, _results;
      _ref1 = this.findFoldMarkers({
        intersectsRow: bufferRow
      });
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        _results.push(this.foldForMarker(marker));
      }
      return _results;
    };

    DisplayBuffer.prototype.screenRowForBufferRow = function(bufferRow) {
      return this.rowMap.screenRowRangeForBufferRow(bufferRow)[0];
    };

    DisplayBuffer.prototype.lastScreenRowForBufferRow = function(bufferRow) {
      return this.rowMap.screenRowRangeForBufferRow(bufferRow)[1] - 1;
    };

    DisplayBuffer.prototype.bufferRowForScreenRow = function(screenRow) {
      return this.rowMap.bufferRowRangeForScreenRow(screenRow)[0];
    };

    DisplayBuffer.prototype.screenRangeForBufferRange = function(bufferRange) {
      var end, start;
      bufferRange = Range.fromObject(bufferRange);
      start = this.screenPositionForBufferPosition(bufferRange.start);
      end = this.screenPositionForBufferPosition(bufferRange.end);
      return new Range(start, end);
    };

    DisplayBuffer.prototype.bufferRangeForScreenRange = function(screenRange) {
      var end, start;
      screenRange = Range.fromObject(screenRange);
      start = this.bufferPositionForScreenPosition(screenRange.start);
      end = this.bufferPositionForScreenPosition(screenRange.end);
      return new Range(start, end);
    };

    DisplayBuffer.prototype.pixelRangeForScreenRange = function(screenRange, clip) {
      var end, start, _ref1;
      if (clip == null) {
        clip = true;
      }
      _ref1 = Range.fromObject(screenRange), start = _ref1.start, end = _ref1.end;
      return {
        start: this.pixelPositionForScreenPosition(start, clip),
        end: this.pixelPositionForScreenPosition(end, clip)
      };
    };

    DisplayBuffer.prototype.pixelPositionForScreenPosition = function(screenPosition, clip) {
      var char, charWidths, column, defaultCharWidth, left, targetColumn, targetRow, token, top, _i, _j, _len, _len1, _ref1, _ref2, _ref3;
      if (clip == null) {
        clip = true;
      }
      screenPosition = Point.fromObject(screenPosition);
      if (clip) {
        screenPosition = this.clipScreenPosition(screenPosition);
      }
      targetRow = screenPosition.row;
      targetColumn = screenPosition.column;
      defaultCharWidth = this.defaultCharWidth;
      top = targetRow * this.lineHeightInPixels;
      left = 0;
      column = 0;
      _ref1 = this.lineForRow(targetRow).tokens;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        token = _ref1[_i];
        charWidths = this.getScopedCharWidths(token.scopes);
        _ref2 = token.value;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          char = _ref2[_j];
          if (column === targetColumn) {
            return {
              top: top,
              left: left
            };
          }
          left += (_ref3 = charWidths[char]) != null ? _ref3 : defaultCharWidth;
          column++;
        }
      }
      return {
        top: top,
        left: left
      };
    };

    DisplayBuffer.prototype.screenPositionForPixelPosition = function(pixelPosition) {
      var char, charWidth, charWidths, column, defaultCharWidth, left, row, targetLeft, targetTop, token, _i, _j, _len, _len1, _ref1, _ref2, _ref3;
      targetTop = pixelPosition.top;
      targetLeft = pixelPosition.left;
      defaultCharWidth = this.defaultCharWidth;
      row = Math.floor(targetTop / this.getLineHeightInPixels());
      row = Math.min(row, this.getLastRow());
      row = Math.max(0, row);
      left = 0;
      column = 0;
      _ref1 = this.lineForRow(row).tokens;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        token = _ref1[_i];
        charWidths = this.getScopedCharWidths(token.scopes);
        _ref2 = token.value;
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          char = _ref2[_j];
          charWidth = (_ref3 = charWidths[char]) != null ? _ref3 : defaultCharWidth;
          if (targetLeft <= left + (charWidth / 2)) {
            break;
          }
          left += charWidth;
          column++;
        }
      }
      return new Point(row, column);
    };

    DisplayBuffer.prototype.pixelPositionForBufferPosition = function(bufferPosition) {
      return this.pixelPositionForScreenPosition(this.screenPositionForBufferPosition(bufferPosition));
    };

    DisplayBuffer.prototype.getLineCount = function() {
      return this.screenLines.length;
    };

    DisplayBuffer.prototype.getLastRow = function() {
      return this.getLineCount() - 1;
    };

    DisplayBuffer.prototype.getMaxLineLength = function() {
      return this.maxLineLength;
    };

    DisplayBuffer.prototype.screenPositionForBufferPosition = function(bufferPosition, options) {
      var column, endScreenRow, maxBufferColumn, row, screenColumn, screenLine, screenRow, startScreenRow, _i, _ref1, _ref2;
      _ref1 = this.buffer.clipPosition(bufferPosition), row = _ref1.row, column = _ref1.column;
      _ref2 = this.rowMap.screenRowRangeForBufferRow(row), startScreenRow = _ref2[0], endScreenRow = _ref2[1];
      for (screenRow = _i = startScreenRow; startScreenRow <= endScreenRow ? _i < endScreenRow : _i > endScreenRow; screenRow = startScreenRow <= endScreenRow ? ++_i : --_i) {
        screenLine = this.screenLines[screenRow];
        if (screenLine == null) {
          throw new BufferToScreenConversionError("No screen line exists when converting buffer row to screen row", {
            softWrapEnabled: this.getSoftWrap(),
            foldCount: this.findFoldMarkers().length,
            lastBufferRow: this.buffer.getLastRow(),
            lastScreenRow: this.getLastRow()
          });
        }
        maxBufferColumn = screenLine.getMaxBufferColumn();
        if (screenLine.isSoftWrapped() && column > maxBufferColumn) {
          continue;
        } else {
          if (column <= maxBufferColumn) {
            screenColumn = screenLine.screenColumnForBufferColumn(column);
          } else {
            screenColumn = Infinity;
          }
          break;
        }
      }
      return this.clipScreenPosition([screenRow, screenColumn], options);
    };

    DisplayBuffer.prototype.bufferPositionForScreenPosition = function(screenPosition, options) {
      var bufferRow, column, row, _ref1;
      _ref1 = this.clipScreenPosition(Point.fromObject(screenPosition), options), row = _ref1.row, column = _ref1.column;
      bufferRow = this.rowMap.bufferRowRangeForScreenRow(row)[0];
      return new Point(bufferRow, this.screenLines[row].bufferColumnForScreenColumn(column));
    };

    DisplayBuffer.prototype.scopesForBufferPosition = function(bufferPosition) {
      return this.tokenizedBuffer.scopesForPosition(bufferPosition);
    };

    DisplayBuffer.prototype.bufferRangeForScopeAtPosition = function(selector, position) {
      return this.tokenizedBuffer.bufferRangeForScopeAtPosition(selector, position);
    };

    DisplayBuffer.prototype.tokenForBufferPosition = function(bufferPosition) {
      return this.tokenizedBuffer.tokenForPosition(bufferPosition);
    };

    DisplayBuffer.prototype.getGrammar = function() {
      return this.tokenizedBuffer.grammar;
    };

    DisplayBuffer.prototype.setGrammar = function(grammar) {
      return this.tokenizedBuffer.setGrammar(grammar);
    };

    DisplayBuffer.prototype.reloadGrammar = function() {
      return this.tokenizedBuffer.reloadGrammar();
    };

    DisplayBuffer.prototype.clipScreenPosition = function(screenPosition, options) {
      var column, maxScreenColumn, row, screenLine, wrapAtSoftNewlines, wrapBeyondNewlines, _ref1;
      if (options == null) {
        options = {};
      }
      wrapBeyondNewlines = options.wrapBeyondNewlines, wrapAtSoftNewlines = options.wrapAtSoftNewlines;
      _ref1 = Point.fromObject(screenPosition), row = _ref1.row, column = _ref1.column;
      if (row < 0) {
        row = 0;
        column = 0;
      } else if (row > this.getLastRow()) {
        row = this.getLastRow();
        column = Infinity;
      } else if (column < 0) {
        column = 0;
      }
      screenLine = this.screenLines[row];
      maxScreenColumn = screenLine.getMaxScreenColumn();
      if (screenLine.isSoftWrapped() && column >= maxScreenColumn) {
        if (wrapAtSoftNewlines) {
          row++;
          column = 0;
        } else {
          column = screenLine.clipScreenColumn(maxScreenColumn - 1);
        }
      } else if (wrapBeyondNewlines && column > maxScreenColumn && row < this.getLastRow()) {
        row++;
        column = 0;
      } else {
        column = screenLine.clipScreenColumn(column, options);
      }
      return new Point(row, column);
    };

    DisplayBuffer.prototype.findWrapColumn = function(line, softWrapColumn) {
      var column, _i, _j, _ref1;
      if (softWrapColumn == null) {
        softWrapColumn = this.getSoftWrapColumn();
      }
      if (!this.softWrap) {
        return;
      }
      if (!(line.length > softWrapColumn)) {
        return;
      }
      if (/\s/.test(line[softWrapColumn])) {
        for (column = _i = softWrapColumn, _ref1 = line.length; softWrapColumn <= _ref1 ? _i <= _ref1 : _i >= _ref1; column = softWrapColumn <= _ref1 ? ++_i : --_i) {
          if (/\S/.test(line[column])) {
            return column;
          }
        }
        return line.length;
      } else {
        for (column = _j = softWrapColumn; softWrapColumn <= 0 ? _j <= 0 : _j >= 0; column = softWrapColumn <= 0 ? ++_j : --_j) {
          if (/\s/.test(line[column])) {
            return column + 1;
          }
        }
        return softWrapColumn;
      }
    };

    DisplayBuffer.prototype.rangeForAllLines = function() {
      return new Range([0, 0], this.clipScreenPosition([Infinity, Infinity]));
    };

    DisplayBuffer.prototype.getMarker = function(id) {
      var bufferMarker, marker;
      if (!(marker = this.markers[id])) {
        if (bufferMarker = this.buffer.getMarker(id)) {
          marker = new DisplayBufferMarker({
            bufferMarker: bufferMarker,
            displayBuffer: this
          });
          this.markers[id] = marker;
        }
      }
      return marker;
    };

    DisplayBuffer.prototype.getMarkers = function() {
      return this.buffer.getMarkers().map((function(_this) {
        return function(_arg) {
          var id;
          id = _arg.id;
          return _this.getMarker(id);
        };
      })(this));
    };

    DisplayBuffer.prototype.getMarkerCount = function() {
      return this.buffer.getMarkerCount();
    };

    DisplayBuffer.prototype.markScreenRange = function() {
      var args, bufferRange;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      bufferRange = this.bufferRangeForScreenRange(args.shift());
      return this.markBufferRange.apply(this, [bufferRange].concat(__slice.call(args)));
    };

    DisplayBuffer.prototype.markBufferRange = function(range, options) {
      return this.getMarker(this.buffer.markRange(range, options).id);
    };

    DisplayBuffer.prototype.markScreenPosition = function(screenPosition, options) {
      return this.markBufferPosition(this.bufferPositionForScreenPosition(screenPosition), options);
    };

    DisplayBuffer.prototype.markBufferPosition = function(bufferPosition, options) {
      return this.getMarker(this.buffer.markPosition(bufferPosition, options).id);
    };

    DisplayBuffer.prototype.destroyMarker = function(id) {
      this.buffer.destroyMarker(id);
      return delete this.markers[id];
    };

    DisplayBuffer.prototype.findMarker = function(params) {
      return this.findMarkers(params)[0];
    };

    DisplayBuffer.prototype.findMarkers = function(params) {
      params = this.translateToBufferMarkerParams(params);
      return this.buffer.findMarkers(params).map((function(_this) {
        return function(stringMarker) {
          return _this.getMarker(stringMarker.id);
        };
      })(this));
    };

    DisplayBuffer.prototype.translateToBufferMarkerParams = function(params) {
      var bufferMarkerParams, key, value;
      bufferMarkerParams = {};
      for (key in params) {
        value = params[key];
        switch (key) {
          case 'startBufferRow':
            key = 'startRow';
            break;
          case 'endBufferRow':
            key = 'endRow';
            break;
          case 'containsBufferRange':
            key = 'containsRange';
            break;
          case 'containsBufferPosition':
            key = 'containsPosition';
            break;
          case 'containedInBufferRange':
            key = 'containedInRange';
        }
        bufferMarkerParams[key] = value;
      }
      return bufferMarkerParams;
    };

    DisplayBuffer.prototype.findFoldMarker = function(attributes) {
      return this.findFoldMarkers(attributes)[0];
    };

    DisplayBuffer.prototype.findFoldMarkers = function(attributes) {
      return this.buffer.findMarkers(this.getFoldMarkerAttributes(attributes));
    };

    DisplayBuffer.prototype.getFoldMarkerAttributes = function(attributes) {
      if (attributes == null) {
        attributes = {};
      }
      return _.extend(attributes, {
        "class": 'fold',
        displayBufferId: this.id
      });
    };

    DisplayBuffer.prototype.pauseMarkerObservers = function() {
      var marker, _i, _len, _ref1, _results;
      _ref1 = this.getMarkers();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        _results.push(marker.pauseEvents());
      }
      return _results;
    };

    DisplayBuffer.prototype.resumeMarkerObservers = function() {
      var marker, _i, _len, _ref1;
      _ref1 = this.getMarkers();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        marker.resumeEvents();
      }
      return this.emit('markers-updated');
    };

    DisplayBuffer.prototype.refreshMarkerScreenPositions = function() {
      var marker, _i, _len, _ref1, _results;
      _ref1 = this.getMarkers();
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        _results.push(marker.notifyObservers({
          textChanged: false
        }));
      }
      return _results;
    };

    DisplayBuffer.prototype.destroy = function() {
      var marker, _i, _len, _ref1;
      _ref1 = this.getMarkers();
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        marker = _ref1[_i];
        marker.unsubscribe();
      }
      this.tokenizedBuffer.destroy();
      return this.unsubscribe();
    };

    DisplayBuffer.prototype.logLines = function(start, end) {
      var line, row, _i, _results;
      if (start == null) {
        start = 0;
      }
      if (end == null) {
        end = this.getLastRow();
      }
      _results = [];
      for (row = _i = start; start <= end ? _i <= end : _i >= end; row = start <= end ? ++_i : --_i) {
        line = this.lineForRow(row).text;
        _results.push(console.log(row, this.bufferRowForScreenRow(row), line, line.length));
      }
      return _results;
    };

    DisplayBuffer.prototype.handleTokenizedBufferChange = function(tokenizedBufferChange) {
      var bufferChange, delta, end, start;
      start = tokenizedBufferChange.start, end = tokenizedBufferChange.end, delta = tokenizedBufferChange.delta, bufferChange = tokenizedBufferChange.bufferChange;
      return this.updateScreenLines(start, end + 1, delta, {
        delayChangeEvent: bufferChange != null
      });
    };

    DisplayBuffer.prototype.updateScreenLines = function(startBufferRow, endBufferRow, bufferDelta, options) {
      var changeEvent, endScreenRow, regions, screenLines, startScreenRow, _ref1;
      if (bufferDelta == null) {
        bufferDelta = 0;
      }
      if (options == null) {
        options = {};
      }
      startBufferRow = this.rowMap.bufferRowRangeForBufferRow(startBufferRow)[0];
      endBufferRow = this.rowMap.bufferRowRangeForBufferRow(endBufferRow - 1)[1];
      startScreenRow = this.rowMap.screenRowRangeForBufferRow(startBufferRow)[0];
      endScreenRow = this.rowMap.screenRowRangeForBufferRow(endBufferRow - 1)[1];
      _ref1 = this.buildScreenLines(startBufferRow, endBufferRow + bufferDelta), screenLines = _ref1.screenLines, regions = _ref1.regions;
      [].splice.apply(this.screenLines, [startScreenRow, endScreenRow - startScreenRow].concat(screenLines)), screenLines;
      this.rowMap.spliceRegions(startBufferRow, endBufferRow - startBufferRow, regions);
      this.findMaxLineLength(startScreenRow, endScreenRow, screenLines);
      if (options.suppressChangeEvent) {
        return;
      }
      changeEvent = {
        start: startScreenRow,
        end: endScreenRow - 1,
        screenDelta: screenLines.length - (endScreenRow - startScreenRow),
        bufferDelta: bufferDelta
      };
      if (options.delayChangeEvent) {
        this.pauseMarkerObservers();
        return this.pendingChangeEvent = changeEvent;
      } else {
        return this.emitChanged(changeEvent, options.refreshMarkers);
      }
    };

    DisplayBuffer.prototype.buildScreenLines = function(startBufferRow, endBufferRow) {
      var bufferRow, fold, foldLine, foldedRowCount, rectangularRegion, regions, screenLines, softWraps, tokenizedLine, wrapScreenColumn, wrappedLine, _ref1;
      screenLines = [];
      regions = [];
      rectangularRegion = null;
      bufferRow = startBufferRow;
      while (bufferRow < endBufferRow) {
        tokenizedLine = this.tokenizedBuffer.lineForScreenRow(bufferRow);
        if (fold = this.largestFoldStartingAtBufferRow(bufferRow)) {
          foldLine = tokenizedLine.copy();
          foldLine.fold = fold;
          screenLines.push(foldLine);
          if (rectangularRegion != null) {
            regions.push(rectangularRegion);
            rectangularRegion = null;
          }
          foldedRowCount = fold.getBufferRowCount();
          regions.push({
            bufferRows: foldedRowCount,
            screenRows: 1
          });
          bufferRow += foldedRowCount;
        } else {
          softWraps = 0;
          while (wrapScreenColumn = this.findWrapColumn(tokenizedLine.text)) {
            _ref1 = tokenizedLine.softWrapAt(wrapScreenColumn), wrappedLine = _ref1[0], tokenizedLine = _ref1[1];
            screenLines.push(wrappedLine);
            softWraps++;
          }
          screenLines.push(tokenizedLine);
          if (softWraps > 0) {
            if (rectangularRegion != null) {
              regions.push(rectangularRegion);
              rectangularRegion = null;
            }
            regions.push({
              bufferRows: 1,
              screenRows: softWraps + 1
            });
          } else {
            if (rectangularRegion == null) {
              rectangularRegion = {
                bufferRows: 0,
                screenRows: 0
              };
            }
            rectangularRegion.bufferRows++;
            rectangularRegion.screenRows++;
          }
          bufferRow++;
        }
      }
      if (rectangularRegion != null) {
        regions.push(rectangularRegion);
      }
      return {
        screenLines: screenLines,
        regions: regions
      };
    };

    DisplayBuffer.prototype.findMaxLineLength = function(startScreenRow, endScreenRow, newScreenLines) {
      var length, maxLengthCandidates, maxLengthCandidatesStartRow, screenLine, screenRow, _i, _len, _ref1, _results;
      if ((startScreenRow <= (_ref1 = this.longestScreenRow) && _ref1 < endScreenRow)) {
        this.longestScreenRow = 0;
        this.maxLineLength = 0;
        maxLengthCandidatesStartRow = 0;
        maxLengthCandidates = this.screenLines;
      } else {
        maxLengthCandidatesStartRow = startScreenRow;
        maxLengthCandidates = newScreenLines;
      }
      _results = [];
      for (screenRow = _i = 0, _len = maxLengthCandidates.length; _i < _len; screenRow = ++_i) {
        screenLine = maxLengthCandidates[screenRow];
        length = screenLine.text.length;
        if (length > this.maxLineLength) {
          this.longestScreenRow = maxLengthCandidatesStartRow + screenRow;
          _results.push(this.maxLineLength = length);
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    DisplayBuffer.prototype.handleBufferMarkersUpdated = function() {
      var event;
      if (event = this.pendingChangeEvent) {
        this.pendingChangeEvent = null;
        return this.emitChanged(event, false);
      }
    };

    DisplayBuffer.prototype.handleBufferMarkerCreated = function(marker) {
      if (marker.matchesAttributes(this.getFoldMarkerAttributes())) {
        this.createFoldForMarker(marker);
      }
      return this.emit('marker-created', this.getMarker(marker.id));
    };

    DisplayBuffer.prototype.createFoldForMarker = function(marker) {
      return new Fold(this, marker);
    };

    DisplayBuffer.prototype.foldForMarker = function(marker) {
      return this.foldsByMarkerId[marker.id];
    };

    return DisplayBuffer;

  })(Model);

}).call(this);
