var React = require('react');
var $ = require('jquery');
var Divider = require('./divider');
var ContextMenu = require('./context-menu');
var util = require('./util');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');

var isStr = util.isStr;
var contextMenuList = [
  { name: 'Copy URL' },
  { name: 'Copy As cURL' },
  { name: 'Replay' },
  { name: 'Replay Times' },
  { name: 'Export' },
  { name: 'Edit', icon: 'send' }
].concat(util.NETWORK_ACTIONS);
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
  copyAsCURL: function(_, item) {
    item = item || this.getItem();
    if (!item) {
      return;
    }
    var headers = item.headers;
    if (isStr(headers)) {
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
  },
  onReplayTimes: function() {
    this.props.onReplay(this.getItem(), true);
  },
  handleClick: function(item) {
    var data = this.props.data;
    data.forEach(function(item) {
      item.selected = false;
    });
    data._selectedKey = item.key;
    item.selected = true;
    this.setState({});
  },
  exportItem: function(item) {
    var headers = item.headers;
    var rules = [];
    if (isStr(headers) && RULES_KEY.test(headers)) {
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
    util.trigger('showExportDialog', ['composer', {
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
    var self = this;
    var groupList = self.props.data && self.props.data._groupList;
    if (!groupList) {
      return;
    }
    var len = groupList.length;
    for (var i = 0; i < len; i++) {
      var item = groupList[i];
      if (item && item.selected) {
        self.exportItem(item);
      }
    }
  },
  onContextMenu: function(e) {
    var self = this;
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
    var data = self.props.data;
    var groupList = data && data._groupList;
    var item = groupList && groupList[elem.attr('data-index')];
    if (!item) {
      return;
    }
    self._focusItem = item;
    contextMenuList[0].name = isTitle ? 'Copy' : 'Copy URL';
    contextMenuList[0].copyText = elem.attr('title');

    for (var i = 1; i < 6; i++) {
      var ctxMenu = contextMenuList[i];
      ctxMenu.hide = isTitle;
    }
    data = util.getMenuPosition(e, 130, 185 - (isTitle ? 150 : 0));
    data.className = 'w-keep-history-data';
    data.list = contextMenuList;
    self.refs.contextMenu.show(data);
  },
  onClickContextMenu: function (action) {
    var self = this;
    var props = self.props;
    var focusItem = self._focusItem;
    switch (action) {
    case 'Copy As cURL':
      return self.copyAsCURL(null, focusItem);
    case 'Export':
      return self.exportItem(focusItem);
    case 'Replay':
    case 'Replay Times':
      return props.onReplay(focusItem, action !== 'Replay');
    case 'Edit':
      return props.onEdit(focusItem);
    case 'createApiTest':
      return util.showService('createApiTest');
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
      <div ref="historyDialog" className={'w-layer box w-com-history-data' + (show ? ' w-show' : '')}>
        {data.length ? null : <CloseBtn onClick={props.onClose} />}
        {data.length ?
        <Divider leftWidth="170">
          <div ref="list" className="w-com-history-list" onContextMenu={self.onContextMenu}>
            {groupList.map(function(item, i) {
              var title = item.title;
              if (title) {
                return <div key={title} className="w-history-title" title={title} data-index={i}>{title}</div>;
              }
              if (item.selected) {
                selectedItem = item;
              }
              return (
                <div key={item.key} className={'w-history-item' + (item.selected ? ' w-selected' : '')}
                  title={item.url} onClick={function () { self.handleClick(item); }} data-index={i}>
                  <div>{item.url}</div>
                  <p>
                    <i className={'w-req-tag w-req-tag-' + item.method}>{item.method}</i>
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
                  onClick={self.copyAsCURL}
                >
                  As cURL
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={self.onReplay}
                >
                  Replay
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={self.onReplayTimes}
                >
                  Replay Times
                </button>
                <button
                  type="button"
                  className="btn btn-info"
                  onClick={self.export}
                >
                  Export
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={self.onEdit}
                >
                  <Icon name="send" />
                  Edit
                </button>
                <CloseBtn onClick={props.onClose} />
              </div> : null}
              {selectedItem ? <pre className="fill">
                {getRaw(selectedItem)}
              </pre> : null}
          </div>
        </Divider> : <div className="w-empty-data">No data</div>}
        <ContextMenu onClick={self.onClickContextMenu} ref="contextMenu" />
      </div>
    );
  }
});

module.exports = HistoryData;
