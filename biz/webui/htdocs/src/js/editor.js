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
require('../css/list.css');
require('../css/editor.css');

var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var CodeMirror = require('codemirror');
var message = require('./message');
var INIT_LENGTH = 1024 * 16;

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

var rulesHint = require('./rules-hint');

var themes = ['default', 'neat', 'elegant', 'erlang-dark', 'night', 'monokai', 'cobalt', 'eclipse'
              , 'rubyblue', 'lesser-dark', 'xq-dark', 'xq-light', 'ambiance'
              , 'blackboard', 'vibrant-ink', 'solarized dark', 'solarized light', 'twilight', 'midnight'];
require('./rules-mode');
var DEFAULT_THEME = 'cobalt';
var DEFAULT_FONT_SIZE = '16px';
var RULES_COMMENT_RE = /^()\s*#\s*/;
var JS_COMMENT_RE = /^(\s*)\/\/+\s?/;
var NO_SPACE_RE = /\S/;

function hasSelector(selector) {
  return document.querySelector ? document.querySelector(selector) : $(selector).length;
}

var Editor = React.createClass({
  getThemes: function() {
    return themes;
  },
  setMode: function(mode) {
    if (/^(javascript|css|xml|rules|markdown)$/i.test(mode)) {
      mode = RegExp.$1.toLowerCase();
    } else if (/^(js|pac|jsx|json)$/i.test(mode)) {
      mode = 'javascript';
    } else if (/^(html|wtpl)?$/i.test(mode)) {
      mode = 'htmlmixed';
    } else if (/^md$/i.test(mode)) {
      mode = 'markdown';
    }

    this._mode = mode;
    if (this._editor) {
      this._editor.setOption('mode', mode);
    }
  },
  setValue: function(value) {
    value = this._value = value == null ? '' : value + '';
    if (!this._editor || this._editor.getValue() == value) {
      return;
    }
    this._editor.setValue(value);
  },
  getValue: function() {
    return this._editor ? '' : this._editor.getValue();
  },
  setTheme: function(theme) {
    theme = this._theme = theme || DEFAULT_THEME;
    if (!this._editor) {
      return;
    }
    this._editor.setOption('theme', theme);
  },
  setFontSize: function(fontSize) {
    fontSize = this._fontSize = fontSize || DEFAULT_FONT_SIZE;
    if (this._editor) {
      ReactDOM.findDOMNode(this.refs.editor).style.fontSize = fontSize;
    }
  },
  showLineNumber: function(show) {
    show = this._showLineNumber = show === false ? false : true;
    if (this._editor) {
      this._editor.setOption('lineNumbers', show);
    }
  },
  showLineWrapping: function(show) {
    show = this._showLineNumber = show === false ? false : true;
    if (this._editor) {
      this._editor.setOption('lineWrapping', show);
    }
  },
  setReadOnly: function(readOnly) {
    readOnly = this._readOnly = readOnly === false || readOnly === 'false' ? false : true;
    if (this._editor) {
      this._editor.setOption('readOnly', readOnly);
    }
  },
  setAutoComplete: function() {
    var isRules = this.isRulesEditor();
    var option = isRules ? rulesHint.getExtraKeys() : {};
    if (!/\(Macintosh;/i.test(window.navigator.userAgent)) {
      option['Ctrl-F'] = 'findPersistent';
    }
    option['Cmd-F'] = 'findPersistent';
    var editor = this._editor;
    editor.setOption('extraKeys', option);
    var timer;
    if (isRules) {
      editor.on('keyup', function(_, e) {
        clearTimeout(timer);
        var _byDelete = e.keyCode === 8;
        if (_byDelete || e.keyCode === 13) {
          timer = setTimeout(function() {
            if (!hasSelector('.CodeMirror-hints')) {
              editor._byDelete = true;
              editor._byEnter = !_byDelete;
              editor.execCommand('autocomplete');
            }
          }, 300);
        }
      });
    }
  },
  isRulesEditor: function() {
    return this.props.name === 'rules' || this._mode === 'rules';
  },
  componentDidMount: function() {
    var timeout;
    var self = this;
    var elem = ReactDOM.findDOMNode(self.refs.editor);
    var editor = self._editor = CodeMirror(elem);
    editor.on('change', function(e) {
      if (typeof self.props.onChange == 'function' && editor.getValue() !== (self.props.value || '')) {
        self.props.onChange.call(self, e);
      }
    });
    editor.on('mousedown', function(_, e) {
      if (!(e.ctrlKey || e.metaKey)) {
        return;
      }
      var target = $(e.target);
      if (target.hasClass('cm-js-type') || target.hasClass('cm-js-at') || target.hasClass('cm-js-http-url')) {
        e.preventDefault();
      }
    });
    self._init(true);
    $(elem).find('.CodeMirror').addClass('fill');
    resize();
    $(window).on('resize', function() {
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
    $(elem).on('keydown', function(e) {
      var isRules = self.isRulesEditor();
      var isJS = self._mode == 'javascript';
      if (isRules) {
        var options = {
          name: self.props.name,
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
          if (typeof onKeyDown === 'function' && onKeyDown(e, options) === false) {
            e.stopPropagation();
            e.preventDefault();
            return true;
          }
        } catch(e) {}
      }
      if ((!isRules && !isJS) || !(e.ctrlKey || e.metaKey) || e.keyCode != 191) {
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
      list.forEach(function(range) {
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

        if (isEmpty = !hasComment && !hasRule) {
          return;
        }
        var lastIndex, firstLine, lastLine;
        if (hasRule) {
          lastIndex = lines.length - 1;
          firstLine = lines[0];
          lastLine = lines[lastIndex];
          lines = lines.map(function(line) {
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
          lines = lines.map(function(line) {
            return line.replace(commentRE, '$1');
          });
        }
        if (anchor.ch != 0) {
          anchor.ch +=  lines[0].length - firstLine.length;
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
          editor.replaceRange(lines.join('\n') + '\n', {line: head.line + 1, ch: 0}, {line: anchor.line, ch: 0});
          ranges.push({anchor: head, head: anchor});
        } else {
          editor.replaceRange(lines.join('\n') + '\n', {line: anchor.line, ch: 0}, {line: head.line + 1, ch: 0});
          ranges.push({anchor: anchor, head: head});
        }
      });
      if (!isEmpty) {
        editor.setSelections(ranges);
      }
    });
  },
  _init: function(init) {
    var self = this;
    this.setMode(self.props.mode);
    var value = self.props.value;
    if (init && value && value.length > INIT_LENGTH) {
      var elem = message.info('Loading...');
      self.timer = setTimeout(function() {
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
  },
  componentDidUpdate: function() {
    this._init();
  },
  render: function() {

    return (
      <div tabIndex="0" ref="editor" className="fill orient-vertical-box w-list-content"></div>
    );
  }
});

module.exports = Editor;
