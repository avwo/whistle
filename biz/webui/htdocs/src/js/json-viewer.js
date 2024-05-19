require('../css/json-viewer.css');
var React = require('react');
var $ = require('jquery');
var ReactDOM = require('react-dom');
var TextView = require('./textview');
var CopyBtn = require('./copy-btn');
var message = require('./message');
var ContextMenu = require('./context-menu');
var win = require('./win');

var JSONTree = require('./components/react-json-tree')['default'];
var dataCenter = require('./data-center');
var util = require('./util');
var events = require('./events');
var MAX_LENGTH = 1024 * 16;
var STR_SELECTOR = 'span[style="color: rgb(133, 153, 0);"]';
var LINK_RE = /^"(https?:)?(\/\/[^/]\S+)"$/i;
var contextMenuList = [
  { name: 'Expand All' },
  { name: 'Collapse All' }
];
var SEARCH_MENU = [{name: 'Search Object'}];

function compare(a, b) {
  return a > b ? 1 : -1;
}

var JsonViewer = React.createClass({
  getInitialState: function () {
    return { lastData: {} };
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  preventBlur: function (e) {
    e.target.nodeName != 'INPUT' && e.preventDefault();
  },
  getCurStr: function() {
    var data = this.props.data;
    return data && data.str;
  },
  edit: function () {
    var str = this.getCurStr();
    if (str) {
      util.openEditor(str);
    }
  },
  onContextMenu: function(e) {
    var isDialog = this.props.dialog;
    var ctxMenu = util.getMenuPosition(e, 110, isDialog ? 60 : 90);
    ctxMenu.list = isDialog ? contextMenuList : contextMenuList.concat(SEARCH_MENU);
    this.refs.contextMenu.show(ctxMenu);
    e.preventDefault();
  },
  onClickContextMenu: function(action) {
    if (action === 'Expand All') {
      this.expandAll();
    } else if (action === 'Collapse All') {
      this.collapseAll();
    } else if (action === 'Search Object') {
      this.search();
    }
  },
  search: function() {
    var str = this.getCurStr();
    if (str) {
      events.trigger('showJsonViewDialog', str);
    }
  },
  showMockDialog: function(e) {
    var self = this;
    var props = self.props;
    var reqData = props.reqData;
    if (reqData) {
      return events.trigger('showMockDialog', {
        type: props.reqType,
        item: reqData
      });
    }
    self.showNameInput(e);
  },
  showNameInput: function (e) {
    var self = this;
    self.state.showDownloadInput = /w-download/.test(e.target.className);
    self.state.showNameInput = true;
    self.forceUpdate(function () {
      var nameInput = ReactDOM.findDOMNode(self.refs.nameInput);
      var defaultName = !nameInput.value && self.props.defaultName;
      if (defaultName) {
        nameInput.value = defaultName;
      }
      nameInput.select();
      nameInput.focus();
    });
  },
  hideNameInput: function () {
    this.state.showNameInput = false;
    this.forceUpdate(function () {
      var nameInput = ReactDOM.findDOMNode(this.refs.nameInput);
      var defaultName = this.props.defaultName;
      if (defaultName === nameInput.value) {
        nameInput.value = '';
      }
    });
  },
  submit: function (e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var modal = dataCenter.valuesModal;
    if (!modal) {
      return;
    }
    var target = ReactDOM.findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    var self = this;
    if (self.state.showDownloadInput) {
      self.download();
      return;
    }
    if (!name) {
      message.error('The key cannot be empty.');
      return;
    }

    if (/\s/.test(name)) {
      message.error('The key cannot have spaces.');
      return;
    }
    var handleSubmit = function (sure) {
      if (!sure) {
        return;
      }
      var value = (self.state.lastData.str || '').replace(/\r\n|\r/g, '\n');
      dataCenter.values.add({ name: name, value: value }, function (data, xhr) {
        if (data && data.ec === 0) {
          modal.add(name, value);
          target.value = '';
          target.blur();
        } else {
          util.showSystemError(xhr);
        }
      });
    };
    if (!modal.exists(name)) {
      return handleSubmit(true);
    }
    win.confirm(
      'The key \'' + name + '\' already exists.\nDo you want to override it.',
      handleSubmit
    );
  },
  download: function () {
    var target = ReactDOM.findDOMNode(this.refs.nameInput);
    var name = target.value.trim();
    target.value = '';
    var data = this.props.data || {};
    ReactDOM.findDOMNode(this.refs.filename).value = name;
    ReactDOM.findDOMNode(this.refs.content).value = data.str || '';
    ReactDOM.findDOMNode(this.refs.downloadForm).submit();
    this.hideNameInput();
  },
  toggle: function () {
    this.setState({ viewSource: !this.state.viewSource });
  },
  componentDidMount: function () {
    var viewer = $(ReactDOM.findDOMNode(this.refs.jsonViewer));
    viewer
      .on('mouseenter', STR_SELECTOR, function (e) {
        if (!(e.ctrlKey || e.metaKey)) {
          return;
        }
        var elem = $(this);
        if (LINK_RE.test(elem.text())) {
          elem.addClass('w-is-link');
        }
      })
      .on('mouseleave', STR_SELECTOR, function () {
        $(this).removeClass('w-is-link');
      })
      .on('mousedown', STR_SELECTOR, function (e) {
        if (!(e.ctrlKey || e.metaKey)) {
          return;
        }
        var elem = $(this);
        if (LINK_RE.test(elem.text())) {
          window.open((RegExp.$1 || 'http:') + RegExp.$2);
        }
      });
  },
  expandAll: function() {
    var expandedStatus = this.state.expandedStatus || 0;
    ++expandedStatus;
    this.setState({
      expandedStatus: expandedStatus,
      shouldExpandNode: function() {
        return expandedStatus;
      }
    });
  },
  collapseAll: function() {
    var expandedStatus = this.state.expandedStatus;
    if (expandedStatus) {
      expandedStatus = false;
    } else if (expandedStatus === false) {
      expandedStatus = 0;
    } else {
      expandedStatus = false;
    }
    this.setState({
      expandedStatus: expandedStatus,
      shouldExpandNode: function() {
        return expandedStatus;
      }
    });
  },
  render: function () {
    var state = this.state;
    var viewSource = state.viewSource;
    var props = this.props;
    var data = props.data;
    var noData = !data;
    if (noData) {
      data = state.lastData || {};
    } else {
      state.lastData = data;
    }
    var value = data.str || '';
    if (value && viewSource) {
      var exceed = value.length - MAX_LENGTH;
      if (exceed > 512) {
        value =
          value.substring(0, MAX_LENGTH) +
          '...\r\n\r\n(' +
          exceed +
          ' characters left, you can click on the ViewAll button in the upper right corner to view all)\r\n';
      }
    }
    return (
      <div
        className={
          'fill orient-vertical-box w-properties-wrap w-json-viewer' +
          (noData || props.hide ? ' hide' : '')
        }
      >
        <div className="w-textarea-bar">
          <CopyBtn value={data.str} />
          <a
            className="w-download"
            onDoubleClick={this.download}
            onClick={this.showNameInput}
            draggable="false"
          >
            Download
          </a>
          <a style={{display: dataCenter.hideMockMenu ? 'none' : null}} className="w-add" onClick={this.showMockDialog} draggable="false">
            { props.reqData ? 'Mock' : '+Key' }
          </a>
          {viewSource ? (
            <a className="w-edit" onClick={this.edit} draggable="false">
              ViewAll
            </a>
          ) : (props.dialog ? undefined : <a className="w-edit" onClick={this.search} draggable="false">
                Search
              </a>)}
          <a onClick={this.toggle} className="w-properties-btn">
            {viewSource ? 'JSON' : 'Text'}
          </a>
          <div
            onMouseDown={this.preventBlur}
            style={{ display: state.showNameInput ? 'block' : 'none' }}
            className="shadow w-textarea-input"
          >
            <input
              ref="nameInput"
              onKeyDown={this.submit}
              onBlur={this.hideNameInput}
              type="text"
              maxLength="64"
              placeholder={
                state.showDownloadInput ? 'Input the filename' : 'Input the key'
              }
            />
            <button
              type="button"
              onClick={this.submit}
              className="btn btn-primary"
            >
              {state.showDownloadInput ? 'OK' : '+Key'}
            </button>
          </div>
          <form
            ref="downloadForm"
            action="cgi-bin/download"
            style={{ display: 'none' }}
            method="post"
            target="downloadTargetFrame"
          >
            <input ref="filename" name="filename" type="hidden" />
            <input ref="content" name="content" type="hidden" />
          </form>
        </div>
        <TextView
          className={'fill w-json-viewer-str' + (viewSource ? '' : ' hide')}
          value={value}
        />
        <div
          ref="jsonViewer"
          onContextMenu={this.onContextMenu}
          className={'fill w-json-viewer-tree' + (viewSource ? ' hide' : '')}
        >
          <JSONTree data={data.json} sortObjectKeys={compare} shouldExpandNode={state.shouldExpandNode}
            expandAll={this.expandAll} collapseAll={this.collapseAll} onSearch={props.dialog ? null : this.search} />
        </div>
        <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
      </div>
    );
  }
});

module.exports = JsonViewer;
