require('codemirror/lib/codemirror.css');
require('codemirror/theme/neat.css');
require('codemirror/theme/elegant.css');
require('codemirror/theme/erlang-dark.css');
require('codemirror/theme/night.css');
require('codemirror/theme/monokai.css');
require('codemirror/theme/cobalt.css');
require('codemirror/theme/eclipse.css');
require('codemirror/theme/rubyblue.css');
require('codemirror/theme/lesser-dark.css');
require('codemirror/theme/xq-dark.css');
require('codemirror/theme/xq-light.css');
require('codemirror/theme/ambiance.css');
require('codemirror/theme/blackboard.css');
require('codemirror/theme/vibrant-ink.css');
require('codemirror/theme/solarized.css');
require('codemirror/theme/twilight.css');
require('codemirror/theme/midnight.css');
require('codemirror/addon/dialog/dialog.css');
require('codemirror/addon/search/matchesonscrollbar.css');
require('codemirror/addon/fold/foldgutter.css');

require('../css/list.css');
require('../css/editor.css');

var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var CodeMirror = require('codemirror');
var message = require('./message');
var INIT_LENGTH = 1024 * 16;
var GUTTER_STYLE = [
  'CodeMirror-linenumbers',
  'CodeMirror-foldgutter',
  'CodeMirror-lint-markers'
];

require('codemirror/mode/javascript/javascript');
require('codemirror/mode/css/css');
require('codemirror/mode/xml/xml');
require('codemirror/mode/htmlmixed/htmlmixed');
require('codemirror/mode/markdown/markdown');
require('codemirror/addon/dialog/dialog');
require('codemirror/addon/search/searchcursor');
require('codemirror/addon/search/search');
require('codemirror/addon/scroll/annotatescrollbar');
require('codemirror/addon/search/matchesonscrollbar');

require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/fold/comment-fold');

var rulesHint = require('./rules-hint');
var events = require('./events');

var themes = [
  'default',
  'neat',
  'elegant',
  'erlang-dark',
  'night',
  'monokai',
  'cobalt',
  'eclipse',
  'rubyblue',
  'lesser-dark',
  'xq-dark',
  'xq-light',
  'ambiance',
  'blackboard',
  'vibrant-ink',
  'solarized dark',
  'solarized light',
  'twilight',
  'midnight'
];
require('./rules-mode');
var DEFAULT_THEME = 'cobalt';
var DEFAULT_FONT_SIZE = '16px';
var RULES_COMMENT_RE = /^(\s*)#\s*/;
var JS_COMMENT_RE = /^(\s*)\/\/+\s?/;
var NO_SPACE_RE = /\S/;
var FOLD_MODE = ['javascript', 'htmlmixed', 'css'];

function hasSelector(selector) {
  return document.querySelector
    ? document.querySelector(selector)
    : $(selector).length;
}

var Editor = React.createClass({
  getThemes: function () {
    return themes;
  },
  setMode: function (mode) {
    if (/^(javascript|css|xml|rules|markdown)$/i.test(mode)) {
      mode = RegExp.$1.toLowerCase();
    } else if (/^(js|pac|jsx|json)$/i.test(mode)) {
      mode = 'javascript';
    } else if (/^(html|wtpl)$/i.test(mode)) {
      mode = 'htmlmixed';
    } else if (/^md$/i.test(mode)) {
      mode = 'markdown';
    }
    if (this._mode !== mode) {
      this._mode = mode;
      if (this._editor) {
        this._editor.setOption('mode', mode);
      }
      if (this._foldGutter) {
        this._editor.setOption('foldGutter', false);
        this._editor.setOption('foldGutter', true);
      }
      this.setFoldGutter(this.props.foldGutter);
    }
  },
  setValue: function (value) {
    value = this._value = value == null ? '' : value + '';
    if (!this._editor || this._editor.getValue() == value) {
      return;
    }
    this._editor.setValue(value);
  },
  getValue: function () {
    return this._editor ? '' : this._editor.getValue();
  },
  setTheme: function (theme) {
    theme = this._theme = theme || DEFAULT_THEME;
    if (!this._editor) {
      return;
    }
    this._editor.setOption('theme', theme);
  },
  setFontSize: function (fontSize) {
    fontSize = this._fontSize = fontSize || DEFAULT_FONT_SIZE;
    if (this._editor) {
      ReactDOM.findDOMNode(this.refs.editor).style.fontSize = fontSize;
    }
  },
  showLineNumber: function (show) {
    show = this._showLineNumber = show === false ? false : true;
    if (this._editor) {
      this._editor.setOption('lineNumbers', show);
    }
  },
  showLineWrapping: function (show) {
    show = this._showLineNumber = show === false ? false : true;
    if (this._editor) {
      this._editor.setOption('lineWrapping', show);
    }
  },
  setReadOnly: function (readOnly) {
    readOnly = this._readOnly =
      readOnly === false || readOnly === 'false' ? false : true;
    if (this._editor) {
      this._editor.setOption('readOnly', readOnly);
    }
  },
  handleKeyUp: function(_, e) {
    clearTimeout(this._timer);
    var _byDelete = e.keyCode === 8;
    if (_byDelete || e.keyCode === 13) {
      var editor = this._editor;
      this._timer = setTimeout(function () {
        if (!hasSelector('.CodeMirror-hints')) {
          editor._byDelete = true;
          editor._byEnter = !_byDelete;
          editor.execCommand('autocomplete');
        }
      }, 300);
    }
  },
  setAutoComplete: function () {
    var isRules = this.isRulesEditor();
    var option = isRules && !this.props.readOnly ? rulesHint.getExtraKeys() : {};
    if (!/\(Macintosh;/i.test(window.navigator.userAgent)) {
      option['Ctrl-F'] = 'findPersistent';
    }
    option['Cmd-F'] = 'findPersistent';
    var editor = this._editor;
    editor.setOption('extraKeys', option);
    editor.off('keyup', this.handleKeyUp);
    isRules && editor.on('keyup', this.handleKeyUp);
  },

  // 设置代码折叠
  setFoldGutter: function (foldGutter) {
    if (this.props.mode === 'rules') {
      return;
    }
    foldGutter = foldGutter !== false && FOLD_MODE.indexOf(this._mode) !== -1;
    if (this._foldGutter !== foldGutter && this._editor) {
      this._foldGutter = foldGutter;
      this._editor.setOption('foldGutter', foldGutter);
      this._editor.setOption('gutters', foldGutter ? GUTTER_STYLE : []);
    }
  },

  isRulesEditor: function () {
    return this.props.mode === 'rules' || this._mode === 'rules';
  },
  componentDidMount: function () {
    var timeout;
    var self = this;
    var elem = ReactDOM.findDOMNode(self.refs.editor);
    var editor = (self._editor = CodeMirror(elem));
    var timer;
    events.on('updatePlugins', function() {
      if (self.isRulesEditor()) {
        timer && clearTimeout(timer);
        if (self.props.hide) {
          timer = null;
          self._waitingUpdate = true;
        } else {
          timer = setTimeout(function() {
            timer = null;
            if (self.isRulesEditor()) {
              if (self.props.hide) {
                self._waitingUpdate = true;
              } else {
                self._waitingUpdate = false;
                editor.setOption('mode', '');
                editor.setOption('mode', 'rules');
              }
            }
          }, 600);
        }
      }
    });
    editor.on('change', function (e) {
      if (
        typeof self.props.onChange == 'function' &&
        editor.getValue() !== (self.props.value || '')
      ) {
        self.props.onChange.call(self, e);
      }
    });
    editor.on('mousedown', function (_, e) {
      if (!(e.ctrlKey || e.metaKey)) {
        return;
      }
      var target = $(e.target);
      if (
        target.hasClass('cm-js-type') ||
        target.hasClass('cm-js-at') ||
        target.hasClass('cm-js-http-url')
      ) {
        e.preventDefault();
      }
    });
    self._init(true);
    $(elem).find('.CodeMirror').addClass('fill');
    resize();
    $(window).on('resize', function () {
      timeout && clearTimeout(timeout);
      timeout = null;
      timeout = setTimeout(resize, 30);
    });
    function resize() {
      var height = elem.offsetHeight || 0;
      if (height < 10) {
        timeout && clearTimeout(timeout);
        timeout = setTimeout(resize, 300);
      } else {
        editor.setSize(null, height);
      }
    }
    var getCh = function (ch, dis) {
      return Math.max(0, ch + dis);
    };
    $(elem).on('dblclick', '.CodeMirror-linenumber', function (e) {
      var num = parseInt($(e.target).text(), 10);
      if (!(num > 0)) {
        return;
      }
      var lineNum = num - 1;
      var line = editor.getLine(lineNum);
      if (!line || !line.trim()) {
        return;
      }
      var isRules = self.isRulesEditor();
      var commentRE = isRules ? RULES_COMMENT_RE : JS_COMMENT_RE;
      var origLine = line;
      if (commentRE.test(line)) {
        line = line.replace(commentRE, '$1');
      } else {
        line = (isRules ? '#' : '//') + (/^\s/.test(line) ? '' : ' ') + line;
      }
      var list = editor.listSelections();
      var resetRange;
      var len = list && list.length;
      var dis = line.length - origLine.length;
      if (list && list.length) {
        for (var i = 0; i < len; i++) {
          var pre = list[i];
          var hLine = pre.head.line;
          var aLine = pre.anchor.line;
          if (hLine === lineNum) {
            resetRange = true;
            pre.head.ch = getCh(pre.head.ch, dis);
            if (aLine === hLine && pre.head !== pre.anchor) {
              pre.anchor.ch = getCh(pre.anchor.ch, dis);
            }
            break;
          }
          if (aLine === lineNum) {
            resetRange = true;
            pre.anchor.ch = getCh(pre.anchor.ch, dis);
            break;
          }
        }
      }
      editor.replaceRange(
        line + '\n',
        { line: lineNum, ch: 0 },
        { line: num, ch: 0 }
      );
      if (resetRange) {
        editor.setSelections(list);
      }
      events.trigger('toggleCommentInEditor');
    });
    $(elem).on('keydown', function (e) {
      var isRules = self.isRulesEditor();
      var isJS = self._mode == 'javascript';
      if (isRules) {
        var options = {
          name: self.props.mode,
          url: location.href
        };
        if (!e.ctrlKey && !e.metaKey && e.keyCode === 112) {
          var helpUrl = rulesHint.getHelpUrl(self._editor, options);
          helpUrl && window.open(helpUrl);
          e.stopPropagation();
          e.preventDefault();
          return true;
        }
        try {
          var onKeyDown = window.parent.onWhistleRulesEditorKeyDown;
          if (
            typeof onKeyDown === 'function' &&
            onKeyDown(e, options) === false
          ) {
            e.stopPropagation();
            e.preventDefault();
            return true;
          }
        } catch (e) {}
      }
      if (
        (!isRules && !isJS) ||
        !(e.ctrlKey || e.metaKey) ||
        e.keyCode != 191
      ) {
        return;
      }

      var list = editor.listSelections();
      if (!list || !list.length) {
        return;
      }
      var commentRE = isRules ? RULES_COMMENT_RE : JS_COMMENT_RE;
      var isShiftKey = e.shiftKey;
      var isEmpty;
      var ranges = [];
      list.forEach(function (range) {
        var anchor = range.anchor;
        var head = range.head;
        var lines = [];
        var hasComment, hasRule, revert;

        if (anchor.line > head.line) {
          revert = anchor;
          anchor = head;
          head = revert;
        }

        for (var i = anchor.line; i <= head.line; i++) {
          var line = editor.getLine(i);
          if (commentRE.test(line)) {
            hasComment = true;
          } else if (NO_SPACE_RE.test(line)) {
            hasRule = true;
          }
          lines.push(line);
        }

        if ((isEmpty = !hasComment && !hasRule)) {
          return;
        }
        var lastIndex, firstLine, lastLine;
        if (hasRule) {
          lastIndex = lines.length - 1;
          firstLine = lines[0];
          lastLine = lines[lastIndex];
          lines = lines.map(function (line) {
            if (!NO_SPACE_RE.test(line)) {
              return line;
            }
            if (isShiftKey && commentRE.test(line)) {
              return line.replace(commentRE, '$1');
            }
            return (isRules ? '# ' : '// ') + line;
          });
        } else {
          firstLine = lines[0];
          lastIndex = lines.length - 1;
          lastLine = lines[lastIndex];
          lines = lines.map(function (line) {
            return line.replace(commentRE, '$1');
          });
        }
        if (anchor.ch != 0) {
          anchor.ch += lines[0].length - firstLine.length;
          if (anchor.ch < 0) {
            anchor.ch = 0;
          }
        }
        if (head.ch != 0 && head != anchor) {
          head.ch += lines[lastIndex].length - lastLine.length;
          if (head.ch < 0) {
            head.ch = 0;
          }
        }
        if (revert) {
          editor.replaceRange(
            lines.join('\n') + '\n',
            { line: head.line + 1, ch: 0 },
            { line: anchor.line, ch: 0 }
          );
          ranges.push({ anchor: head, head: anchor });
        } else {
          editor.replaceRange(
            lines.join('\n') + '\n',
            { line: anchor.line, ch: 0 },
            { line: head.line + 1, ch: 0 }
          );
          ranges.push({ anchor: anchor, head: head });
        }
      });
      if (!isEmpty) {
        editor.setSelections(ranges);
      }
    });
  },
  _init: function (init) {
    var self = this;
    var mode = self.props.mode;
    if (self._waitingUpdate && mode === 'rules') {
      self._editor.setOption('mode', '');
      self._mode = '';
    }
    self.setMode(mode);
    self._waitingUpdate = false;
    var value = self.props.value;
    if (init && value && value.length > INIT_LENGTH) {
      var elem = message.info('Loading...');
      self.timer = setTimeout(function () {
        elem.hide();
        self.timer = null;
        self.setValue(self.props.value); // 节流
      }, 500);
    } else if (!self.timer) {
      self.setValue(value);
    }
    self.setTheme(self.props.theme);
    self.setFontSize(self.props.fontSize);
    self.setTheme(self.props.theme);
    self.showLineNumber(self.props.lineNumbers || false);
    self.showLineWrapping(self.props.lineWrapping || false);
    self.setReadOnly(self.props.readOnly || false);
    self.setAutoComplete();
    self.setFoldGutter(self.props.foldGutter);
  },
  componentDidUpdate: function () {
    this._init();
  },
  render: function () {
    return (
      <div
        tabIndex="0"
        ref="editor"
        className="fill orient-vertical-box w-list-content"
      ></div>
    );
  }
});

module.exports = Editor;
