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
var storage = require('./storage');
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
  getInitialState: function() {
    var nodes = util.parseJSON(storage.get(this.getCollapseKey()));
    var map = {};
    this.collapseGroups = Array.isArray(nodes) ? nodes.filter(function(name) {
      if (util.isGroup(name) && name[1] && !map[name]) {
        map[name] = 1;
        return true;
      }
    }) : [];
    return {};
  },
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
          var group = self.getCurGroup(item);
          group && self.expandGroup(group.name);
          e.shiftKey ? self.setState({}) : self.onClick(item);
          if (self.isRules()) {
            events.trigger('updateUI');
          }
          e.preventDefault();
        }
      });
    var comName = self.isRules() ? 'Rules' : 'Values';
    events.on('toggleCommentInEditor', function () {
      var activeItem = modal.getActive();
      if (activeItem) {
        events.trigger('save' + comName, activeItem);
      }
    });
    events.on('reload' + comName + 'RecycleBin', function () {
      self.reloadRecycleBin(comName);
    });
    events.on('expand' + comName + 'Group', function(_, groupName) {
      var group = self.getGroupByName(groupName);
      group && self.expandGroup(group.name);
    });
    var scrollToBottom = function() {
      ReactDOM.findDOMNode(self.refs.list).scrollTop = 1000000000;
    };
    var focusList = function() {
      ReactDOM.findDOMNode(self.refs.list).focus();
    };
    events.on('scroll' + comName + 'Bottom', function() {
      scrollToBottom();
    });
    events.on('focus' + comName + 'List', function() {
      focusList();
    });
    events.on(comName.toLowerCase() + 'NameChanged', function(_, name, newName) {
      var index = name === newName ? - 1 : self.collapseGroups.indexOf(name);
      if (index !== -1) {
        if (self.collapseGroups.indexOf(newName) !== -1) {
          self.collapseGroups.splice(index, 1);
        } else {
          self.collapseGroups[index] = newName;
        }
        storage.set(self.getCollapseKey(), JSON.stringify(self.collapseGroups));
      }
    });
    this.ensureVisible(true);
  },
  expandGroup: function(groupName) {
    var index = this.collapseGroups.indexOf(groupName);
    if (index !== -1) {
      this.collapseGroups.splice(index, 1);
      storage.set(this.getCollapseKey(), JSON.stringify(this.collapseGroups));
    }
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
  toggleGroup: function (item) {
    var index = this.collapseGroups.indexOf(item.name);
    if (index === -1) {
      this.collapseGroups.push(item.name);
    } else {
      this.collapseGroups.splice(index, 1);
    }
    storage.set(this.getCollapseKey(), JSON.stringify(this.collapseGroups));
    this.setState({});
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
      var group = this.collapseGroups.indexOf(fromName) !== -1;
      var toName = info.toName;
      var params = {
        from: fromName,
        to: toName,
        group: group
      };
      info.target.style.background = '';
      var toTop = this.isRules() && toName === 'Default';
      if (toTop) {
        toName = this.props.modal.list[1];
        params.to = toName;
        params.toTop = true;
      }
      if (this.props.modal.moveTo(fromName, toName, group, toTop)) {
        var name = this.props.name === 'rules' ? 'rules' : 'values';
        dataCenter[name].moveTo(params, function (data, xhr) {
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
  getGroupByName: function(name) {
    var modal = this.props.modal;
    var item = modal.data[name];
    if (!item || util.isGroup(item.name)) {
      return item;
    }
    var i = modal.list.indexOf(name) - 1;
    for (; i >= 0; i--) {
      item = modal.data[modal.list[i]];
      if (util.isGroup(item.name)) {
        return item;
      }
    }
  },
  getCurGroup: function(item) {
    item = item || this.currentFocusItem;
    return item && this.getGroupByName(item.name);
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
      events.trigger('createRules', self.getCurGroup());
      break;
    case 'Key':
      events.trigger('createValues', self.getCurGroup());
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
  isRules: function() {
    return this.props.name == 'rules';
  },
  getCollapseKey: function() {
    return this.isRules() ? 'collapseRulesGroups' : 'collapseValuesGroups';
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
    var isRules = this.isRules();
    var pluginItem = isRules ? rulesCtxMenuList[8] : valuesCtxMenuList[9];
    util.addPluginMenus(
      pluginItem,
      dataCenter[isRules ? 'getRulesMenus' : 'getValuesMenus'](),
      isRules ? 7 : 8
    );
    if (!isRules) {
      valuesCtxMenuList[0].list[0].name = name && util.isGroup(name) ? 'Name' : 'Key';
    }
    var height = (isRules ? 280 : 315) - (pluginItem.hide ? 30 : 0);
    pluginItem.maxHeight = height + 30;
    var data = util.getMenuPosition(e, 110, height);
    data.className = 'w-contenxt-menu-list';
    if (isRules) {
      data.list = rulesCtxMenuList;
      data.list[1].disabled = disabled;
      data.list[1].name = 'Save';
      if (item && !item.changed) {
        if ((dataCenter.isMutilEnv() && name !== 'Default') || util.isGroup(name)) {
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
  parseList: function() {
    var isRules = this.isRules();
    var modal = this.props.modal;
    var list = modal.list;
    var data = modal.data;
    var group;
    var childCount = 0;
    var selectedCount = 0;
    var changed;
    var setStatus = function() {
      if (group) {
        group.changed = changed;
        group.childCount = childCount;
        group.selectedCount = selectedCount;
        childCount = 0;
        selectedCount = 0;
        changed = false;
      }
    };
    list.forEach(function(name, i) {
      var item = data[name];
      if (util.isGroup(item.name)) {
        setStatus();
        item.isGroup = true;
        group = item;
      } else if (group) {
        ++childCount;
        changed = changed || item.changed;
        if (isRules && item.selected) {
          ++selectedCount;
        }
      }
    });
    setStatus();
    return list;
  },
  render: function () {
    var self = this;
    var modal = self.props.modal;
    var list = self.parseList();
    var data = modal.data;
    var props = self.props;
    var activeItem = modal.getActive() || '';
    var isSub, isHide;
    if (!activeItem && list[0] && (activeItem = data[list[0]])) {
      activeItem.active = true;
    }
    var isRules = self.isRules();
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
        <Divider leftWidth="230">
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
                var isGroup = item.isGroup;
                var title = isGroup ? name.substring(1) : name;
                isSub = isSub || isGroup;
                if (isGroup) {
                  isHide = self.collapseGroups.indexOf(name) !== -1;
                }
                return (
                  <a
                    tabIndex="0"
                    ref={name}
                    data-name={i + '_' + name}
                    onDragStart={isDefaultRule ? undefined : self.onDragStart}
                    onDragEnter={self.onDragEnter}
                    onDragLeave={self.onDragLeave}
                    onDrop={self.onDrop}
                    style={{ display: item.hide ? 'none' : null }}
                    key={item.key}
                    data-key={item.key}
                    title={title}
                    draggable={isDefaultRule ? false : draggable}
                    onClick={function () {
                      isGroup ? self.toggleGroup(item) : self.onClick(item);
                    }}
                    onDoubleClick={isGroup ? null : function (e) {
                      self.onDoubleClick(item);
                      e.preventDefault();
                    }}
                    className={util.getClasses({
                      'w-active': !isGroup && item.active,
                      'w-changed': item.changed,
                      'w-selected': !isGroup && item.selected,
                      'w-list-group': isGroup,
                      'w-list-sub': !isGroup && isSub,
                      'w-hide': !isGroup && isHide,
                      'w-group-empty': isGroup && !item.childCount
                    })}
                  >
                    {isGroup ? <span className={'glyphicon glyphicon-triangle-' + (isHide ? 'right' : 'bottom')} /> : null}
                    {title}
                    {isGroup ? <span className={util.getClasses({
                      'w-group-child-num': true,
                      'w-exists-selected': item.selectedCount > 0
                    })}>({item.selectedCount > 0 ? item.selectedCount + '/' : ''}{item.childCount})</span> : <span className="glyphicon glyphicon-ok"></span>}
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
            readOnly={!activeItem || activeItem.hide || disabledEditor}
            value={activeItem.hide ? '' : activeItem.value}
            mode={isRules ? 'rules' : getSuffix(activeItem.name)}
          />
        </Divider>
      </div>
    );
  }
});

module.exports = List;
