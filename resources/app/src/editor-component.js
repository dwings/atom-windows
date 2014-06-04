(function() {
  var CursorsComponent, EditorComponent, GutterComponent, InputComponent, LinesComponent, Point, Range, React, ScrollbarComponent, ScrollbarCornerComponent, SubscriberMixin, debounce, defaults, div, isEqualForProperties, scrollbarStyle, span, _ref, _ref1, _ref2;

  React = require('react-atom-fork');

  _ref = require('reactionary-atom-fork'), div = _ref.div, span = _ref.span;

  _ref1 = require('underscore-plus'), debounce = _ref1.debounce, defaults = _ref1.defaults, isEqualForProperties = _ref1.isEqualForProperties;

  scrollbarStyle = require('scrollbar-style');

  _ref2 = require('text-buffer'), Range = _ref2.Range, Point = _ref2.Point;

  GutterComponent = require('./gutter-component');

  InputComponent = require('./input-component');

  CursorsComponent = require('./cursors-component');

  LinesComponent = require('./lines-component');

  ScrollbarComponent = require('./scrollbar-component');

  ScrollbarCornerComponent = require('./scrollbar-corner-component');

  SubscriberMixin = require('./subscriber-mixin');

  module.exports = EditorComponent = React.createClass({
    displayName: 'EditorComponent',
    mixins: [SubscriberMixin],
    pendingScrollTop: null,
    pendingScrollLeft: null,
    selectOnMouseMove: false,
    batchingUpdates: false,
    updateRequested: false,
    cursorsMoved: false,
    selectionChanged: false,
    selectionAdded: false,
    scrollingVertically: false,
    gutterWidth: 0,
    refreshingScrollbars: false,
    measuringScrollbars: true,
    pendingVerticalScrollDelta: 0,
    pendingHorizontalScrollDelta: 0,
    mouseWheelScreenRow: null,
    mouseWheelScreenRowClearDelay: 150,
    scrollViewMeasurementRequested: false,
    overflowChangedEventsPaused: false,
    overflowChangedWhilePaused: false,
    measureLineHeightAndDefaultCharWidthWhenShown: false,
    render: function() {
      var className, cursorBlinkPeriod, cursorBlinkResumeDelay, cursorScreenRanges, defaultCharWidth, editor, focused, fontFamily, fontSize, hiddenInputStyle, horizontalScrollbarHeight, horizontallyScrollable, invisibles, lineHeight, lineHeightInPixels, maxLineNumberDigits, mouseWheelScreenRow, renderedEndRow, renderedRowRange, renderedStartRow, scrollHeight, scrollLeft, scrollTop, scrollViewHeight, scrollWidth, selectionScreenRanges, showIndentGuide, showInvisibles, verticalScrollbarWidth, verticallyScrollable, visible, _ref3, _ref4, _ref5;
      _ref3 = this.state, focused = _ref3.focused, fontSize = _ref3.fontSize, lineHeight = _ref3.lineHeight, fontFamily = _ref3.fontFamily, showIndentGuide = _ref3.showIndentGuide, showInvisibles = _ref3.showInvisibles, visible = _ref3.visible;
      _ref4 = this.props, editor = _ref4.editor, cursorBlinkPeriod = _ref4.cursorBlinkPeriod, cursorBlinkResumeDelay = _ref4.cursorBlinkResumeDelay;
      maxLineNumberDigits = editor.getScreenLineCount().toString().length;
      invisibles = showInvisibles ? this.state.invisibles : {};
      if (this.isMounted()) {
        renderedRowRange = this.getRenderedRowRange();
        renderedStartRow = renderedRowRange[0], renderedEndRow = renderedRowRange[1];
        cursorScreenRanges = this.getCursorScreenRanges(renderedRowRange);
        selectionScreenRanges = this.getSelectionScreenRanges(renderedRowRange);
        scrollHeight = editor.getScrollHeight();
        scrollWidth = editor.getScrollWidth();
        scrollTop = editor.getScrollTop();
        scrollLeft = editor.getScrollLeft();
        lineHeightInPixels = editor.getLineHeightInPixels();
        defaultCharWidth = editor.getDefaultCharWidth();
        scrollViewHeight = editor.getHeight();
        horizontalScrollbarHeight = editor.getHorizontalScrollbarHeight();
        verticalScrollbarWidth = editor.getVerticalScrollbarWidth();
        verticallyScrollable = editor.verticallyScrollable();
        horizontallyScrollable = editor.horizontallyScrollable();
        hiddenInputStyle = this.getHiddenInputPosition();
        hiddenInputStyle.WebkitTransform = 'translateZ(0)';
        if ((this.mouseWheelScreenRow != null) && !((renderedStartRow <= (_ref5 = this.mouseWheelScreenRow) && _ref5 < renderedEndRow))) {
          mouseWheelScreenRow = this.mouseWheelScreenRow;
        }
      }
      className = 'editor editor-colors react';
      if (focused) {
        className += ' is-focused';
      }
      return div({
        className: className,
        style: {
          fontSize: fontSize,
          lineHeight: lineHeight,
          fontFamily: fontFamily
        },
        tabIndex: -1
      }, GutterComponent({
        ref: 'gutter',
        editor: editor,
        renderedRowRange: renderedRowRange,
        maxLineNumberDigits: maxLineNumberDigits,
        scrollTop: scrollTop,
        scrollHeight: scrollHeight,
        lineHeightInPixels: lineHeightInPixels,
        pendingChanges: this.pendingChanges,
        mouseWheelScreenRow: mouseWheelScreenRow
      }), div({
        ref: 'scrollView',
        className: 'scroll-view',
        onMouseDown: this.onMouseDown
      }, InputComponent({
        ref: 'input',
        className: 'hidden-input',
        style: hiddenInputStyle,
        onInput: this.onInput,
        onFocus: this.onInputFocused,
        onBlur: this.onInputBlurred
      }), CursorsComponent({
        editor: editor,
        scrollTop: scrollTop,
        scrollLeft: scrollLeft,
        cursorScreenRanges: cursorScreenRanges,
        cursorBlinkPeriod: cursorBlinkPeriod,
        cursorBlinkResumeDelay: cursorBlinkResumeDelay,
        lineHeightInPixels: lineHeightInPixels,
        defaultCharWidth: defaultCharWidth
      }), LinesComponent({
        ref: 'lines',
        editor: editor,
        lineHeightInPixels: lineHeightInPixels,
        defaultCharWidth: defaultCharWidth,
        showIndentGuide: showIndentGuide,
        renderedRowRange: renderedRowRange,
        pendingChanges: this.pendingChanges,
        scrollTop: scrollTop,
        scrollLeft: scrollLeft,
        scrollingVertically: this.scrollingVertically,
        selectionScreenRanges: selectionScreenRanges,
        scrollHeight: scrollHeight,
        scrollWidth: scrollWidth,
        mouseWheelScreenRow: mouseWheelScreenRow,
        invisibles: invisibles,
        visible: visible,
        scrollViewHeight: scrollViewHeight
      })), ScrollbarComponent({
        ref: 'verticalScrollbar',
        className: 'vertical-scrollbar',
        orientation: 'vertical',
        onScroll: this.onVerticalScroll,
        scrollTop: scrollTop,
        scrollHeight: scrollHeight,
        visible: verticallyScrollable && !this.refreshingScrollbars && !this.measuringScrollbars,
        scrollableInOppositeDirection: horizontallyScrollable,
        verticalScrollbarWidth: verticalScrollbarWidth,
        horizontalScrollbarHeight: horizontalScrollbarHeight
      }), ScrollbarComponent({
        ref: 'horizontalScrollbar',
        className: 'horizontal-scrollbar',
        orientation: 'horizontal',
        onScroll: this.onHorizontalScroll,
        scrollLeft: scrollLeft,
        scrollWidth: scrollWidth + this.gutterWidth,
        visible: horizontallyScrollable && !this.refreshingScrollbars && !this.measuringScrollbars,
        scrollableInOppositeDirection: verticallyScrollable,
        verticalScrollbarWidth: verticalScrollbarWidth,
        horizontalScrollbarHeight: horizontalScrollbarHeight
      }), ScrollbarCornerComponent({
        ref: 'scrollbarCorner',
        visible: !this.refreshingScrollbars && (this.measuringScrollbars || horizontallyScrollable && verticallyScrollable),
        measuringScrollbars: this.measuringScrollbars,
        height: horizontalScrollbarHeight,
        width: verticalScrollbarWidth
      }));
    },
    getInitialState: function() {
      return {
        visible: true
      };
    },
    getDefaultProps: function() {
      return {
        cursorBlinkPeriod: 800,
        cursorBlinkResumeDelay: 100,
        lineOverdrawMargin: 8
      };
    },
    componentWillMount: function() {
      this.pendingChanges = [];
      this.props.editor.manageScrollPosition = true;
      return this.observeConfig();
    },
    componentDidMount: function() {
      var editor;
      editor = this.props.editor;
      this.observeEditor();
      this.listenForDOMEvents();
      this.listenForCommands();
      this.subscribe(atom.themes, 'stylesheet-added stylsheet-removed', this.onStylesheetsChanged);
      this.subscribe(scrollbarStyle.changes, this.refreshScrollbars);
      editor.setVisible(true);
      return editor.batchUpdates((function(_this) {
        return function() {
          _this.measureLineHeightAndDefaultCharWidth();
          _this.measureScrollView();
          return _this.measureScrollbars();
        };
      })(this));
    },
    componentWillUnmount: function() {
      this.unsubscribe();
      return window.removeEventListener('resize', this.onWindowResize);
    },
    componentWillUpdate: function() {
      if (this.cursorsMoved) {
        return this.props.parentView.trigger('cursor:moved');
      }
    },
    componentDidUpdate: function(prevProps, prevState) {
      this.pendingChanges.length = 0;
      this.refreshingScrollbars = false;
      if (this.measuringScrollbars) {
        this.measureScrollbars();
      }
      this.measureLineHeightAndCharWidthsIfNeeded(prevState);
      this.pauseOverflowChangedEvents();
      return this.props.parentView.trigger('editor:display-updated');
    },
    requestUpdate: function() {
      if (this.batchingUpdates) {
        return this.updateRequested = true;
      } else {
        return this.forceUpdate();
      }
    },
    getRenderedRowRange: function() {
      var editor, lineOverdrawMargin, renderedEndRow, renderedStartRow, visibleEndRow, visibleStartRow, _ref3, _ref4;
      _ref3 = this.props, editor = _ref3.editor, lineOverdrawMargin = _ref3.lineOverdrawMargin;
      _ref4 = editor.getVisibleRowRange(), visibleStartRow = _ref4[0], visibleEndRow = _ref4[1];
      renderedStartRow = Math.max(0, visibleStartRow - lineOverdrawMargin);
      renderedEndRow = Math.min(editor.getScreenLineCount(), visibleEndRow + lineOverdrawMargin);
      return [renderedStartRow, renderedEndRow];
    },
    getHiddenInputPosition: function() {
      var editor, focused, height, left, top, width, _ref3;
      editor = this.props.editor;
      focused = this.state.focused;
      if (!(this.isMounted() && focused && (editor.getCursor() != null))) {
        return {
          top: 0,
          left: 0
        };
      }
      _ref3 = editor.getCursor().getPixelRect(), top = _ref3.top, left = _ref3.left, height = _ref3.height, width = _ref3.width;
      if (width === 0) {
        width = 2;
      }
      top -= editor.getScrollTop();
      left -= editor.getScrollLeft();
      top = Math.max(0, Math.min(editor.getHeight() - height, top));
      left = Math.max(0, Math.min(editor.getWidth() - width, left));
      return {
        top: top,
        left: left
      };
    },
    getCursorScreenRanges: function(renderedRowRange) {
      var cursor, cursorScreenRanges, editor, renderedEndRow, renderedStartRow, screenRange, selection, _i, _len, _ref3, _ref4;
      editor = this.props.editor;
      renderedStartRow = renderedRowRange[0], renderedEndRow = renderedRowRange[1];
      cursorScreenRanges = {};
      _ref3 = editor.getSelections();
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        selection = _ref3[_i];
        if (!(selection.isEmpty())) {
          continue;
        }
        cursor = selection.cursor;
        screenRange = cursor.getScreenRange();
        if ((renderedStartRow <= (_ref4 = screenRange.start.row) && _ref4 < renderedEndRow)) {
          cursorScreenRanges[cursor.id] = screenRange;
        }
      }
      return cursorScreenRanges;
    },
    getSelectionScreenRanges: function(renderedRowRange) {
      var editor, index, renderedEndRow, renderedStartRow, screenRange, selection, selectionScreenRanges, _i, _len, _ref3;
      editor = this.props.editor;
      renderedStartRow = renderedRowRange[0], renderedEndRow = renderedRowRange[1];
      selectionScreenRanges = {};
      _ref3 = editor.getSelections();
      for (index = _i = 0, _len = _ref3.length; _i < _len; index = ++_i) {
        selection = _ref3[index];
        screenRange = selection.getScreenRange();
        if (!screenRange.isEmpty() && screenRange.intersectsRowRange(renderedStartRow, renderedEndRow)) {
          selectionScreenRanges[selection.id] = screenRange;
        } else if (index === 0) {
          selectionScreenRanges[selection.id] = new Range(new Point(renderedStartRow, 0), new Point(renderedStartRow, 0));
        }
      }
      return selectionScreenRanges;
    },
    observeEditor: function() {
      var editor;
      editor = this.props.editor;
      this.subscribe(editor, 'batched-updates-started', this.onBatchedUpdatesStarted);
      this.subscribe(editor, 'batched-updates-ended', this.onBatchedUpdatesEnded);
      this.subscribe(editor, 'screen-lines-changed', this.onScreenLinesChanged);
      this.subscribe(editor, 'cursors-moved', this.onCursorsMoved);
      this.subscribe(editor, 'selection-removed selection-screen-range-changed', this.onSelectionChanged);
      this.subscribe(editor, 'selection-added', this.onSelectionAdded);
      this.subscribe(editor.$scrollTop.changes, this.onScrollTopChanged);
      this.subscribe(editor.$scrollLeft.changes, this.requestUpdate);
      this.subscribe(editor.$height.changes, this.requestUpdate);
      this.subscribe(editor.$width.changes, this.requestUpdate);
      this.subscribe(editor.$defaultCharWidth.changes, this.requestUpdate);
      return this.subscribe(editor.$lineHeightInPixels.changes, this.requestUpdate);
    },
    listenForDOMEvents: function() {
      var node, scrollViewNode;
      node = this.getDOMNode();
      node.addEventListener('mousewheel', this.onMouseWheel);
      node.addEventListener('focus', this.onFocus);
      scrollViewNode = this.refs.scrollView.getDOMNode();
      scrollViewNode.addEventListener('overflowchanged', this.onScrollViewOverflowChanged);
      scrollViewNode.addEventListener('scroll', this.onScrollViewScroll);
      return window.addEventListener('resize', this.onWindowResize);
    },
    listenForCommands: function() {
      var editor, mini, parentView, _ref3;
      _ref3 = this.props, parentView = _ref3.parentView, editor = _ref3.editor, mini = _ref3.mini;
      this.addCommandListeners({
        'core:move-left': (function(_this) {
          return function() {
            return editor.moveCursorLeft();
          };
        })(this),
        'core:move-right': (function(_this) {
          return function() {
            return editor.moveCursorRight();
          };
        })(this),
        'core:select-left': (function(_this) {
          return function() {
            return editor.selectLeft();
          };
        })(this),
        'core:select-right': (function(_this) {
          return function() {
            return editor.selectRight();
          };
        })(this),
        'core:select-all': (function(_this) {
          return function() {
            return editor.selectAll();
          };
        })(this),
        'core:backspace': (function(_this) {
          return function() {
            return editor.backspace();
          };
        })(this),
        'core:delete': (function(_this) {
          return function() {
            return editor["delete"]();
          };
        })(this),
        'core:undo': (function(_this) {
          return function() {
            return editor.undo();
          };
        })(this),
        'core:redo': (function(_this) {
          return function() {
            return editor.redo();
          };
        })(this),
        'core:cut': (function(_this) {
          return function() {
            return editor.cutSelectedText();
          };
        })(this),
        'core:copy': (function(_this) {
          return function() {
            return editor.copySelectedText();
          };
        })(this),
        'core:paste': (function(_this) {
          return function() {
            return editor.pasteText();
          };
        })(this),
        'editor:move-to-previous-word': (function(_this) {
          return function() {
            return editor.moveCursorToPreviousWord();
          };
        })(this),
        'editor:select-word': (function(_this) {
          return function() {
            return editor.selectWord();
          };
        })(this),
        'editor:consolidate-selections': this.consolidateSelections,
        'editor:delete-to-beginning-of-word': (function(_this) {
          return function() {
            return editor.deleteToBeginningOfWord();
          };
        })(this),
        'editor:delete-to-beginning-of-line': (function(_this) {
          return function() {
            return editor.deleteToBeginningOfLine();
          };
        })(this),
        'editor:delete-to-end-of-word': (function(_this) {
          return function() {
            return editor.deleteToEndOfWord();
          };
        })(this),
        'editor:delete-line': (function(_this) {
          return function() {
            return editor.deleteLine();
          };
        })(this),
        'editor:cut-to-end-of-line': (function(_this) {
          return function() {
            return editor.cutToEndOfLine();
          };
        })(this),
        'editor:move-to-beginning-of-next-paragraph': (function(_this) {
          return function() {
            return editor.moveCursorToBeginningOfNextParagraph();
          };
        })(this),
        'editor:move-to-beginning-of-previous-paragraph': (function(_this) {
          return function() {
            return editor.moveCursorToBeginningOfPreviousParagraph();
          };
        })(this),
        'editor:move-to-beginning-of-screen-line': (function(_this) {
          return function() {
            return editor.moveCursorToBeginningOfScreenLine();
          };
        })(this),
        'editor:move-to-beginning-of-line': (function(_this) {
          return function() {
            return editor.moveCursorToBeginningOfLine();
          };
        })(this),
        'editor:move-to-end-of-screen-line': (function(_this) {
          return function() {
            return editor.moveCursorToEndOfScreenLine();
          };
        })(this),
        'editor:move-to-end-of-line': (function(_this) {
          return function() {
            return editor.moveCursorToEndOfLine();
          };
        })(this),
        'editor:move-to-first-character-of-line': (function(_this) {
          return function() {
            return editor.moveCursorToFirstCharacterOfLine();
          };
        })(this),
        'editor:move-to-beginning-of-word': (function(_this) {
          return function() {
            return editor.moveCursorToBeginningOfWord();
          };
        })(this),
        'editor:move-to-end-of-word': (function(_this) {
          return function() {
            return editor.moveCursorToEndOfWord();
          };
        })(this),
        'editor:move-to-beginning-of-next-word': (function(_this) {
          return function() {
            return editor.moveCursorToBeginningOfNextWord();
          };
        })(this),
        'editor:move-to-previous-word-boundary': (function(_this) {
          return function() {
            return editor.moveCursorToPreviousWordBoundary();
          };
        })(this),
        'editor:move-to-next-word-boundary': (function(_this) {
          return function() {
            return editor.moveCursorToNextWordBoundary();
          };
        })(this),
        'editor:select-to-end-of-line': (function(_this) {
          return function() {
            return editor.selectToEndOfLine();
          };
        })(this),
        'editor:select-to-beginning-of-line': (function(_this) {
          return function() {
            return editor.selectToBeginningOfLine();
          };
        })(this),
        'editor:select-to-end-of-word': (function(_this) {
          return function() {
            return editor.selectToEndOfWord();
          };
        })(this),
        'editor:select-to-beginning-of-word': (function(_this) {
          return function() {
            return editor.selectToBeginningOfWord();
          };
        })(this),
        'editor:select-to-beginning-of-next-word': (function(_this) {
          return function() {
            return editor.selectToBeginningOfNextWord();
          };
        })(this),
        'editor:select-to-next-word-boundary': (function(_this) {
          return function() {
            return editor.selectToNextWordBoundary();
          };
        })(this),
        'editor:select-to-previous-word-boundary': (function(_this) {
          return function() {
            return editor.selectToPreviousWordBoundary();
          };
        })(this),
        'editor:select-to-first-character-of-line': (function(_this) {
          return function() {
            return editor.selectToFirstCharacterOfLine();
          };
        })(this),
        'editor:select-line': (function(_this) {
          return function() {
            return editor.selectLine();
          };
        })(this),
        'editor:transpose': (function(_this) {
          return function() {
            return editor.transpose();
          };
        })(this),
        'editor:upper-case': (function(_this) {
          return function() {
            return editor.upperCase();
          };
        })(this),
        'editor:lower-case': (function(_this) {
          return function() {
            return editor.lowerCase();
          };
        })(this)
      });
      if (!mini) {
        return this.addCommandListeners({
          'core:move-up': (function(_this) {
            return function() {
              return editor.moveCursorUp();
            };
          })(this),
          'core:move-down': (function(_this) {
            return function() {
              return editor.moveCursorDown();
            };
          })(this),
          'core:move-to-top': (function(_this) {
            return function() {
              return editor.moveCursorToTop();
            };
          })(this),
          'core:move-to-bottom': (function(_this) {
            return function() {
              return editor.moveCursorToBottom();
            };
          })(this),
          'core:select-up': (function(_this) {
            return function() {
              return editor.selectUp();
            };
          })(this),
          'core:select-down': (function(_this) {
            return function() {
              return editor.selectDown();
            };
          })(this),
          'core:select-to-top': (function(_this) {
            return function() {
              return editor.selectToTop();
            };
          })(this),
          'core:select-to-bottom': (function(_this) {
            return function() {
              return editor.selectToBottom();
            };
          })(this),
          'editor:indent': (function(_this) {
            return function() {
              return editor.indent();
            };
          })(this),
          'editor:auto-indent': (function(_this) {
            return function() {
              return editor.autoIndentSelectedRows();
            };
          })(this),
          'editor:indent-selected-rows': (function(_this) {
            return function() {
              return editor.indentSelectedRows();
            };
          })(this),
          'editor:outdent-selected-rows': (function(_this) {
            return function() {
              return editor.outdentSelectedRows();
            };
          })(this),
          'editor:newline': (function(_this) {
            return function() {
              return editor.insertNewline();
            };
          })(this),
          'editor:newline-below': (function(_this) {
            return function() {
              return editor.insertNewlineBelow();
            };
          })(this),
          'editor:newline-above': (function(_this) {
            return function() {
              return editor.insertNewlineAbove();
            };
          })(this),
          'editor:add-selection-below': (function(_this) {
            return function() {
              return editor.addSelectionBelow();
            };
          })(this),
          'editor:add-selection-above': (function(_this) {
            return function() {
              return editor.addSelectionAbove();
            };
          })(this),
          'editor:split-selections-into-lines': (function(_this) {
            return function() {
              return editor.splitSelectionsIntoLines();
            };
          })(this),
          'editor:toggle-soft-tabs': (function(_this) {
            return function() {
              return editor.toggleSoftTabs();
            };
          })(this),
          'editor:toggle-soft-wrap': (function(_this) {
            return function() {
              return editor.toggleSoftWrap();
            };
          })(this),
          'editor:fold-all': (function(_this) {
            return function() {
              return editor.foldAll();
            };
          })(this),
          'editor:unfold-all': (function(_this) {
            return function() {
              return editor.unfoldAll();
            };
          })(this),
          'editor:fold-current-row': (function(_this) {
            return function() {
              return editor.foldCurrentRow();
            };
          })(this),
          'editor:unfold-current-row': (function(_this) {
            return function() {
              return editor.unfoldCurrentRow();
            };
          })(this),
          'editor:fold-selection': (function(_this) {
            return function() {
              return neditor.foldSelectedLines();
            };
          })(this),
          'editor:fold-at-indent-level-1': (function(_this) {
            return function() {
              return editor.foldAllAtIndentLevel(0);
            };
          })(this),
          'editor:fold-at-indent-level-2': (function(_this) {
            return function() {
              return editor.foldAllAtIndentLevel(1);
            };
          })(this),
          'editor:fold-at-indent-level-3': (function(_this) {
            return function() {
              return editor.foldAllAtIndentLevel(2);
            };
          })(this),
          'editor:fold-at-indent-level-4': (function(_this) {
            return function() {
              return editor.foldAllAtIndentLevel(3);
            };
          })(this),
          'editor:fold-at-indent-level-5': (function(_this) {
            return function() {
              return editor.foldAllAtIndentLevel(4);
            };
          })(this),
          'editor:fold-at-indent-level-6': (function(_this) {
            return function() {
              return editor.foldAllAtIndentLevel(5);
            };
          })(this),
          'editor:fold-at-indent-level-7': (function(_this) {
            return function() {
              return editor.foldAllAtIndentLevel(6);
            };
          })(this),
          'editor:fold-at-indent-level-8': (function(_this) {
            return function() {
              return editor.foldAllAtIndentLevel(7);
            };
          })(this),
          'editor:fold-at-indent-level-9': (function(_this) {
            return function() {
              return editor.foldAllAtIndentLevel(8);
            };
          })(this),
          'editor:toggle-line-comments': (function(_this) {
            return function() {
              return editor.toggleLineCommentsInSelection();
            };
          })(this),
          'editor:log-cursor-scope': (function(_this) {
            return function() {
              return editor.logCursorScope();
            };
          })(this),
          'editor:checkout-head-revision': (function(_this) {
            return function() {
              return editor.checkoutHead();
            };
          })(this),
          'editor:copy-path': (function(_this) {
            return function() {
              return editor.copyPathToClipboard();
            };
          })(this),
          'editor:move-line-up': (function(_this) {
            return function() {
              return editor.moveLineUp();
            };
          })(this),
          'editor:move-line-down': (function(_this) {
            return function() {
              return editor.moveLineDown();
            };
          })(this),
          'editor:duplicate-lines': (function(_this) {
            return function() {
              return editor.duplicateLines();
            };
          })(this),
          'editor:join-lines': (function(_this) {
            return function() {
              return editor.joinLines();
            };
          })(this),
          'editor:toggle-indent-guide': (function(_this) {
            return function() {
              return atom.config.toggle('editor.showIndentGuide');
            };
          })(this),
          'editor:toggle-line-numbers': (function(_this) {
            return function() {
              return atom.config.toggle('editor.showLineNumbers');
            };
          })(this),
          'editor:scroll-to-cursor': (function(_this) {
            return function() {
              return editor.scrollToCursorPosition();
            };
          })(this),
          'core:page-up': (function(_this) {
            return function() {
              return editor.pageUp();
            };
          })(this),
          'core:page-down': (function(_this) {
            return function() {
              return editor.pageDown();
            };
          })(this),
          'benchmark:scroll': this.runScrollBenchmark
        });
      }
    },
    addCommandListeners: function(listenersByCommandName) {
      var command, listener, parentView, _results;
      parentView = this.props.parentView;
      _results = [];
      for (command in listenersByCommandName) {
        listener = listenersByCommandName[command];
        _results.push(parentView.command(command, listener));
      }
      return _results;
    },
    observeConfig: function() {
      this.subscribe(atom.config.observe('editor.fontFamily', this.setFontFamily));
      this.subscribe(atom.config.observe('editor.fontSize', this.setFontSize));
      this.subscribe(atom.config.observe('editor.lineHeight', this.setLineHeight));
      this.subscribe(atom.config.observe('editor.showIndentGuide', this.setShowIndentGuide));
      this.subscribe(atom.config.observe('editor.invisibles', this.setInvisibles));
      return this.subscribe(atom.config.observe('editor.showInvisibles', this.setShowInvisibles));
    },
    onFocus: function() {
      return this.refs.input.focus();
    },
    onInputFocused: function() {
      return this.setState({
        focused: true
      });
    },
    onInputBlurred: function() {
      return this.setState({
        focused: false
      });
    },
    onVerticalScroll: function(scrollTop) {
      var animationFramePending, editor;
      editor = this.props.editor;
      if (scrollTop === editor.getScrollTop()) {
        return;
      }
      animationFramePending = this.pendingScrollTop != null;
      this.pendingScrollTop = scrollTop;
      if (!animationFramePending) {
        return requestAnimationFrame((function(_this) {
          return function() {
            _this.props.editor.setScrollTop(_this.pendingScrollTop);
            return _this.pendingScrollTop = null;
          };
        })(this));
      }
    },
    onHorizontalScroll: function(scrollLeft) {
      var animationFramePending, editor;
      editor = this.props.editor;
      if (scrollLeft === editor.getScrollLeft()) {
        return;
      }
      animationFramePending = this.pendingScrollLeft != null;
      this.pendingScrollLeft = scrollLeft;
      if (!animationFramePending) {
        return requestAnimationFrame((function(_this) {
          return function() {
            _this.props.editor.setScrollLeft(_this.pendingScrollLeft);
            return _this.pendingScrollLeft = null;
          };
        })(this));
      }
    },
    onMouseWheel: function(event) {
      var animationFramePending, wheelDeltaX, wheelDeltaY;
      event.preventDefault();
      animationFramePending = this.pendingHorizontalScrollDelta !== 0 || this.pendingVerticalScrollDelta !== 0;
      wheelDeltaX = event.wheelDeltaX, wheelDeltaY = event.wheelDeltaY;
      if (Math.abs(wheelDeltaX) > Math.abs(wheelDeltaY)) {
        this.pendingHorizontalScrollDelta -= wheelDeltaX;
      } else {
        this.pendingVerticalScrollDelta -= wheelDeltaY;
        this.mouseWheelScreenRow = this.screenRowForNode(event.target);
        if (this.clearMouseWheelScreenRowAfterDelay == null) {
          this.clearMouseWheelScreenRowAfterDelay = debounce(this.clearMouseWheelScreenRow, this.mouseWheelScreenRowClearDelay);
        }
        this.clearMouseWheelScreenRowAfterDelay();
      }
      if (!animationFramePending) {
        return requestAnimationFrame((function(_this) {
          return function() {
            var editor;
            editor = _this.props.editor;
            editor.setScrollTop(editor.getScrollTop() + _this.pendingVerticalScrollDelta);
            editor.setScrollLeft(editor.getScrollLeft() + _this.pendingHorizontalScrollDelta);
            _this.pendingVerticalScrollDelta = 0;
            return _this.pendingHorizontalScrollDelta = 0;
          };
        })(this));
      }
    },
    onScrollViewOverflowChanged: function() {
      if (this.overflowChangedEventsPaused) {
        return this.overflowChangedWhilePaused = true;
      } else {
        return this.requestScrollViewMeasurement();
      }
    },
    onWindowResize: function() {
      return this.requestScrollViewMeasurement();
    },
    onScrollViewScroll: function() {
      var scrollViewNode;
      console.warn("EditorScrollView scroll position changed, and it shouldn't have. If you can reproduce this, please report it.");
      scrollViewNode = this.refs.scrollView.getDOMNode();
      scrollViewNode.scrollTop = 0;
      return scrollViewNode.scrollLeft = 0;
    },
    onInput: function(char, replaceLastCharacter) {
      var editor;
      editor = this.props.editor;
      if (replaceLastCharacter) {
        return editor.transact(function() {
          editor.selectLeft();
          return editor.insertText(char);
        });
      } else {
        return editor.insertText(char);
      }
    },
    onMouseDown: function(event) {
      var detail, editor, metaKey, screenPosition, shiftKey;
      editor = this.props.editor;
      detail = event.detail, shiftKey = event.shiftKey, metaKey = event.metaKey;
      screenPosition = this.screenPositionForMouseEvent(event);
      if (shiftKey) {
        editor.selectToScreenPosition(screenPosition);
      } else if (metaKey) {
        editor.addCursorAtScreenPosition(screenPosition);
      } else {
        editor.setCursorScreenPosition(screenPosition);
        switch (detail) {
          case 2:
            editor.selectWord();
            break;
          case 3:
            editor.selectLine();
        }
      }
      return this.selectToMousePositionUntilMouseUp(event);
    },
    onStylesheetsChanged: function(stylesheet) {
      if (this.containsScrollbarSelector(stylesheet)) {
        return this.refreshScrollbars();
      }
    },
    onBatchedUpdatesStarted: function() {
      return this.batchingUpdates = true;
    },
    onBatchedUpdatesEnded: function() {
      var updateRequested;
      updateRequested = this.updateRequested;
      this.updateRequested = false;
      this.batchingUpdates = false;
      if (updateRequested) {
        return this.requestUpdate();
      }
    },
    onScreenLinesChanged: function(change) {
      var editor;
      editor = this.props.editor;
      this.pendingChanges.push(change);
      if (editor.intersectsVisibleRowRange(change.start, change.end + 1)) {
        return this.requestUpdate();
      }
    },
    onSelectionChanged: function(selection) {
      var editor;
      editor = this.props.editor;
      if (editor.selectionIntersectsVisibleRowRange(selection)) {
        this.selectionChanged = true;
        return this.requestUpdate();
      }
    },
    onSelectionAdded: function(selection) {
      var editor;
      editor = this.props.editor;
      if (editor.selectionIntersectsVisibleRowRange(selection)) {
        this.selectionChanged = true;
        this.selectionAdded = true;
        return this.requestUpdate();
      }
    },
    onScrollTopChanged: function() {
      this.scrollingVertically = true;
      this.requestUpdate();
      if (this.onStoppedScrollingAfterDelay == null) {
        this.onStoppedScrollingAfterDelay = debounce(this.onStoppedScrolling, 100);
      }
      return this.onStoppedScrollingAfterDelay();
    },
    onStoppedScrolling: function() {
      this.scrollingVertically = false;
      this.mouseWheelScreenRow = null;
      return this.requestUpdate();
    },
    onStoppedScrollingAfterDelay: null,
    onCursorsMoved: function() {
      return this.cursorsMoved = true;
    },
    selectToMousePositionUntilMouseUp: function(event) {
      var animationLoop, dragging, editor, lastMousePosition, onMouseMove, onMouseUp;
      editor = this.props.editor;
      dragging = false;
      lastMousePosition = {};
      animationLoop = (function(_this) {
        return function() {
          return requestAnimationFrame(function() {
            if (dragging) {
              _this.selectToMousePosition(lastMousePosition);
              return animationLoop();
            }
          });
        };
      })(this);
      onMouseMove = function(event) {
        lastMousePosition.clientX = event.clientX;
        lastMousePosition.clientY = event.clientY;
        if (!dragging) {
          dragging = true;
          animationLoop();
        }
        if (event.which === 0) {
          return onMouseUp();
        }
      };
      onMouseUp = function() {
        dragging = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        return editor.finalizeSelections();
      };
      window.addEventListener('mousemove', onMouseMove);
      return window.addEventListener('mouseup', onMouseUp);
    },
    selectToMousePosition: function(event) {
      return this.props.editor.selectToScreenPosition(this.screenPositionForMouseEvent(event));
    },
    requestScrollViewMeasurement: function() {
      if (this.measurementPending) {
        return;
      }
      this.scrollViewMeasurementRequested = true;
      return requestAnimationFrame((function(_this) {
        return function() {
          _this.scrollViewMeasurementRequested = false;
          return _this.measureScrollView();
        };
      })(this));
    },
    measureScrollView: function() {
      var clientHeight, clientWidth, editor, editorNode, height, position, scrollViewNode, width, _ref3;
      if (!this.isMounted()) {
        return;
      }
      editor = this.props.editor;
      editorNode = this.getDOMNode();
      scrollViewNode = this.refs.scrollView.getDOMNode();
      position = getComputedStyle(editorNode).position;
      _ref3 = editorNode.style, width = _ref3.width, height = _ref3.height;
      if (position === 'absolute' || height) {
        clientHeight = scrollViewNode.clientHeight;
        if (clientHeight > 0) {
          editor.setHeight(clientHeight);
        }
      }
      if (position === 'absolute' || width) {
        clientWidth = scrollViewNode.clientWidth;
        if (clientWidth > 0) {
          return editor.setWidth(clientWidth);
        }
      }
    },
    measureLineHeightAndCharWidthsIfNeeded: function(prevState) {
      var editor;
      if (!isEqualForProperties(prevState, this.state, 'lineHeight', 'fontSize', 'fontFamily')) {
        editor = this.props.editor;
        return editor.batchUpdates((function(_this) {
          return function() {
            var oldDefaultCharWidth;
            oldDefaultCharWidth = editor.getDefaultCharWidth();
            if (_this.state.visible) {
              _this.measureLineHeightAndDefaultCharWidth();
            } else {
              _this.measureLineHeightAndDefaultCharWidthWhenShown = true;
            }
            if (oldDefaultCharWidth !== editor.getDefaultCharWidth()) {
              _this.remeasureCharacterWidths();
              return _this.measureGutter();
            }
          };
        })(this));
      } else if (this.measureLineHeightAndDefaultCharWidthWhenShown && this.state.visible && !prevState.visible) {
        return this.measureLineHeightAndDefaultCharWidth();
      }
    },
    measureLineHeightAndDefaultCharWidth: function() {
      this.measureLineHeightAndDefaultCharWidthWhenShown = false;
      return this.refs.lines.measureLineHeightAndDefaultCharWidth();
    },
    remeasureCharacterWidths: function() {
      return this.refs.lines.remeasureCharacterWidths();
    },
    measureGutter: function() {
      var oldGutterWidth;
      oldGutterWidth = this.gutterWidth;
      this.gutterWidth = this.refs.gutter.getDOMNode().offsetWidth;
      if (this.gutterWidth !== oldGutterWidth) {
        return this.requestUpdate();
      }
    },
    measureScrollbars: function() {
      var editor, height, scrollbarCornerNode, width;
      this.measuringScrollbars = false;
      editor = this.props.editor;
      scrollbarCornerNode = this.refs.scrollbarCorner.getDOMNode();
      width = (scrollbarCornerNode.offsetWidth - scrollbarCornerNode.clientWidth) || 15;
      height = (scrollbarCornerNode.offsetHeight - scrollbarCornerNode.clientHeight) || 15;
      editor.setVerticalScrollbarWidth(width);
      return editor.setHorizontalScrollbarHeight(height);
    },
    containsScrollbarSelector: function(stylesheet) {
      var rule, _i, _len, _ref3, _ref4;
      _ref3 = stylesheet.cssRules;
      for (_i = 0, _len = _ref3.length; _i < _len; _i++) {
        rule = _ref3[_i];
        if (((_ref4 = rule.selectorText) != null ? _ref4.indexOf('scrollbar') : void 0) > -1) {
          return true;
        }
      }
      return false;
    },
    refreshScrollbars: function() {
      this.refreshingScrollbars = true;
      this.requestUpdate();
      this.measuringScrollbars = true;
      this.requestUpdate();
      return this.requestUpdate();
    },
    pauseOverflowChangedEvents: function() {
      this.overflowChangedEventsPaused = true;
      if (this.resumeOverflowChangedEventsAfterDelay == null) {
        this.resumeOverflowChangedEventsAfterDelay = debounce(this.resumeOverflowChangedEvents, 500);
      }
      return this.resumeOverflowChangedEventsAfterDelay();
    },
    resumeOverflowChangedEvents: function() {
      if (this.overflowChangedWhilePaused) {
        this.overflowChangedWhilePaused = false;
        return this.requestScrollViewMeasurement();
      }
    },
    resumeOverflowChangedEventsAfterDelay: null,
    clearMouseWheelScreenRow: function() {
      if (this.mouseWheelScreenRow != null) {
        this.mouseWheelScreenRow = null;
        return this.requestUpdate();
      }
    },
    clearMouseWheelScreenRowAfterDelay: null,
    consolidateSelections: function(e) {
      if (!this.props.editor.consolidateSelections()) {
        return e.abortKeyBinding();
      }
    },
    lineNodeForScreenRow: function(screenRow) {
      return this.refs.lines.lineNodeForScreenRow(screenRow);
    },
    lineNumberNodeForScreenRow: function(screenRow) {
      return this.refs.gutter.lineNumberNodeForScreenRow(screenRow);
    },
    screenRowForNode: function(node) {
      var screenRow;
      while (node !== document) {
        if (screenRow = node.dataset.screenRow) {
          return parseInt(screenRow);
        }
        node = node.parentNode;
      }
      return null;
    },
    hide: function() {
      return this.setState({
        visible: false
      });
    },
    show: function() {
      return this.setState({
        visible: true
      });
    },
    runScrollBenchmark: function() {
      var ReactPerf, node, scroll;
      if (process.env.NODE_ENV !== 'production') {
        ReactPerf = require('react-atom-fork/lib/ReactDefaultPerf');
        ReactPerf.start();
      }
      node = this.getDOMNode();
      scroll = function(delta, done) {
        var dispatchMouseWheelEvent, interval, stopScrolling;
        dispatchMouseWheelEvent = function() {
          return node.dispatchEvent(new WheelEvent('mousewheel', {
            wheelDeltaX: -0,
            wheelDeltaY: -delta
          }));
        };
        stopScrolling = function() {
          clearInterval(interval);
          return typeof done === "function" ? done() : void 0;
        };
        interval = setInterval(dispatchMouseWheelEvent, 10);
        return setTimeout(stopScrolling, 500);
      };
      console.timeline('scroll');
      return scroll(50, function() {
        return scroll(100, function() {
          return scroll(200, function() {
            return scroll(400, function() {
              return scroll(800, function() {
                return scroll(1600, function() {
                  console.timelineEnd('scroll');
                  if (process.env.NODE_ENV !== 'production') {
                    ReactPerf.stop();
                    console.log("Inclusive");
                    ReactPerf.printInclusive();
                    console.log("Exclusive");
                    ReactPerf.printExclusive();
                    console.log("Wasted");
                    return ReactPerf.printWasted();
                  }
                });
              });
            });
          });
        });
      });
    },
    setFontSize: function(fontSize) {
      return this.setState({
        fontSize: fontSize
      });
    },
    setLineHeight: function(lineHeight) {
      return this.setState({
        lineHeight: lineHeight
      });
    },
    setFontFamily: function(fontFamily) {
      return this.setState({
        fontFamily: fontFamily
      });
    },
    setShowIndentGuide: function(showIndentGuide) {
      return this.setState({
        showIndentGuide: showIndentGuide
      });
    },
    setInvisibles: function(invisibles) {
      if (invisibles == null) {
        invisibles = {};
      }
      defaults(invisibles, {
        eol: '\u00ac',
        space: '\u00b7',
        tab: '\u00bb',
        cr: '\u00a4'
      });
      return this.setState({
        invisibles: invisibles
      });
    },
    setShowInvisibles: function(showInvisibles) {
      return this.setState({
        showInvisibles: showInvisibles
      });
    },
    screenPositionForMouseEvent: function(event) {
      var pixelPosition;
      pixelPosition = this.pixelPositionForMouseEvent(event);
      return this.props.editor.screenPositionForPixelPosition(pixelPosition);
    },
    pixelPositionForMouseEvent: function(event) {
      var clientX, clientY, editor, left, scrollViewClientRect, top;
      editor = this.props.editor;
      clientX = event.clientX, clientY = event.clientY;
      scrollViewClientRect = this.refs.scrollView.getDOMNode().getBoundingClientRect();
      top = clientY - scrollViewClientRect.top + editor.getScrollTop();
      left = clientX - scrollViewClientRect.left + editor.getScrollLeft();
      return {
        top: top,
        left: left
      };
    }
  });

}).call(this);
