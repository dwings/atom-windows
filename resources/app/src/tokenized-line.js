(function() {
  var Scope, TokenizedLine, idCounter, _;

  _ = require('underscore-plus');

  idCounter = 1;

  module.exports = TokenizedLine = (function() {
    function TokenizedLine(_arg) {
      var tokens;
      tokens = _arg.tokens, this.lineEnding = _arg.lineEnding, this.ruleStack = _arg.ruleStack, this.startBufferColumn = _arg.startBufferColumn, this.fold = _arg.fold, this.tabLength = _arg.tabLength, this.indentLevel = _arg.indentLevel;
      this.tokens = this.breakOutAtomicTokens(tokens);
      if (this.startBufferColumn == null) {
        this.startBufferColumn = 0;
      }
      this.text = this.buildText();
      this.bufferDelta = this.buildBufferDelta();
      this.id = idCounter++;
      this.markLeadingAndTrailingWhitespaceTokens();
    }

    TokenizedLine.prototype.buildText = function() {
      var text, token, _i, _len, _ref;
      text = "";
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        text += token.value;
      }
      return text;
    };

    TokenizedLine.prototype.buildBufferDelta = function() {
      var delta, token, _i, _len, _ref;
      delta = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        delta += token.bufferDelta;
      }
      return delta;
    };

    TokenizedLine.prototype.copy = function() {
      return new TokenizedLine({
        tokens: this.tokens,
        lineEnding: this.lineEnding,
        ruleStack: this.ruleStack,
        startBufferColumn: this.startBufferColumn,
        fold: this.fold
      });
    };

    TokenizedLine.prototype.clipScreenColumn = function(column, options) {
      var skipAtomicTokens, token, tokenStartColumn, _i, _len, _ref;
      if (options == null) {
        options = {};
      }
      if (this.tokens.length === 0) {
        return 0;
      }
      skipAtomicTokens = options.skipAtomicTokens;
      column = Math.min(column, this.getMaxScreenColumn());
      tokenStartColumn = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (tokenStartColumn + token.screenDelta > column) {
          break;
        }
        tokenStartColumn += token.screenDelta;
      }
      if (token.isAtomic && tokenStartColumn < column) {
        if (skipAtomicTokens) {
          return tokenStartColumn + token.screenDelta;
        } else {
          return tokenStartColumn;
        }
      } else {
        return column;
      }
    };

    TokenizedLine.prototype.screenColumnForBufferColumn = function(bufferColumn, options) {
      var currentBufferColumn, screenColumn, token, _i, _len, _ref;
      bufferColumn = bufferColumn - this.startBufferColumn;
      screenColumn = 0;
      currentBufferColumn = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (currentBufferColumn > bufferColumn) {
          break;
        }
        screenColumn += token.screenDelta;
        currentBufferColumn += token.bufferDelta;
      }
      return this.clipScreenColumn(screenColumn + (bufferColumn - currentBufferColumn));
    };

    TokenizedLine.prototype.bufferColumnForScreenColumn = function(screenColumn, options) {
      var bufferColumn, currentScreenColumn, token, _i, _len, _ref;
      bufferColumn = this.startBufferColumn;
      currentScreenColumn = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (currentScreenColumn + token.screenDelta > screenColumn) {
          break;
        }
        bufferColumn += token.bufferDelta;
        currentScreenColumn += token.screenDelta;
      }
      return bufferColumn + (screenColumn - currentScreenColumn);
    };

    TokenizedLine.prototype.getMaxScreenColumn = function() {
      if (this.fold) {
        return 0;
      } else {
        return this.text.length;
      }
    };

    TokenizedLine.prototype.getMaxBufferColumn = function() {
      return this.startBufferColumn + this.bufferDelta;
    };

    TokenizedLine.prototype.softWrapAt = function(column) {
      var leftFragment, leftTextLength, leftTokens, nextToken, rightFragment, rightTokens, _ref;
      if (column === 0) {
        return [new TokenizedLine([], '', [0, 0], [0, 0]), this];
      }
      rightTokens = (function(func, args, ctor) {
        ctor.prototype = func.prototype;
        var child = new ctor, result = func.apply(child, args);
        return Object(result) === result ? result : child;
      })(Array, this.tokens, function(){});
      leftTokens = [];
      leftTextLength = 0;
      while (leftTextLength < column) {
        if (leftTextLength + rightTokens[0].value.length > column) {
          [].splice.apply(rightTokens, [0, 1].concat(_ref = rightTokens[0].splitAt(column - leftTextLength))), _ref;
        }
        nextToken = rightTokens.shift();
        leftTextLength += nextToken.value.length;
        leftTokens.push(nextToken);
      }
      leftFragment = new TokenizedLine({
        tokens: leftTokens,
        startBufferColumn: this.startBufferColumn,
        ruleStack: this.ruleStack,
        lineEnding: null
      });
      rightFragment = new TokenizedLine({
        tokens: rightTokens,
        startBufferColumn: this.bufferColumnForScreenColumn(column),
        ruleStack: this.ruleStack,
        lineEnding: this.lineEnding
      });
      return [leftFragment, rightFragment];
    };

    TokenizedLine.prototype.isSoftWrapped = function() {
      return this.lineEnding === null;
    };

    TokenizedLine.prototype.tokenAtBufferColumn = function(bufferColumn) {
      return this.tokens[this.tokenIndexAtBufferColumn(bufferColumn)];
    };

    TokenizedLine.prototype.tokenIndexAtBufferColumn = function(bufferColumn) {
      var delta, index, token, _i, _len, _ref;
      delta = 0;
      _ref = this.tokens;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        token = _ref[index];
        delta += token.bufferDelta;
        if (delta > bufferColumn) {
          return index;
        }
      }
      return index - 1;
    };

    TokenizedLine.prototype.tokenStartColumnForBufferColumn = function(bufferColumn) {
      var delta, nextDelta, token, _i, _len, _ref;
      delta = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        nextDelta = delta + token.bufferDelta;
        if (nextDelta > bufferColumn) {
          break;
        }
        delta = nextDelta;
      }
      return delta;
    };

    TokenizedLine.prototype.breakOutAtomicTokens = function(inputTokens) {
      var breakOutLeadingSoftTabs, outputTokens, token, _i, _len;
      outputTokens = [];
      breakOutLeadingSoftTabs = true;
      for (_i = 0, _len = inputTokens.length; _i < _len; _i++) {
        token = inputTokens[_i];
        outputTokens.push.apply(outputTokens, token.breakOutAtomicTokens(this.tabLength, breakOutLeadingSoftTabs));
        if (breakOutLeadingSoftTabs) {
          breakOutLeadingSoftTabs = token.isOnlyWhitespace();
        }
      }
      return outputTokens;
    };

    TokenizedLine.prototype.markLeadingAndTrailingWhitespaceTokens = function() {
      var firstNonWhitespacePosition, firstTrailingWhitespacePosition, i, lineIsWhitespaceOnly, position, token, _i, _len, _ref, _results;
      firstNonWhitespacePosition = this.text.search(/\S/);
      firstTrailingWhitespacePosition = this.text.search(/\s*$/);
      lineIsWhitespaceOnly = firstTrailingWhitespacePosition === 0;
      position = 0;
      _ref = this.tokens;
      _results = [];
      for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
        token = _ref[i];
        token.hasLeadingWhitespace = position < firstNonWhitespacePosition;
        token.hasTrailingWhitespace = (this.lineEnding != null) && (position + token.value.length > firstTrailingWhitespacePosition);
        _results.push(position += token.value.length);
      }
      return _results;
    };

    TokenizedLine.prototype.isComment = function() {
      var scope, token, _i, _j, _len, _len1, _ref, _ref1;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (token.scopes.length === 1) {
          continue;
        }
        if (token.isOnlyWhitespace()) {
          continue;
        }
        _ref1 = token.scopes;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          scope = _ref1[_j];
          if (_.contains(scope.split('.'), 'comment')) {
            return true;
          }
        }
        break;
      }
      return false;
    };

    TokenizedLine.prototype.tokenAtIndex = function(index) {
      return this.tokens[index];
    };

    TokenizedLine.prototype.getTokenCount = function() {
      return this.tokens.length;
    };

    TokenizedLine.prototype.bufferColumnForToken = function(targetToken) {
      var column, token, _i, _len, _ref;
      column = 0;
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        if (token === targetToken) {
          return column;
        }
        column += token.bufferDelta;
      }
    };

    TokenizedLine.prototype.getScopeTree = function() {
      var scopeStack, token, _i, _len, _ref;
      if (this.scopeTree != null) {
        return this.scopeTree;
      }
      scopeStack = [];
      _ref = this.tokens;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        token = _ref[_i];
        this.updateScopeStack(scopeStack, token.scopes);
        _.last(scopeStack).children.push(token);
      }
      this.scopeTree = scopeStack[0];
      this.updateScopeStack(scopeStack, []);
      return this.scopeTree;
    };

    TokenizedLine.prototype.updateScopeStack = function(scopeStack, desiredScopes) {
      var i, j, poppedScope, scope, _i, _j, _len, _ref, _ref1, _ref2, _results;
      for (i = _i = 0, _len = desiredScopes.length; _i < _len; i = ++_i) {
        scope = desiredScopes[i];
        if (((_ref = scopeStack[i]) != null ? _ref.scope : void 0) !== desiredScopes[i]) {
          break;
        }
      }
      while (scopeStack.length !== i) {
        poppedScope = scopeStack.pop();
        if ((_ref1 = _.last(scopeStack)) != null) {
          _ref1.children.push(poppedScope);
        }
      }
      _results = [];
      for (j = _j = i, _ref2 = desiredScopes.length; i <= _ref2 ? _j < _ref2 : _j > _ref2; j = i <= _ref2 ? ++_j : --_j) {
        _results.push(scopeStack.push(new Scope(desiredScopes[j])));
      }
      return _results;
    };

    return TokenizedLine;

  })();

  Scope = (function() {
    function Scope(scope) {
      this.scope = scope;
      this.children = [];
    }

    return Scope;

  })();

}).call(this);
