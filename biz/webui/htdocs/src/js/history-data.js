require('./base-css.js');
require('../css/composer.css');
var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var Divider = require('./divider');
var ContextMenu = require('./context-menu');
var events = require('./events');
var util = require('./util');

var contextMenuList = [
  { name: 'Copy URL' },
  { name: 'Copy As CURL' },
  { name: 'Export' },
  { name: 'Replay' },
  { name: 'Repeat Times' },
  { name: 'Edit' }
];
var RULES_KEY = /^\s*x-whistle-rule-value:/mi;
var curItem;
var curRaw;

function getRaw(item) {
  if (curItem === item) {
    return curRaw;
  }
  var raw = [
    item.method + ' ' + item.url + ' HTTP/' + (item.useH2 ? '2.0' : '1.1')
  ];
  item.headers && raw.push(item.headers);
  raw.push('\n', item.body || (item.base64 && util.base64Decode(item.base64))) || '';
  curRaw = raw.join('\n');
  curItem = item;
  return curRaw;
}

var HistoryData = React.createClass({
  getInitialState: function() {
    return {};
  },
  shouldComponentUpdate: function (nextProps) {
    return this.props.show || nextProps.show !== this.props.show;
  },
  getItem: function () {
    var list = this.props.data;
    for (var i = 0, len = list.length; i < len; i++) {
      var item = list[i];
      if (item.selected) {
        return item;
      }
    }
  },
  scrollToTop: function() {
    ReactDOM.findDOMNode(this.refs.list).scrollTop = 0;
  },
  copyAsCURL: function(_, item) {
    item = item || this.getItem();
    if (!item) {
      return;
    }
    var headers = item.headers;
    if (typeof headers === 'string') {
      headers = RULES_KEY.test(headers) ? headers.split(/\r\n|\r|\n/).filter(function(line) {
        return !RULES_KEY.test(line);
      }).join('\r\n') : headers;
      headers = util.parseHeaders(headers);
    }
    var text = util.asCURL({
      url: item.url || '',
      req: {
        method: item.method,
        headers: headers,
        base64: item.base64 || '',
        body: item.body || ''
      }
    });
    util.copyText(text, true);
  },
  onEdit: function () {
    this.props.onEdit(this.getItem());
  },
  onReplay: function () {
    this.props.onReplay(this.getItem());
    this.scrollToTop();
  },
  onReplayTimes: function() {
    this.props.onReplay(this.getItem(), true);
    this.scrollToTop();
  },
  handleClick: function(item) {
    this.props.data.forEach(function(item) {
      item.selected = false;
    });
    item.selected = true;
    this.setState({});
  },
  exportItem: function(item) {
    var headers = item.headers;
    var rules = [];
    if (typeof headers === 'string' && RULES_KEY.test(headers)) {
      headers = headers.split(/\r\n|\r|\n/).filter(function(line) {
        if (RULES_KEY.test(line)) {
          line = line.substring(line.indexOf(':') + 1).trim();
          line = util.decodeURIComponentSafe(line).trim();
          line && rules.push(line);
          return false;
        }
        return true;
      }).join('\r\n');
    }
    events.trigger('download', {
      name: 'composer_' + Date.now() + '.txt',
      value: JSON.stringify({
        type: 'setComposerData',
        useH2: item.useH2,
        rules: rules.join('\n'),
        url: item.url,
        method: item.method,
        headers: headers,
        body: item.body,
        base64: item.base64,
        isHexText: item.isHexText
      }, null, '  ')
    });
  },
  export: function() {
    var groupList = this.props.data && this.props.data._groupList;
    if (!groupList) {
      return;
    }
    var len = groupList.length;
    for (var i = 0; i < len; i++) {
      var item = groupList[i];
      if (item && item.selected) {
        this.exportItem(item);
      }
    }
  },
  onContextMenu: function(e) {
    var isTitle;
    var elem = $(e.target).closest('div.w-history-item');
    if (!elem.length) {
      elem = $(e.target).closest('div.w-history-title');
      isTitle = true;
    }
    e.preventDefault();
    if (!elem.length) {
      return;
    }
    var groupList = this.props.data && this.props.data._groupList;
    var item = groupList && groupList[elem.attr('data-index')];
    if (!item) {
      return;
    }
    this._focusItem = item;
    contextMenuList[0].name = isTitle ? 'Copy' : 'Copy URL';
    contextMenuList[0].copyText = elem.attr('title');
    contextMenuList[1].hide = isTitle;
    contextMenuList[2].hide = isTitle;
    contextMenuList[3].hide = isTitle;
    contextMenuList[4].hide = isTitle;
    contextMenuList[5].hide = isTitle;
    var data = util.getMenuPosition(e, 130, 185 - (isTitle ? 150 : 0));
    data.className = 'w-keep-history-data';
    data.list = contextMenuList;
    this.refs.contextMenu.show(data);
  },
  onClickContextMenu: function (action) {
    switch (action) {
    case 'Copy As CURL':
      return this.copyAsCURL(null, this._focusItem);
    case 'Export':
      return this.exportItem(this._focusItem);
    case 'Replay':
      this.props.onReplay(this._focusItem);
      return this.scrollToTop();
    case 'Repeat Times':
      this.props.onReplay(this._focusItem, true);
      return this.scrollToTop();
    case 'Edit':
      return this.props.onEdit(this._focusItem);
    }
  },
  render: function () {
    var self = this;
    var props = self.props;
    var show = props.show;
    var data = props.data || [];
    var groupList = data._groupList || [];
    var selectedItem;
    return (
      <div ref="historyDialog" className={'w-layer box w-composer-history-data' + (show ? '' : ' hide')}>
        {data.length ?
        <Divider leftWidth="170">
          <div ref="list" className="w-composer-history-list" onContextMenu={self.onContextMenu}>
            {groupList.map(function(item, i) {
              if (item.title) {
                return <div className="w-history-title" title={item.title} data-index={i}>{item.title}</div>;
              }
              if (item.selected) {
                selectedItem = item;
              }
              return (
                <div className={'w-history-item' + (item.selected ? ' w-selected' : '')}
                  title={item.url} onClick={() => self.handleClick(item)} data-index={i}>
                  {item.path}
                  <p>
                    <i className="w-req-protocol-tag">{item.protocol}</i>
                    <i className="w-req-method-tag">{item.method}</i>
                    {item.body ? <i className="w-req-type-tag">Body</i> : null}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="fill w-composer-history-ctn">
            {selectedItem ? <div className="w-composer-history-footer">
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={this.export}
                >
                  Export
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={this.copyAsCURL}
                >
                  As CURL
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={this.onReplay}
                >
                  Replay
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={this.onReplayTimes}
                >
                  Replay Times
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={this.onEdit}
                >
                  Edit
                </button>
                <span onClick={props.onClose} aria-hidden="true" className="w-close">&times;</span>
              </div> : null}
            {selectedItem ? <pre>{getRaw(selectedItem)}</pre> : null}
          </div>
        </Divider> : <div className="w-empty-data">
            Empty
          </div>}
          <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
      </div>
    );
  }
});

module.exports = HistoryData;
