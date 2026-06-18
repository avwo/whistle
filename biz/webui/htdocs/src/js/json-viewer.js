require('../css/json-viewer.css');
var React = require('react');
var $ = require('jquery');
var findDOMNode = require('react-dom').findDOMNode;
var TextView = require('./textview');
var CopyBtn = require('./copy-btn');
var ContextMenu = require('./context-menu');
var Tips = require('./panel-tips');
var textareaMixin = require('./textarea-mixin');

var JSONTree = require('./components/react-json-tree')['default'];
var util = require('./util');
var events = require('./events');
var MAX_LENGTH = 1024 * 16;
var STR_SELECTOR = 'span[style="color: var(--c-jb);"]';
var LINK_RE = /^"(https?:)?(\/\/[^/]\S+)"$/i;
var contextMenuList = [
  { name: 'Copy Object' },
  { name: 'Expand All' },
  { name: 'Collapse All' }
];
var SEARCH_MENU = [{name: 'Search Object'}];
var KEY_PATH = ['root'];

function compare(a, b) {
  return a > b ? 1 : -1;
}

var JsonViewer = React.createClass({
  mixins: [textareaMixin],
  getInitialState: function () {
    return { lastData: {} };
  },
  shouldComponentUpdate: util.shouldComponentUpdate,
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
    var self = this;
    var isDialog = self.props.dialog;
    var data = self.props.data || {};
    var ctxMenu = util.getMenuPosition(e, 110, isDialog ? 90 : 120);
    contextMenuList[0].copyText = data.str || '';
    ctxMenu.list = isDialog ? contextMenuList : contextMenuList.concat(SEARCH_MENU);
    self.refs.contextMenu.show(ctxMenu);
    e.preventDefault();
  },
  onClickContextMenu: function(action) {
    var self = this;
    if (action === 'Expand All') {
      self.expandAll();
    } else if (action === 'Collapse All') {
      self.collapseAll();
    } else if (action === 'Search Object') {
      self.search();
    }
  },
  search: function() {
    var self = this;
    var str = self.getCurStr();
    if (str) {
      events.trigger('showJsonViewDialog', [str, null, self.props.session]);
    }
  },
  getText: function() {
    return (this.state.lastData.str || '').replace(/\r\n|\r/g, '\n');
  },
  download: function () {
    var self = this;
    var target = findDOMNode(self.refs.nameInput);
    var name = target.value.trim() || 'json_' + util.formatDate() + '.txt';
    var data = self.props.data || {};
    target.value = '';
    util.download(data.str || '', name);
    self.hideNameInput();
  },
  toggle: function () {
    var self = this;
    self.setState({ viewSource: !self.state.viewSource });
  },
  componentDidMount: function () {
    var viewer = $(findDOMNode(this.refs.jsonViewer));
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
    var self = this;
    var state = self.state;
    var viewSource = state.viewSource;
    var props = self.props;
    var data = props.data;
    var tips = props.tips;
    var className = 'fill v-box w-props-wrap w-json-viewer';
    var noData = !data;
    if (noData) {
      data = state.lastData || {};
      if (tips) {
        return <div className={className + (props.hide ? ' hide' : '')}><Tips data={tips} /></div>;
      }
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
        className={className + (noData || props.hide ? ' hide' : '')}
      >
        <Tips data={tips} />
        <div className="w-textarea-bar">
          <CopyBtn value={data.str} />
          <a
            onDoubleClick={self.download}
            onClick={self.showNameInput}
            className="w-download"
            draggable="false"
          >
            Download
          </a>
          {self.renderAddBtn()}
          {viewSource ? (
            <a onClick={self.edit} draggable="false">
              ViewAll
            </a>
          ) : (props.dialog ? undefined : <a onClick={self.search} draggable="false">
                Search
              </a>)}
          <a onClick={self.toggle}>
            {viewSource ? 'JSON' : 'Text'}
          </a>
          {self.renderInput()}
        </div>
        <TextView
          className={'fill w-json-viewer-str' + (viewSource ? '' : ' hide')}
          value={value}
        />
        <div
          ref="jsonViewer"
          onContextMenu={self.onContextMenu}
          className={'fill w-json-viewer-tree' + (viewSource ? ' hide' : '')}
        >
          <JSONTree keyPath={props.keyPath || KEY_PATH} data={data.json} sortObjectKeys={compare} shouldExpandNode={state.shouldExpandNode}
            expandAll={self.expandAll} collapseAll={self.collapseAll} onSearch={props.dialog ? null : self.search} />
        </div>
        <ContextMenu onClick={self.onClickContextMenu} ref="contextMenu" />
      </div>
    );
  }
});

module.exports = JsonViewer;
