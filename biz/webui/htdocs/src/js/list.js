require('./base-css.js');
require('../css/list.css');
var $ = require('jquery');
var util = require('./util');
var React = require('react');
var ReactDOM = require('react-dom');
var message = require('./message');
var Divider = require('./divider');
var Editor = require('./editor');
var FilterInput = require('./filter-input');
var ContextMenu = require('./context-menu');
var dataCenter = require('./data-center');
var events = require('./events');
var iframes = require('./iframes');
var RecycleBinDialog = require('./recycle-bin');

var disabledEditor = window.location.href.indexOf('disabledEditor=1') !== -1;
var rulesCtxMenuList = [
  {
    name: 'Copy',
    list: [{ name: 'Name' }, { name: 'Rules' }]
  },
  { name: 'Enable', action: 'Save' },
  {
    name: 'Create',
    action: 'Rule'
  },
  { name: 'Rename' },
  { name: 'Delete' },
  { name: 'Export' },
  { name: 'Import' },
  { name: 'Trash' },
  {
    name: 'Others',
    action: 'Plugins',
    list: []
  },
  { name: 'Help', sep: true }
];
var valuesCtxMenuList = [
  {
    name: 'Copy',
    list: [{ name: 'Key', action: 'CopyKey' }, { name: 'Value' }]
  },
  { name: 'Save' },
  {
    name: 'Create',
    action: 'Key'
  },
  { name: 'Rename' },
  { name: 'Delete' },
  {
    name: 'JSON',
    list: [{ name: 'Validate' }, { name: 'Format' }]
  },
  { name: 'Export' },
  { name: 'Import' },
  { name: 'Trash' },
  {
    name: 'Others',
    action: 'Plugins',
    list: []
  },
  { name: 'Help', sep: true }
];
var NAME_PREFIX = 'listmodal$';
var JSON_RE = /^\s*(?:[\{｛][\w\W]+[\}｝]|\[[\w\W]+\])\s*$/;
var curTarget;

function getTarget(e) {
  var target = e.target;
  var nodeName = target.nodeName;
  if (nodeName === 'A') {
    return target;
  }
  target = target.parentNode;
  if (target) {
    nodeName = target.nodeName;
    if (nodeName === 'A') {
      return target;
    }
  }
}

function getName(name) {
  if (typeof name !== 'string') {
    return '';
  }
  return name.substring(name.indexOf('_') + 1);
}

function getDragInfo(e) {
  var target = getTarget(e);
  var name = target && target.getAttribute('data-name');
  if (!name) {
    return;
  }
  var fromName = getNameFromTypes(e);
  if (fromName && name.toLowerCase() !== fromName) {
    return {
      target: target,
      toName: getName(name)
    };
  }
}

function getNameFromTypes(e) {
  var type = util.findArray(e.dataTransfer.types, function (type) {
    if (type.indexOf(NAME_PREFIX) === 0) {
      return true;
    }
  });
  return type && type.substring(NAME_PREFIX.length);
}

$(document).on('drop', function () {
  if (curTarget) {
    curTarget.style.background = '';
  }
  curTarget = null;
});

function getSuffix(name) {
  if (typeof name != 'string') {
    return '';
  }
  var index = name.lastIndexOf('.');
  return index == -1 ? '' : name.substring(index + 1);
}

var List = React.createClass({
  componentDidMount: function () {
    var self = this;
    var visible = !self.props.hide;
    $(window)
      .keydown(function (e) {
        if (visible && (e.ctrlKey || e.metaKey)) {
          var modal = self.props.modal;
          if (e.keyCode === 83) {
            modal.getChangedList().forEach(trigger);
            return false;
          }
        }
      })
      .on('hashchange', function () {
        var disabled = window.location.href.indexOf('disabledEditor=1') !== -1;
        if (disabled !== disabledEditor) {
          disabledEditor = disabled;
          self.setState({});
        }
      });

    function trigger(item) {
      self.onDoubleClick(item);
    }
    var modal = self.props.modal;
    this.curListLen = modal.list.length;
    this.curActiveItem = modal.getActive();
    $(ReactDOM.findDOMNode(self.refs.list))
      .focus()
      .on('keydown', function (e) {
        var item;
        if (e.keyCode == 38) {
          //up
          item = modal.prev();
        } else if (e.keyCode == 40) {
          //down
          item = modal.next();
        }

        if (item) {
          e.shiftKey ? self.setState({}) : self.onClick(item);
          e.preventDefault();
        }
      });
    events.on('toggleCommentInEditor', function () {
      var activeItem = modal.getActive();
      if (activeItem) {
        var name = self.props.name === 'rules' ? 'Rules' : 'Values';
        events.trigger('save' + name, activeItem);
      }
    });
    events.on('reloadRulesRecycleBin', function () {
      self.reloadRecycleBin('Rules');
    });
    events.on('reloadValuesRecycleBin', function () {
      self.reloadRecycleBin('Values');
    });
    this.ensureVisible(true);
  },
  shouldComponentUpdate: function (nextProps) {
    var hide = util.getBoolean(this.props.hide);
    return hide != util.getBoolean(nextProps.hide) || !hide;
  },
  componentDidUpdate: function () {
    var modal = this.props.modal;
    var curListLen = modal.list.length;
    var curActiveItem = modal.getActive();
    if (curListLen > this.curListLen || curActiveItem !== this.curActiveItem) {
      this.ensureVisible();
    }
    this.curListLen = curListLen;
    this.curActiveItem = curActiveItem;
    if (this.props.hide) {
      this.refs.recycleBinDialog.hide();
    }
  },
  ensureVisible: function (init) {
    var activeItem = this.props.modal.getActive();
    if (activeItem) {
      var elem = ReactDOM.findDOMNode(this.refs[activeItem.name]);
      var con = ReactDOM.findDOMNode(this.refs.list);
      util.ensureVisible(elem, con, init);
    }
  },
  onClick: function (item) {
    var self = this;
    if (
      typeof self.props.onActive != 'function' ||
      self.props.onActive(item) !== false
    ) {
      self.props.modal.setActive(item.name);
      self.setState({ activeItem: item });
    }
  },
  onClickGroup: function (e) {
    var name = e.target.getAttribute('data-group');
    var groups = this.props.modal.groups;
    var group = groups[name];
    if (!group) {
      group = groups[name] = {};
    }
    group.expand = !group.expand;
    this.setState({});
  },
  onDoubleClick: function (item, okIcon) {
    (item.selected && !item.changed) || okIcon
      ? this.onUnselect(item)
      : this.onSelect(item);
    var onDoubleClick = this.props.onDoubleClick;
    typeof onDoubleClick == 'function' && onDoubleClick(item);
  },
  onSelect: function (data) {
    var onSelect = this.props.onSelect;
    typeof onSelect == 'function' && onSelect(data);
  },
  onUnselect: function (data) {
    var onUnselect = this.props.onUnselect;
    typeof onUnselect == 'function' && onUnselect(data);
  },
  onChange: function (e) {
    var modal = this.props.modal;
    var item = modal.getActive();
    if (!item) {
      return;
    }
    var oldValue = item.value || '';
    var value = e.getValue() || '';
    if (value != oldValue) {
      var hasChanged = modal.hasChanged();
      item.changed = true;
      item.value = value;
      this.setState({
        selectedItem: item
      });
      if (!hasChanged) {
        events.trigger('updateGlobal');
      }
    }
  },
  onFilterChange: function (keyword) {
    this.props.modal.search(keyword, this.props.name != 'rules');
    this.setState({ filterText: keyword });
  },
  getItemByKey: function (key) {
    return this.props.modal.getByKey(key);
  },
  onDragStart: function (e) {
    var target = getTarget(e);
    var name = target && target.getAttribute('data-name');
    if (name) {
      e.dataTransfer.setData(NAME_PREFIX + name, 1);
      e.dataTransfer.setData('-' + NAME_PREFIX, name);
    }
  },
  onDragEnter: function (e) {
    var info = getDragInfo(e);
    if (info) {
      curTarget = info.target;
      curTarget.style.background = '#ddd';
    }
  },
  onDragLeave: function (e) {
    var info = getDragInfo(e);
    if (info) {
      info.target.style.background = '';
    }
  },
  onDrop: function (e) {
    var info = getDragInfo(e);
    if (info) {
      var fromName = getName(e.dataTransfer.getData('-' + NAME_PREFIX));
      info.target.style.background = '';
      if (this.props.modal.moveTo(fromName, info.toName)) {
        var name = this.props.name === 'rules' ? 'rules' : 'values';
        dataCenter[name].moveTo(
          {
            from: fromName,
            to: info.toName
          },
          function (data, xhr) {
            if (!data) {
              util.showSystemError(xhr);
              return;
            }
            if (data.ec === 2) {
              events.trigger(name + 'Changed');
            }
          }
        );
        this.setState({});
        this.triggerChange('move');
      }
    }
  },
  formatJson: function (item) {
    var value = (item && item.value) || '';
    if (/\S/.test(value)) {
      var json = util.parseRawJson(value);
      if (json) {
        json = JSON.stringify(json, null, '  ');
        if (value !== json) {
          item.changed = true;
          item.value = json;
          events.trigger('updateGlobal');
        }
      }
    }
  },
  reloadRecycleBin: function (name) {
    if (this.refs.recycleBinDialog.isVisible()) {
      this._pendingRecycle = false;
      this.showRecycleBin(name);
    }
  },
  showRecycleBin: function (name) {
    var self = this;
    if (self._pendingRecycle) {
      return;
    }
    self._pendingRecycle = true;
    dataCenter[name.toLowerCase()].recycleList(function (data, xhr) {
      self._pendingRecycle = false;
      if (!data) {
        util.showSystemError(xhr);
        return;
      }
      if (!data.list.length) {
        return message.info('Trash is empty.');
      }
      self.refs.recycleBinDialog.show({ name: name, list: data.list });
    });
  },
  onClickContextMenu: function (action, e, parentAction, menuName) {
    var self = this;
    var name = self.props.name === 'rules' ? 'Rules' : 'Values';
    switch (parentAction || action) {
      case 'Save':
        events.trigger('save' + name, self.currentFocusItem);
        break;
      case 'Rename':
        events.trigger('rename' + name, self.currentFocusItem);
        break;
      case 'Delete':
        events.trigger('delete' + name, self.currentFocusItem);
        break;
      case 'Rule':
        events.trigger('createRules');
        break;
      case 'Key':
        events.trigger('createValues');
        break;
      case 'ruleGroup':
        events.trigger('createRuleGroup');
        break;
      case 'valueGroup':
        events.trigger('createValueGroup');
        break;
      case 'Export':
        events.trigger('export' + name);
        break;
      case 'Import':
        events.trigger('import' + name, e);
        break;
      case 'Trash':
        self.showRecycleBin(name);
        break;
      case 'Validate':
        var item = self.currentFocusItem;
        if (item) {
          if (JSON_RE.test(item.value)) {
            try {
              JSON.parse(item.value);
              message.success('Good JSON Object.');
            } catch (e) {
              message.error(
                'Warning: the value of ' +
                  item.name +
                  ' can`t be parsed into json. ' +
                  e.message
              );
            }
          } else {
            message.error('Bad JSON Object.');
          }
        }
        break;
      case 'Format':
        self.formatJson(self.currentFocusItem);
        break;
      case 'Help':
        window.open(
          'https://avwo.github.io/whistle/webui/' +
            (self.props.name || 'values') +
            '.html'
        );
        break;
      case 'Plugins':
        var modal = self.props.modal;
        iframes.fork(action, {
          port: dataCenter.getPort(),
          type: self.props.name === 'rules' ? 'rules' : 'values',
          name: menuName,
          list: modal && modal.getList(),
          activeItem: self.currentFocusItem,
          selectedItem: modal && modal.getActive()
        });
        break;
    }
  },
  triggerChange: function (type) {
    var data = this.props.modal.data;
    var list = this.props.modal.list.map(function (name) {
      var item = data[name];
      return {
        name: name,
        value: (item && item.value) || ''
      };
    });
    util.triggerListChange(this.props.name || 'values', {
      type: type,
      url: location.href,
      list: list
    });
  },
  onContextMenu: function (e) {
    var name = $(e.target).closest('a').attr('data-name');
    var modal = this.props.modal;
    name = name && getName(name);
    var item = modal.get(name);
    if (!item) {
      name = undefined;
    }
    this.currentFocusItem = item;
    var disabled = !name;
    var isDefault;
    var isRules = this.props.name == 'rules';
    var pluginItem = isRules ? rulesCtxMenuList[8] : valuesCtxMenuList[9];
    util.addPluginMenus(
      pluginItem,
      dataCenter[isRules ? 'getRulesMenus' : 'getValuesMenus'](),
      isRules ? 7 : 8
    );
    var height = (isRules ? 280 : 310) - (pluginItem.hide ? 30 : 0);
    pluginItem.maxHeight = height + 30;
    var data = util.getMenuPosition(e, 110, height);
    data.className = 'w-contenxt-menu-list';
    if (isRules) {
      data.list = rulesCtxMenuList;
      data.list[1].disabled = disabled;
      data.list[1].name = 'Save';
      if (item && !item.changed) {
        if (dataCenter.isMutilEnv() && name !== 'Default') {
          data.list[1].disabled = true;
        } else {
          data.list[1].name = item.selected ? 'Disable' : 'Enable';
        }
      }
      if (item && item.isDefault) {
        isDefault = true;
      }
      data.list[5].disabled = !modal.list.length;
    } else {
      data.list = valuesCtxMenuList;
      data.list[1].disabled = !item || !item.changed;
      data.list[5].disabled = disabled;
      data.list[6].disabled = !modal.list.length;
    }
    var copyItem = data.list[0];
    copyItem.disabled = disabled;
    if (!disabled) {
      copyItem.list[0].copyText = name;
      if (item.value) {
        copyItem.list[1].disabled = false;
        copyItem.list[1].copyText = item.value;
      } else {
        copyItem.list[1].disabled = true;
      }
    }
    data.list[3].disabled = isDefault || disabled;
    data.list[4].disabled = isDefault || disabled;
    this.refs.contextMenu.show(data);
    e.preventDefault();
  },
  onAddRule: function (name) {
    this.props.modal.setActive(name);
    this.setState({});
  },
  enableAllRules: function () {
    var self = this;
    if (self._pendingEnableRules) {
      return;
    }
    self._pendingEnableRules = setTimeout(function () {
      self._pendingEnableRules = null;
    }, 2000);
    $('.w-enable-rules-menu').trigger('click');
    events.trigger('disableAllRules');
  },
  render: function () {
    var self = this;
    var modal = self.props.modal;
    var list = modal.list;
    var data = modal.data;
    var props = self.props;
    var activeItem = modal.getActive() || '';
    if (!activeItem && list[0] && (activeItem = data[list[0]])) {
      activeItem.active = true;
    }
    var isRules = self.props.name == 'rules';
    var draggable = false;
    var activeName = activeItem ? activeItem.name : '';
    if (isRules) {
      draggable = list.length > 2;
      util.triggerRulesActiveChange(activeName);
    } else if (list.length > 1) {
      draggable = true;
      util.triggerValuesActiveChange(activeName);
    }

    //不设置height为0，滚动会有问题
    return (
      <div className={'orient-vertical-box fill' + (props.hide ? ' hide' : '')}>
        {props.disabled ? (
          <div className="w-record-status">
            All rules is disabled
            <button className="btn btn-primary" onClick={self.enableAllRules}>
              Enable
            </button>
          </div>
        ) : null}
        <Divider leftWidth="220">
          <div className="fill orient-vertical-box w-list-left">
            <div
              ref="list"
              tabIndex="0"
              onContextMenu={this.onContextMenu}
              className={
                'fill orient-vertical-box w-list-data ' +
                (props.className || '') +
                (props.disabled ? ' w-disabled' : '')
              }
            >
              {list.map(function (name, i) {
                var item = data[name];
                var isDefaultRule = isRules && i === 0;

                return (
                  <a
                    tabIndex="0"
                    ref={name}
                    data-name={i + '_' + name}
                    onDragStart={isDefaultRule ? undefined : self.onDragStart}
                    onDragEnter={isDefaultRule ? undefined : self.onDragEnter}
                    onDragLeave={isDefaultRule ? undefined : self.onDragLeave}
                    onDrop={isDefaultRule ? undefined : self.onDrop}
                    style={{ display: item.hide ? 'none' : null }}
                    key={item.key}
                    data-key={item.key}
                    title={name}
                    draggable={isDefaultRule ? false : draggable}
                    onClick={function () {
                      self.onClick(item);
                    }}
                    onDoubleClick={function () {
                      self.onDoubleClick(item);
                    }}
                    className={util.getClasses({
                      'w-active': item.active,
                      'w-changed': item.changed,
                      'w-selected': item.selected
                    })}
                  >
                    {name}
                    <span className="glyphicon glyphicon-ok"></span>
                  </a>
                );
              })}
            </div>
            <FilterInput onChange={this.onFilterChange} />
            <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
            <RecycleBinDialog ref="recycleBinDialog" />
          </div>
          <Editor
            {...self.props}
            onChange={self.onChange}
            readOnly={disabledEditor || !activeItem}
            value={activeItem.value}
            mode={isRules ? 'rules' : getSuffix(activeItem.name)}
          />
        </Divider>
      </div>
    );
  }
});

module.exports = List;
