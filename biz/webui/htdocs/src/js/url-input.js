var React = require('react');
var $ = require('jquery');
var util = require('./util');
var PropsEditor = require('./props-editor');
var CloseBtn = require('./close-btn');
var Icon = require('./icon');
var win = require('./win');
var events = require('./events');

var PROTOCOL_RE = /^[\w-]+:\/\//;
var getHideStyle = util.getHideStyle;


var UrlInput = React.createClass({
  getInitialState: function() {
    var props = this.props;
    var protocols = ['', 'http://', 'https://', 'ws://', 'wss://', 'tunnel://'];
    if (props.enableLocalFile) {
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
    var state = this.state;
    if (state.protocol !== 'tpl://') {
      state.protocol = 'file://';
    }
    state.url = filepath + this.getSuffix();
    this.setState({});
    this.handleChange();
  },
  getProtocol: function() {
    return this.state.protocol.replace(/:\/\//, '');
  },
  parseUrl: function(url) {
    url = url && util.isString(url) ? url.replace(/[\s#]+/g, '') : '';
    var index = url.indexOf('://');
    var protocols = this.state.protocols;
    var protocol = '';
    if (index !== -1) {
      protocol = url.substring(0, index + 3).toLowerCase();
      if (protocols.indexOf(protocol) === -1) {
        protocol = protocols[0];
      } else {
        url = url.substring(index + 3);
      }
    }
    return {
      protocol: protocol || protocols[0],
      url: url
    };
  },
  handleChange: function() {
    var onChange = this.props.onChange;
    if (onChange) {
      var state = this.state;
      var url = state.url;
      url = url ? state.protocol + state.url : '';
      if (url !== this._curUrl) {
        this._curUrl = url;
        onChange(url, this.refs.checkbox);
      }
    }
  },
  onProtocolChange: function(e) {
    var state = this.state;
    var protocol = e.target.value;
    state.protocol = protocol;
    if (protocol) {
      state.url = state.url.replace(PROTOCOL_RE, '');
    }
    this.setState({});
    this.handleChange();
  },
  shake: function() {
    var con = $(this.refs.urlInput).find('input');
    util.shakeElem(con);
    con.select().focus();
  },
  showParams: function() {
    var url = this.state.url.replace(/#.*$/, '');
    var index = url.indexOf('?');
    var paramsText = index === -1 ? '' : url.substring(index + 1);
    var params = util.parseQueryString(paramsText, null, null, decodeURIComponent);
    this.refs.paramsEditor.update(params);
    this.setState({ showParams: true, paramsText: paramsText, hasPath: this.getPathIndex() !== -1 });
  },
  hideParams: function() {
    this.setState({ showParams: false });
  },
  toggleParams: function() {
    if (this.state.showParams) {
      this.hideParams();
    } else {
      this.showParams();
    }
  },
  addParam: function() {
    this.refs.paramsEditor.onAdd();
  },
  onParamsChange: function () {
    var paramsText = this.refs.paramsEditor.toString();
    var state = this.state;
    state.url = util.replacQuery(state.url, paramsText);
    this.setState({ paramsText: paramsText });
    this.handleChange();
  },
  onUrlChange: function(e) {
    var result = this.parseUrl(e.target.value);
    var state = this.state;
    if (result.protocol) {
      state.protocol = result.protocol;
    } else if (PROTOCOL_RE.test(result.url)) {
      state.protocol = '';
    }
    state.url = result.url;
    this.setState({});
    this.handleChange();
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
    this.componentDidUpdate();
  },
  componentDidUpdate: function() {
    var value = this.props.value;
    if (value !== this._curValue) {
      this._curValue = value;
      this.setUrl(value);
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
    if (e.keyCode === 27) {
      if (this.state.showHints) {
        this.hideHints();
      } else {
        this.showHints();
      }
    }
  },
  onUrlKeyDown: function(e) {
    var elem;
    if (e.keyCode === 38) {
        // up
      elem = this.hintElem.find('.w-active');
      if (!this.state.showHints) {
        this.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.prev('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = this.hintElem.find('li:last');
        elem.addClass('w-active');
      }
      util.ensureVisible(elem, this.hintElem);
      e.preventDefault();
    } else if (e.keyCode === 40) {
        // down
      elem = this.hintElem.find('.w-active');
      if (!this.state.showHints) {
        this.showHints();
      }
      if (elem.length) {
        elem.removeClass('w-active');
        elem = elem.next('li').addClass('w-active');
      }

      if (!elem.length) {
        elem = this.hintElem.find('li:first');
        elem.addClass('w-active');
      }
      util.ensureVisible(elem, this.hintElem);
      e.preventDefault();
    } else if (e.keyCode === 13) {
      elem = this.hintElem.find('.w-active');
      var value = elem.attr('title');
      value && this.setUrl(value);
    } else {
      var curUrl = e.target.value;
      util.handleEditorKeydown(e);
      if (curUrl && !e.target.value) {
        this.showHints();
        this.setUrl();
      }
    }
  },
  setUrl: function(url) {
    if (url === this._curUrl) {
      return;
    }
    var result = this.parseUrl(url);
    var state = this.state;
    if (result.protocol === state.protocol && result.url === state.url) {
      return;
    }
    state.protocol = result.protocol;
    state.url = result.url;
    this.hideHints();
    this.handleChange();
  },
  clearUrl: function() {
    var self = this;
    win.confirm('Do you confirm the deletion of the URL?', function(sure) {
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
    win.confirm('Do you confirm the deletion of the path?', function(sure) {
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
    win.confirm('Do you confirm the deletion of all params?', function(sure) {
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
    var state = this.state;
    var showParams = state.showParams;

    return (
        <div className={'w-layer w-params-editor v-box' + (showParams ? '' : ' hide')}>
          <div className="w-filter-bar w-middle">
            <div className="w-params-btns w-middle flex-1">
              <a onClick={this.addParam}>
                <Icon name="plus" />Param
              </a>
              <a style={getHideStyle(!state.url)} onClick={this.clearUrl}>
                <Icon name="remove" />URL
              </a>
              <a style={getHideStyle(!state.hasPath)} onClick={this.clearPath}>
                <Icon name="remove" />Path
              </a>
              <a style={getHideStyle(!state.paramsText)} onClick={this.clearParams}>
                <Icon name="remove" />Params
              </a>
            </div>
            <CloseBtn onClick={this.hideParams} className="w-close-params" />
          </div>
          <PropsEditor
            ref="paramsEditor"
            onChange={this.onParamsChange}
            callback={this.execute}
          />
        </div>
    );
  },
  renderHints: function() {
    var hints = this.props.hints;
    if (!hints || !hints.length) {
      return null;
    }

    return (
      <div
        className="w-layer w-filter-hint w-url-hints"
        style={getHideStyle(!this.state.showHints)}
        onMouseDown={util.preventBlur}
      >
        <div className="w-filter-bar">
          <CloseBtn onClick={this.hideHints} className="w-clear-hints" />
        </div>
        <ul ref="hints" onClick={this.clickHints}>
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
    events.trigger('showEditorDialog', {
      filename: this.state.url.replace(/\?.*$/, ''),
      session: this.props.session || null,
      callback: this.handleCallback
    });
  },
  render: function() {
    var state = this.state;
    var props = this.props;
    var protocol = state.protocol;
    var disabled = props.disabled;
    var enableLocalFile = props.enableLocalFile;
    var isFile = protocol === 'file://' || protocol === 'tpl://';

    return (
      <div ref="urlInput" className={'w-url-input ' + (props.className || '')} style={props.style}>
        <select
          disabled={disabled}
          value={protocol}
          onChange={this.onProtocolChange}
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
          onChange={this.onUrlChange}
          onKeyUp={this.handleUrlKeyUp}
          onKeyDown={this.onUrlKeyDown}
          onFocus={this.showHints}
          onDoubleClick={this.showHints}
          onBlur={this.hideHints}
          type="text"
          maxLength="8192"
          placeholder={props.placeholder || 'Enter ' + (isFile ?  'file or directory path or (value)' : 'request URL')}
          className={'fill form-control' + (isFile ? ' w-file-input' : '')}
        />
        <button
          disabled={disabled}
          className={'btn btn-default w-url-params' + (isFile ? ' w-hide' : '')}
          onClick={this.toggleParams}
        >
          Params
        </button>
        {enableLocalFile ? <button disabled={disabled} className="btn btn-primary h-32 ml-10 w-add-file" onClick={this.showEditor}>
          <Icon name="plus" />
          File
        </button> : null}
        {this.renderParamsEditor()}
        {this.renderHints()}
      </div>
    );
  }
});

module.exports = UrlInput;
