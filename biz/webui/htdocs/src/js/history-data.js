var React = require('react');
var ReactDOM = require('react-dom');
var $ = require('jquery');
var Divider = require('./divider');
var ContextMenu = require('./context-menu');
var events = require('./events');
var util = require('./util');
var dataCenter = require('./data-center');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');

var contextMenuList = [
  { name: 'Copy URL' },
  { name: 'Copy As cURL' },
  { name: 'Replay' },
  { name: 'Replay Times' },
  { name: 'Export' },
  { name: 'Edit', icon: 'send' },
  {
    name: 'Service',
    list: [
      { name: 'Create API Test', action: 'createApiTest' },
      { name: 'Copy As Script', action: 'copyAsScript' },
      { name: 'Share Via URL', action: 'Export' }
    ]
  }
];
var RULES_KEY = /^\s*x-whistle-rule-value:/mi;
var curItem;
var curDisabled;
var curRaw;

function noData(item) {
  return !!(item && item.body == null && (item.dataHash || item.base64Hash));
}

function getRaw(item, disabled) {
  if (curItem === item && curDisabled === disabled) {
    return curRaw;
  }
  var raw = [
    item.method + ' ' + item.url + ' HTTP/' + (item.useH2 ? '2.0' : '1.1')
  ];
  if (disabled) {
    raw.push('// Loading data, please wait...');
  } else {
    item.headers && raw.push(item.headers);
    raw.push('\n', item.body || (item.base64 && util.base64Decode(item.base64))) || '';
  }
  curRaw = raw.join('\n');
  curItem = item;
  curDisabled = disabled;
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
    events.trigger('showExportDialog', ['composer', {
      type: 'setComposerData',
      useH2: item.useH2,
      rules: rules.join('\n'),
      url: item.url,
      method: item.method,
      headers: headers,
      body: item.body,
      base64: item.base64,
      isHexText: item.isHexText
    }]);
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
    var noService = !dataCenter.whistleId;
    var disabled = noData(item);
    this._focusItem = item;
    contextMenuList[0].name = isTitle ? 'Copy' : 'Copy URL';
    contextMenuList[0].copyText = elem.attr('title');

    for (var i = 1, len = contextMenuList.length; i < len; i++) {
      var ctxMenu = contextMenuList[i];
      ctxMenu.hide = isTitle;
      ctxMenu.disabled = disabled;
      if (i === 6) {
        ctxMenu.hide = noService || isTitle;
      }
    }
    var data = util.getMenuPosition(e, 130, 185 - (isTitle ? 150 : 0) + (noService ? 0 : 30));
    data.className = 'w-keep-history-data';
    data.list = contextMenuList;
    this.refs.contextMenu.show(data);
  },
  onClickContextMenu: function (action) {
    switch (action) {
    case 'Copy As cURL':
      return this.copyAsCURL(null, this._focusItem);
    case 'Export':
      return this.exportItem(this._focusItem);
    case 'Replay':
      this.props.onReplay(this._focusItem);
      return this.scrollToTop();
    case 'Replay Times':
      this.props.onReplay(this._focusItem, true);
      return this.scrollToTop();
    case 'Edit':
      return this.props.onEdit(this._focusItem);
    case 'createApiTest':
      return util.showService('createApiTest');
    case 'copyAsScript':
      return util.showService('copyAsScript');
    }
  },
  render: function () {
    var self = this;
    var props = self.props;
    var show = props.show;
    var data = props.data || [];
    var groupList = data._groupList || [];
    var selectedItem;
    var disabled;
    return (
      <div ref="historyDialog" className={'w-layer box w-com-history-data' + (show ? ' w-show' : '')}>
        {data.length ? null : <CloseBtn onClick={props.onClose} />}
        {data.length ?
        <Divider leftWidth="170">
          <div ref="list" className="w-com-history-list" onContextMenu={self.onContextMenu}>
            {groupList.map(function(item, i) {
              if (item.title) {
                return <div className="w-history-title" title={item.title} data-index={i}>{item.title}</div>;
              }
              if (item.selected) {
                selectedItem = item;
                disabled = noData(item);
              }
              return (
                <div className={'w-history-item' + (item.selected ? ' w-selected' : '')}
                  title={item.url} onClick={function () { self.handleClick(item); }} data-index={i}>
                  <div>{item.url}</div>
                  <p>
                    <i className={'w-req-method-tag w-req-method-tag-' + item.method}>{item.method}</i>
                    <i className="w-req-protocol-tag">{item.protocol}</i>
                    {item.body ? <i className="w-req-type-tag">Body</i> : null}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="fill v-box w-com-history-ctn">
            {selectedItem ? <div className="w-com-history-footer">
                <button
                  type="button"
                  className="btn btn-default"
                  disabled={disabled}
                  onClick={this.copyAsCURL}
                >
                  As cURL
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  disabled={disabled}
                  onClick={this.onReplay}
                >
                  Replay
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  disabled={disabled}
                  onClick={this.onReplayTimes}
                >
                  Replay Times
                </button>
                <button
                  type="button"
                  className="btn btn-info"
                  disabled={disabled}
                  onClick={this.export}
                >
                  Export
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={disabled}
                  onClick={this.onEdit}
                >
                  <Icon name="send" />
                  Edit
                </button>
                <CloseBtn onClick={props.onClose} />
              </div> : null}
              {selectedItem ? <pre className={disabled ? 'w-show-loading fill' : 'fill'}>
                {getRaw(selectedItem, disabled)}
                <div className="w-load-tips">Loading...</div>
              </pre> : null}
          </div>
        </Divider> : <div className="w-empty-data">Empty</div>}
        <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
      </div>
    );
  }
});

module.exports = HistoryData;
