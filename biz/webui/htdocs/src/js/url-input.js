var React = require('react');
var $ = require('jquery');
var util = require('./util');
var PropsEditor = require('./props-editor');
var CloseBtn = require('./close-btn');
var Icon = require('./icon');
var win = require('./win');

var PROTOCOL_RE = /^[\w-]+:\/\//;
var getHideStyle = util.getHideStyle;
var preventBlur = util.preventBlur;
var CMF_DEL_MSG = util.CMF_DEL_MSG;


var UrlInput = React.createClass({
  getInitialState: function() {
    var props = this.props;
    var protocols = ['', 'http://', 'https://', 'ws://', 'wss://', 'tunnel://'];
    if (props.hideCustom) {
      protocols = protocols.slice(1);
    } else if (props.enableFile) {
      protocols = ['file://', 'http://', 'https://'];
    } else if (props.isRedirect) {
      protocols = ['', 'http://', 'https://'];
    }
    if (props.enableTplFile) {
      protocols.splice(1, 0, 'tpl://');
    }

    return {
      protocols: protocols,
      protocol: protocols[0],
      url: ''
    };
  },
  getSuffix: function() {
    var result = /^temp(?:\/(?:[\da-z]{64}|blank))(\.[\w-]+)?$/.exec(this.state.url);
    return (result && result[1]) || '';
  },
  handleCallback: function(filepath) {
    var self = this;
    var state = self.state;
    if (state.protocol !== 'tpl://') {
      state.protocol = 'file://';
    }
    state.url = filepath + self.getSuffix();
    self.setState({});
    self.handleChange();
  },
  getProtocol: function() {
    return this.state.protocol.replace(/:\/\//, '');
  },
  parseUrl: function(url) {
    url = util.notEStr(url) ? url.replace(/[\s#]+/g, '') : '';
    var index = url.indexOf('://');
    var protocols = this.state.protocols;
    var protocol = protocols[0];
    if (index !== -1) {
      var keep;
      protocol = url.substring(0, index + 3).toLowerCase();
      if (protocol === '://') {
        protocol = '';
      }
      if (protocols.indexOf(protocol) === -1) {
        keep = !protocols[0];
        protocol = keep ? '' : this.state.protocol;
      }
      if (!keep) {
        url = url.substring(index + 3);
      }
    }
    return {
      protocol: protocol,
      url: url
    };
  },
  handleChange: function() {
    var self = this;
    var onChange = self.props.onChange;
    if (onChange) {
      var state = self.state;
      var url = state.url;
      url = url ? state.protocol + state.url : '';
      if (url !== self._curUrl) {
        self._curUrl = url;
        onChange(url, self.refs.checkbox);
      }
    }
  },
  onProtocolChange: function(e) {
    var self = this;
    var state = self.state;
    var protocol = e.target.value;
    state.protocol = protocol;
    if (protocol) {
      state.url = state.url.replace(PROTOCOL_RE, '');
    }
    self.setState({});
    self.handleChange();
  },
  shake: function() {
    var con = $(this.refs.urlInput).find('input');
    util.shakeElem(con);
    con.select().focus();
  },
  showParams: function() {
    var self = this;
    var url = self.state.url.replace(/#.*$/, '');
    var index = url.indexOf('?');
    var paramsText = index === -1 ? '' : url.substring(index + 1);
    var params = util.parseQueryString(paramsText, null, null, decodeURIComponent);
    self.refs.paramsEditor.update(params);
    self.setState({ showParams: true, paramsText: paramsText, hasPath: self.getPathIndex() !== -1 });
  },
  hideParams: function() {
    this.setState({ showParams: false });
  },
  toggleParams: function() {
    var self = this;
    if (self.state.showParams) {
      self.hideParams();
    } else {
      self.showParams();
    }
  },
  addParam: function() {
    this.refs.paramsEditor.onAdd();
  },
  onParamsChange: function () {
    var self = this;
    var paramsText = self.refs.paramsEditor.toString();
    var state = self.state;
    state.url = util.replacQuery(state.url, paramsText);
    self.setState({ paramsText: paramsText });
    self.handleChange();
  },
  onUrlChange: function(e) {
    var self = this;
    var result = self.parseUrl(e.target.value);
    var state = self.state;
    if (result.protocol) {
      state.protocol = result.protocol;
    } else if (PROTOCOL_RE.test(result.url)) {
      state.protocol = '';
    }
    state.url = result.url;
    self.setState({});
    self.handleChange();
  },
  componentDidMount: function() {
    var self = this;
    self.hintElem = $(self.refs.hints);
    self.handleHideParams = function(e) {
      var target = $(e.target);
      if (!(target.closest('.w-url-params').length ||
        target.closest('.w-params-editor').length ||
        target.closest('.w-com-dialog').length ||
        target.closest('.w-win-dialog').length ||
        target.closest('.w-ctx-menu').length)) {
        self.hideParams();
      }
    };
    $(document).on('click mousedown', self.handleHideParams);
    self.componentDidUpdate();
  },
  componentDidUpdate: function() {
    var self = this;
    var value = self.props.value;
    if (value !== self._curValue) {
      self._curValue = value;
      self.setUrl(value);
    }
  },
  showHints: function() {
    this.setState({ showHints: true });
  },
  hideHints: function() {
    this.setState({ showHints: false });
    this.hintElem.find('.w-active').removeClass('w-active');
  },
  clickHints: function(e) {
    var value = e.target.title;
    value && this.setUrl(value);
  },
  handleUrlKeyUp: function(e) {
    var self = this;
    if (e.keyCode === 27) {
      if (self.state.showHints) {
        self.hideHints();
      } else {
        self.showHints();
      }
    }
  },
  onUrlKeyDown: function(e) {
    var self = this;
    var elem;
    if (e.keyCode === 38) {
        // up
      elem = self.hintElem.find('.w-active');
      if (!self.state.showHints) {
        self.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.prev('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = self.hintElem.find('li:last');
        elem.addClass('w-active');
      }
      util.ensureVisible(elem, self.hintElem);
      preventBlur(e);
    } else if (e.keyCode === 40) {
        // down
      elem = self.hintElem.find('.w-active');
      if (!self.state.showHints) {
        self.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.next('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = self.hintElem.find('li:first');
        elem.addClass('w-active');
      }
      util.ensureVisible(elem, self.hintElem);
      preventBlur(e);
    } else if (e.keyCode === 13) {
      elem = self.hintElem.find('.w-active');
      var value = elem.attr('title');
      value && self.setUrl(value);
    } else {
      var curUrl = e.target.value;
      util.handleEditorKeydown(e);
      if (curUrl && !e.target.value) {
        self.showHints();
        self.setUrl();
      }
    }
  },
  setUrl: function(url) {
    var self = this;
    if (url === self._curUrl) {
      return;
    }
    var result = self.parseUrl(url);
    var state = self.state;
    if (result.protocol === state.protocol && result.url === state.url) {
      return;
    }
    state.protocol = result.protocol;
    state.url = result.url;
    self.hideHints();
    self.handleChange();
  },
  clearUrl: function() {
    var self = this;
    win.confirm(CMF_DEL_MSG + 'the URL?', function(sure) {
      if (sure) {
        self.hideParams();
        self.setState({ url: '' }, self.handleChange);
      }
    });
  },
  getPathIndex: function() {
    var url = this.state.url;
    var path = url.replace(PROTOCOL_RE, '');
    var index = path.indexOf('/');
    var queryIndex = path.indexOf('?');
    return queryIndex === -1 || queryIndex > index ? index : -1;
  },
  clearPath: function() {
    var self = this;
    win.confirm(CMF_DEL_MSG + 'the path?', function(sure) {
      if (sure) {
        self.hideParams();
        var pathIndex = self.getPathIndex();
        if (pathIndex !== -1) {
          var url = self.state.url.substring(0, pathIndex);
          self.setState({ url: url }, self.handleChange);
        }
      }
    });
  },
  clearParams: function() {
    var self = this;
    win.confirm(CMF_DEL_MSG + 'all params?', function(sure) {
      if (sure) {
        self.refs.paramsEditor.clear();
        self.hideParams();
      }
    });
  },
  componentWillUnmount: function() {
    $(document).off('click mousedown', this.handleHideParams);
  },
  renderParamsEditor: function() {
    var self = this;
    var state = self.state;
    var showParams = state.showParams;

    return (
        <div className={'w-layer w-params-editor v-box' + util.getHide(!showParams)}>
          <div className="w-filter-bar w-middle">
            <div className="w-params-btns w-middle flex-1">
              <a onClick={self.addParam}>
                <Icon name="plus" />Param
              </a>
              <a style={getHideStyle(!state.url)} onClick={self.clearUrl}>
                <Icon name="remove" />URL
              </a>
              <a style={getHideStyle(!state.hasPath)} onClick={self.clearPath}>
                <Icon name="remove" />Path
              </a>
              <a style={getHideStyle(!state.paramsText)} onClick={self.clearParams}>
                <Icon name="remove" />Params
              </a>
            </div>
            <CloseBtn onClick={self.hideParams} className="w-close-params" />
          </div>
          <PropsEditor
            ref="paramsEditor"
            onChange={self.onParamsChange}
            callback={self.execute}
          />
        </div>
    );
  },
  renderHints: function() {
    var self = this;
    var hints = self.props.hints;
    if (!hints || !hints.length) {
      return null;
    }

    return (
      <div
        className="w-layer w-filter-hint w-url-hints"
        style={getHideStyle(!self.state.showHints)}
        onMouseDown={util.preventBlur}
      >
        <div className="w-filter-bar">
          <CloseBtn onClick={self.hideHints} className="w-clear-hints" />
        </div>
        <ul ref="hints" onClick={self.clickHints}>
          {
            hints.map(function(hint) {
              return <li key={hint} title={hint}>{hint}</li>;
            })
          }
        </ul>
      </div>
    );
  },
  showEditor: function () {
    var self = this;
    util.trigger('showEditorDialog', {
      filename: self.state.url.replace(/\?.*$/, ''),
      session: self.props.session || null,
      callback: self.handleCallback
    });
  },
  render: function() {
    var self = this;
    var state = self.state;
    var props = self.props;
    var protocol = state.protocol;
    var disabled = props.disabled;
    var isFile = protocol === 'file://' || protocol === 'tpl://';

    return (
      <div ref="urlInput" className={'w-url-input ' + (props.className || '')} style={props.style}>
        <select
          disabled={disabled}
          value={protocol}
          onChange={self.onProtocolChange}
          className="form-control w-url-protocol"
        >
          {state.protocols.map(function (p) {
            return <option value={p}>{p || 'Custom'}</option>;
          })}
        </select>
        <input
          ref="checkbox"
          disabled={disabled}
          value={state.url}
          onChange={self.onUrlChange}
          onKeyUp={self.handleUrlKeyUp}
          onKeyDown={self.onUrlKeyDown}
          onFocus={self.showHints}
          onDoubleClick={self.showHints}
          onBlur={self.hideHints}
          type="text"
          maxLength="8192"
          placeholder={props.placeholder || 'Enter ' + (isFile ?  'file' + (props.enableTplFile ? ' or directory ' : '') + 'path or (value)' : 'URL')}
          className={'fill form-control' + (isFile ? ' w-file-input' : '')}
        />
        <button
          disabled={disabled}
          className={'btn btn-default w-url-params' + (isFile ? ' w-hide' : '')}
          onClick={self.toggleParams}
        >
          Params
        </button>
        {props.enableFile ? <button disabled={disabled} className="btn btn-primary h-32 ml-10 w-add-file" onClick={self.showEditor}>
          <Icon name="plus" />
          File
        </button> : null}
        {self.renderParamsEditor()}
        {self.renderHints()}
      </div>
    );
  }
});

module.exports = UrlInput;
