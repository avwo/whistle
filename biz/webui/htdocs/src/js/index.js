require('./base-css.js');
require('../css/index.css');
require('../css/theme.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var Clipboard = require('clipboard');
var EditorDialog = require('./editor-dialog');
var List = require('./list');
var ListModal = require('./list-modal');
var Network = require('./network');
var About = require('./about');
var Online = require('./online');
var MenuItem = require('./menu-item');
var RecordBtn = require('./record-btn');
var EditorSettings = require('./editor-settings');
var NetworkSettings = require('./network-settings');
var Plugins = require('./plugins');
var dataCenter = require('./data-center');
var util = require('./util');
var protocols = require('./protocols');
var storage = require('./storage');
var Dialog = require('./dialog');
var ListDialog = require('./list-dialog');
var FilterBtn = require('./filter-btn');
var message = require('./message');
var UpdateAllBtn = require('./update-all-btn');
var ContextMenu = require('./context-menu');
var RulesDialog = require('./rules-dialog');
var SyncDialog = require('./sync-dialog');
var LargeDialog = require('./large-dialog');
var JSONDialog = require('./json-dialog');
var IframeDialog = require('./iframe-dialog');
var win = require('./win');
var ServiceBtn = require('./service-btn');
var SaveToServiceBtn = require('./share-via-url-btn');
var ImportDialog = require('./import-dialog');
var ExportDialog = require('./export-dialog');
var HttpsSettings = require('./https-settings');
var ServiceDialog = require('./service-dialog');
var Icon = require('./icon');
var CloseBtn = require('./close-btn');
var CreateRuleDialog = require('./create-rule');
var TestRuleDialog = require('./test-rule');
var DismissBtn = require('./dismiss-btn');

var TEMP_LINK_RE = /^(?:[\w-]+:\/\/)?<?temp(?:\/([\da-z]{64}|blank))?(?:\.[\w-]+)?>?$/;
var FILE_PATH_RE = /^(?:[\w-]+:\/\/)?<?((?:[a-z]:[\\/]|\/).+)>?$/i;
var DEFAULT = 'Default';
var MAX_PLUGINS_TABS = 7;
var MAX_FILE_SIZE = 1024 * 1024 * 128;
var MAX_OBJECT_SIZE = 1024 * 1024 * 36;
var MAX_LOG_SIZE = 1024 * 1024 * 2;
var MAX_REPLAY_COUNT = 100;
var LINK_SELECTOR = '.cm-js-type, .cm-js-http-url, .cm-string, .cm-js-at, .cm-js-weinre, .cm-js-log';
var LINK_RE = /^"(https?:)?(\/\/[^/]\S+)"$/i;
var AT_LINK_RE = /^@(https?:)?(\/\/[^/]\S+)$/i;
var OPTIONS_WITH_SELECTED = [
  'removeSelected',
  'exportWhistleFile'
];
var HIDE_STYLE = util.HIDE_STYLE;
var trigger = util.trigger;
var VER_RE = /^(?:\d+)\.(?:\d+)\.(?:\d+)(?:-[\w-]+)?$/;
var search = window.location.search;
var query = util.getQuery();
var isClient = query.mode === 'client';
var clientVersion = isClient && util.isElectron && VER_RE.test(query.v) ? query.v : '';
var hideMenus = !!(query.hideMenus || query.hideMenu);
var hideLeftMenu;
var showTreeView;
var dataUrl;
var TABS = ['Network', 'Rules', 'Values', 'Plugins'];
var TEXT_SUFFIX_RE = /[\w-]\.(?:txt|csv|tsv|json|xml|yaml|yml|ini|conf|log|html|htm|css|js|py|java|c|cpp|h|sh|php|sql|md|markdown|rtf|tex|bib|vcf)(>)?$/i;
var findDOMNode = ReactDOM.findDOMNode;
var getHideStyle = util.getHideStyle;
var showSysErr = util.showSysErr;
var isFunc = util.isFunc;
var isStr = util.isStr;
var notEStr = util.notEStr;
var trimStr = util.trimStr;
var getStr = util.getString;
var handleImportData = util.handleImportData;
var removeProtocol = util.removeProtocol;
var hasShortcut = util.hasShortcut;
var changePageName = util.changePageName;
var isGroupName = util.isGroup;
var getSimplePluginName = util.getSimplePluginName;
var readFileAsText = util.readFileAsText;
var addEvent = util.on;
var preventBlur = util.preventBlur;
var getBool = util.getBool;
var triggerChange = util.triggerListChange;
var attr = util.attr;
var showError = message.error;
var showSucc = message.success;
var GITHUB_URL = util.GITHUB_URL;
var EXCEED_TIPS = util.EXCEED_TIPS;
var README_URL = GITHUB_URL + '#whistle';
var OBJ_TIPS = EXCEED_TIPS + ' 36MB';
var EMPTY_TIPS = 'The name is required';
var alertMsg = win.alert;
var confirmMsg = win.confirm;
var CMF_DEL_MSG = util.CMF_DEL_MSG;
var CMF_CHG_MSG = util.CMF_CHG_MSG;
var DEL_RULES = CMF_DEL_MSG + 'all follow rules or group?';
var DEL_VALUE = CMF_DEL_MSG + 'all follow values or group?';
var DISABLE_TIPS = 'Do you confirm disabling all ';
var DISABLE_RULES = DISABLE_TIPS + 'rules?';
var DISABLE_PLUGINS = DISABLE_TIPS + 'plugins?';

function getExistsTips(name) {
  return 'The name \'' + name + '\' is already in use';
}

function getExportNames(modal, item) {
  item = item || modal.getActive();
  if (!item) {
    return;
  }
  var name = item.name;
  var result = [name];
  if (!isGroupName(name)) {
    return result;
  }
  var list = modal.list;
  for (var i = list.indexOf(name) + 1, len = list.length; i < len; i++) {
    name = list[i];
    if (isGroupName(name)) {
      return result;
    }
    result.push(name);
  }
  return result;
}

function isTextFile(url) {
  if (!TEXT_SUFFIX_RE.test(url)) {
    return false;
  }
  var PATH_RE;
  if (RegExp.$1) {
    PATH_RE = dataCenter.isWin ? /^(?:[\w-]+:\/\/)?<[a-z]:[\\/]/i : /^(?:[\w-]+:\/\/)?<\//i;
  } else {
    PATH_RE = dataCenter.isWin ? /^(?:[\w-]+:\/\/)?[a-z]:[\\/]/i : /^(?:[\w-]+:\/\/)?\//i;
  }
  return PATH_RE.test(url);
}

function preventInputBlur(e) {
  e.target.nodeName != 'INPUT' && preventBlur(e);
}

window.setWhistleDataUrl = function(url) {
  if (url = trimStr(url)) {
    if (dataCenter.handleDataUrl) {
      dataCenter.handleDataUrl(url);
    } else {
      dataUrl = url;
    }
    return true;
  }
  return false;
};

window.showWhistleMessage = function(options) {
  message[options.level || options.type || 'info'](options.text || options.msg || options.message);
};

window.showWhistleWebUI = function(name) {
  if (TABS.indexOf(name) !== -1) {
    trigger('show' + name);
  }
};

if (/[&#?]showTreeView=(0|false|1|true)(?:&|$|#)/.test(search)) {
  showTreeView = RegExp.$1 === '1' || RegExp.$1 === 'true';
}

if (/[&#?]hideLeft(?:Bar|Menu)=(0|false|1|true)(?:&|$|#)/.test(search)) {
  hideLeftMenu = RegExp.$1 === '1' || RegExp.$1 === 'true';
} else if (/[&#?]showLeft(?:Bar|Menu)=(0|false|1|true)(?:&|$|#)/.test(search)) {
  hideLeftMenu = RegExp.$1 === '0' || RegExp.$1 === 'false';
}

var TOP_BAR_MENUS = [
  {
    name: 'Scroll To Top',
    action: 'top'
  },
  {
    name: 'Scroll To Selected',
    action: 'selected'
  },
  {
    name: 'Scroll To Bottom',
    action: 'bottom'
  }
];

var LEFT_BAR_MENUS = [
  {
    name: 'Clear',
    icon: 'remove'
  },
  {
    name: 'Save',
    icon: 'save-file'
  },
  {
    name: 'Tree View',
    multiple: true
  },
  {
    name: 'Rules',
    multiple: true
  },
  {
    name: 'Plugins',
    multiple: true
  }
];

var RULES_ACTIONS = [
  {
    name: 'Import',
    icon: 'import',
    id: 'importRules',
    title: 'Ctrl[Command] + I'
  },
  {
    name: 'Export',
    icon: 'export',
    id: 'exportRules'
  }
];
var VALUES_ACTIONS = [
  {
    name: 'Import',
    icon: 'import',
    id: 'importValues',
    title: 'Ctrl[Command] + I'
  },
  {
    name: 'Export',
    icon: 'export',
    id: 'exportValues'
  }
];

var ABORT_OPTIONS = [
  {
    name: 'Abort',
    icon: 'ban-circle',
    id: 'abort'
  }
];

function getJsonForm(data, name) {
  var form = new FormData();
  var file = new File([JSON.stringify(data)], 'data.json', { type: 'application/json' });
  form.append(name || 'rules', file);
  return form;
}

function readFileJson(file, cb) {
  if (isStr(file)) {
    if (file.length > MAX_OBJECT_SIZE) {
      alertMsg(OBJ_TIPS);
      return cb();
    }
    return cb(parseJSON(file));
  }
  if (!file || !/\.(txt|json|har)$/i.test(file.name)) {
    alertMsg('Supported file formats: .txt, .json, .har');
    return cb();
  }

  if (file.size > MAX_OBJECT_SIZE) {
    alertMsg(OBJ_TIPS);
    return cb();
  }
  readFileAsText(file, function(text) {
    cb(parseJSON(text));
  });
}

function handleImportFile(file, cb, type) {
  readFileJson(file, function(data) {
    if (!data || handleImportData(data, type)) {
      return cb();
    }
    cb(data);
  });
}

function getPageName(options) {
  var hash = location.hash.substring(1);
  if (hash) {
    hash = hash.replace(/[?#].*$/, '');
  } else {
    hash = location.href.replace(/[?#].*$/, '').replace(/.*\//, '');
  }
  if (options.networkMode) {
    return 'network';
  }
  if (options.rulesMode && options.pluginsMode) {
    return 'plugins';
  }
  if (options.rulesOnlyMode) {
    return hash === 'values' ? 'values' : 'rules';
  }
  if (options.rulesMode) {
    return hash === 'network' ? 'rules' : hash;
  }

  if (options.pluginsMode) {
    return hash !== 'plugins' ? 'network' : hash;
  }
  if (isClient && !hash) {
    hash = storage.get('pageName');
    return TABS.indexOf(hash) !== -1 ? hash : 'network';
  }
  return hash;
}

function parseJSON(text) {
  try {
    var obj = JSON.parse(text);
    return util.isObj(obj) ? obj : null;
  } catch (e) {
    showError(e.message);
  }
}

function compareSelectedNames(src, target) {
  var srcLen = src.length;
  var i;
  for (i = 0; i < srcLen; i++) {
    if ($.inArray(src[i], target) === -1) {
      return false;
    }
  }
  var targetLen = target.length;
  if (srcLen !== targetLen) {
    for (i = 0; i < targetLen; i++) {
      if ($.inArray(target[i], src) === -1) {
        return false;
      }
    }
  }
  return true;
}

function getKey(url) {
  if (url.indexOf('{') == 0) {
    var index = url.lastIndexOf('}');
    return index > 1 && url.substring(1, index);
  }

  return false;
}

function getValue(url) {
  if (url.indexOf('(') == 0) {
    var index = url.lastIndexOf(')');
    return (index != -1 && url.substring(1, index)) || '';
  }

  return false;
}

function appendList(list, _list) {
  if (!_list.length) {
    return;
  }
  for (var i = 0, len = list.length; i < len; i++) {
    if (isGroupName(list[i])) {
      _list.unshift(i, 0);
      list.splice.apply(list, _list);
      return;
    }
  }
  list.push.apply(list, _list);
}

function updateData(list, data, modal) {
  var changedList = modal.getChangedList();
  if (!changedList.length) {
    return;
  }
  var hasChanged;
  var _list = [];
  var activeItem;
  changedList.forEach(function(item) {
    var name = item.name;
    var curItem = data[name];
    if (!curItem) {
      data[name] = item;
      _list.push(name);
      if (item.active) {
        activeItem = item;
      }
    } else if (curItem.value != item.value) {
      hasChanged = true;
      data[name] = item;
    }
  });
  appendList(list, _list);
  if (activeItem) {
    list.forEach(function(name) {
      data[name].active = false;
    });
    activeItem.active = true;
  }
  return hasChanged;
}

function getCAType(type) {
  if (type === 'crt' || type === 'pem') {
    return type;
  }
  return 'cer';
}

var Index = React.createClass({
  getInitialState: function () {
    var self = this;
    var modal = self.props.modal;
    var rules = modal.rules;
    var values = modal.values;
    var server = modal.server;
    var caUrlList = [];
    var caHash = util.getCAHash(server, caUrlList);
    var state = {
      filename: '',
      replayCount: 1,
      tabs: [],
      caType: getCAType(storage.get('caType')),
      caHash: caHash,
      caUrlList: caUrlList,
      allowMultipleChoice: modal.rules.allowMultipleChoice,
      backRulesFirst: modal.rules.backRulesFirst,
      networkMode: !!server.networkMode,
      rulesMode: !!server.rulesMode,
      pluginsMode: !!server.pluginsMode,
      rulesOnlyMode: !!server.rulesOnlyMode,
      ndr: server.ndr,
      ndp: server.ndp,
      drb: server.drb,
      drm: server.drm,
      port: server.port,
      whistleId: server.whistleId,
      version: modal.version
    };
    if (hideLeftMenu !== false) {
      hideLeftMenu = hideLeftMenu || server.hideLeftMenu;
    }
    var pageName = getPageName(state);
    if (!pageName || pageName.indexOf('rules') != -1) {
      state.hasRules = true;
      state.name = 'rules';
    } else if (pageName.indexOf('values') != -1) {
      state.hasValues = true;
      state.name = 'values';
    } else if (pageName.indexOf('plugins') != -1) {
      state.hasPlugins = true;
      state.name = 'plugins';
    } else {
      state.hasNetwork = true;
      state.name = 'network';
    }

    var rulesList = [];
    var rulesOptions = [];
    var rulesData = {};
    var valuesList = [];
    var valuesOptions = [];
    var valuesData = {};

    var rulesTheme = storage.get('rulesTheme') || (rules && rules.theme);
    var valuesTheme = storage.get('valuesTheme') || (values && values.theme);
    var rulesFontSize = storage.get('rulesFontSize') || (rules && rules.fontSize);
    var valuesFontSize = storage.get('valuesFontSize') || (values && values.fontSize);
    var showRulesLineNumbers = storage.get('showRulesLineNumbers') || (rules && rules.showLineNumbers);
    var showValuesLineNumbers = storage.get('showValuesLineNumbers') || (values && values.showLineNumbers);
    var autoRulesLineWrapping = storage.get('autoRulesLineWrapping');
    var autoValuesLineWrapping = storage.get('autoValuesLineWrapping');
    var selectedName;

    if (rules) {
      selectedName = storage.get('activeRules');
      var selected = !rules.defaultRulesIsDisabled;
      rulesList.push(DEFAULT);
      rulesData.Default = {
        name: DEFAULT,
        fixed: true,
        value: rules.defaultRules,
        selected: selected,
        isDefault: true,
        active: selectedName === DEFAULT
      };

      rulesOptions.push(rulesData.Default);

      rules.list.forEach(function (item) {
        rulesList.push(item.name);
        item = rulesData[item.name] = {
          name: item.name,
          value: item.data,
          selected: item.selected,
          active: selectedName === item.name
        };
        rulesOptions.push(item);
      });
    }

    if (values) {
      selectedName = storage.get('activeValues');
      values.list.forEach(function (item) {
        valuesList.push(item.name);
        valuesData[item.name] = {
          name: item.name,
          value: item.data,
          active: selectedName === item.name
        };
        valuesOptions.push({
          name: item.name,
          icon: 'edit'
        });
      });
    }
    var rulesModal = new ListModal(rulesList, rulesData);
    var valuesModal = new ListModal(valuesList, valuesData);
    var networkModal = dataCenter.networkModal;
    dataCenter.setValuesModal(valuesModal);
    dataCenter.rulesModal = rulesModal;
    dataCenter.exportSessions = function(sessions, opts, name) {
      var type;
      if (isStr(opts)) {
        type = opts;
      } else if (opts) {
        type = opts.type;
        name = opts.name || name;
      }
      if (type === 'saz' || type === 'fiddler') {
        type = 'Fiddler';
      }
      if (!isStr(name)) {
        name = '';
      }
      self.exportSessions(type, name, sessions);
    };
    state.rulesTheme = rulesTheme;
    state.valuesTheme = valuesTheme;
    state.rulesFontSize = rulesFontSize;
    state.valuesFontSize = valuesFontSize;
    state.showRulesLineNumbers = getBool(showRulesLineNumbers);
    state.showValuesLineNumbers = getBool(showValuesLineNumbers);
    state.autoRulesLineWrapping = !!autoRulesLineWrapping;
    state.foldGutter = storage.get('foldGutter') !== '';
    state.autoValuesLineWrapping = !!autoValuesLineWrapping;
    state.plugins = modal.plugins;
    state.disabledPlugins = modal.disabledPlugins;
    state.disabledAllRules = modal.disabledAllRules;
    state.disabledAllPlugins = modal.disabledAllPlugins;
    state.interceptHttpsConnects = modal.interceptHttpsConnects;
    state.enableHttp2 = modal.enableHttp2;
    state.rules = rulesModal;
    state.network = networkModal;
    state.rulesOptions = rulesOptions;
    state.pluginsOptions = self.createPluginsOptions(modal.plugins);
    dataCenter.valuesModal = state.values = valuesModal;
    state.valuesOptions = valuesOptions;
    dataCenter.syncData = self.syncData;
    dataCenter.syncRules = self.syncRules;
    dataCenter.syncValues = self.syncValues;

    self.initPluginTabs(state, modal.plugins);
    if (rulesModal.exists(dataCenter.activeRulesName)) {
      self.setRulesActive(dataCenter.activeRulesName, rulesModal);
    }
    if (valuesModal.exists(dataCenter.activeValuesName)) {
      self.setValuesActive(dataCenter.activeValuesName, valuesModal);
    }

    state.networkOptions = [
      {
        name: 'Remove All',
        icon: 'remove',
        id: 'removeAll',
        disabled: true,
        title: 'Ctrl[Command] + X'
      },
      {
        name: 'Remove Selected',
        id: 'removeSelected',
        disabled: true,
        title: 'Ctrl[Command] + D'
      },
      {
        name: 'Remove Unselected',
        id: 'removeUnselected',
        disabled: true,
        title: 'Ctrl[Command] + Shift + D'
      },
      {
        name: 'Import',
        icon: 'import',
        id: 'importSessions',
        title: 'Ctrl[Command] + I'
      },
      {
        name: 'Export',
        icon: 'export',
        id: 'exportWhistleFile',
        disabled: true,
        title: 'Ctrl[Command] + S'
      },
      {
        name: 'Show Tree View',
        icon: 'tree-conifer',
        id: 'toggleView'
      }
    ];
    state.helpOptions = [
      {
        name: 'Website',
        href: util.getDocUrl(),
        icon: 'link'
      },
      {
        name: 'GitHub',
        href: GITHUB_URL,
        icon: 'github'
      },
      {
        name: 'Update',
        href: util.UPDATE_URL,
        icon: 'refresh'
      },
      {
        name: 'Issue',
        href: GITHUB_URL + '/issues/new',
        icon: 'record'
      }
    ];
    protocols.setPlugins(state);
    state.exportFileType = storage.get('exportFileType');
    var showLeftMenu = storage.get('showLeftMenu');
    state.showLeftMenu = showLeftMenu == null ? true : showLeftMenu;
    util.triggerPageChange(state.name);
    if (showTreeView || showTreeView === false) {
      networkModal.setTreeView(showTreeView, true);
    }
    addEvent('importSessionsFromUrl', function (_, url) {
      self.importSessionsFromUrl(url);
    });
    return self.updateMenuView(state);
  },
  initPluginTabs: function(state, plugins) {
    plugins = plugins || {};
    var tabs = state.tabs;
    var activeTabs;
    var activeName;
    try {
      activeTabs = JSON.parse(storage.get('activePluginTabList'));
      activeName = storage.get('activePluginTabName');
    } catch (e) {}
    if (!Array.isArray(activeTabs)) {
      return;
    }
    var map = {};
    Object.keys(plugins)
      .forEach(function (name) {
        var plugin = plugins[name];
        name = name.slice(0, -1);
        if (activeTabs.indexOf(name) === -1) {
          return;
        }
        if (activeName === name) {
          state.active = name;
        }
        map[name] = {
          name: name,
          url: plugin.pluginHomepage || 'plugin.' + name + '/'
        };
      });
    activeTabs.forEach(function(name) {
      name = name && map[name];
      name && tabs.push(name);
    });
  },
  getListByName: function (name, type) {
    var list = this.state[name].list;
    var data = this.state[name].data;
    return {
      type: type,
      url: location.href,
      list: list.map(function (name) {
        var item = data[name];
        return {
          name: name,
          value: (item && item.value) || ''
        };
      })
    };
  },
  triggerRulesChange: function (type) {
    triggerChange('rules', this.getListByName('rules', type));
  },
  triggerValuesChange: function (type) {
    triggerChange('values', this.getListByName('values', type));
  },
  syncData: function(plugin, cb) {
    var state = this.state;
    this.refs.syncDialog.show(plugin, state.rules, state.values, cb);
  },
  syncRules: function(plugin) {
    var self = this;
    self.syncData(plugin, function() {
      self.refs.syncDialog.syncRules(plugin);
    });
  },
  syncValues: function(plugin) {
    var self = this;
    self.syncData(plugin, function() {
      self.refs.syncDialog.syncValues(plugin);
    });
  },
  showKVDialog: function(data, isValues) {
    if (data) {
      var self = this;
      var state = self.state;
      self.refs.syncDialog.showKVDialog(data, state.rules, state.values, isValues);
    }
  },
  createPluginsOptions: function (plugins) {
    plugins = plugins || {};
    var pluginsOptions = [
      {
        name: 'Home'
      }
    ];

    Object.keys(plugins)
      .sort(function (a, b) {
        var p1 = plugins[a];
        var p2 = plugins[b];
        return (
          util.compare(p1.priority, p2.priority) ||
          util.compare(p2.mtime, p1.mtime) ||
          (a > b ? 1 : -1)
        );
      })
      .forEach(function (name) {
        var plugin = plugins[name];
        pluginsOptions.push({
          name: name.slice(0, -1),
          icon: 'checkbox',
          mtime: plugin.mtime,
          homepage: plugin.homepage,
          latest: plugin.latest,
          hideLongProtocol: plugin.hideLongProtocol,
          hideShortProtocol: plugin.hideShortProtocol,
          path: plugin.path,
          pluginVars: plugin.pluginVars
        });
      });
    return pluginsOptions;
  },
  reloadRules: function (data, quite) {
    var self = this;
    var selectedName = storage.get('activeRules', true);
    var rulesList = [];
    var rulesData = {};
    rulesList.push(DEFAULT);
    rulesData.Default = {
      name: DEFAULT,
      fixed: true,
      value: data.defaultRules,
      selected: !data.defaultRulesIsDisabled,
      isDefault: true,
      active: selectedName === DEFAULT
    };
    data.list.forEach(function (item) {
      rulesList.push(item.name);
      item = rulesData[item.name] = {
        name: item.name,
        value: item.data,
        selected: item.selected,
        active: selectedName === item.name
      };
    });
    var modal = self.state.rules;
    var changed = quite && updateData(rulesList, rulesData, modal);
    modal.reset(rulesList, rulesData);
    self.setState({});
    return changed;
  },
  reloadValues: function (data, quite) {
    var self = this;
    var selectedName = storage.get('activeValues', true);
    var valuesList = [];
    var valuesData = {};
    data.list.forEach(function (item) {
      valuesList.push(item.name);
      valuesData[item.name] = {
        name: item.name,
        value: item.data,
        active: selectedName === item.name
      };
    });
    var values = self.state.values;
    var changed = quite && updateData(valuesList, valuesData, values);
    values.reset(valuesList, valuesData);
    self.setState({});
    return changed;
  },
  reloadDataQuite: function() {
    this.reloadData(true);
  },
  reloadData: function (quite) {
    var self = this;
    var dialog = $('.w-reload-data-tips').closest('.w-confirm-reload-dialog');
    var name = dialog.find('.w-reload-data-tips').attr('data-name');
    var isRules = name === 'rules';
    quite = quite === true;
    var handleResponse = function (data, xhr) {
      if (!data) {
        !quite && showSysErr(xhr, true);
        return setTimeout(function() {
          trigger(isRules ? 'rulesChanged' : 'valuesChanged', true);
        }, 2000);
      }
      if (isRules) {
        if (self.reloadRules(data, quite)) {
          trigger('rulesChanged', true);
        }
        self.triggerRulesChange('reload');
      } else {
        if (self.reloadValues(data, quite)) {
          trigger('valuesChanged', true);
        }
        self.triggerValuesChange('reload');
      }
    };
    if (isRules) {
      dataCenter.rules.list(handleResponse);
      trigger('reloadRulesRecycleBin');
    } else {
      dataCenter.values.list(handleResponse);
      trigger('reloadValuesRecycleBin');
    }
  },
  showReloadRules: function (force) {
    var self = this;
    if (self.rulesChanged && self.state.name === 'rules') {
      self.rulesChanged = false;
      var hasChanged = self.state.rules.hasChanged();
      self.showReloadDialog(
        'Rules changed. Reload now?',
        hasChanged,
        force
      );
    }
  },
  showReloadValues: function (force) {
    var self = this;
    if (self.valuesChanged && self.state.name === 'values') {
      self.valuesChanged = false;
      var hasChanged = self.state.values.hasChanged();
      self.showReloadDialog(
        'Values changed. Reload now?',
        hasChanged,
        force
      );
    }
  },
  componentDidUpdate: function () {
    this.showReloadRules();
    this.showReloadValues();
  },
  showReloadDialog: function (msg, existsUnsaved, force) {
    var self = this;
    var dialog = self.refs.confirmReload;
    clearTimeout(self.reloadTimer);
    var tips = $('.w-reload-data-tips');
    tips.attr('data-name', self.state.name);
    if (!force && !dialog.isVisible()) {
      self.reloadTimer = setTimeout(self.reloadDataQuite, 1000);
      return;
    }
    dialog.show();
    if (existsUnsaved) {
      msg +=
        '<p class="w-confim-reload-note">Warning: Unsaved changes will be lost</p>';
    }
    tips.html(msg);
  },
  showTab: function() {
    var self = this;
    var pageName = getPageName(self.state);
    if (!pageName || pageName.indexOf('rules') != -1) {
      self.showRules();
    } else if (pageName.indexOf('values') != -1) {
      self.showValues();
    } else if (pageName.indexOf('plugins') != -1) {
      self.showPlugins();
    } else {
      self.showNetwork();
    }
    storage.set('pageName', pageName || '');
  },
  switchTab: function(isBack) {
    var self = this;
    var name = self.state.name;
    var tabs = [];
    if (!self.hideNetwork) {
      tabs.push('network');
    }
    if (!self.hideRules) {
      tabs.push('rules');
    }
    if (!self.hideValues) {
      tabs.push('values');
    }
    if (!self.hidePlugins) {
      tabs.push('plugins');
    }
    var index = tabs.indexOf(name);
    var len = tabs.length;
    if (isBack) {
      index = index - 1;
      if (index < 0) {
        index = len - 1;
      }
    } else {
      index = index + 1;
      if (index >= len) {
        index = 0;
      }
    }
    switch (tabs[index]) {
    case 'network':
      self.showNetwork();
      break;
    case 'rules':
      self.showRules();
      break;
    case 'values':
      self.showValues();
      break;
    case 'plugins':
      self.showPlugins();
      break;
    }
  },
  onCloseChooseFileTypeDialog: function() {
    this.setState({ selectedSessions: null });
  },
  componentDidMount: function () {
    var self = this;
    var clipboard = new Clipboard('.w-copy-text');

    clipboard.on('error', function (e) {
      alertMsg('Copy failed');
    });
    clipboard = new Clipboard('.w-copy-text-with-tips');
    clipboard.on('error', function (e) {
      showError('Copy failed');
    });
    clipboard.on('success', function (e) {
      showSucc('Copied clipboard');
    });
    addEvent('showRulesDialog', function(_, data) {
      if (data && !self.isHideRules()) {
        self.refs.rulesDialog.show(data.rules, data.values, data.filename);
      }
    });
    addEvent('showAddRulesDialog', self.showAddRulesDialog);
    addEvent('showTestRuleDialog', function(_, data) {
      self.refs.testRuleDialog.show(data);
    });
    addEvent('changeRecordState', function (_, type) {
      self.setState({ record: type }, self.updateList);
    });
    addEvent('showHttpsSettingsDialog', self.showHttpsSettingsDialog);

    if (isClient) {
      var findEditor = function(keyword, prev) {
        dataCenter.editorMatchedCount = 0;
        trigger(prev ? 'findEditorPrev' : 'findEditorNext', keyword);
        return dataCenter.editorMatchedCount;
      };
      window.__findWhistleCodeMirrorEditor_ = findEditor;
    }

    var composerDidMount;
    var composerData;

    util.one('networkDidMount', function() {
      composerData && trigger('showComposerTab');
    });

    util.one('composerDidMount', function() {
      composerDidMount = true;
      if (composerData) {
        trigger('_setComposerData', composerData);
        composerData = null;
      }
    });

    addEvent('showCopyEditor', function (_, data) {
      self.refs.editorDialog.show({ value: util.getText(data) });
    });

    addEvent('showPluginOptionTab', function(_, plugin) {
      plugin && self.showPluginTab(getSimplePluginName(plugin));
    });

    addEvent('disablePlugin', function(_, plugin, disabled) {
      self.setPluginState(getSimplePluginName(plugin), disabled);
    });

    addEvent('setComposerData', function(_, data) {
      if (!data || self.state.rulesMode) {
        return;
      }
      confirmMsg(CMF_CHG_MSG + 'the composer\'s data?', function(sure) {
        if (sure) {
          if (composerDidMount) {
            trigger('_setComposerData', data);
          } else {
            composerData = data;
          }
        }
      });
    });

    addEvent('showPluginOption', function(_, plugin) {
      if (!plugin) {
        return;
      }
      var name = getSimplePluginName(plugin);
      var homepage = plugin.pluginHomepage;
      var url =  homepage || 'plugin.' + name + '/';
      if ((homepage || plugin.openExternal) && !plugin.openInPlugins && !plugin.openInModal) {
        return window.open(url);
      }
      var modal = plugin.openInModal || plugin.openInDialog || '';
      if (modal && !homepage) {
        url += '?openInModal=5b6af7b9884e1165';
      }
      self.refs.iframeDialog.show({
        favicon: util.getPluginIcon(plugin),
        name: name,
        url: url,
        homepage: plugin.homepage,
        disabled: util.pluginIsDisabled(self.state, name),
        width: modal.width,
        height: modal.height
      });
    });
    addEvent('hidePluginOption', function() {
      self.refs.iframeDialog.hide();
    });

    addEvent('download', function(_, data) {
      self.download(data);
    });
    addEvent('enableRecord', function () {
      self.enableRecord();
    });
    addEvent('showJsonViewDialog', function(_, data, keyPath, session) {
      self.refs.jsonDialog.show(data, keyPath, session);
    });
    addEvent('rulesChanged', function (_, force) {
      self.rulesChanged = true;
      self.showReloadRules(force === true);
    });
    addEvent('switchTreeView', function () {
      self.toggleTreeView();
    });
    addEvent('updateGlobal', function () {
      self.setState({});
    });
    addEvent('valuesChanged', function (_, force) {
      self.valuesChanged = true;
      self.showReloadValues(force === true);
    });
    addEvent('showNetwork', function () {
      self.showNetwork();
    });
    addEvent('showRules', function (_, name) {
      self.showRules();
      if (name && self.state.rules.exists(name)) {
        trigger('expandRulesGroup', name);
        self.setRulesActive(name);
      }
    });
    addEvent('showValues', function () {
      self.showValues();
    });
    addEvent('showPlugins', function (_, name) {
      if (notEStr(name)) {
        self.setState({ active: 'Home' });
        setTimeout(function() {
          trigger('highlightPlugin', name);
        }, 600);
      }
      self.showPlugins();
    });
    addEvent('disableAllPlugins', self.disableAllPlugins);
    addEvent('disableAllRules', self.disableAllRules);
    addEvent('activeRules', function () {
      var rulesModal = dataCenter.rulesModal;
      var activeName = dataCenter.activeRulesName;
      if (rulesModal.exists(activeName)) {
        self.setRulesActive(activeName, rulesModal);
        self.setState({});
      }
    });

    addEvent('activeValues', function () {
      var valuesModal = dataCenter.valuesModal;
      var activeName = dataCenter.activeValuesName;
      if (valuesModal.exists(activeName)) {
        self.setValuesActive(activeName, valuesModal);
        self.setState({});
      }
    });
    var editorWin;
    addEvent('openEditor', function(_, text) {
      if (storage.get('viewAllInNewWindow') === '1') {
        text = text || '';
        var url = util.getOpenUrl();
        if (url) {
          return window.open(url.replace('{WHISTLE_DATA}', encodeURIComponent(text)));
        }
        return util.openInNewWin(text);
      }
      try {
        if (editorWin && isFunc(editorWin.setValue)) {
          window.getTextFromWhistle_ = null;
          self.refs.editorWin.show();
          return editorWin.setValue(text);
        }
        window._initWhistleTextEditor_ = function(win) {
          editorWin = win;
          editorWin.setValue(text);
        };
        self.refs.editorWin.show('editor.html');
      } catch (e) {}
    });
    addEvent('openUrl', function (_, url) {
      self.refs.innerWin.show(url);
    });

    var updateTimer;
    addEvent('updateUIThrottle', function() {
      if (updateTimer) {
        return;
      }
      updateTimer = setTimeout(function() {
        updateTimer = null;
        self.setState({});
      }, 200);
    });

    addEvent('addNewRulesFile', function(_, data) {
      var filename = data.filename;
      var modal = self.state.rules;
      var item = modal.add(filename, data.data);
      modal.setChanged(filename, false);
      self.setRulesActive(filename);
      self.setState({ activeRules: item });
      if (!data.update) {
        self.triggerRulesChange('create');
      }
    });
    addEvent('addNewValuesFile', function(_, data) {
      var filename = data.filename;
      var modal = self.state.values;
      var item = modal.add(filename, data.data);
      modal.setChanged(filename, false);
      if (data.update) {
        self.setState({});
      } else {
        self.setValuesActive(filename);
        self.setState({ activeValues: item });
        self.triggerValuesChange('create');
      }
    });

    addEvent('recoverRules', function (_, data) {
      var modal = self.state.rules;
      var filename = data.filename;
      var handleRecover = function (sure) {
        if (!sure) {
          return;
        }
        dataCenter.rules.add(
          {
            name: filename,
            value: data.data,
            recycleFilename: data.name
          },
          function (result, xhr) {
            if (result && result.ec === 0) {
              var item = modal.add(filename, data.data);
              self.setRulesActive(filename);
              self.setState({ activeRules: item });
              self.triggerRulesChange('create');
              trigger('rulesRecycleList', result);
              trigger('focusRulesList');
            } else {
              showSysErr(xhr);
            }
          }
        );
      };
      if (!modal.exists(filename)) {
        return handleRecover(true);
      }
      confirmMsg(
        getExistsTips(filename) + '. Overwrite?',
        handleRecover
      );
    });

    addEvent('recoverValues', function (_, data) {
      var modal = self.state.values;
      var filename = data.filename;
      var handleRecover = function (sure) {
        if (!sure) {
          return;
        }
        dataCenter.values.add(
          {
            name: filename,
            value: data.data,
            recycleFilename: data.name
          },
          function (result, xhr) {
            if (result && result.ec === 0) {
              var item = modal.add(filename, data.data);
              self.setValuesActive(filename);
              self.setState({ activeValues: item });
              self.triggerValuesChange('create');
              trigger('valuesRecycleList', result);
            } else {
              showSysErr(xhr);
            }
          }
        );
      };
      if (!modal.exists(filename)) {
        return handleRecover(true);
      }
      confirmMsg(
        'The name \'' + filename + '\' is already in use. Overwrite?',
        handleRecover
      );
    });
    addEvent('networkImportFile', function (_, file) {
      self.uploadSessionsForm(file);
    });
    addEvent('networkImportData', function (_, data) {
      self.importAnySessions(data);
    });
    addEvent('rulesImportFile', function (_, file) {
      handleImportFile(file, self.handleImportRules);
    });
    addEvent('rulesImportData', function (_, data) {
      self.handleImportRules(data);
    });
    addEvent('valuesImportFile', function (_, file) {
      handleImportFile(file, self.handleImportValues);
    });
    addEvent('valuesImportData', function (_, data) {
      self.handleImportValues(data);
    });
    addEvent('networkSettingsImportFile composerImportFile rulesSettingsImportFile valuesSettingsImportFile', function (e, file) {
      handleImportFile(file, util.noop, e.type);
    });
    addEvent('networkSettingsImportData composerImportData rulesSettingsImportFile valuesSettingsImportFile', function (_, data) {
      handleImportData(data);
    });
    addEvent('setRulesSettings', function (_, data) {
      if (!data) {
        return;
      }
      confirmMsg(CMF_CHG_MSG + 'the rules settings?', function(sure) {
        if (sure) {
          self.setState({
            rulesTheme: data.theme,
            rulesFontSize: data.fontSize,
            showRulesLineNumbers: data.lineNumbers,
            autoRulesLineWrapping: data.autoLineWrapping
          });
          storage.set('rulesTheme', trimStr(data.theme).substring(0, 30));
          storage.set('rulesFontSize', trimStr(data.fontSize).substring(0, 30));
          storage.set('showRulesLineNumbers', !!data.lineNumbers);
          storage.set('autoRulesLineWrapping', data.autoLineWrapping ? '1' : '');
          self.setMultipleCohice(data.allowMultipleChoice);
          self.setBackRulesFirst(data.backRulesFirst);
        }
      });
    });
    addEvent('setValuesSettings', function (_, data) {
      if (!data) {
        return;
      }
      confirmMsg(CMF_CHG_MSG + 'the values settings?', function(sure) {
        if (sure) {
          self.setState({
            valuesTheme: data.theme,
            valuesFontSize: data.fontSize,
            showValuesLineNumbers: data.lineNumbers,
            autoValuesLineWrapping: data.autoLineWrapping,
            foldGutter: data.foldGutter
          });
          storage.set('valuesTheme', trimStr(data.theme).substring(0, 30));
          storage.set('valuesFontSize', trimStr(data.fontSize).substring(0, 10));
          storage.set('showValuesLineNumbers', !!data.lineNumbers);
          storage.set('autoValuesLineWrapping', data.autoLineWrapping ? '1' : '');
          storage.set('foldGutter', data.foldGutter ? '1' : '');
        }
      });
    });

    $(document)
      .on('dragleave', preventBlur)
      .on('dragenter', preventBlur)
      .on('dragover', preventBlur)
      .on('drop', function (e) {
        preventBlur(e);
        var files = e.originalEvent.dataTransfer.files;
        var file = files && files[0];
        if (!file) {
          return;
        }
        var target = e.target;
        if (target.nodeName === 'TEXTAREA') {
          target.readOnly = true;
          setTimeout(function() {
            target.readOnly = false;
          }, 0);
        }
        var $target = $(target);
        var iframe = $target.closest('.w-fix-drag').find('iframe')[0];
        if (iframe) {
          try {
            var win = iframe.contentWindow;
            if (win && isFunc(win.onWhistleFileDrop)) {
              return win.onWhistleFileDrop(file);
            }
          } catch (e) {
            console.error(e); // eslint-disable-line
          }
        }
        if ($('.w-show-upload-temp-file.in').length) {
          return trigger('uploadTempFile', file);
        }
        if ($('.w-import-dialog.in').length) {
          return trigger('importFile', file);
        }
        var name = self.state.name;
        var filename = file.name;
        if (name === 'network') {
          if ($target.closest('.w-frames-com').length) {
            return;
          }
          if (/\.log$/i.test(filename)) {
            if (file.size > MAX_LOG_SIZE) {
              return alertMsg(EXCEED_TIPS + ' 2MB');
            }
            readFileAsText(file, function (logs) {
              logs = util.parseLogs(logs);
              logs && trigger('showLog', { logs: logs });
            });
            return;
          }
          return self.uploadSessionsForm(file);
        }
        handleImportFile(file, function(json) {
          if (json) {
            if (name === 'rules') {
              self.handleImportRules(json);
            } else if (name === 'values') {
              self.handleImportValues(json);
            }
          }
        });
      })
      .on('keyup', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.keyCode === 82) {
          !isClient && preventBlur(e);
        } else if (e.keyCode === 191) {
          var name = self.state.name;
          var nodeName = document.activeElement && document.activeElement.nodeName;
          if (nodeName !== 'INPUT' && nodeName !== 'TEXTAREA' && !$('.modal.in').length) {
            if (name === 'network') {
              if (!hasShortcut('focusNetworkSearchBox')) {
                return;
              }
              trigger('focusNetworkFilterInput');
            } else if (name === 'rules') {
              if (!hasShortcut('focusRulesSearchBox')) {
                return;
              }
              trigger('focusRulesFilterInput');
            } else if (name === 'values') {
              if (!hasShortcut('focusValuesSearchBox')) {
                return;
              }
              trigger('focusValuesFilterInput');
            }
          }
        }
      })
      .on('contextmenu', '.w-textarea-bar', preventBlur);
    var removeItem = function (e) {
      var target = e.target;
      if (
        target.nodeName == 'A' &&
        $(target).parent().hasClass('w-list-data')
      ) {
        self.state.name == 'rules' ? self.removeRules() : self.removeValues();
      }
      preventBlur(e);
    };

    $(window)
      .on('hashchange', self.showTab)
      .on('keyup', function (e) {
        if (e.keyCode == 27) {
          self.setMenuOptionsState();
          var dialog = $('.modal');
          if (isFunc(dialog.modal)) {
            dialog.modal('hide');
          }
        }
      })
      .on('keydown', function (e) {
        var name = self.state.name;
        var code = e.keyCode;
        code == 46 && removeItem(e);
        if (!e.ctrlKey && !e.metaKey) {
          if (code === 112) {
            preventBlur(e);
            window.open(util.getDocUrl('gui/' + name + '.html'));
          } else if (code === 116) {
            preventBlur(e);
          }
          return;
        }
        var isBack = code === 37;
        if (isBack || code === 39) {
          if (!hasShortcut(isBack ? 'switchTabReverse' : 'switchTab')) {
            return;
          }
          self.switchTab(isBack);
          return preventBlur(e);
        }
        if (code === 79) {
          if (name === 'network') {
            if (!hasShortcut('toggleNetworkState')) {
              return;
            }
            trigger('toggleNetworkState');
          } else if (name === 'rules') {
            if (!hasShortcut('toggleRules')) {
              return;
            }
            self.confirmDisableAllRules();
          } else if (name === 'plugins') {
            if (!hasShortcut('togglePlugins')) {
              return;
            }
            self.confirmDisableAllPlugins();
          }
          preventBlur(e);
        } else if (code === 76) {
          if (name === 'network') {
            if (!hasShortcut('toggleNetworkPanelLayout')) {
              return;
            }
            trigger('toggleNetworkDock');
          } else if (name === 'rules') {
            if (!hasShortcut('toggleRulesNum')) {
              return;
            }
            trigger('toggleRulesLineNumbers');
          } else if (name === 'values') {
            if (!hasShortcut('toggleValuesNum')) {
              return;
            }
            trigger('toggleValuesLineNumbers');
          }
          preventBlur(e);
        } else if (code === 82) {
          !isClient && preventBlur(e);
        } else if (code === 77) {
          self.toggleLeftMenu();
          preventBlur(e);
        } else if (code === 66) {
          if (!hasShortcut('switchNetworkView')) {
            return;
          }
          self.toggleTreeView();
          preventBlur(e);
          trigger('toggleTreeViewByAccessKey');
          return;
        }
        var isNetwork = name === 'network';
        if (isNetwork && code == 88) {
          if (
            !util.isFocusEditor() &&
            !$(e.target).closest('.w-frames-list').length &&
            hasShortcut('clearNetworkSessions')
          ) {
            self.clear();
          }
          return;
        }
        if (code == 68) {
          if (!hasShortcut(isNetwork ? 'removeNetworkSessions' : name === 'rules' ? 'removeRules' : 'removeValues')) {
            return;
          }
          return removeItem(e);
        }
        var modal = self.state.network;
        if (isNetwork && (code === 83 || code === 69)) {
          if (code === 83) {
            if (!hasShortcut('saveNetwork')) {
              return;
            }
            preventBlur(e);
            util.noModal() && trigger('saveSessions');
            return;
          }
          preventBlur(e);
          if (!util.noModal()) {
            if (self.refs.chooseFileType.isVisible()) {
              self.exportBySave();
            }
            return;
          }
          var nodeName = e.target.nodeName;
          if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
            return;
          }
          var hasSelected = modal.hasSelected();
          if (hasSelected) {
            self.showChooseFileType();
          }
          return;
        }
        if (code === 69) {
          if (!hasShortcut(isNetwork ? 'exportNetwork' : name === 'rules' ? 'exportRules' : 'exportValues')) {
            return;
          }
          preventBlur(e);
          return util.noModal() && self.exportData();
        }
        if (code === 190) {
          if (!hasShortcut(isNetwork ? 'openNetworkSettings' : name === 'rules' ? 'openRulesSettings' : 'openValuesSettings')) {
            return;
          }
          self.showSettings();
          return preventBlur(e);
        }
        var isService = code === 74;
        if (isService || code === 73) {
          if (util.noModal()) {
            if (isService) {
              if (!dataCenter.whistleId || !hasShortcut('openService')) {
                return;
              }
              self.showService();
            } else if (isNetwork || name === 'rules' || name === 'values') {
              if (!hasShortcut(isNetwork ? 'importNetwork' : name === 'rules' ? 'importRules' : 'importValues')) {
                return;
              }
              self.importData();
            } else if (name === 'plugins') {
              if (!hasShortcut('openInstallPlugins')) {
                return;
              }
              trigger('installPlugins');
            }
          }
          preventBlur(e);
        }
      });

    function getKey(url) {
      if (!(url = url && url.trim())) {
        return;
      }

      var index = url.indexOf('://') + 3;
      url = index != -1 ? url.substring(index) : url;
      if (url.indexOf('{') !== 0) {
        return;
      }

      index = url.lastIndexOf('}');
      return index > 1 ? url.substring(1, index) : null;
    }

    var isEditor = function () {
      var name = self.state.name;
      return name === 'rules' || name === 'values';
    };

    $(document.body)
      .on('mouseenter', LINK_SELECTOR, function (e) {
        if (!isEditor() || !(e.ctrlKey || e.metaKey)) {
          return;
        }
        var elem = $(this);
        var text;
        if (
          elem.hasClass('cm-js-http-url') ||
          elem.hasClass('cm-string') ||
          elem.hasClass('cm-js-at') ||
          elem.hasClass('cm-js-weinre') ||
          (!self.hideNetwork && elem.hasClass('cm-js-log')) ||
          TEMP_LINK_RE.test(text = elem.text()) ||
          isTextFile(text) ||
          getKey(text)
        ) {
          elem.addClass('w-is-link');
        }
      })
      .on('mouseleave', LINK_SELECTOR, function (e) {
        $(this).removeClass('w-is-link');
      })
      .on('mousedown', LINK_SELECTOR, function (e) {
        if (!isEditor() || !(e.ctrlKey || e.metaKey)) {
          return;
        }
        var elem = $(this);
        var text = elem.text();
        if (elem.hasClass('cm-js-at')) {
          if (AT_LINK_RE.test(text)) {
            window.open((RegExp.$1 || 'http:') + RegExp.$2);
          }
          return;
        }
        if (elem.hasClass('cm-string')) {
          if (LINK_RE.test(text)) {
            window.open((RegExp.$1 || 'http:') + RegExp.$2);
          }
          return;
        }
        if (elem.hasClass('cm-js-weinre')) {
          return self.openWeinre(removeProtocol(text));
        }
        if (elem.hasClass('cm-js-log')) {
          return self.openLog(removeProtocol(text));
        }
        if (elem.hasClass('cm-js-http-url')) {
          if (!/^https?:\/\//i.test(text)) {
            text = 'http:' + (text[0] === '/' ? '' : '//') + text;
          }
          window.open(text);
          return;
        }
        if (TEMP_LINK_RE.test(text) || (isTextFile(text) && FILE_PATH_RE.test(text))) {
          var tempFile = RegExp.$1;
          return self.showEditorDialog([{
            ruleName: self.getActiveRuleName(),
            tempFile: tempFile
          }, elem]);
        } else {
          var name = getKey(text);
          if (name) {
            var activeRule = self.state.rules.getActive();
            var rulesText = activeRule && activeRule.value;
            var values = {};
            util.resolveInlineValues(rulesText, values);
            if (values[name] == null) {
              return self.showEditorDialog({ name: name });
            }
            return confirmMsg('The value of \'' + name + '\' is stored in this rule file and cannot be synced if edited via the Values\'s editor. Continue?', function (sure) {
              if (sure) {
                self.showEditorDialog({ name: name });
              }
            });
          }
        }
      });

    if (self.state.name == 'network') {
      self.startLoadData(true);
    }
    dataCenter.on('settings', function (data) {
      var state = self.state;
      var server = data.server;
      var hasChanged = state.whistleId !== server.whistleId;
      if (hasChanged) {
        state.whistleId = server.whistleId;
      }
      var caUrlList = [];
      var caHash = util.getCAHash(server, caUrlList);
      if (caHash !== state.caHash) {
        state.caHash = caHash;
        state.caUrlList = caUrlList;
        hasChanged = true;
      }
      if (
        state.interceptHttpsConnects !== data.interceptHttpsConnects ||
        state.enableHttp2 !== data.enableHttp2 ||
        state.disabledAllRules !== data.disabledAllRules ||
        state.allowMultipleChoice !== data.allowMultipleChoice ||
        state.disabledAllPlugins !== data.disabledAllPlugins ||
        state.backRulesFirst !== data.backRulesFirst ||
        state.ndp != server.ndp ||
        state.ndr != server.ndr ||
        state.drb != server.drb ||
        state.drm != server.drm ||
        state.port != server.port
      ) {
        state.interceptHttpsConnects = data.interceptHttpsConnects;
        state.enableHttp2 = data.enableHttp2;
        state.disabledAllRules = data.disabledAllRules;
        state.allowMultipleChoice = data.allowMultipleChoice;
        state.backRulesFirst = data.backRulesFirst;
        state.disabledAllPlugins = data.disabledAllPlugins;
        state.ndp = server.ndp;
        state.ndr = server.ndr;
        state.drb = server.drb;
        state.drm = server.drm;
        state.port = server.port;
        protocols.setPlugins(state);
        var list = LEFT_BAR_MENUS;
        list[3].checked = !state.disabledAllRules;
        list[4].checked = !state.disabledAllPlugins;
        self.refs.contextMenu.update();
        return self.setState({});
      }
      if (hasChanged) {
        self.setState({});
      }
    });
    dataCenter.on('rules', function (data) {
      var modal = self.state.rules;
      var newSelectedNames = data.list;
      if (
        !data.defaultRulesIsDisabled &&
        newSelectedNames.indexOf('Default') === -1
      ) {
        newSelectedNames.unshift('Default');
      }
      var selectedNames = modal.getSelectedNames();
      if (compareSelectedNames(selectedNames, newSelectedNames)) {
        return;
      }
      self.reselectRules(data, true);
      self.setState({});
    });
    dataCenter.on('serverInfo', function (data) {
      self.serverInfo = data;
    });

    addEvent('autoRefreshNetwork', function () {
      !self.state.network.isTreeView && self.autoRefresh && self.autoRefresh();
    });

    var getFocusItemList = function (curItem) {
      if (Array.isArray(curItem)) {
        return curItem;
      }
      if (!curItem || curItem.selected) {
        return;
      }
      return [curItem];
    };

    addEvent('updateUI', function () {
      self.setState({});
    });

    addEvent('replaySessions', function (e, curItem, shiftKey) {
      var modal = self.state.network;
      var list = getFocusItemList(curItem) || modal.getSelectedList();
      var len = list && list.length;
      if (shiftKey && len === 1) {
        self.replayList = list;
        self.refs.setReplayCount.show();
        setTimeout(function () {
          var input = findDOMNode(self.refs.replayCount);
          input.select();
          input.focus();
        }, 300);
        return;
      }
      self.replay(e, list);
    });
    addEvent('filterSessions', self.showSettings);
    addEvent('exportSessions', function (e, curItem, filename) {
      self.exportData(e, getFocusItemList(curItem), filename);
    });
    addEvent('abortRequest', function (e, curItem) {
      self.abort(getFocusItemList(curItem));
    });
    addEvent('removeIt', function (e, item) {
      var modal = self.state.network;
      if (item && modal) {
        modal.remove(item);
        self.setState({});
      }
    });
    addEvent('removeOthers', function (e, item) {
      var modal = self.state.network;
      if (item && modal) {
        if (item.selected) {
          modal.removeUnselectedItems();
        } else {
          modal.removeOthers(item);
        }
        self.setState({});
      }
    });
    addEvent('clearAll', self.clear);
    addEvent('removeSelected', function () {
      var modal = self.state.network;
      if (modal) {
        modal.removeSelectedItems();
        self.setState({});
      }
    });
    addEvent('removeUnselected', function () {
      var modal = self.state.network;
      if (modal) {
        modal.removeUnselectedItems();
        self.setState({});
      }
    });
    addEvent('removeUnmarked', function () {
      var modal = self.state.network;
      if (modal) {
        modal.removeUnmarkedItems();
        self.setState({});
      }
    });
    addEvent('saveRules', function (e, item) {
      if (item.changed || !item.selected) {
        var list = self.state.rules.getChangedGroupList(item);
        list.forEach(self.selectRules);
      } else {
        self.unselectRules(item);
      }
    });
    addEvent('saveValues', function (e, item) {
      var list = self.state.values.getChangedGroupList(item);
      list.forEach(self.saveValues);
    });
    addEvent('renameRules', function (e, item) {
      self.showEditRules(item);
    });
    addEvent('renameValues', function (e, item) {
      self.showEditValues(item);
    });
    addEvent('deleteRules', function (e, item) {
      setTimeout(function () {
        self.removeRules(item);
      }, 0);
    });
    addEvent('deleteValues', function (e, item) {
      setTimeout(function () {
        self.removeValues(item);
      }, 0);
    });
    addEvent('createRules', self.showCreateRules);
    addEvent('createValues', self.showCreateValues);
    addEvent('showImportDialog', function (_, name) {
      self.refs.importDialog.show(name || self.state.name);
    });
    addEvent('showExportDialog', function (_, name, data) {
      self.refs.exportDialog.show(name || self.state.name, data);
    });
    addEvent('exportData', self.exportData);
    addEvent('handleImportRules', function(_, data) {
      self.handleImportRules(data);
    });
    addEvent('handleImportValues', function(_, data) {
      self.handleImportValues(data);
    });
    addEvent('uploadRules', function (_, data) {
      var form = getJsonForm(data);
      form.append('replaceAll', '1');
      dataCenter.upload.importRules(form, function (data, xhr) {
        if (!data) {
          showSysErr(xhr);
        } else if (data.ec === 0) {
          self.reloadRules(data);
          showSucc('Rules imported successfully');
        } else {
          alertMsg(data.em);
        }
      });
    });
    addEvent('uploadValues', function (_, data) {
      var form = getJsonForm(data, 'values');
      form.append('replaceAll', '1');
      dataCenter.upload.importValues(form, function (data, xhr) {
        if (!data) {
          showSysErr(xhr);
        }
        if (data.ec === 0) {
          self.reloadValues(data);
          showSucc('Values imported successfully');
        } else {
          alertMsg(data.em);
        }
      });
    });
    var timeout;
    var hidden = document.hidden;
    var isAtBottom; // 记录 visibilitychange 之前的状态
    $(document).on('visibilitychange', function () {
      clearTimeout(timeout);
      var isNetwork = self.state.name === 'network';
      if (document.hidden || !isNetwork) {
        if (isNetwork && hidden !== document.hidden) {
          hidden = true;
          isAtBottom = self.scrollerAtBottom && self.scrollerAtBottom();
        }
        return;
      }
      hidden = false;
      timeout = setTimeout(function () {
        var atBottom = isAtBottom || self.scrollerAtBottom && self.scrollerAtBottom();
        isAtBottom = false;
        self.setState({}, function () {
          atBottom && self.autoRefresh();
        });
      }, 100);
    });

    setTimeout(function () {
      dataCenter.checkUpdate(function (data) {
        if (data && data.showUpdate) {
          self.setState(
            {
              version: data.version,
              latestVersion: data.latestVersion
            },
            function () {
              self.refs.showUpdateTipsDialog.show();
            }
          );
        }
      });
    }, 10000);

    dataCenter.getLogIdOptions = function(id) {
      var list = self.getLogIdListFromRules() || [];
      var map = {};
      list = list.map(function (id) {
        map[id] = true;
        return {
          value: id,
          text: id
        };
      });
      list.unshift({
        value: '',
        text: 'All Logs'
      });
      return {
        logIdList: list,
        logId: !id || !map[id] ? '' : id
      };
    };
    dataCenter.importAnySessions = self.importAnySessions;
    dataCenter.on('plugins', function (data) {
      var pluginsOptions = self.createPluginsOptions(data.plugins);
      var oldPluginsOptions = self.state.pluginsOptions;
      var oldDisabledPlugins = self.state.disabledPlugins;
      var disabledAllPlugins = self.state.disabledAllPlugins;
      var disabledPlugins = data.disabledPlugins;
      if (
        disabledAllPlugins == data.disabledAllPlugins &&
        pluginsOptions.length == oldPluginsOptions.length
      ) {
        var hasUpdate;
        for (var i = 0, len = pluginsOptions.length; i < len; i++) {
          var plugin = pluginsOptions[i];
          var oldPlugin = oldPluginsOptions[i];
          if (
            plugin.name != oldPlugin.name ||
            plugin.latest !== oldPlugin.latest ||
            plugin.mtime != oldPlugin.mtime || // 判断时间即可
            oldDisabledPlugins[plugin.name] != disabledPlugins[plugin.name] ||
            plugin.hideLongProtocol != oldPlugin.hideLongProtocol ||
            plugin.hideShortProtocol != oldPlugin.hideShortProtocol ||
            plugin.path != oldPlugin.path
          ) {
            hasUpdate = true;
            break;
          }
        }
        if (!hasUpdate) {
          return;
        }
      }
      var oldPlugins = self.state.plugins;
      if (oldPlugins && data.plugins) {
        Object.keys(data.plugins).forEach(function(name) {
          var oldP = oldPlugins[name];
          if (oldP) {
            var p = data.plugins[name];
            p.selectedRulesHistory = oldP.selectedRulesHistory;
            p.selectedValuesHistory = oldP.selectedValuesHistory;
          }
        });
      }
      var pluginsState = {
        plugins: data.plugins,
        disabledPlugins: data.disabledPlugins,
        pluginsOptions: pluginsOptions,
        disabledAllPlugins: data.disabledAllPlugins
      };
      protocols.setPlugins(pluginsState);
      self.setState(pluginsState);
    });
    try {
      var onReady = window.parent.onWhistleReady;
      if (isFunc(onReady)) {
        var selectItem = function(item) {
          var modal = item && self.state.network;
          var index = modal && modal.getList().indexOf(item);
          if (index >= 0) {
            trigger('selectedIndex', index);
          }
        };
        var selectIndex = function (index) {
          trigger('selectedIndex', index);
        };
        onReady({
          url: location.href,
          pageId: dataCenter.getPageId(),
          compose: dataCenter.compose,
          createComposeInterrupt: dataCenter.createComposeInterrupt,
          importSessions: self.importAnySessions,
          importHarSessions: self.importHarSessions,
          clearSessions: self.clear,
          selectIndex: selectIndex,
          selectItem: selectItem,
          setActive: function(item) {
            if (item >= 0) {
              selectIndex(item);
            } else {
              selectItem(item);
            }
          }
        });
      }
    } catch (e) {}
    self.handleDataUrl(dataUrl || util.getDataUrl());
    dataCenter.handleDataUrl = self.handleDataUrl;
    dataUrl = null;

    var INTERVAL = 6000;
    var curNetworkSettings;
    var curRulesSettings;
    var curValuesSettings;
    var curWhistleId;
    var saveSettings = function () {
      if (!dataCenter.whistleId) {
        curNetworkSettings = curRulesSettings = curValuesSettings = null;
        return setTimeout(saveSettings, INTERVAL);
      }
      if (curWhistleId !== dataCenter.whistleId) {
        curNetworkSettings = curRulesSettings = curValuesSettings = null;
        curWhistleId = dataCenter.whistleId;
      }
      var networkSettings = JSON.stringify(self.refs.networkSettings.getSettings());
      var rulesSettings = JSON.stringify(self.getRulesSettings());
      var valuesSettings = JSON.stringify(self.getValuesSettings());
      var data;
      if (curNetworkSettings !== networkSettings) {
        data = { networkSettings: networkSettings };
      }
      if (curRulesSettings !== rulesSettings) {
        data = data || {};
        data.rulesSettings = rulesSettings;
      }
      if (curValuesSettings !== valuesSettings) {
        data = data || {};
        data.valuesSettings = valuesSettings;
      }
      if (!data) {
        return setTimeout(saveSettings, INTERVAL);
      }
      data.type = 'settings';
      dataCenter.saveToService(data, function (result) {
        setTimeout(saveSettings, INTERVAL);
        if (result && result.ec === 0) {
          curValuesSettings = valuesSettings;
          curRulesSettings = rulesSettings;
          curNetworkSettings = networkSettings;
        }
      });
    };
    setTimeout(saveSettings, INTERVAL);
  },
  showAddRulesDialog: function(_, data, item) {
    this.refs.addRulesDialog.show(data, item && item.name);
  },
  showEditorDialog: function(options) {
    if (options && options.target) {
      options = null;
    }
    trigger('showEditorDialog', options);
  },
  shouldComponentUpdate: function (_, nextSate) {
    var self = this;
    var name = self.state.name;
    if (name === 'network' && nextSate.name !== name) {
      self._isAtBottom = self.scrollerAtBottom && self.scrollerAtBottom();
    }
    return true;
  },
  openEditorInNewWin: function (editorWin) {
    try {
      util.openInNewWin(editorWin.getEditorValue() || '');
    } catch (e) {}
  },
  handleDataUrl: function(url) {
    if (url = trimStr(url)) {
      var self = this;
      dataCenter.getRemoteData(url, function(err, data) {
        if (!err) {
          self.importAnySessions(data);
        }
      });
    }
  },
  importAnySessions: function (data) {
    if (data && !handleImportData(data)) {
      var isArr = Array.isArray(data);
      if (!isArr && !Array.isArray(data.log && data.log.entries)) {
        isArr = true;
        data = [data];
      }
      if (Array.isArray(data)) {
        dataCenter.addNetworkList(data);
      } else {
        this.importHarSessions(data);
      }
    }
  },
  donotShowAgain: function () {
    dataCenter.donotShowAgain();
  },
  hideUpdateTipsDialog: function () {
    this.refs.showUpdateTipsDialog.hide();
  },
  getAllRulesText: function () {
    var text = ' ' + this.getAllRulesValue();
    return text.replace(/#[^\r\n]*[\r\n]/g, '\n');
  },
  getLogIdListFromRules: function () {
    var text = this.getAllRulesText();
    if (
      (text = text.match(
        /\slog:\/\/(?:\{[^\s]{1,36}\}|[^/\\{}()<>\s]{1,36})\s/g
      ))
    ) {
      var flags = {};
      text = text
        .map(function (logId) {
          logId = removeProtocol(logId.trim());
          if (logId[0] === '{') {
            logId = logId.slice(1, -1);
          }
          return logId;
        })
        .filter(function (logId) {
          if (!logId) {
            return false;
          }
          if (!flags[logId]) {
            flags[logId] = 1;
            return true;
          }
          return false;
        });
    }
    return text;
  },
  getWeinreFromRules: function () {
    var values = this.state.values;
    var text = this.getAllRulesText();
    if ((text = text.match(/(?:^|\s)weinre:\/\/[^\s#]+(?:$|\s)/gm))) {
      var flags = {};
      text = text
        .map(function (weinre) {
          weinre = removeProtocol(weinre.trim());
          var value = getValue(weinre);
          if (value !== false) {
            return value;
          }
          var key = getKey(weinre);
          if (key !== false) {
            key = values.get(key);
            return key && key.value;
          }

          return weinre;
        })
        .filter(function (weinre) {
          if (!weinre) {
            return false;
          }
          if (!flags[weinre]) {
            flags[weinre] = 1;
            return true;
          }
          return false;
        });
    }

    return text;
  },
  getValuesFromRules: function () {
    var text = ' ' + this.getAllRulesValue();
    if ((text = text.match(/\s(?:[\w-]+:\/\/)?\{[^\s#]+\}/g))) {
      text = text
        .map(function (key) {
          return getKey(removeProtocol(key.trim()));
        })
        .filter(function (key) {
          return !!key;
        });
    }
    return text;
  },
  getAllRulesValue: function () {
    var result = [];
    var activeList = [];
    var selectedList = [];
    var state = this.state;
    var modal = state.rules;
    modal.list.forEach(function (name) {
      var item = modal.get(name);
      var value = item.value || '';
      if (item.active) {
        activeList.push(value);
      } else if (item.selected) {
        selectedList.push(value);
      } else {
        result.push(value);
      }
    });
    modal = state.values;
    modal.list.forEach(function (name) {
      if (/\.rules$/.test(name)) {
        result.push(modal.get(name).value);
      }
    });

    return activeList.concat(selectedList).concat(result).join('\r\n');
  },
  startLoadData: function (init) {
    var self = this;
    if (self._updateNetwork) {
      if (init) {
        self._updateNetwork();
      } else {
        setTimeout(self._updateNetwork, 30);
      }
      return;
    }
    var scrollTimeout;
    var baseDom = $('.w-req-data-list .ReactVirtualized__Grid:first').scroll(
      function () {
        var modal = self.state.network;
        scrollTimeout && clearTimeout(scrollTimeout);
        scrollTimeout = null;
        if (atBottom()) {
          scrollTimeout = setTimeout(function () {
            update(modal, true);
          }, 1000);
        }
      }
    );

    var timeout;
    var con = baseDom[0];
    self.container = baseDom;
    dataCenter.on('data', update);

    function update(modal, _atBottom) {
      modal = modal || self.state.network;
      clearTimeout(timeout);
      timeout = null;
      if (self.state.name != 'network') {
        return;
      }
      _atBottom = _atBottom || atBottom();
      if (modal.update(_atBottom) && _atBottom) {
        timeout = setTimeout(update, 3000);
      }
      if (document.hidden) {
        return;
      }
      self.setState({}, function () {
        _atBottom && scrollToBottom();
      });
    }

    function scrollToBottom(force) {
      if (force || !self.state.network.isTreeView) {
        con.scrollTop = 10000000;
      }
    }

    $(document).on('dblclick', '.w-network-menu-list', function (e) {
      if ($(e.target).hasClass('w-network-menu-list')) {
        if (con.scrollTop < 1) {
          scrollToBottom(true);
        } else {
          con.scrollTop = 0;
        }
      }
    });

    self._updateNetwork = update;
    self.autoRefresh = scrollToBottom;
    self.scrollerAtBottom = atBottom;

    function atBottom(force) {
      var body = baseDom.find('.ReactVirtualized__Grid__innerScrollContainer')[0];
      if (!body) {
        force && trigger('toggleBackToBottomBtn', false);
        return true;
      }
      var height = con.offsetHeight + 5;
      var ctnHeight = body.offsetHeight;
      var isBottom = con.scrollTop + height > ctnHeight;
      trigger('toggleBackToBottomBtn', !isBottom && ctnHeight >= height);
      return isBottom;
    }

    addEvent('checkAtBottom', atBottom);
  },
  showPlugins: function (e) {
    var self = this;
    if (self.state.name != 'plugins') {
      self.setMenuOptionsState();
      self.hidePluginsOptions();
    } else if (e && !self.state.showLeftMenu) {
      self.showPluginsOptions();
    }
    self.setState({
      hasPlugins: true,
      name: 'plugins'
    });
    changePageName('plugins');
  },
  handleAction: function (type) {
    var self = this;
    if (type === 'top') {
      self.container[0].scrollTop = 0;
      return;
    }
    if (type === 'bottom') {
      return self.autoRefresh(true);
    }
    if (type === 'pause') {
      trigger('changeRecordState', type);
      return dataCenter.pauseNetworkRecord();
    }
    var refresh = type === 'refresh';
    if (refresh) {
      trigger('changeRecordState');
    } else {
      trigger('changeRecordState', 'stop');
    }
    dataCenter.stopNetworkRecord(!refresh);
    if (refresh) {
      return self.autoRefresh();
    }
  },
  showNetwork: function (e, cb) {
    var self = this;
    if (self.state.name == 'network') {
      e && !self.state.showLeftMenu && self.showNetworkOptions();
      return;
    }
    self.setMenuOptionsState();
    self.setState(
      {
        hasNetwork: true,
        name: 'network'
      },
      function () {
        self.startLoadData();
        if (self._isAtBottom) {
          self._isAtBottom = false;
          self.autoRefresh && self.autoRefresh();
        }
        if (isFunc(cb)) {
          cb();
        }
      }
    );
    changePageName('network');
  },
  handleNetwork: function (item, e) {
    var self = this;
    var modal = self.state.network;
    if (item.id == 'removeAll') {
      self.clear();
    } else if (item.id == 'removeSelected') {
      modal.removeSelectedItems();
    } else if (item.id == 'removeUnselected') {
      modal.removeUnselectedItems();
    } else if (item.id == 'exportWhistleFile') {
      self.exportData();
    } else if (item.id === 'toggleView') {
      self.toggleTreeView();
    } else if (item.id === 'importSessions') {
      self.importData();
    }
    self.hideNetworkOptions();
  },
  importData: function () {
    this.refs.importDialog.show(this.state.name);
  },
  getRulesSettings: function() {
    var state = this.state;
    return {
      type: 'setRulesSettings',
      theme: state.rulesTheme || 'cobalt',
      fontSize: state.rulesFontSize || '14px',
      lineNumbers: !!state.showRulesLineNumbers,
      autoLineWrapping: !!state.autoRulesLineWrapping,
      allowMultipleChoice: !!state.allowMultipleChoice,
      backRulesFirst: !!state.backRulesFirst
    };
  },
  getValuesSettings: function() {
    var state = this.state;
    return {
      type: 'setValuesSettings',
      theme: state.valuesTheme || 'cobalt',
      fontSize: state.rulesFontSize || '14px',
      lineNumbers: !!state.showValuesLineNumbers,
      autoLineWrapping: !!state.autoValuesLineWrapping,
      foldGutter: !!state.foldGutter
    };
  },
  importRulesSettings: function() {
    this.refs.importDialog.show('rulesSettings');
  },
  exportRulesSettings: function() {
    this.refs.exportDialog.show('rulesSettings', this.getRulesSettings());
  },
  importValuesSettings: function() {
    this.refs.importDialog.show('valuesSettings');
  },
  exportValuesSettings: function() {
    this.refs.exportDialog.show('valuesSettings', this.getValuesSettings());
  },
  getInputValue: function () {
    return util.formatFilename(findDOMNode(this.refs.sessionsName).value.trim());
  },
  filterFilename: function (e) {
    this.setState({ filename: util.formatFilename(e.target.value) });
  },
  exportData: function (_, curItem, filename) {
    var self = this;
    var state = self.state;
    switch (state.name) {
    case 'network':
      var modal = state.network;
      self.currentFoucsItem = curItem;
      if (modal.hasVisibleSession()) {
        self.showChooseFileType(filename);
      } else {
        message.info('No sessions to export');
      }
      break;
    case 'rules':
      self.showAndActiveRules({ id: 'exportRules', selectedList: getExportNames(state.rules, curItem) });
      break;
    case 'values':
      self.showAndActiveValues({ id: 'exportValues', selectedList: getExportNames(state.values, curItem) });
      break;
    }
  },
  showService: function () {
    util.showService(this.state.name);
  },
  importSessionsFromUrl: function (url) {
    var self = this;
    url && dataCenter.getRemoteData(url, function (err, data) {
      if (!err) {
        self.importAnySessions(data);
      }
    });
  },
  handleImportRules: function(data) {
    if (data && !handleImportData(data)) {
      this.showKVDialog(data);
    }
  },
  handleImportValues: function(data) {
    if (data && !handleImportData(data)) {
      this.showKVDialog(data, true);
    }
  },
  showAndActiveRules: function (item, e) {
    var self = this;
    if (self.state.name === 'rules') {
      switch (item.id) {
      case 'exportRules':
        self.refs.selectRulesDialog.show(item.selectedList);
        break;
      case 'importRules':
        self.importData();
        break;
      }
    } else {
      self.setRulesActive(item.name);
      self.showRules();
    }
    self.hideRulesOptions();
  },
  showRules: function (e) {
    var self = this;
    if (self.state.name != 'rules') {
      self.setMenuOptionsState();
      self.hideRulesOptions();
    } else if (e && !self.state.showLeftMenu) {
      self.showRulesOptions(e);
    }
    self.setState({
      hasRules: true,
      name: 'rules'
    });
    changePageName('rules');
  },
  showAndActiveValues: function (item, e) {
    var self = this;
    if (self.state.name === 'values' && item.id) {
      switch (item.id) {
      case 'exportValues':
        self.refs.selectValuesDialog.show(item.selectedList);
        break;
      case 'importValues':
        self.importData();
        break;
      }
    } else {
      var modal = self.state.values;
      var name = item.name;

      if (!modal.exists(name)) {
        dataCenter.values.add({ name: name }, function (data, xhr) {
          if (data && data.ec === 0) {
            var item = modal.add(name);
            self.setValuesActive(name);
            self.setState({
              activeValues: item
            });
            trigger('focusValuesList');
          } else {
            showSysErr(xhr);
          }
        });
      } else {
        self.setValuesActive(name);
      }

      self.showValues();
    }
    self.hideValuesOptions();
  },
  addValue: function () {},
  showValues: function (e) {
    var self = this;
    if (self.state.name != 'values') {
      self.setMenuOptionsState();
      self.hideValuesOptions();
    } else if (e && !self.state.showLeftMenu) {
      self.showValuesOptions(e);
    }
    self.setState({
      hasValues: true,
      name: 'values'
    });
    changePageName('values');
  },
  showNetworkOptions: function () {
    if (this.state.name == 'network') {
      this.setState({
        showNetworkOptions: true
      });
    }
  },
  hideNetworkOptions: function () {
    this.setState({
      showAbortOptions: false,
      showNetworkOptions: false
    });
  },
  showAbortOptions: function () {
    var modal = this.state.network;
    var list = modal.getSelectedList();
    ABORT_OPTIONS[0].disabled = !list || !list.filter(util.canAbort).length;
    this.setState({
      showAbortOptions: true
    });
  },
  showCreateOptions: function () {
    this.setState({
      showCreateOptions: true
    });
  },
  hideCreateOptions: function () {
    this.setState({
      showCreateOptions: false
    });
  },
  hideAbortOptions: function () {
    this.setState({
      showAbortOptions: false
    });
  },
  showHelpOptions: function () {
    this.setState({
      showHelpOptions: true
    });
  },
  hideHelpOptions: function () {
    this.setState({
      showHelpOptions: false
    });
  },
  showHasNewVersion: function (hasNewVersion) {
    this.setState({
      hasNewVersion: hasNewVersion
    });
  },
  showRulesOptions: function (e) {
    var self = this;
    var rules = self.state.rules;
    var data = rules.data;
    var rulesOptions;
    var rulesList = rules.list;
    if (self.state.name === 'rules') {
      var len = rulesList.length;
      RULES_ACTIONS[0].disabled = len < 2;
      RULES_ACTIONS[1].disabled = len < 1;
      rulesOptions = RULES_ACTIONS;
    } else {
      rulesOptions = [];
      rulesList.forEach(function (name) {
        rulesOptions.push(data[name]);
      });
    }
    self.setState({
      rulesOptions: rulesOptions,
      showRulesOptions: true
    });
  },
  hideRulesOptions: function () {
    this.setState({
      showRulesOptions: false
    });
  },
  showValuesOptions: function (e) {
    var self = this;
    var valuesOptions;
    var valuesList = self.state.values.list;
    if (self.state.name === 'values') {
      var len = valuesList.length;
      VALUES_ACTIONS[0].disabled = len < 2;
      VALUES_ACTIONS[1].disabled = len < 1;
      valuesOptions = VALUES_ACTIONS;
    } else {
      valuesOptions = [];
      var list = self.getValuesFromRules() || [];
      list = util.unique(valuesList.concat(list));
      var newValues = [];
      list.forEach(function (name) {
        var exists = valuesList.indexOf(name) != -1;
        var item = {
          name: name,
          icon: exists ? 'edit' : 'plus'
        };
        exists ? valuesOptions.push(item) : newValues.push(item);
      });
      valuesOptions = newValues.concat(valuesOptions);
    }
    self.setState({
      valuesOptions: valuesOptions,
      showValuesOptions: true
    });
  },
  hideValuesOptions: function () {
    this.setState({
      showValuesOptions: false
    });
  },
  showAndActivePlugins: function (option) {
    var self = this;
    self.hidePluginsOptions();
    self.showPlugins();
    self.showPluginTab(option.name);
  },
  showPluginTab: function (name) {
    var self = this;
    var active = 'Home';
    var tabs = self.state.tabs || [];
    if (name && name != active) {
      for (var i = 0, len = tabs.length; i < len; i++) {
        if (tabs[i].name == name) {
          active = name;
          name = null;
          break;
        }
      }
    }
    var plugin = name && self.state.plugins[name + ':'];
    if (plugin) {
      if (tabs.length >= MAX_PLUGINS_TABS) {
        alertMsg('Maximum ' + MAX_PLUGINS_TABS + ' tabs allowed');
        return self.showPlugins();
      }
      active = name;
      var homepage = plugin.pluginHomepage;
      if (homepage && !plugin.openInPlugins) {
        return window.open(homepage);
      }
      tabs.push({
        name: name,
        url: homepage || 'plugin.' + name + '/'
      });
    }

    self.setState({
      active: active,
      tabs: tabs
    });
    self.updatePluginTabInfo(tabs, active);
  },
  updatePluginTabInfo: function(tabs, active) {
    tabs = tabs.map(function(tab) {
      return tab.name;
    });
    storage.set('activePluginTabList', JSON.stringify(tabs));
    active && storage.set('activePluginTabName', active);
  },
  activePluginTab: function (e) {
    this.showPluginTab($(e.target).attr('data-name'));
  },
  closePluginTab: function (e) {
    var name = $(e.target).attr('data-name');
    var self = this;
    var state = self.state;
    var tabs = state.tabs || [];
    for (var i = 0, len = tabs.length; i < len; i++) {
      if (tabs[i].name == name) {
        tabs.splice(i, 1);
        var active = state.active;
        if (active == name) {
          var plugin = tabs[i] || tabs[i - 1];
          state.active = plugin ? plugin.name : null;
        }
        self.setState({
          tabs: tabs
        });
        self.updatePluginTabInfo(tabs);
        return;
      }
    }
  },
  showPluginsOptions: function (e) {
    this.setState({
      showPluginsOptions: true
    });
  },
  hidePluginsOptions: function () {
    this.setState({
      showPluginsOptions: false
    });
  },
  showWeinreOptionsQuick: function (e) {
    var self = this;
    var list = self.getWeinreFromRules();
    if (!list || !list.length) {
      self.showAnonymousWeinre();
      return;
    }
    $(e.target).closest('div').addClass('w-menu-wrapper-show');
    util.shakeElem($(findDOMNode(self.refs.weinreMenuItem)));
  },
  showWeinreOptions: function (e) {
    var self = this;
    var list = (self.state.weinreOptions = self.getWeinreFromRules() || []);
    self.state.weinreOptions = util.unique(list).map(function (name) {
      return {
        name: name,
        icon: 'console'
      };
    });
    self.setState({
      showWeinreOptions: true
    });
  },
  hideWeinreOptions: function () {
    this.setState({
      showWeinreOptions: false
    });
  },
  setMenuOptionsState: function (name, callback) {
    var state = {
      showCreateRules: false,
      showCreateValues: false,
      showEditRules: false,
      showEditValues: false,
      showCreateOptions: false
    };
    if (name) {
      state[name] = true;
    }
    this.setState(state, callback);
  },
  hideRulesInput: function () {
    this.setState({ showCreateRules: false });
  },
  hideValuesInput: function () {
    this.setState({ showCreateValues: false });
  },
  hideRenameRuleInput: function () {
    this.setState({ showEditRules: false });
  },
  hideRenameValueInput: function () {
    this.setState({ showEditValues: false });
  },
  showCreateRules: function (_, group, focusItem) {
    var self = this;
    var createRulesInput = findDOMNode(self.refs.createRulesInput);
    self._curFocusRulesGroup = group;
    self._curFocusRulesItem = focusItem;
    self.setState(
      {
        showCreateRules: true
      },
      function () {
        createRulesInput.focus();
      }
    );
  },
  showCreateValues: function (_, group, focusItem) {
    var self = this;
    var createValuesInput = findDOMNode(self.refs.createValuesInput);
    self._curFocusValuesGroup = group;
    self._curFocusValuesItem = focusItem;
    self.setState(
      {
        showCreateValues: true
      },
      function () {
        createValuesInput.focus();
      }
    );
  },
  showHttpsSettingsDialog: function () {
    this.refs.httpsSettings.show();
  },
  interceptHttpsConnects: function (e) {
    var self = this;
    var checked = e.target.checked;
    dataCenter.interceptHttpsConnects(
      { interceptHttpsConnects: checked ? 1 : 0 },
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.state.interceptHttpsConnects = checked;
          dataCenter.isCapture = checked ? 1 : 0;
          trigger('reqTabsChange');
          trigger('resTabsChange');
        } else {
          showSysErr(xhr);
        }
        self.setState({});
      }
    );
  },
  enableHttp2: function (e) {
    var self = this;
    if (!dataCenter.supportH2) {
      confirmMsg(
        'HTTP/2 requires Node.js LTS version v16+. Please upgrade',
        function (sure) {
          sure && window.open('https://nodejs.org/');
          self.setState({});
        }
      );
      return;
    }
    var checked = e.target.checked;
    dataCenter.enableHttp2(
      { enableHttp2: checked ? 1 : 0 },
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.state.enableHttp2 = checked;
        } else {
          showSysErr(xhr);
        }
        self.setState({});
      }
    );
  },
  createRules: function (e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var self = this;
    var target = findDOMNode(self.refs.createRulesInput);
    var name = target.value.trim();
    if (!name) {
      showError(EMPTY_TIPS);
      return;
    }
    var modal = self.state.rules;
    var type = e && attr(e.target, 'data-type');
    var isGroup;
    if (type === 'group') {
      isGroup = true;
      name = '\r' + name;
    }
    if (modal.exists(name)) {
      showError(getExistsTips(name));
      return;
    }
    var addToTop = type === 'top' ? 1 : '';
    var groupItem = self._curFocusRulesGroup;
    var focusItem = self._curFocusRulesItem;
    var params = { name: name, addToTop: addToTop };
    if (isGroup) {
      var focusName = focusItem && focusItem.name;
      if (focusName) {
        if (focusName === 'Default') {
          focusName = self.state.rules.list[1];
        }
        params.focusName = focusName;
      }
    } else if (groupItem) {
      params.groupName = groupItem.name;
    }
    dataCenter.rules.add(params, function (data, xhr) {
      if (data && data.ec === 0) {
        var item = modal[addToTop ? 'unshift' : 'add'](name);
        target.value = '';
        target.blur();
        var toName = params.focusName;
        if (toName) {
          modal.moveTo(name, toName);
        } else {
          modal.moveToGroup(name, params.groupName, addToTop);
        }
        if (isGroup) {
          if (item) {
            item._isNewGroup = true;
          }
        } else {
          self.setRulesActive(name);
        }
        params.groupName && trigger('expandRulesGroup', params.groupName);
        self.setState(isGroup ? {} : {
          activeRules: item
        });
        self.triggerRulesChange('create');
      } else {
        showSysErr(xhr);
      }
    }
    );
  },
  createValues: function (e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var self = this;
    var target = findDOMNode(self.refs.createValuesInput);
    var name = target.value.trim();
    if (!name) {
      showError(EMPTY_TIPS);
      return;
    }

    if (/\s/.test(name)) {
      showError('Spaces are not allowed in the name');
      return;
    }

    if (/#/.test(name)) {
      showError('Special character \'#\' is not allowed in the name');
      return;
    }

    var modal = self.state.values;
    var type = e && attr(e.target, 'data-type');
    var isGroup;
    if (type === 'group') {
      isGroup = true;
      name = '\r' + name;
    }
    if (modal.exists(name)) {
      showError(getExistsTips(name));
      return;
    }
    var groupItem = self._curFocusValuesGroup;
    var focusItem = self._curFocusValuesItem;
    var params = { name: name };
    if (isGroup) {
      if (focusItem) {
        params.focusName = focusItem.name;
      }
    } else if (groupItem) {
      params.groupName = groupItem.name;
    }
    dataCenter.values.add(params, function (data, xhr) {
      if (data && data.ec === 0) {
        var item = modal.add(name);
        target.value = '';
        target.blur();
        var toName = params.focusName;
        if (toName) {
          modal.moveTo(name, toName);
        } else {
          modal.moveToGroup(name, params.groupName);
        }
        if (isGroup) {
          if (item) {
            item._isNewGroup = true;
          }
        } else {
          self.setValuesActive(name);
        }
        params.groupName && trigger('expandValuesGroup', params.groupName);
        self.setState(isGroup ? {} : {
          activeValues: item
        });
        self.triggerValuesChange('create');
      } else {
        showSysErr(xhr);
      }
    });
  },
  showEditRules: function (item) {
    var self = this;
    self.currentFocusRules = item;
    var modal = self.state.rules;
    var activeItem = item || modal.getActive();
    if (!activeItem || activeItem.isDefault) {
      return;
    }
    var editRulesInput = findDOMNode(self.refs.editRulesInput);
    editRulesInput.value = activeItem.name;
    self.setState(
      {
        showEditRules: true,
        selectedRule: activeItem
      },
      function () {
        editRulesInput.select();
        editRulesInput.focus();
      }
    );
  },
  showEditValuesByDBClick: function (item) {
    !item.changed && this.showEditValues();
  },
  showEditValues: function (item) {
    var self = this;
    self.currentFocusValues = item;
    var modal = self.state.values;
    var activeItem = item || modal.getActive();
    if (!activeItem || activeItem.isDefault) {
      return;
    }

    var editValuesInput = findDOMNode(self.refs.editValuesInput);
    editValuesInput.value = activeItem.name;
    self.setState(
      {
        showEditValues: true,
        selectedValue: activeItem
      },
      function () {
        editValuesInput.select();
        editValuesInput.focus();
      }
    );
  },
  editRules: function (e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var self = this;
    var modal = self.state.rules;
    var activeItem = self.currentFocusRules || modal.getActive();
    if (!activeItem) {
      return;
    }
    var target = findDOMNode(self.refs.editRulesInput);
    var isGroup = isGroupName(activeItem.name);
    var name = (isGroup ? '\r' : '') + target.value.trim();
    if (!name) {
      showError(EMPTY_TIPS);
      return;
    }

    if (modal.exists(name)) {
      showError(getExistsTips(name));
      return;
    }
    var curName = activeItem.name;
    dataCenter.rules.rename(
      { name: curName, newName: name },
      function (data, xhr) {
        if (data && data.ec === 0) {
          modal.rename(curName, name);
          target.value = '';
          target.blur();
          !isGroup && self.setRulesActive(name);
          trigger('rulesNameChanged', [curName, name]);
          self.setState({ activeRules: modal.getActive() });
          self.triggerRulesChange('rename');
        } else {
          showSysErr(xhr);
        }
      }
    );
  },
  editValues: function (e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var self = this;
    var modal = self.state.values;
    var activeItem = self.currentFocusValues || modal.getActive();
    if (!activeItem) {
      return;
    }
    var target = findDOMNode(self.refs.editValuesInput);
    var isGroup = isGroupName(activeItem.name);
    var name = (isGroup ? '\r' : '') + target.value.trim();
    if (!name) {
      showError(EMPTY_TIPS);
      return;
    }

    if (modal.exists(name)) {
      showError(getExistsTips(name));
      return;
    }
    var curName = activeItem.name;
    dataCenter.values.rename(
      { name: curName, newName: name },
      function (data, xhr) {
        if (data && data.ec === 0) {
          modal.rename(curName, name);
          target.value = '';
          target.blur();
          !isGroup && self.setValuesActive(name);
          trigger('valuesNameChanged', [curName, name]);
          self.setState({ activeValues: modal.getActive() });
          self.triggerValuesChange('rename');
        } else {
          showSysErr(xhr);
        }
      }
    );
  },
  getActiveRuleName: function() {
    var modal = this.state.rules;
    var activeItem = modal.getActive();
    return activeItem ? activeItem.name : '';
  },
  showAnonymousWeinre: function () {
    this.openWeinre();
  },
  showWeinre: function (options) {
    this.openWeinre(options.name);
  },
  openWeinre: function (name) {
    window.open('weinre/client/#' + (name || 'anonymous'));
    this.setState({
      showWeinreOptions: false
    });
  },
  openLog: function(id) {
    if (!this.hideNetwork) {
      this.showNetwork(null, function() {
        trigger('showLog', id);
      });
    }
  },
  onClickRulesOption: function (item) {
    item.selected ? this.unselectRules(item) : this.selectRules(item);
  },
  selectRules: function (item) {
    if (isGroupName(item.name)) {
      return;
    }
    var self = this;
    dataCenter.rules[item.isDefault ? 'enableDefault' : 'select'](
      item,
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.reselectRules(data);
          self.state.rules.setChanged(item.name, false);
          self.setState({});
          self.triggerRulesChange('save');
          if (data.changed) {
            trigger('rulesChanged');
          }
          if (self.state.disabledAllRules) {
            confirmMsg(
              'Rules are currently disabled. Enable them now?',
              function (sure) {
                if (sure) {
                  dataCenter.rules.disableAllRules(
                    { disabledAllRules: 0 },
                    function (data, xhr) {
                      if (data && data.ec === 0) {
                        self.state.disabledAllRules = false;
                        self.setState({});
                      } else {
                        showSysErr(xhr);
                      }
                    }
                  );
                }
              }
            );
          }
        } else {
          showSysErr(xhr);
        }
      }
    );
    return false;
  },
  selectRulesByOptions: function (e) {
    var item = this.state.rules.data[$(e.target).attr('data-name')];
    this[e.target.checked ? 'selectRules' : 'unselectRules'](item);
  },
  unselectRules: function (item) {
    var self = this;
    dataCenter.rules[item.isDefault ? 'disableDefault' : 'unselect'](
      item,
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.reselectRules(data);
          self.triggerRulesChange('unselect');
          self.setState({});
        } else {
          showSysErr(xhr);
        }
      }
    );
    return false;
  },
  reselectRules: function (data, autoUpdate) {
    var self = this;
    var state = self.state;
    state.rules.clearAllSelected();
    self.setSelected(
      state.rules,
      'Default',
      !data.defaultRulesIsDisabled,
      autoUpdate
    );
    data.list.forEach(function (name) {
      self.setSelected(state.rules, name, true, autoUpdate);
    });
  },
  saveValues: function (item) {
    if (!item.changed || isGroupName(item.name)) {
      return;
    }
    var self = this;
    dataCenter.values.add(item, function (data, xhr) {
      if (data && data.ec === 0) {
        self.setSelected(self.state.values, item.name);
        self.triggerValuesChange('save');
      } else {
        showSysErr(xhr);
      }
    });
    return false;
  },
  setSelected: function (modal, name, selected, autoUpdate) {
    if (modal.setSelected(name, selected)) {
      if (!autoUpdate) {
        modal.setChanged(name, false);
      }
      this.setState({
        curSelectedName: name
      });
    }
  },
  replayCountChange: function (e) {
    var count = e.target.value.replace(/^\s*0*|[^\d]+/, '');
    var replayCount = count.slice(0, 3);
    if (replayCount > MAX_REPLAY_COUNT) {
      replayCount = MAX_REPLAY_COUNT;
    }
    this.setState({ replayCount: replayCount });
  },
  clickReplay: function (e) {
    if (e.shiftKey) {
      trigger('replaySessions', [null, e.shiftKey]);
    } else {
      this.replay(e);
    }
  },
  replay: function (e, list, count) {
    var modal = this.state.network;
    list = Array.isArray(list) ? list : modal.getSelectedList();
    if (!list || !list.length) {
      return;
    }
    this.enableRecord();
    var replayReq = function (item, repeatCount) {
      var req = item.req;
      dataCenter.compose({
        repeatCount: repeatCount,
        useH2: item.useH2 ? 1 : '',
        url: item.url,
        headers: util.getOriginalReqHeaders(item),
        method: req.method,
        base64: req.base64
      });
    };
    var map;
    if (count > 1) {
      replayReq(list[0], Math.min(count, MAX_REPLAY_COUNT));
    } else {
      map = {};
      list.slice(0, MAX_REPLAY_COUNT).forEach(function (item) {
        map[item.id] = 1;
        replayReq(item);
      });
    }
    if (modal.isTreeView) {
      var dataId = dataCenter.lastSelectedDataId;
      if (!dataId) {
        return;
      }
      if (!map) {
        return trigger('replayTreeView', [dataId, count]);
      }
      var node = dataId && modal.getTreeNode(dataId);
      node = node && node.parent;
      if (!node) {
        return;
      }
      count = 0;
      node.children.forEach(function (item) {
        item = item.data;
        if (item && map[item.id]) {
          ++count;
        }
      });
      trigger('replayTreeView', [dataId, count]);
    } else if (this.autoRefresh) {
      this.autoRefresh();
    }
  },
  enableRecord: function () {
    this.refs.recordBtn.enable();
    trigger('changeRecordState');
  },
  composer: function () {
    trigger('composer');
  },
  clear: function () {
    var modal = this.state.network;
    this.setState({
      network: modal.clear()
    });
  },
  removeRulesBatch: function(list) {
    var self = this;
    dataCenter.rules.remove({ list: list }, function (data, xhr) {
      if (data && data.ec === 0) {
        var nextItem;
        var modal = self.state.rules;
        list.forEach(function(name) {
          var item = modal.data[name] || '';
          if (item.active) {
            nextItem = modal.getSibling(name);
            nextItem && self.setRulesActive(nextItem.name);
          }
          modal.remove(name);
        });
        nextItem && trigger('expandRulesGroup', nextItem.name);
        self.setState(nextItem ? { activeRules: nextItem } : {});
        self.triggerRulesChange('remove');
        trigger('focusRulesList');
      } else {
        showSysErr(xhr);
      }
    });
    this.refs.deleteRulesDialog.hide();
  },
  removeValuesBatch: function(list) {
    var self = this;
    dataCenter.values.remove({ list: list }, function (data, xhr) {
      if (data && data.ec === 0) {
        var nextItem;
        var modal = self.state.values;
        list.forEach(function(name) {
          var item = modal.data[name] || '';
          if (item.active) {
            nextItem = modal.getSibling(name);
            nextItem && self.setValuesActive(nextItem.name);
          }
          modal.remove(name);
        });
        nextItem && trigger('expandValuesGroup', nextItem.name);
        self.setState(nextItem ? { activeValues: nextItem } : {});
        self.triggerValuesChange('remove');
        trigger('focusValuesList');
      } else {
        showSysErr(xhr);
      }
    });
    this.refs.deleteValuesDialog.hide();
  },
  removeRules: function (item) {
    var modal = this.state.rules;
    var activeItem = item || modal.getActive();
    if (activeItem && !activeItem.isDefault) {
      this.refs.deleteRulesDialog.show(activeItem.name);
    }
  },
  removeValues: function (item) {
    var modal = this.state.values;
    var activeItem = item || modal.getActive();
    if (activeItem && !activeItem.isDefault) {
      this.refs.deleteValuesDialog.show(activeItem.name);
    }
  },
  setRulesActive: function (name, modal) {
    modal = modal || this.state.rules;
    storage.set('activeRules', name);
    modal.setActive(name);
  },
  setValuesActive: function (name, modal) {
    modal = modal || this.state.values;
    storage.set('activeValues', name);
    modal.setActive(name);
  },
  showRulesSettings: function () {
    this.refs.rulesSettingsDialog.show();
  },
  showValuesSettings: function () {
    this.refs.valuesSettingsDialog.show();
  },
  toggleLeftMenu: function () {
    var showLeftMenu = !this.state.showLeftMenu;
    this.setState({
      showLeftMenu: showLeftMenu
    });
    storage.set('showLeftMenu', showLeftMenu ? 1 : '');
    trigger('editorResize');
  },
  handleCreate: function () {
    var self = this;
    self.state.name == 'rules'
      ? self.showCreateRules()
      : self.showCreateValues();
  },
  saveRulesOrValues: function () {
    var self = this;
    var state = self.state;
    var list;
    var isRules = state.name == 'rules';
    if (isRules) {
      list = state.rules.getChangedList();
      var active = state.rules.getActive();
      if (active && !active.selected && list.indexOf(active) === -1) {
        list.push(active);
      }
      if (list.length) {
        list.forEach(function (item) {
          self.selectRules(item);
        });
        self.setState({});
      }
    } else {
      list = state.values.getChangedList();
      if (list.length) {
        list.forEach(function (item) {
          self.saveValues(item);
        });
        self.setState({});
      }
    }
  },
  onClickMenu: function (e) {
    var target = $(e.target).closest('a');
    var self = this;
    var state = self.state;
    var isRules = state.name == 'rules';
    if (target.hasClass('w-edit-menu')) {
      isRules ? self.showEditRules() : self.showEditValues();
    } else if (target.hasClass('w-delete-menu')) {
      isRules ? self.removeRules() : self.removeValues();
    } else if (target.hasClass('w-save-menu')) {
      self.saveRulesOrValues();
    }
  },
  showSettings: function () {
    var self = this;
    var pageName = self.state.name;
    if (pageName === 'rules') {
      self.showRulesSettings();
      return;
    }
    if (pageName === 'values') {
      self.showValuesSettings();
      return;
    }
    if (pageName === 'network') {
      self.refs.networkSettings.showDialog();
    }
  },
  activeRules: function (item) {
    storage.set('activeRules', item.name);
    this.setState({ activeRules: item });
  },
  activeValues: function (item) {
    storage.set('activeValues', item.name);
    this.setState({ activeValues: item });
  },
  setValueChange: function(e, name) {
    var value = e.target.value;
    storage.set(name, value);
    this.state[name] = value;
    this.setState({});
  },
  onRulesThemeChange: function (e) {
    this.setValueChange(e, 'rulesTheme');
  },
  onValuesThemeChange: function (e) {
    this.setValueChange(e, 'valuesTheme');
  },
  onRulesFontSizeChange: function (e) {
    this.setValueChange(e, 'rulesFontSize');
  },
  onValuesFontSizeChange: function (e) {
    this.setValueChange(e, 'valuesFontSize');
  },
  setChecked: function(e, name) {
    var checked = e.target.checked;
    storage.set(name, checked ? '1' : '');
    this.state[name] = checked;
    this.setState({});
  },
  onRulesLineNumberChange: function (e) {
    this.setChecked(e, 'showRulesLineNumbers');
  },
  onValuesLineNumberChange: function (e) {
    this.setChecked(e, 'showValuesLineNumbers');
  },
  showFoldGutter: function (e) {
    this.setChecked(e, 'foldGutter');
  },
  onRulesLineWrappingChange: function (e) {
    this.setChecked(e, 'autoRulesLineWrapping');
  },
  onValuesLineWrappingChange: function (e) {
    this.setChecked(e, 'autoValuesLineWrapping');
  },
  confirmDisableAllRules: function (e) {
    var self = this;
    var state = self.state;
    var dialog;
    if (state.disabledAllRules || (!e && (dialog = $('.w-win-dialog[data-confirm-flag=rules]')).is(':visible'))) {
      self.disableAllRules();
      dialog && dialog.modal('hide');
    } else {
      confirmMsg(DISABLE_RULES, function (sure) {
        sure && self.disableAllRules();
      }, false, 'rules');
    }
    e && preventBlur(e);
  },
  confirmDisableAllPlugins: function (e) {
    var self = this;
    var state = self.state;
    var dialog;
    if (state.disabledAllPlugins || (!e && (dialog = $('.w-win-dialog[data-confirm-flag=plugins]')).is(':visible'))) {
      self.disableAllPlugins();
      dialog && dialog.modal('hide');
    } else {
      confirmMsg(DISABLE_PLUGINS, function (sure) {
        sure && self.disableAllPlugins();
      }, false, 'plugins');
    }
    e && preventBlur(e);
  },
  disableAllRules: function (e, callback) {
    var self = this;
    var state = self.state;
    var checked = !state.disabledAllRules;
    dataCenter.rules.disableAllRules(
      { disabledAllRules: checked ? 1 : 0 },
      function (data, xhr) {
        if (data && data.ec === 0) {
          state.disabledAllRules = checked;
          self.setState({});
          if (isFunc(callback)) {
            callback(checked);
          }
        } else {
          showSysErr(xhr);
        }
      }
    );
    e && preventBlur(e);
  },
  disableAllPlugins: function (e, callback) {
    var self = this;
    var state = self.state;
    var checked = !state.disabledAllPlugins;
    dataCenter.plugins.disableAllPlugins(
      { disabledAllPlugins: checked ? 1 : 0 },
      function (data, xhr) {
        if (data && data.ec === 0) {
          state.disabledAllPlugins = checked;
          protocols.setPlugins(state);
          self.setState({});
          if (isFunc(callback)) {
            callback(checked);
          }
        } else {
          showSysErr(xhr);
        }
      }
    );
    e && preventBlur(e);
  },
  setPluginState: function(name, disabled) {
    var self = this;
    if (self.state.ndp) {
      return message.info('Plugin disabling is restricted');
    }
    dataCenter.plugins.disablePlugin(
      {
        name: name,
        disabled: disabled ? 1 : 0
      },
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.state.disabledPlugins = data.data;
          dataCenter.setDisabledPlugins(data.data);
          protocols.setPlugins(self.state);
          self.setState({});
        } else {
          showSysErr(xhr);
        }
      }
    );
  },
  disablePlugin: function (e) {
    var target = e.target;
    this.setPluginState($(target).attr('data-name'), !target.checked);
  },
  abort: function (list) {
    if (!Array.isArray(list)) {
      var modal = this.state.network;
      list = modal.getSelectedList();
    }
    if (list) {
      list = list.map(function (item) {
        if (util.canAbort(item)) {
          return item.id;
        }
      });
      if (list.length) {
        dataCenter.abort({ list: list.join() });
      }
    }
    this.hideAbortOptions();
  },
  allowMultipleChoice: function (e) {
    this.setMultipleCohice(e.target.checked);
  },
  setMultipleCohice: function (checked) {
    var self = this;
    dataCenter.rules.allowMultipleChoice(
      { allowMultipleChoice: checked ? 1 : 0 },
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.setState({
            allowMultipleChoice: checked
          });
        } else {
          showSysErr(xhr);
        }
      }
    );
  },
  enableBackRulesFirst: function (e) {
    this.setBackRulesFirst(e.target.checked);
  },
  setBackRulesFirst: function (checked) {
    var self = this;
    dataCenter.rules.enableBackRulesFirst(
      { backRulesFirst: checked ? 1 : 0 },
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.setState({
            backRulesFirst: checked
          });
          dataCenter.backRulesFirst = checked;
        } else {
          showSysErr(xhr);
        }
      }
    );
  },
  installPlugins: function () {
    trigger('installPlugins');
  },
  showChooseFileType: function (filename) {
    this.refs.chooseFileType.show();
    var input = findDOMNode(this.refs.sessionsName);
    if (notEStr(filename)) {
      input.value = filename;
    }
    setTimeout(function () {
      input.focus();
      input.select();
    }, 500);
    this.setState({ selectedSessions: this.getExportSessions() });
  },
  chooseFileType: function (e) {
    var value = e.target.value;
    storage.set('exportFileType', value);
    this.setState({
      exportFileType: value
    });
  },
  importHarSessions: function (result) {
    if (!util.isObj(result)) {
      return;
    }
    var entries = result.log.entries;
    var sessions = [];
    entries.forEach(function (entry) {
      entry = util.harToSession(entry);
      entry && sessions.push(entry);
    });
    dataCenter.addNetworkList(sessions);
  },
  uploadSessionsForm: function (data) {
    if (!(data instanceof FormData)) {
      var form = new FormData();
      form.append('importSessions', data);
      data = form;
    }
    var file = data.get('importSessions');
    if (!file || !/\.(txt|json|saz|har)$/i.test(file.name)) {
      return alertMsg('Supported file formats: .txt, .json, .saz, .har');
    }

    if (file.size > MAX_FILE_SIZE) {
      return alertMsg(EXCEED_TIPS + ' 64MB');
    }
    var isText = /\.(?:txt|json)$/i.test(file.name);
    if (isText || /\.har$/i.test(file.name)) {
      var self = this;
      readFileAsText(file, function (result) {
        try {
          result = JSON.parse(result);
          if (isText) {
            dataCenter.importAnySessions(result);
          } else {
            self.importHarSessions(result);
          }
        } catch (e) {
          alertMsg('Invalid JSON format');
        }
      });
      return;
    }
    dataCenter.upload.importSessions(data, dataCenter.addNetworkList);
  },
  getExportSessions: function() {
    var self = this;
    var modal = self.state.network;
    var sessions = self.currentFoucsItem;
    self.currentFoucsItem = null;
    return sessions || modal.getSelectedList();
  },
  exportSessions: function (type, name, sessions) {
    var self = this;
    sessions = sessions || self.getExportSessions();
    if (!sessions || !sessions.length) {
      return;
    }
    var isHar = type === 'har';
    var version = self.state.version;
    if (isHar) {
      sessions = {
        log: {
          version: '1.2',
          creator: {
            name: 'Whistle',
            version: version,
            comment: ''
          },
          browser: {
            name: 'Whistle',
            version: version
          },
          pages: [],
          entries: sessions.map(util.toHar),
          comment: ''
        }
      };
    }
    if (type !== 'Fiddler') {
      return util.download(sessions, name || 'network_' + util.formatDate() + (isHar ? '.har' : '.txt'));
    }
    var refs = self.refs;
    findDOMNode(refs.exportFilename).value = name || '';
    findDOMNode(refs.exportFileType).value = type;
    findDOMNode(refs.sessions).value = util.stringify(sessions);
    findDOMNode(refs.exportSessionsForm).submit();
  },
  hideChooseFileTypeDialog: function(failed) {
    if (!failed) {
      this.refs.chooseFileType.hide();
      findDOMNode(this.refs.sessionsName).value = '';
    }
  },
  exportBySave: function (e) {
    if (util.checkSubmit(e)) {
      return;
    }
    var self = this;
    var input = findDOMNode(self.refs.sessionsName);
    var name = input.value.trim();
    input.value = '';
    self.exportSessions(self.state.exportFileType, name, self.state.selectedSessions);
    self.hideChooseFileTypeDialog();
  },
  exportAll: function () {
    var self = this;
    var sessions = self.state.network.getList().filter(function (item) {
      return !item.hide;
    });
    self.setState({ selectedSessions: sessions }, self.exportBySave);
  },
  replayRepeat: function (e) {
    if (util.checkSubmit(e)) {
      return;
    }
    var self = this;
    self.refs.setReplayCount.hide();
    self.replay('', self.replayList, self.state.replayCount);
    trigger('focusNetworkList');
  },
  showAboutDialog: function (e) {
    if (this.state.hasNewVersion) {
      this.refs.aboutDialog.showAboutInfo();
      preventBlur(e);
    }
  },
  onTopContextMenu: function(e) {
    if (this.getTabName() !== 'network' || $(e.target).closest('.w-menu-item').length) {
      return;
    }
    preventBlur(e);
    var data = util.getMenuPosition(e, 110, 100);
    data.list = TOP_BAR_MENUS;
    this.refs.topContextMenu.show(data);
  },
  onContextMenu: function (e) {
    var count = 0;
    var list = LEFT_BAR_MENUS;
    if (list[2].hide) {
      ++count;
    }
    if (list[3].hide) {
      ++count;
    }
    if (list[4].hide) {
      ++count;
    }
    if (count < 3) {
      var data = util.getMenuPosition(e, 110, 100 - count * 30);
      var state = this.state;
      data.list = list;
      list[2].checked = !!state.network.isTreeView;
      list[3].checked = !state.disabledAllRules;
      list[4].checked = !state.disabledAllPlugins;
      var target = $(e.target);
      list[0].hide = true;
      list[1].hide = true;
      if (target.closest('.w-network-menu').length) {
        list[0].hide = false;
      } else if (target.closest('.w-save-menu').length) {
        list[1].hide = false;
        if (target.closest('.w-rules-menu').length) {
          list[1].disabled = !state.rules.hasChanged();
        } else {
          list[1].disabled = !state.values.hasChanged();
        }
      }
      this.refs.contextMenu.show(data);
    }
    preventBlur(e);
  },
  onClickTopMenu: function(action) {
    var self = this;
    switch(action) {
    case 'top':
      if (self.container) {
        self.container[0].scrollTop = 0;
      }
      break;
    case 'selected':
      trigger('ensureSelectedItemVisible');
      break;
    case 'bottom':
      if (self.container) {
        self.container[0].scrollTop = 10000000;
      }
      break;
    }
  },
  onClickContextMenu: function (action) {
    var self = this;
    var state = self.state;
    var list = LEFT_BAR_MENUS;
    switch (action) {
    case 'Tree View':
      list[2].checked = !state.network.isTreeView;
      setTimeout(self.toggleTreeView, 0);
      break;
    case 'Rules':
      self.disableAllRules(null, function (disabled) {
        list[3].checked = !disabled;
        self.setState({});
      });
      break;
    case 'Plugins':
      self.disableAllPlugins(null, function (disabled) {
        list[4].checked = !disabled;
        self.setState({});
      });
      break;
    case 'Clear':
      self.clear();
      return;
    case 'Save':
      self.saveRulesOrValues();
      return;
    }
    this.refs.contextMenu.show({});
  },
  forceToggleLeftMenu: function(show) {
    var self = this;
    clearTimeout(self.hideTimer);
    clearTimeout(self.showTimer);
    self[show ? 'showTimer' : 'hideTimer'] = setTimeout(function () {
      self.setState({ forceShowLeftMenu: show });
    }, show ? 200 : 500);
  },
  forceShowLeftMenu: function () {
    this.forceToggleLeftMenu(true);
  },
  forceHideLeftMenu: function () {
    this.forceToggleLeftMenu(false);
  },
  updateMenuView: function(state) {
    var opt = state.networkOptions[state.networkOptions.length - 1];
    if (state.network.isTreeView) {
      opt.icon = 'globe';
      opt.name = 'Show List View';
    } else {
      opt.icon = 'tree-conifer';
      opt.name = 'Show Tree View';
    }
    return state;
  },
  toggleTreeView: function () {
    var self = this;
    var modal = self.state.network;
    modal.setTreeView(!modal.isTreeView);
    self.updateMenuView(self.state);
    self.setState({}, function () {
      if (!modal.isTreeView) {
        self.autoRefresh && self.autoRefresh();
      }
    });
  },
  toggleTreeViewByIcon: function () {
    if (this.getTabName() == 'network') {
      this.toggleTreeView();
    }
  },
  download: function(data) {
    if (!data || !(isStr(data.content) ||
      isStr(data.value) || isStr(data.base64))) {
      return;
    }
    var base64 = getStr(data.base64);
    var self = this;
    findDOMNode(self.refs.filename).value = getStr(data.name);
    findDOMNode(self.refs.dataType).value = base64 ? 'rawBase64' : '';
    findDOMNode(self.refs.content).value = base64 || getStr(data.value|| data.content);
    findDOMNode(self.refs.downloadForm).submit();
  },
  getTabName: function () {
    var state = this.state;
    var rulesMode = state.rulesMode;
    var pluginsMode = state.pluginsMode;
    var name = state.name;
    if (state.networkMode) {
      name = 'network';
    } else if (state.rulesOnlyMode) {
      name = name === 'values' ? 'values' : 'rules';
    } else if (rulesMode && pluginsMode) {
      name = 'plugins';
    } else if (rulesMode) {
      name = name === 'network' ? 'rules' : name;
    } else if (pluginsMode) {
      name = name !== 'plugins' ? 'network' : name;
    }
    return name || 'network';
  },
  isHideRules: function() {
    var state = this.state;
    return state.networkMode || state.pluginsMode;
  },
  onClickHelpMenu: function(option, e) {
    if (option.name === 'Update' && dataCenter.showLatestClientVersion()) {
      preventBlur(e);
    }
  },
  renderBtn: function(onClick, name, type) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-type={type}
        className={'btn btn-' + (type ? 'default' : 'primary')}
      >
        {name}
      </button>
    );
  },
  render: function () {
    var self = this;
    var state = self.state;
    var networkMode = state.networkMode;
    var rulesMode = state.rulesMode;
    var rulesOnlyMode = state.rulesOnlyMode;
    var pluginsMode = state.pluginsMode;
    var multiEnv = dataCenter.isMultiEnv();
    var name = self.getTabName();
    var isAccount = name == 'account';
    var isNetwork = name == 'network';
    var isRules = name == 'rules';
    var isValues = name == 'values';
    var isPlugins = name == 'plugins';
    var isEditor = isRules || isValues;
    var editMenuStyle = getHideStyle(!isEditor);
    var importMenuStyle = getHideStyle(isPlugins || isAccount);
    var disabledEditBtn = true;
    var disabledDeleteBtn = true;
    var rulesTheme = state.rulesTheme || 'cobalt';
    var valuesTheme = state.valuesTheme || 'cobalt';
    var rulesFontSize = state.rulesFontSize || '14px';
    var valuesFontSize = state.valuesFontSize || '14px';
    var showRulesLineNumbers = state.showRulesLineNumbers || false;
    var showValuesLineNumbers = state.showValuesLineNumbers || false;
    var autoRulesLineWrapping = state.autoRulesLineWrapping;
    var autoValuesLineWrapping = state.autoValuesLineWrapping;
    var rulesOptions = state.rulesOptions;
    var pluginsOptions = state.pluginsOptions;
    var uncheckedRules = {};
    var showNetworkOptions = state.showNetworkOptions;
    var showRulesOptions = state.showRulesOptions;
    var showValuesOptions = state.showValuesOptions;
    var showPluginsOptions = state.showPluginsOptions;
    var showWeinreOptions = state.showWeinreOptions;
    var showHelpOptions = state.showHelpOptions;
    var sessions = state.selectedSessions;
    var selectedCount = sessions && sessions.length || 0;
    var modal = state.network;
    var isTreeView = modal.isTreeView;
    var hasSession = modal.hasVisibleSession();
    var showAnonymousWeinre = self.showAnonymousWeinre;
    var onClickMenu = self.onClickMenu;
    var networkType = (isTreeView ? 'tree-conifer' : 'globe') + (state.record ? ' w-disabled' : '');
    if (rulesOptions[0].name === DEFAULT) {
      rulesOptions.forEach(function (item, i) {
        item.icon = !i || !multiEnv ? 'checkbox' : 'edit';
        if (!item.selected) {
          uncheckedRules[item.name] = 1;
        }
      });
    }

    var i, data;
    if (isRules) {
      data = state.rules.data;
      for (i in data) {
        if (data[i].active) {
          disabledEditBtn = disabledDeleteBtn = data[i].isDefault;
          break;
        }
      }
    } else if (isValues) {
      data = state.values.data;
      for (i in data) {
        if (data[i].active) {
          disabledEditBtn = disabledDeleteBtn = false;
          break;
        }
      }
    }
    modal.rulesModal = state.rules;
    state.rules.editorTheme = {
      theme: rulesTheme,
      fontSize: rulesFontSize,
      lineNumbers: showRulesLineNumbers
    };
    var networkOptions = state.networkOptions;
    var hasUnselected = modal.hasUnselected();
    if (modal.hasSelected()) {
      networkOptions.forEach(function (option) {
        option.disabled = false;
        if (option.id === 'removeUnselected') {
          option.disabled = !hasUnselected;
        }
      });
    } else {
      networkOptions.forEach(function (option) {
        if (OPTIONS_WITH_SELECTED.indexOf(option.id) !== -1) {
          option.disabled = true;
        } else if (option.id === 'removeUnselected') {
          option.disabled = !hasUnselected;
        }
      });
      networkOptions[0].disabled = !hasUnselected;
    }
    var mustHideLeftMenu = hideLeftMenu && !state.forceShowLeftMenu;
    var pluginsOnlyMode = pluginsMode && rulesMode;
    var showLeftMenu = (networkMode || state.showLeftMenu) && !pluginsOnlyMode;
    var disabledAllPlugins = state.disabledAllPlugins;
    var disabledAllRules = state.disabledAllRules;
    var forceShowLeftMenu, forceHideLeftMenu;
    var pluginsStyle = getHideStyle(rulesOnlyMode || pluginsOnlyMode || networkMode);
    if (showLeftMenu && hideLeftMenu) {
      forceShowLeftMenu = self.forceShowLeftMenu;
      forceHideLeftMenu = self.forceHideLeftMenu;
    }
    LEFT_BAR_MENUS[2].hide = rulesMode;
    LEFT_BAR_MENUS[3].hide = pluginsMode;
    LEFT_BAR_MENUS[4].hide = rulesOnlyMode;

    var caType = state.caType || 'crt';
    var caHash = state.caHash;
    var caUrl = 'cgi-bin/rootca';
    var caShortUrl = 'http://rootca.pro/';

    if (caType !== 'cer') {
      caUrl += '?type=' + caType;
      caShortUrl += caType;
    }
    var hideEditor = self.isHideRules();
    var hideEditorStyle = getHideStyle(hideEditor);
    var hideStyle = util.getHide(hideMenus);
    var replayRepeat = self.replayRepeat;
    var showRules = self.showRules;
    var createRules = self.createRules;
    var createValues = self.createValues;
    var renderBtn = self.renderBtn;

    dataCenter.hideRulesEditor = hideEditor;
    self.hideNetwork = rulesMode;
    self.hideRules = self.hideValues = hideEditor;
    self.hidePlugins = pluginsStyle;

    return (
      <div
        className={
          'main v-box' + (showLeftMenu ? ' w-show-left-menu' : '')
          + (isEditor && !rulesOnlyMode ? ' w-show-editor' : '') + (isRules ? ' w-show-rules' : '')
          + (rulesOnlyMode || rulesMode ? ' w-show-rules-mode' : '')
        }
      >
        <div className={'w-menu w-' + name + '-menu-list' + hideStyle + (showLeftMenu ? '' : ' w-top')} onContextMenu={self.onTopContextMenu}>
          <a
            onClick={self.toggleLeftMenu}
            draggable="false"
            className="w-switch-layout"
            onMouseEnter={forceShowLeftMenu}
            onMouseLeave={forceHideLeftMenu}
            style={getHideStyle(networkMode || pluginsOnlyMode)}
            title="Ctrl[Command] + M"
          >
            <Icon
              name={
                'chevron-' +
                (showLeftMenu ? (mustHideLeftMenu ? 'down' : 'up') : 'left')
              }
            />
          </a>
          <div
            style={getHideStyle(rulesMode)}
            onMouseEnter={self.showNetworkOptions}
            onMouseLeave={self.hideNetworkOptions}
            className={
              'w-nav-menu w-menu-wrapper' +
              (showNetworkOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={self.showNetwork}
              onDoubleClick={self.toggleTreeView}
              className={
                'w-network-menu' + (isNetwork ? ' w-menu-selected' : '')
              }
              title={
                'Double-click to open' +
                (isTreeView ? ' List View' : ' Tree View')
              }
              draggable="false"
            >
              <Icon name={networkType} />
              Network
            </a>
            <MenuItem
              ref="networkMenuItem"
              options={state.networkOptions}
              className="w-network-menu-item"
              onClickOption={self.handleNetwork}
            />
          </div>
          <div
            style={hideEditorStyle}
            onMouseEnter={self.showRulesOptions}
            onMouseLeave={self.hideRulesOptions}
            className={
              'w-nav-menu w-menu-wrapper' +
              (showRulesOptions ? ' w-menu-wrapper-show' : '') +
              (isRules ? ' w-menu-auto' : '')
            }
          >
            <a
              onClick={showRules}
              className={
                'w-rules-menu' + (isRules ? ' w-menu-selected' : '')
              }
              draggable="false"
            >
              <Icon name="list" className={disabledAllRules ? 'w-disabled' : ''} />
              Rules
            </a>
            <MenuItem
              ref="rulesMenuItem"
              name={isRules ? null : 'Open'}
              options={rulesOptions}
              checkedOptions={uncheckedRules}
              disabled={disabledAllRules}
              className="w-rules-menu-item"
              onClick={showRules}
              onClickOption={self.showAndActiveRules}
              onChange={self.selectRulesByOptions}
            />
          </div>
          <div
            style={hideEditorStyle}
            onMouseEnter={self.showValuesOptions}
            onMouseLeave={self.hideValuesOptions}
            className={
              'w-nav-menu w-menu-wrapper' +
              (showValuesOptions ? ' w-menu-wrapper-show' : '') +
              (isValues ? ' w-menu-auto' : '')
            }
          >
            <a
              onClick={self.showValues}
              className={
                'w-values-menu' + (isValues ? ' w-menu-selected' : '')
              }
              draggable="false"
            >
              <Icon name="folder-close" />Values
            </a>
            <MenuItem
              ref="valuesMenuItem"
              name={isValues ? null : 'Open'}
              options={state.valuesOptions}
              className="w-values-menu-item"
              onClick={self.showValues}
              onClickOption={self.showAndActiveValues}
            />
          </div>
          <div
            style={pluginsStyle}
            ref="pluginsMenu"
            onMouseEnter={self.showPluginsOptions}
            onMouseLeave={self.hidePluginsOptions}
            className={
              'w-nav-menu w-menu-wrapper' +
              (showPluginsOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={self.showPlugins}
              className={
                'w-plugins-menu' + (isPlugins ? ' w-menu-selected' : '')
              }
              draggable="false"
            >
              <Icon name="th-large" className={disabledAllPlugins ? 'w-disabled' : ''} />
              Plugins
            </a>
            <MenuItem
              ref="pluginsMenuItem"
              name={isPlugins ? null : 'Open'}
              options={pluginsOptions}
              checkedOptions={state.disabledPlugins}
              disabled={disabledAllPlugins}
              className="w-plugins-menu-item"
              onClick={self.showPlugins}
              onChange={self.disablePlugin}
              onClickOption={self.showAndActivePlugins}
            />
          </div>
          {!state.ndr && (
            <a
              onClick={self.confirmDisableAllRules}
              className="w-enable-rules-menu w-switch-btn"
              title={
                disabledAllRules ? 'Enable all rules' : 'Disable all rules'
              }
              style={getHideStyle(!isRules)}
              draggable="false"
            >
              <Icon name="stop" className={disabledAllRules ? 'w-pause' : ''} />
              ON
            </a>
          )}
          {!state.ndp && (
            <a
              onClick={self.confirmDisableAllPlugins}
              className="w-enable-plugin-menu w-switch-btn"
              title={
                disabledAllPlugins
                  ? 'Enable all plugins'
                  : 'Disable all plugins'
              }
              style={getHideStyle(!isPlugins)}
              draggable="false"
            >
              <Icon name="stop" className={disabledAllPlugins ? 'w-pause' : ''} />
              ON
            </a>
          )}
          <UpdateAllBtn hide={!isPlugins} />
          <a
            onClick={self.installPlugins}
            className="w-plugins-menu"
            style={getHideStyle(!isPlugins)}
            draggable="false"
          >
            <Icon name="download-alt" />
            Install
          </a>
          <RecordBtn
            ref="recordBtn"
            hide={!isNetwork}
            onClick={self.handleAction}
          />
          <a
            onClick={self.importData}
            style={importMenuStyle}
            className="w-import-menu"
            draggable="false"
          >
            <Icon name="import" />Import
          </a>
          <a
            onClick={self.exportData}
            className="w-export-menu"
            style={importMenuStyle}
            draggable="false"
          >
            <Icon name="export" />Export
          </a>
          <a
            onClick={self.clear}
            style={getHideStyle(!isNetwork)}
            className="w-remove-menu w-remove-menu-list"
            title="Ctrl[Command] + X"
            draggable="false"
          >
            <Icon name="remove" />Clear
          </a>
          <a
            onClick={onClickMenu}
            className="w-save-menu"
            style={editMenuStyle}
            draggable="false"
            title="Ctrl[Command] + S"
          >
            <Icon name="save-file" />Save
          </a>
          <a
            className="w-create-menu"
            style={editMenuStyle}
            draggable="false"
            onClick={self.handleCreate}
          >
            <Icon name="plus" />Create
          </a>
          <a
            onClick={onClickMenu}
            className={'w-edit-menu' + (disabledEditBtn ? ' w-disabled' : '')}
            style={editMenuStyle}
            draggable="false"
          >
            <Icon name="transfer" />Rename
          </a>
          <div
            onMouseEnter={self.showAbortOptions}
            onMouseLeave={self.hideAbortOptions}
            style={getHideStyle(!isNetwork)}
            className={
              'w-menu-wrapper w-abort-menu-list w-menu-auto' +
              (state.showAbortOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={self.clickReplay}
              className="w-replay-menu"
              draggable="false"
            >
              <Icon name="repeat" />Replay
            </a>
            <MenuItem
              options={ABORT_OPTIONS}
              className="w-remove-menu-item"
              onClickOption={self.abort}
            />
          </div>
          <a
            onClick={self.composer}
            className="w-com-menu"
            style={getHideStyle(!isNetwork)}
            draggable="false"
          >
            <Icon name="send" />Edit
          </a>
          <a
            onClick={onClickMenu}
            className={
              'w-delete-menu' + (disabledDeleteBtn ? ' w-disabled' : '')
            }
            style={editMenuStyle}
            draggable="false"
          >
            <Icon name="trash" />Delete
          </a>
          <FilterBtn
            onClick={self.showSettings}
            disabledRules={isRules && disabledAllRules}
            backRulesFirst={isRules && state.backRulesFirst}
            isNetwork={isNetwork}
            hide={isPlugins}
          />
          <ServiceBtn name={name} />
          <div
            onMouseEnter={self.showWeinreOptions}
            onMouseLeave={self.hideWeinreOptions}
            className={
              'w-menu-wrapper' +
              (showWeinreOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={self.showWeinreOptionsQuick}
              onDoubleClick={showAnonymousWeinre}
              className="w-weinre-menu"
              draggable="false"
            >
              <Icon name="console" />
              <span className="w-weinre-name">Weinre</span>
            </a>
            <MenuItem
              ref="weinreMenuItem"
              name="anonymous"
              icon="console"
              options={state.weinreOptions}
              className="w-weinre-menu-item"
              onClick={showAnonymousWeinre}
              onClickOption={self.showWeinre}
            />
          </div>
          <a
            onClick={self.showHttpsSettingsDialog}
            className="w-https-menu"
            draggable="false"
            style={{ color: dataCenter.hasInvalidCerts ? 'var(--c-error)' : null }}
          >
            <Icon name={state.interceptHttpsConnects ? 'ok-circle' : 'lock'} />
            <span className="w-https-name">HTTPS</span>
          </a>
          <div
            onMouseEnter={self.showHelpOptions}
            onMouseLeave={self.hideHelpOptions}
            className={
              'w-menu-wrapper' + (showHelpOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={self.showAboutDialog}
              title={
                state.hasNewVersion
                  ? 'A new version is available, click to see details'
                  : null
              }
              href={README_URL}
              target="_blank"
            >
              {state.hasNewVersion ? <i className="w-new-version-icon" /> : null}
              <Icon name="question-sign" />
              <span className="w-help-name">Help</span>
            </a>
            <MenuItem
              ref="helpMenuItem"
              options={state.helpOptions}
              onClickOption={self.onClickHelpMenu}
              name={
                <About
                  ref="aboutDialog"
                  clientVersion={clientVersion}
                  onClick={self.hideHelpOptions}
                  onCheckUpdate={self.showHasNewVersion}
                />
              }
              className="w-help-menu-item"
            />
          </div>
          <Online name={name} clientVersion={clientVersion} />
          <div
            onMouseDown={preventInputBlur}
            style={getHideStyle(!state.showCreateRules)}
            className="w-shadow w-input-menu-item w-create-rule-file-input"
          >
            <input
              ref="createRulesInput"
              onKeyDown={createRules}
              onBlur={self.hideRulesInput}
              type="text"
              maxLength="64"
              placeholder="Enter name"
            />
            {renderBtn(createRules, '+Name')}
            {renderBtn(createRules, '+Top', 'top')}
            {renderBtn(createRules, '+Group', 'group')}
            {renderBtn(self.showAddRulesDialog, '+Rule', 1)}
            {renderBtn(self.showEditorDialog, '+File', 1)}
          </div>
          <div
            onMouseDown={preventInputBlur}
            style={getHideStyle(!state.showCreateValues)}
            className="w-shadow w-input-menu-item w-create-values-input"
          >
            <input
              ref="createValuesInput"
              onKeyDown={createValues}
              onBlur={self.hideValuesInput}
              type="text"
              maxLength="64"
              placeholder="Enter name"
            />
            {renderBtn(createValues, '+Key')}
            {renderBtn(createValues, '+Group', 'group')}
            {renderBtn(self.showEditorDialog, '+File', 1)}
          </div>
          <div
            onMouseDown={preventInputBlur}
            style={getHideStyle(!state.showEditRules)}
            className="w-shadow w-input-menu-item w-edit-rules-input"
          >
            <input
              ref="editRulesInput"
              onKeyDown={self.editRules}
              onBlur={self.hideRenameRuleInput}
              type="text"
              maxLength="64"
            />
            {renderBtn(self.editRules, 'OK')}
          </div>
          <div
            onMouseDown={preventInputBlur}
            style={getHideStyle(!state.showEditValues)}
            className="w-shadow w-input-menu-item w-edit-values-input"
          >
            <input
              ref="editValuesInput"
              onKeyDown={self.editValues}
              onBlur={self.hideRenameValueInput}
              type="text"
              maxLength="64"
            />
            {renderBtn(self.editValues, 'OK')}
          </div>
        </div>
        <div className="w-container box fill">
          <ContextMenu onClick={self.onClickContextMenu} ref="contextMenu" />
          <ContextMenu onClick={self.onClickTopMenu} ref="topContextMenu" />
          <div
            onContextMenu={self.onContextMenu}
            onDoubleClick={self.onContextMenu}
            className={
              'w-left-menu' + (forceShowLeftMenu ? ' w-hover-left-menu' : '') + hideStyle
            }
            style={getHideStyle(networkMode || mustHideLeftMenu)}
            onMouseEnter={forceShowLeftMenu}
            onMouseLeave={forceHideLeftMenu}
          >
            <a
              onClick={self.showNetwork}
              className={
                'w-network-menu' + (isNetwork ? ' w-menu-selected' : '')
              }
              style={getHideStyle(rulesMode)}
              draggable="false"
            >
              <Icon name={networkType} />
              <i className="w-left-menu-name">Network</i>
            </a>
            <a
              onClick={showRules}
              className={
                'w-save-menu w-rules-menu' +
                (isRules ? ' w-menu-selected' : '')
              }
              style={hideEditorStyle}
              draggable="false"
            >
              <Icon name="list" className={disabledAllRules ? 'w-disabled' : ''} />
              <i className="w-left-menu-name">Rules</i>
              <i
                className="w-menu-changed"
                style={getHideStyle(!state.rules.hasChanged())}
              >
                *
              </i>
            </a>
            <a
              onClick={self.showValues}
              className={
                'w-save-menu w-values-menu' +
                (isValues ? ' w-menu-selected' : '')
              }
              style={hideEditorStyle}
              draggable="false"
            >
              <Icon name="folder-close" />
              <i className="w-left-menu-name">Values</i>
              <i
                className="w-menu-changed"
                style={getHideStyle(!state.values.hasChanged())}
              >
                *
              </i>
            </a>
            <a
              onClick={self.showPlugins}
              className={
                'w-plugins-menu' + (isPlugins ? ' w-menu-selected' : '')
              }
              style={pluginsStyle}
              draggable="false"
            >
              <Icon name="th-large" className={disabledAllPlugins ? 'w-disabled' : ''} />
              <i className="w-left-menu-name">Plugins</i>
            </a>
          </div>
          {state.hasRules ? (
            <List
              ref="rules"
              disabled={disabledAllRules}
              theme={rulesTheme}
              lineWrapping={autoRulesLineWrapping}
              fontSize={rulesFontSize}
              lineNumbers={showRulesLineNumbers}
              onSelect={self.selectRules}
              onUnselect={self.unselectRules}
              onActive={self.activeRules}
              modal={state.rules}
              hide={!isRules}
              name="rules"
            />
          ) : null}
          {state.hasValues ? (
            <List
              theme={valuesTheme}
              onDoubleClick={self.showEditValuesByDBClick}
              fontSize={valuesFontSize}
              lineWrapping={autoValuesLineWrapping}
              lineNumbers={showValuesLineNumbers}
              onSelect={self.saveValues}
              onActive={self.activeValues}
              modal={state.values}
              hide={!isValues}
              className="w-values-list"
              foldGutter={state.foldGutter}
            />
          ) : null}
          {state.hasNetwork ? (
            <Network
              ref="network"
              hide={!isNetwork}
              modal={modal}
              rulesModal={state.rules}
            />
          ) : null}
          {state.hasPlugins ? (
            <Plugins
              {...state}
              onOpen={self.activePluginTab}
              onClose={self.closePluginTab}
              onActive={self.activePluginTab}
              onChange={self.disablePlugin}
              ref="plugins"
              hide={!isPlugins}
            />
          ) : null}
        </div>
        <Dialog ref="rulesSettingsDialog" wstyle="w-rules-settings-dialog">
          <div className="modal-body">
            <CloseBtn />
            <EditorSettings
              name="rules"
              theme={rulesTheme}
              fontSize={rulesFontSize}
              lineNumbers={showRulesLineNumbers}
              lineWrapping={autoRulesLineWrapping}
              onLineWrappingChange={self.onRulesLineWrappingChange}
              onThemeChange={self.onRulesThemeChange}
              onFontSizeChange={self.onRulesFontSizeChange}
              onLineNumberChange={self.onRulesLineNumberChange}
            />
            {!state.drm && (
              <p className="w-editor-option">
                <label className="w-middle" style={{ color: multiEnv ? 'var(--c-disabled)' : null }}>
                  <input
                    type="checkbox"
                    disabled={multiEnv}
                    checked={!multiEnv && state.allowMultipleChoice}
                    onChange={self.allowMultipleChoice}
                  />{' '}
                  Use multiple rules
                </label>
              </p>
            )}
            {!state.drb && (
              <p className="w-editor-option">
                <label className="w-middle">
                  <input
                    type="checkbox"
                    checked={state.backRulesFirst}
                    onChange={self.enableBackRulesFirst}
                  />{' '}
                The later rules first
                </label>
              </p>
            )}
          </div>
          <div className="modal-footer">
            <DismissBtn />
            {renderBtn(self.importRulesSettings, 'Import')}
            <button
              type="button"
              className="btn btn-info"
              onClick={self.exportRulesSettings}
            >
              Export
            </button>
          </div>
        </Dialog>
        <Dialog ref="valuesSettingsDialog" wstyle="w-values-settings-dialog">
          <div className="modal-body">
            <CloseBtn />
            <EditorSettings
              theme={valuesTheme}
              fontSize={valuesFontSize}
              lineNumbers={showValuesLineNumbers}
              lineWrapping={autoValuesLineWrapping}
              onLineWrappingChange={self.onValuesLineWrappingChange}
              onThemeChange={self.onValuesThemeChange}
              onFontSizeChange={self.onValuesFontSizeChange}
              onLineNumberChange={self.onValuesLineNumberChange}
            />
            <p className="w-editor-option">
              <label className="w-middle">
                <input
                  type="checkbox"
                  checked={state.foldGutter}
                  onChange={self.showFoldGutter}
                />{' '}
                Show fold gutter
              </label>
            </p>
          </div>
          <div className="modal-footer">
            <DismissBtn />
            {renderBtn(self.importValuesSettings, 'Import')}
            <button
              type="button"
              className="btn btn-info"
              onClick={self.exportValuesSettings}
            >
              Export
            </button>
          </div>
        </Dialog>
        {rulesMode ? null : <NetworkSettings ref="networkSettings" />}
        <HttpsSettings
          ref="httpsSettings"
          caHash={caHash}
          port={state.port}
          caUrlList={state.caUrlList}
          multiEnv={multiEnv}
          interceptHttpsConnects={state.interceptHttpsConnects}
          enableHttp2={state.enableHttp2}
          onEnableHttps={self.interceptHttpsConnects}
          onEnableHttp2={self.enableHttp2}
        />
        <Dialog ref="chooseFileType" wstyle="w-choose-file-type" onClose={self.onCloseChooseFileTypeDialog}>
          <div className="modal-body">
            <label className="w-choose-file-type-label">
              Save As
              <input
                ref="sessionsName"
                value={state.filename}
                onChange={self.filterFilename}
                onKeyDown={self.exportBySave}
                placeholder="Enter filename (optional)"
                className="form-control"
                maxLength="64"
              />
              <select
                ref="fileType"
                className="form-control"
                value={state.exportFileType}
                onChange={self.chooseFileType}
              >
                <option value="whistle">*.txt</option>
                <option value="har">*.har</option>
                <option value="Fiddler">*.saz</option>
              </select>
            </label>
          </div>
          <div className="modal-footer">
            <DismissBtn />
            <button
              type="button"
              tabIndex="0"
              onMouseDown={preventInputBlur}
              className="btn btn-default"
              onClick={self.exportAll}
              disabled={!hasSession}
            >
              Export All
            </button>
            <SaveToServiceBtn
              type="network"
              disabled={!selectedCount}
              onComplete={self.hideChooseFileTypeDialog}
              getFilename={self.getInputValue} data={self.getExportSessions}
            />
            <button
              type="button"
              onKeyDown={self.exportBySave}
              tabIndex="0"
              onMouseDown={preventInputBlur}
              className="btn btn-primary"
              onClick={self.exportBySave}
              disabled={!selectedCount}
            >
              Export Selected ({selectedCount})
            </button>
          </div>
        </Dialog>
        <LargeDialog ref="editorWin" className="w-editor-win" openInNewWin={self.openEditorInNewWin} />
        <LargeDialog ref="innerWin" className="w-inner-win" />
        <Dialog ref="setReplayCount" wstyle="w-replay-count-dialog">
          <div className="modal-body">
            <label>
              Times:
              <input
                ref="replayCount"
                placeholder={'<= ' + MAX_REPLAY_COUNT}
                onKeyDown={replayRepeat}
                onChange={self.replayCountChange}
                value={state.replayCount}
                className="form-control"
                maxLength="3"
              />
            </label>
            <button
              type="button"
              onKeyDown={replayRepeat}
              tabIndex="0"
              onMouseDown={preventInputBlur}
              className="btn btn-primary"
              disabled={!state.replayCount}
              onClick={replayRepeat}
            >
              Replay
            </button>
          </div>
        </Dialog>
        <Dialog ref="showUpdateTipsDialog" wstyle="w-show-update-tips-dialog">
          <div className="modal-body">
            <CloseBtn />
            <p className="w-show-update-tips">
            Whistle has critical updates available.
            Update to the latest version immediately.
            </p>
            <p>Current version: {state.version}</p>
            <p>Latest version: {state.latestVersion}</p>
            <p>
              View change:{' '}
              <a onClick={util.openChangeLog}>
                CHANGELOG.md
              </a>
            </p>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-default"
              onClick={self.donotShowAgain}
              data-dismiss="modal"
            >
              Skip
            </button>
            <a
              type="button"
              className="btn btn-primary"
              onClick={self.hideUpdateTipsDialog}
              href={util.UPDATE_URL}
              target="_blank"
            >
              View Update Guide
            </a>
          </div>
        </Dialog>
        <Dialog ref="confirmReload" wstyle="w-confirm-reload-dialog">
          <div className="modal-body w-confirm-reload">
            <CloseBtn />
            <div className="w-reload-data-tips"></div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              No
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={self.reloadData}
              data-dismiss="modal"
            >
              Yes
            </button>
          </div>
        </Dialog>
        <ListDialog
          ref="deleteRulesDialog"
          title="Delete Rules"
          tips={DEL_RULES}
          onConfirm={self.removeRulesBatch}
          name="rules"
          isRules="1"
          list={state.rules.list}
        />
        <ListDialog
          ref="deleteValuesDialog"
          title="Delete Values"
          tips={DEL_VALUE}
          onConfirm={self.removeValuesBatch}
          name="values"
          list={state.values.list}
        />
        <ListDialog
          ref="selectRulesDialog"
          name="rules"
          modal={state.rules}
          list={state.rules.list}
        />
        <ListDialog
          ref="selectValuesDialog"
          title="Export Values"
          name="values"
          list={state.values.list}
        />
        <iframe name="downloadTargetFrame" style={HIDE_STYLE} />
        <form
          ref="exportSessionsForm"
          action="cgi-bin/sessions/export"
          style={HIDE_STYLE}
          method="post"
          target="downloadTargetFrame"
        >
          <input ref="exportFilename" name="exportFilename" type="hidden" />
          <input ref="exportFileType" name="exportFileType" type="hidden" />
          <input ref="sessions" name="sessions" type="hidden" />
        </form>
        <SyncDialog ref="syncDialog" />
        <JSONDialog ref="jsonDialog" />
        <div id="copyTextBtn" style={HIDE_STYLE} />
        <RulesDialog ref="rulesDialog" />
        <form
          ref="downloadForm"
          action="cgi-bin/download"
          style={HIDE_STYLE}
          method="post"
          target="downloadTargetFrame"
        >
          <input ref="dataType" name="type" type="hidden" />
          <input ref="filename" name="filename" type="hidden" />
          <input ref="content" name="content" type="hidden" />
        </form>
        <IframeDialog ref="iframeDialog" />
        <ImportDialog ref="importDialog" />
        <ExportDialog ref="exportDialog" />
        {/* 初始化 EditorDialog 给 Rules 里面的快捷键使用 */}
        <EditorDialog textEditor standalone />
        <EditorDialog ref="editorDialog" />
        <ServiceDialog />
        <CreateRuleDialog ref="addRulesDialog" />
        <TestRuleDialog ref="testRuleDialog" />
      </div>
    );
  }
});
dataCenter.getInitialData(function (data) {
  ReactDOM.render(<Index modal={data} />, document.getElementById('container'));
});
