require('../css/index.css');
var $ = require('jquery');
var React = require('react');
var ReactDOM = require('react-dom');
var Clipboard = require('clipboard');

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
var events = require('./events');
var storage = require('./storage');
var Dialog = require('./dialog');
var ListDialog = require('./list-dialog');
var FilterBtn = require('./filter-btn');
var FilesDialog = require('./files-dialog');
var message = require('./message');
var UpdateAllBtn = require('./update-all-btn');
var ContextMenu = require('./context-menu');
var CertsInfoDialog = require('./certs-info-dialog');
var SyncDialog = require('./sync-dialog');
var win = require('./win');

var H2_RE = /http\/2\.0/i;
var JSON_RE = /^\s*(?:[\{｛][\w\W]+[\}｝]|\[[\w\W]+\])\s*$/;
var DEFAULT = 'Default';
var MAX_PLUGINS_TABS = 7;
var MAX_FILE_SIZE = 1024 * 1024 * 128;
var MAX_OBJECT_SIZE = 1024 * 1024 * 6;
var MAX_LOG_SIZE = 1024 * 1024 * 2;
var MAX_REPLAY_COUNT = 100;
var LINK_SELECTOR = '.cm-js-type, .cm-js-http-url, .cm-string, .cm-js-at';
var LINK_RE = /^"(https?:)?(\/\/[^/]\S+)"$/i;
var AT_LINK_RE = /^@(https?:)?(\/\/[^/]\S+)$/i;
var OPTIONS_WITH_SELECTED = [
  'removeSelected',
  'exportWhistleFile',
  'exportSazFile'
];
var search = window.location.search;
var hideLeftMenu;
var showTreeView;

if (/[&#?]showTreeView=(0|false|1|true)(?:&|$|#)/.test(search)) {
  showTreeView = RegExp.$1 === '1' || RegExp.$1 === 'true';
}

if (/[&#?]hideLeft(?:Bar|Menu)=(0|false|1|true)(?:&|$|#)/.test(search)) {
  hideLeftMenu = RegExp.$1 === '1' || RegExp.$1 === 'true';
} else if (/[&#?]showLeft(?:Bar|Menu)=(0|false|1|true)(?:&|$|#)/.test(search)) {
  hideLeftMenu = RegExp.$1 === '0' || RegExp.$1 === 'false';
}

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
    name: 'Export Selected',
    icon: 'export',
    id: 'exportRules'
  },
  {
    name: 'Export All',
    href: 'cgi-bin/rules/export',
    target: 'downloadTargetFrame',
    id: 'exportAllRules'
  },
  {
    name: 'Import',
    icon: 'import',
    id: 'importRules'
  }
];
var VALUES_ACTIONS = [
  {
    name: 'Export Selected',
    icon: 'export',
    id: 'exportValues'
  },
  {
    name: 'Export All',
    href: 'cgi-bin/values/export',
    target: 'downloadTargetFrame',
    id: 'exportAllValues'
  },
  {
    name: 'Import',
    icon: 'import',
    id: 'importValues'
  }
];
var REMOVE_OPTIONS = [
  {
    name: 'Remove Selected Sessions',
    icon: 'remove',
    id: 'removeSelected',
    disabled: true,
    title: 'Ctrl[Command] + D'
  },
  {
    name: 'Remove Unselected Sessions',
    id: 'removeUnselected',
    disabled: true,
    title: 'Ctrl[Command] + Shift + D'
  }
];
var ABORT_OPTIONS = [
  {
    name: 'Abort',
    icon: 'ban-circle',
    id: 'abort'
  }
];

function checkJson(item) {
  if (/\.json$/i.test(item.name) && JSON_RE.test(item.value)) {
    try {
      JSON.parse(item.value);
    } catch (e) {
      message.warn(
        'Warning: the value of ' +
          item.name +
          ' can`t be parsed into json. ' +
          e.message
      );
    }
  }
}

function getJsonForm(data, name) {
  data = JSON.stringify(data);
  var form = new FormData();
  var file = new File([data], 'data.json', { type: 'application/json' });
  form.append(name || 'rules', file);
  return form;
}

function checkUrl(url) {
  url = url.trim();
  if (!url) {
    message.error('The url cannot be empty.');
    return;
  }
  if (!/^https?:\/\/[^/]/i.test(url)) {
    message.error('Please input the correct url.');
    return;
  }
  return url;
}

function getRemoteDataHandler(callback) {
  return function (data, xhr) {
    if (!data) {
      util.showSystemError(xhr);
      return callback(true);
    }
    if (data.ec !== 0) {
      message.error(data.em);
      return callback(true);
    }
    try {
      data = data.body && JSON.parse(data.body);
      if (!data || !Object.keys(data).length) {
        message.info('No body data.');
      } else {
        return callback(false, data);
      }
    } catch (e) {
      message.error(e.message);
    }
    callback(true);
  };
}

function getPageName(options) {
  if (options.networkMode) {
    return 'network';
  }
  if (options.rulesMode && options.pluginsMode) {
    return 'plugins';
  }
  var hash = location.hash.substring(1);
  if (hash) {
    hash = hash.replace(/[?#].*$/, '');
  } else {
    hash = location.href.replace(/[?#].*$/, '').replace(/.*\//, '');
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

  return hash;
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

var Index = React.createClass({
  getInitialState: function () {
    var modal = this.props.modal;
    var rules = modal.rules;
    var values = modal.values;
    var multiEnv = !!modal.server.multiEnv;
    var caType = storage.get('caType');
    if (caType !== 'cer' && caType !== 'pem') {
      caType = 'crt';
    }
    var state = {
      replayCount: 1,
      tabs: [],
      caType: caType,
      allowMultipleChoice: modal.rules.allowMultipleChoice,
      backRulesFirst: modal.rules.backRulesFirst,
      networkMode: !!modal.server.networkMode,
      rulesMode: !!modal.server.rulesMode,
      pluginsMode: !!modal.server.pluginsMode,
      rulesOnlyMode: !!modal.server.rulesOnlyMode,
      multiEnv: modal.server.multiEnv,
      isWin: modal.server.isWin,
      ndr: modal.server.ndr,
      ndp: modal.server.ndp,
      drb: modal.server.drb,
      drm: modal.server.drm,
      version: modal.version
    };
    if (hideLeftMenu !== false) {
      hideLeftMenu = hideLeftMenu || modal.server.hideLeftMenu;
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

    var rulesTheme = storage.get('rulesTheme');
    var valuesTheme = storage.get('valuesTheme');
    var rulesFontSize = storage.get('rulesFontSize');
    var valuesFontSize = storage.get('valuesFontSize');
    var showRulesLineNumbers = storage.get('showRulesLineNumbers');
    var showValuesLineNumbers = storage.get('showValuesLineNumbers');
    var autoRulesLineWrapping = storage.get('autoRulesLineWrapping');
    var autoValuesLineWrapping = storage.get('autoValuesLineWrapping');
    var selectedName;

    if (rules) {
      selectedName = storage.get('activeRules') || rules.current;
      var selected = !rules.defaultRulesIsDisabled;
      if (!rulesTheme) {
        rulesTheme = rules.theme;
      }
      if (!rulesFontSize) {
        rulesFontSize = rules.fontSize;
      }
      if (!showRulesLineNumbers) {
        showRulesLineNumbers = rules.showLineNumbers ? 'true' : 'false';
      }
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
      selectedName = storage.get('activeValues') || values.current;
      if (!valuesTheme) {
        valuesTheme = values.theme;
      }
      if (!valuesFontSize) {
        valuesFontSize = values.fontSize;
      }
      if (!showValuesLineNumbers) {
        showValuesLineNumbers = values.showLineNumbers ? 'true' : 'false';
      }
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
    dataCenter.rulesModal = rulesModal;
    state.rulesTheme = rulesTheme;
    state.valuesTheme = valuesTheme;
    state.rulesFontSize = rulesFontSize;
    state.valuesFontSize = valuesFontSize;
    state.showRulesLineNumbers = showRulesLineNumbers === 'true';
    state.showValuesLineNumbers = showValuesLineNumbers === 'true';
    state.autoRulesLineWrapping = !!autoRulesLineWrapping;
    state.foldGutter = !!storage.get('foldGutter') !== '';
    state.autoValuesLineWrapping = !!autoValuesLineWrapping;
    state.plugins = modal.plugins;
    state.disabledPlugins = modal.disabledPlugins;
    state.disabledAllRules = modal.disabledAllRules;
    state.disabledAllPlugins = modal.disabledAllPlugins;
    state.interceptHttpsConnects = !multiEnv && modal.interceptHttpsConnects;
    state.enableHttp2 = modal.enableHttp2;
    state.rules = rulesModal;
    state.network = networkModal;
    state.rulesOptions = rulesOptions;
    state.pluginsOptions = this.createPluginsOptions(modal.plugins);
    dataCenter.valuesModal = state.values = valuesModal;
    state.valuesOptions = valuesOptions;
    dataCenter.syncData = this.syncData;
    dataCenter.syncRules = this.syncRules;
    dataCenter.syncValues = this.syncValues;

    this.initPluginTabs(state, modal.plugins);
    if (rulesModal.exists(dataCenter.activeRulesName)) {
      this.setRulesActive(dataCenter.activeRulesName, rulesModal);
    }
    if (valuesModal.exists(dataCenter.activeValuesName)) {
      this.setValuesActive(dataCenter.activeValuesName, valuesModal);
    }

    state.networkOptions = [
      {
        name: 'Remove All Sessions',
        icon: 'remove',
        id: 'removeAll',
        disabled: true,
        title: 'Ctrl[Command] + X'
      },
      {
        name: 'Remove Selected Sessions',
        id: 'removeSelected',
        disabled: true,
        title: 'Ctrl[Command] + D'
      },
      {
        name: 'Remove Unselected Sessions',
        id: 'removeUnselected',
        disabled: true,
        title: 'Ctrl[Command] + Shift + D'
      },
      {
        name: 'Export Selected Sessions (*.txt)',
        icon: 'export',
        id: 'exportWhistleFile',
        disabled: true,
        title: 'Ctrl + S'
      },
      {
        name: 'Export Selected Sessions (*.saz)',
        id: 'exportSazFile',
        disabled: true,
        title: 'Ctrl + S'
      },
      {
        name: 'Export Selected Sessions (*.har)',
        id: 'exportHarFile',
        disabled: true,
        title: 'Ctrl + S'
      },
      {
        name: 'Import Sessions',
        icon: 'import',
        id: 'importSessions',
        title: 'Ctrl + I'
      },
      {
        name: 'Show Tree View',
        icon: 'tree-conifer',
        id: 'toggleView'
      }
    ];
    state.helpOptions = [
      {
        name: 'GitHub',
        href: 'https://github.com/avwo/whistle',
        icon: false
      },
      {
        name: 'Docs',
        href: 'https://avwo.github.io/whistle/',
        icon: false
      },
      {
        name: 'Update',
        href: 'https://avwo.github.io/whistle/update.html',
        icon: false
      },
      {
        name: 'Issue',
        href: 'https://github.com/avwo/whistle/issues/new',
        icon: false
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
    var self = this;
    events.on('importSessionsFromUrl', function (_, url) {
      self.importSessionsFromUrl(url);
    });
    return this.updateMenuView(state);
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
    util.triggerListChange('rules', this.getListByName('rules', type));
  },
  triggerValuesChange: function (type) {
    util.triggerListChange('values', this.getListByName('values', type));
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
  reloadRules: function (data) {
    var self = this;
    var selectedName = storage.get('activeRules', true) || data.current;
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
    self.state.rules.reset(rulesList, rulesData);
    self.setState({});
  },
  reloadValues: function (data) {
    var self = this;
    var selectedName = storage.get('activeValues', true) || data.current;
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
    self.state.values.reset(valuesList, valuesData);
    self.setState({});
  },
  reloadData: function () {
    var self = this;
    var dialog = $('.w-reload-data-tips').closest('.w-confirm-reload-dialog');
    var name = dialog.find('.w-reload-data-tips').attr('data-name');
    var isRules = name === 'rules';
    var handleResponse = function (data, xhr) {
      if (!data) {
        util.showSystemError(xhr);
        return;
      }
      if (isRules) {
        self.reloadRules(data);
        self.triggerRulesChange('reload');
      } else {
        self.reloadValues(data);
        self.triggerValuesChange('reload');
      }
    };
    if (isRules) {
      dataCenter.rules.list(handleResponse);
      events.trigger('reloadRulesRecycleBin');
    } else {
      dataCenter.values.list(handleResponse);
      events.trigger('reloadValuesRecycleBin');
    }
  },
  showReloadRules: function () {
    if (this.state.name === 'rules' && this.rulesChanged) {
      this.rulesChanged = false;
      var hasChanged = this.state.rules.hasChanged();
      this.showReloadDialog(
        'The rules has been modified.<br/>Do you want to reload it.',
        hasChanged
      );
    }
  },
  showReloadValues: function () {
    if (this.state.name === 'values' && this.valuesChanged) {
      this.valuesChanged = false;
      var hasChanged = this.state.values.hasChanged();
      this.showReloadDialog(
        'The values has been modified.<br/>Do you want to reload it.',
        hasChanged
      );
    }
  },
  componentDidUpdate: function () {
    this.showReloadRules();
    this.showReloadValues();
  },
  showReloadDialog: function (msg, existsUnsaved) {
    var confirmReload = this.refs.confirmReload;
    confirmReload.show();
    if (existsUnsaved) {
      msg +=
        '<p class="w-confim-reload-note">Note: There are unsaved changes.</p>';
    }
    $('.w-reload-data-tips').html(msg).attr('data-name', this.state.name);
  },
  componentDidMount: function () {
    var self = this;
    var clipboard = new Clipboard('.w-copy-text');
    clipboard.on('error', function (e) {
      win.alert('Copy failed.');
    });
    clipboard = new Clipboard('.w-copy-text-with-tips');
    clipboard.on('error', function (e) {
      message.error('Copy failed.');
    });
    clipboard.on('success', function (e) {
      message.success('Copied clipboard.');
    });
    var preventDefault = function (e) {
      e.preventDefault();
    };
    events.on('enableRecord', function () {
      self.enableRecord();
    });
    events.on('rulesChanged', function () {
      self.rulesChanged = true;
      self.showReloadRules();
    });
    events.on('switchTreeView', function () {
      self.toggleTreeView();
    });
    events.on('updateGlobal', function () {
      self.setState({});
    });
    events.on('valuesChanged', function () {
      self.valuesChanged = true;
      self.showReloadValues();
    });
    events.on('disableAllPlugins', self.disableAllPlugins);
    events.on('disableAllRules', self.disableAllRules);
    events.on('showFiles', function (_, data) {
      self.files = self.files || data;
      self.showFiles();
    });

    events.on('activeRules', function () {
      var rulesModal = dataCenter.rulesModal;
      if (rulesModal.exists(dataCenter.activeRulesName)) {
        self.setRulesActive(dataCenter.activeRulesName, rulesModal);
        self.setState({});
      }
    });

    events.on('activeValues', function () {
      var valuesModal = dataCenter.valuesModal;
      if (valuesModal.exists(dataCenter.activeValuesName)) {
        self.setValuesActive(dataCenter.activeValuesName, valuesModal);
        self.setState({});
      }
    });

    events.on('recoverRules', function (_, data) {
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
              events.trigger('rulesRecycleList', result);
              events.trigger('focusRulesList');
            } else {
              util.showSystemError(xhr);
            }
          }
        );
      };
      if (!modal.exists(filename)) {
        return handleRecover(true);
      }
      win.confirm(
        'The name `' + filename + '`  already exists, whether to overwrite it?',
        handleRecover
      );
    });

    events.on('recoverValues', function (_, data) {
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
              events.trigger('valuesRecycleList', result);
            } else {
              util.showSystemError(xhr);
            }
          }
        );
      };
      if (!modal.exists(filename)) {
        return handleRecover(true);
      }
      win.confirm(
        'The name `' + filename + '`  already exists, whether to overwrite it?',
        handleRecover
      );
    });

    $(document)
      .on('dragleave', preventDefault)
      .on('dragenter', preventDefault)
      .on('dragover', preventDefault)
      .on('drop', function (e) {
        e.preventDefault();
        var files = e.originalEvent.dataTransfer.files;
        var file = files && files[0];
        if (!file) {
          return;
        }
        if ($('.w-files-dialog.in').length) {
          return events.trigger('uploadFile', file);
        }
        var data;
        var name = self.state.name;
        var target = $(e.target);
        if (name === 'network') {
          if (target.closest('.w-frames-composer').length) {
            return;
          }
          if (/\.log$/i.test(file.name)) {
            if (file.size > MAX_LOG_SIZE) {
              return win.alert('The file size cannot exceed 2m.');
            }
            util.readFileAsText(file, function (logs) {
              logs = util.parseLogs(logs);
              if (!logs) {
                return;
              }
              if (dataCenter.uploadLogs !== null) {
                dataCenter.uploadLogs = logs;
              }
              events.trigger('showLog');
              events.trigger('uploadLogs', { logs: logs });
            });
            return;
          }
          data = new FormData();
          data.append('importSessions', files[0]);
          self.uploadSessionsForm(data);
        }
        if (target.closest('.w-divider-left').length) {
          if (name === 'rules') {
            data = new FormData();
            data.append('rules', files[0]);
            self.rulesForm = data;
            self.refs.confirmImportRules.show();
          } else if (name === 'values') {
            data = new FormData();
            data.append('values', files[0]);
            self.valuesForm = data;
            self.refs.confirmImportValues.show();
          }
        }
      })
      .on('keydown', function (e) {
        if ((e.metaKey || e.ctrlKey) && e.keyCode === 82) {
          e.preventDefault();
        }
      });
    var removeItem = function (e) {
      var target = e.target;
      if (
        target.nodeName == 'A' &&
        $(target).parent().hasClass('w-list-data')
      ) {
        self.state.name == 'rules' ? self.removeRules() : self.removeValues();
      }
      e.preventDefault();
    };
    $(window)
      .on('hashchange', function () {
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
      })
      .on('keyup', function (e) {
        if (e.keyCode == 27) {
          self.setMenuOptionsState();
          var dialog = $('.modal');
          if (typeof dialog.modal == 'function') {
            dialog.modal('hide');
          }
        }
      })
      .on('keydown', function (e) {
        e.keyCode == 46 && removeItem(e);
        if (!e.ctrlKey && !e.metaKey) {
          if (e.keyCode === 112) {
            e.preventDefault();
            window.open(
              'https://avwo.github.io/whistle/webui/' +
                self.state.name +
                '.html'
            );
          } else if (e.keyCode === 116) {
            e.preventDefault();
          }
          return;
        }
        if (e.keyCode === 77) {
          self.toggleLeftMenu();
          e.preventDefault();
        } else if (e.keyCode === 66) {
          self.toggleTreeView();
          e.preventDefault();
          events.trigger('toggleTreeViewByAccessKey');
        }
        var isNetwork = self.state.name === 'network';
        if (isNetwork && e.keyCode == 88) {
          if (
            !util.isFocusEditor() &&
            !$(e.target).closest('.w-frames-list').length
          ) {
            self.clear();
          }
        }
        e.keyCode == 68 && removeItem(e);
        var modal = self.state.network;
        if (isNetwork && e.keyCode === 83) {
          e.preventDefault();
          if ($('.modal.in').length) {
            if (
              $(ReactDOM.findDOMNode(self.refs.chooseFileType)).is(':visible')
            ) {
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
            $(ReactDOM.findDOMNode(self.refs.chooseFileType)).modal('show');
            setTimeout(function () {
              ReactDOM.findDOMNode(self.refs.sessionsName).focus();
            }, 500);
          }
          return;
        }

        if (isNetwork && e.keyCode === 73) {
          self.importSessions(e);
          e.preventDefault();
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
        if (
          elem.hasClass('cm-js-http-url') ||
          elem.hasClass('cm-string') ||
          elem.hasClass('cm-js-at') ||
          getKey(elem.text())
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
        if (elem.hasClass('cm-js-http-url')) {
          if (!/^https?:\/\//i.test(text)) {
            text = 'http:' + (text[0] === '/' ? '' : '//') + text;
          }
          window.open(text);
          return;
        }
        var name = getKey(text);
        if (name) {
          self.showAndActiveValues({ name: name });
          return;
        }
      });

    if (self.state.name == 'network') {
      self.startLoadData();
    }
    dataCenter.on('settings', function (data) {
      var state = self.state;
      var server = data.server;
      if (
        state.interceptHttpsConnects !== data.interceptHttpsConnects ||
        state.enableHttp2 !== data.enableHttp2 ||
        state.disabledAllRules !== data.disabledAllRules ||
        state.allowMultipleChoice !== data.allowMultipleChoice ||
        state.disabledAllPlugins !== data.disabledAllPlugins ||
        state.multiEnv != server.multiEnv ||
        state.ndp != server.ndp ||
        state.ndr != server.ndr ||
        state.drb != server.drb ||
        state.drm != server.drm
      ) {
        state.interceptHttpsConnects = data.interceptHttpsConnects;
        state.enableHttp2 = data.enableHttp2;
        state.disabledAllRules = data.disabledAllRules;
        state.allowMultipleChoice = data.allowMultipleChoice;
        state.disabledAllPlugins = data.disabledAllPlugins;
        state.multiEnv = server.multiEnv;
        state.ndp = server.ndp;
        state.ndr = server.ndr;
        state.drb = server.drb;
        state.drm = server.drm;
        protocols.setPlugins(state);
        var list = LEFT_BAR_MENUS;
        list[3].checked = !state.disabledAllRules;
        list[4].checked = !state.disabledAllPlugins;
        self.setState({});
        self.refs.contextMenu.update();
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

    events.on('executeComposer', function () {
      self.autoRefresh && self.autoRefresh();
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

    events.on('updateUI', function () {
      self.setState({});
    });

    events.on('replaySessions', function (e, curItem, shiftKey) {
      var modal = self.state.network;
      var list = getFocusItemList(curItem) || modal.getSelectedList();
      var len = list && list.length;
      if (shiftKey && len === 1) {
        self.replayList = list;
        self.refs.setReplayCount.show();
        setTimeout(function () {
          var input = ReactDOM.findDOMNode(self.refs.replayCount);
          input.select();
          input.focus();
        }, 300);
        return;
      }
      self.replay(e, list);
    });
    events.on('importSessions', self.importSessions);
    events.on('filterSessions', self.showSettings);
    events.on('exportSessions', function (e, curItem) {
      self.exportData(e, getFocusItemList(curItem));
    });
    events.on('abortRequest', function (e, curItem) {
      self.abort(getFocusItemList(curItem));
    });
    events.on('uploadSessions', function (e, data) {
      var sessions = getFocusItemList(data && data.curItem);
      var upload = data && data.upload;
      if (typeof upload === 'function') {
        if (!sessions) {
          var modal = self.state.network;
          sessions = modal.getSelectedList();
          if (sessions && sessions.length) {
            sessions = $.extend(true, [], sessions);
          }
        }
        sessions && upload(sessions);
      }
    });
    events.on('removeIt', function (e, item) {
      var modal = self.state.network;
      if (item && modal) {
        modal.remove(item);
        self.setState({});
      }
    });
    events.on('removeOthers', function (e, item) {
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
    events.on('clearAll', self.clear);
    events.on('removeSelected', function () {
      var modal = self.state.network;
      if (modal) {
        modal.removeSelectedItems();
        self.setState({});
      }
    });
    events.on('removeUnselected', function () {
      var modal = self.state.network;
      if (modal) {
        modal.removeUnselectedItems();
        self.setState({});
      }
    });
    events.on('removeUnmarked', function () {
      var modal = self.state.network;
      if (modal) {
        modal.removeUnmarkedItems();
        self.setState({});
      }
    });
    events.on('saveRules', function (e, item) {
      if (item.changed || !item.selected) {
        var list = self.state.rules.getChangedGroupList(item);
        list.forEach(self.selectRules);
      } else {
        self.unselectRules(item);
      }
    });
    events.on('saveValues', function (e, item) {
      var list = self.state.values.getChangedGroupList(item);
      list.forEach(self.saveValues);
    });
    events.on('renameRules', function (e, item) {
      self.showEditRules(item);
    });
    events.on('renameValues', function (e, item) {
      self.showEditValues(item);
    });
    events.on('deleteRules', function (e, item) {
      setTimeout(function () {
        self.removeRules(item);
      }, 0);
    });
    events.on('deleteValues', function (e, item) {
      setTimeout(function () {
        self.removeValues(item);
      }, 0);
    });
    events.on('createRules', self.showCreateRules);
    events.on('createValues', self.showCreateValues);
    events.on('exportRules', self.exportData);
    events.on('exportValues', self.exportData);
    events.on('importRules', self.importRules);
    events.on('importValues', self.importValues);
    events.on('uploadRules', function (e, data) {
      var form = getJsonForm(data);
      form.append('replaceAll', '1');
      self._uploadRules(form, true);
    });
    events.on('uploadValues', function (e, data) {
      var form = getJsonForm(data, 'values');
      form.append('replaceAll', '1');
      self._uploadValues(form, true);
    });
    var timeout;
    $(document).on('visibilitychange', function () {
      clearTimeout(timeout);
      if (document.hidden) {
        return;
      }
      timeout = setTimeout(function () {
        var atBottom = self.scrollerAtBottom && self.scrollerAtBottom();
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
              $(ReactDOM.findDOMNode(self.refs.showUpdateTipsDialog)).modal(
                'show'
              );
            }
          );
        }
      });
    }, 10000);

    dataCenter.getLogIdList = this.getLogIdListFromRules;
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
      if (typeof onReady === 'function') {
        onReady({
          url: location.href,
          pageId: dataCenter.getPageId(),
          compose: dataCenter.compose,
          importSessions: self.importAnySessions,
          importHarSessions: self.importHarSessions,
          clearSessions: self.clear,
          selectIndex: function (index) {
            events.trigger('selectedIndex', index);
          }
        });
      }
    } catch (e) {}
  },
  importAnySessions: function (data) {
    if (data) {
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
    $(ReactDOM.findDOMNode(this.refs.showUpdateTipsDialog)).modal('hide');
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
          logId = util.removeProtocol(logId.trim());
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
          weinre = util.removeProtocol(weinre.trim());
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
          return getKey(util.removeProtocol(key.trim()));
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
    var modal = this.state.rules;
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
    modal = this.state.values;
    modal.list.forEach(function (name) {
      if (/\.rules$/.test(name)) {
        result.push(modal.get(name).value);
      }
    });

    return activeList.concat(selectedList).concat(result).join('\r\n');
  },
  preventBlur: function (e) {
    e.target.nodeName != 'INPUT' && e.preventDefault();
  },
  startLoadData: function () {
    var self = this;
    if (self._updateNetwork) {
      self._updateNetwork();
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
    this.container = baseDom;
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

    function atBottom() {
      var body = baseDom.find(
        '.ReactVirtualized__Grid__innerScrollContainer'
      )[0];
      if (!body) {
        return true;
      }
      return con.scrollTop + con.offsetHeight + 5 > body.offsetHeight;
    }
  },
  showPlugins: function (e) {
    if (this.state.name != 'plugins') {
      this.setMenuOptionsState();
      this.hidePluginsOptions();
    } else if (e && !this.state.showLeftMenu) {
      this.showPluginsOptions();
    }
    this.setState({
      hasPlugins: true,
      name: 'plugins'
    });
    util.changePageName('plugins');
  },
  handleAction: function (type) {
    if (type === 'top') {
      this.container[0].scrollTop = 0;
      return;
    }
    if (type === 'bottom') {
      return this.autoRefresh(true);
    }
    if (type === 'pause') {
      events.trigger('changeRecordState', type);
      return dataCenter.pauseNetworkRecord();
    }
    var refresh = type === 'refresh';
    if (refresh) {
      events.trigger('changeRecordState');
    } else {
      events.trigger('changeRecordState', 'stop');
    }
    dataCenter.stopNetworkRecord(!refresh);
    if (refresh) {
      return this.autoRefresh();
    }
  },
  showNetwork: function (e) {
    if (this.state.name == 'network') {
      e && !this.state.showLeftMenu && this.showNetworkOptions();
      return;
    }
    this.setMenuOptionsState();
    this.setState(
      {
        hasNetwork: true,
        name: 'network'
      },
      function () {
        this.startLoadData();
      }
    );
    util.changePageName('network');
  },
  handleNetwork: function (item, e) {
    var modal = this.state.network;
    if (item.id == 'removeAll') {
      this.clear();
    } else if (item.id == 'removeSelected') {
      modal.removeSelectedItems();
    } else if (item.id == 'removeUnselected') {
      modal.removeUnselectedItems();
    } else if (item.id == 'exportWhistleFile') {
      this.exportSessions('whistle');
    } else if (item.id == 'exportSazFile') {
      this.exportSessions('Fiddler');
    } else if (item.id == 'exportHarFile') {
      this.exportSessions('har');
    } else if (item.id == 'importSessions') {
      this.importSessions(e);
    } else if (item.id === 'toggleView') {
      this.toggleTreeView();
    }
    this.hideNetworkOptions();
  },
  importData: function (e) {
    switch (this.state.name) {
    case 'network':
      this.importSessions(e);
      break;
    case 'rules':
      this.importRules(e);
      break;
    case 'values':
      this.importValues(e);
      break;
    }
  },
  exportData: function (e, curItem) {
    switch (this.state.name) {
    case 'network':
      var modal = this.state.network;
      var hasSelected = Array.isArray(curItem) || modal.hasSelected();
      this.currentFoucsItem = curItem;
      if (hasSelected) {
        $(ReactDOM.findDOMNode(this.refs.chooseFileType)).modal('show');
        var self = this;
        setTimeout(function () {
          ReactDOM.findDOMNode(self.refs.sessionsName).focus();
        }, 500);
      } else {
        message.info('Please select the sessions first.');
      }
      break;
    case 'rules':
      this.showAndActiveRules({ id: 'exportRules' });
      break;
    case 'values':
      this.showAndActiveValues({ id: 'exportValues' });
      break;
    }
  },
  importSessions: function (e, data) {
    var self = this;
    var shiftKey = (e && e.shiftKey) || (data && data.shiftKey);
    if (shiftKey) {
      self.refs.importRemoteSessions.show();
      setTimeout(function () {
        var input = ReactDOM.findDOMNode(self.refs.sessionsRemoteUrl);
        input.focus();
        input.select();
      }, 500);
      return;
    }
    ReactDOM.findDOMNode(self.refs.importSessions).click();
  },
  importSessionsFromUrl: function (url, byInput) {
    if (!url) {
      return;
    }
    var self = this;
    self.setState({ pendingSessions: true });
    dataCenter.importRemote(
      { url: url },
      getRemoteDataHandler(function (err, data) {
        self.setState({ pendingSessions: false });
        if (!err) {
          byInput && self.refs.importRemoteSessions.hide();
          self.importAnySessions(data);
        }
      })
    );
  },
  importRemoteSessions: function (e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    var self = this;
    var input = ReactDOM.findDOMNode(self.refs.sessionsRemoteUrl);
    var url = checkUrl(input.value);
    self.importSessionsFromUrl(url, true);
  },
  importRules: function (e, data) {
    var self = this;
    var shiftKey = (e && e.shiftKey) || (data && data.shiftKey);
    if (shiftKey) {
      self.refs.importRemoteRules.show();
      setTimeout(function () {
        var input = ReactDOM.findDOMNode(self.refs.rulesRemoteUrl);
        input.focus();
        input.select();
      }, 500);
      return;
    }
    ReactDOM.findDOMNode(self.refs.importRules).click();
  },
  importRemoteRules: function (e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    var self = this;
    var input = ReactDOM.findDOMNode(self.refs.rulesRemoteUrl);
    var url = checkUrl(input.value);
    if (!url) {
      return;
    }
    self.setState({ pendingRules: true });
    dataCenter.importRemote(
      { url: url },
      getRemoteDataHandler(function (err, data) {
        self.setState({ pendingRules: false });
        if (err) {
          return;
        }
        self.refs.importRemoteRules.hide();
        if (data) {
          self.rulesForm = getJsonForm(data);
          self.refs.confirmImportRules.show();
        }
      })
    );
  },
  importValues: function (e, data) {
    var self = this;
    var shiftKey = (e && e.shiftKey) || (data && data.shiftKey);
    if (shiftKey) {
      self.refs.importRemoteValues.show();
      setTimeout(function () {
        var input = ReactDOM.findDOMNode(self.refs.valuesRemoteUrl);
        input.focus();
        input.select();
      }, 500);
      return;
    }
    ReactDOM.findDOMNode(self.refs.importValues).click();
  },
  importRemoteValues: function (e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    var self = this;
    var input = ReactDOM.findDOMNode(self.refs.valuesRemoteUrl);
    var url = checkUrl(input.value);
    if (!url) {
      return;
    }
    self.setState({ pendingValues: true });
    dataCenter.importRemote(
      { url: url },
      getRemoteDataHandler(function (err, data) {
        self.setState({ pendingValues: false });
        if (err) {
          return;
        }
        self.refs.importRemoteValues.hide();
        if (data) {
          self.valuesForm = getJsonForm(data, 'values');
          self.refs.confirmImportValues.show();
        }
      })
    );
  },
  _uploadRules: function (data, showResult) {
    var self = this;
    dataCenter.upload.importRules(data, function (data, xhr) {
      if (!data) {
        util.showSystemError(xhr);
      } else if (data.ec === 0) {
        self.reloadRules(data);
        showResult && message.success('Successful synchronization Rules.');
      } else {
        win.alert(data.em);
      }
    });
  },
  _uploadValues: function (data, showResult) {
    var self = this;
    dataCenter.upload.importValues(data, function (data, xhr) {
      if (!data) {
        util.showSystemError(xhr);
      }
      if (data.ec === 0) {
        self.reloadValues(data);
        showResult && message.success('Successful synchronization Values.');
      } else {
        win.alert(data.em);
      }
    });
  },
  uploadRules: function (e) {
    var data = this.rulesForm;
    this.rulesForm = null;
    if (!data) {
      return;
    }
    var file = data.get('rules');
    if (!file || !/\.(txt|json)$/i.test(file.name)) {
      return win.alert('Only supports .txt or .json file.');
    }

    if (file.size > MAX_OBJECT_SIZE) {
      return win.alert('The file size cannot exceed 6m.');
    }
    if ($(e.target).hasClass('btn-danger')) {
      data.append('replaceAll', '1');
    }
    this._uploadRules(data);
    ReactDOM.findDOMNode(this.refs.importRules).value = '';
  },
  uploadValues: function (e) {
    var data = this.valuesForm;
    this.valuesForm = null;
    if (!data) {
      return;
    }
    var file = data.get('values');
    if (!file || !/\.(txt|json)$/i.test(file.name)) {
      return win.alert('Only supports .txt or .json file.');
    }

    if (file.size > MAX_OBJECT_SIZE) {
      return win.alert('The file size cannot exceed 6m.');
    }
    if ($(e.target).hasClass('btn-danger')) {
      data.append('replaceAll', '1');
    }
    this._uploadValues(data);
    ReactDOM.findDOMNode(this.refs.importValues).value = '';
  },
  uploadRulesForm: function () {
    this.rulesForm = new FormData(
      ReactDOM.findDOMNode(this.refs.importRulesForm)
    );
    this.refs.confirmImportRules.show();
  },
  uploadValuesForm: function () {
    this.valuesForm = new FormData(
      ReactDOM.findDOMNode(this.refs.importValuesForm)
    );
    this.refs.confirmImportValues.show();
  },
  showAndActiveRules: function (item, e) {
    if (this.state.name === 'rules') {
      switch (item.id) {
      case 'exportRules':
        this.refs.selectRulesDialog.show();
        break;
      case 'importRules':
        this.importRules(e);
        break;
      }
    } else {
      this.setRulesActive(item.name);
      this.showRules();
    }
    this.hideRulesOptions();
  },
  showRules: function (e) {
    if (this.state.name != 'rules') {
      this.setMenuOptionsState();
      this.hideRulesOptions();
    } else if (e && !this.state.showLeftMenu) {
      this.showRulesOptions(e);
    }
    this.setState({
      hasRules: true,
      name: 'rules'
    });
    util.changePageName('rules');
  },
  showAndActiveValues: function (item, e) {
    var self = this;
    if (self.state.name === 'values' && item.id) {
      switch (item.id) {
      case 'exportValues':
        self.refs.selectValuesDialog.show();
        break;
      case 'importValues':
        this.importValues(e);
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
            events.trigger('focusValuesList');
          } else {
            util.showSystemError(xhr);
          }
        });
      } else {
        self.setValuesActive(name);
      }

      this.showValues();
    }
    self.hideValuesOptions();
  },
  addValue: function () {},
  showValues: function (e) {
    if (this.state.name != 'values') {
      this.setMenuOptionsState();
      this.hideValuesOptions();
    } else if (e && !this.state.showLeftMenu) {
      this.showValuesOptions(e);
    }
    this.setState({
      hasValues: true,
      name: 'values'
    });
    util.changePageName('values');
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
      showRemoveOptions: false,
      showAbortOptions: false,
      showNetworkOptions: false
    });
  },
  showRemoveOptions: function () {
    this.setState({
      showRemoveOptions: true
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
  hideRemoveOptions: function () {
    this.setState({
      showRemoveOptions: false
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
    var valuesList = this.state.values.list;
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
    this.hidePluginsOptions();
    this.showPlugins();
    this.showPluginTab(option.name);
  },
  showPluginTab: function (name) {
    var active = 'Home';
    var tabs = this.state.tabs || [];
    if (name && name != active) {
      for (var i = 0, len = tabs.length; i < len; i++) {
        if (tabs[i].name == name) {
          active = name;
          name = null;
          break;
        }
      }
    }
    var plugin = name && this.state.plugins[name + ':'];
    if (plugin) {
      if (tabs.length >= MAX_PLUGINS_TABS) {
        win.alert(
          'At most ' +
            MAX_PLUGINS_TABS +
            ' tabs can be opened at the same time.'
        );
        return this.showPlugins();
      }
      active = name;
      if (plugin.pluginHomepage && !plugin.openInPlugins) {
        return window.open(plugin.pluginHomepage);
      }
      tabs.push({
        name: name,
        url: plugin.pluginHomepage || 'plugin.' + name + '/'
      });
    }

    this.setState({
      active: active,
      tabs: tabs
    });
    this.updatePluginTabInfo(tabs, active);
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
    var tabs = this.state.tabs || [];
    for (var i = 0, len = tabs.length; i < len; i++) {
      if (tabs[i].name == name) {
        tabs.splice(i, 1);
        var active = this.state.active;
        if (active == name) {
          var plugin = tabs[i] || tabs[i - 1];
          this.state.active = plugin ? plugin.name : null;
        }
        this.setState({
          tabs: tabs
        });
        this.updatePluginTabInfo(tabs);
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
    var list = this.getWeinreFromRules();
    if (!list || !list.length) {
      this.showAnonymousWeinre();
      return;
    }
    $(e.target).closest('div').addClass('w-menu-wrapper-show');
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
  showCreateRules: function (_, item) {
    var createRulesInput = ReactDOM.findDOMNode(this.refs.createRulesInput);
    this._curFocusRulesItem = item;
    this.setState(
      {
        showCreateRules: true
      },
      function () {
        createRulesInput.focus();
      }
    );
  },
  showCreateValues: function (_, item) {
    var createValuesInput = ReactDOM.findDOMNode(this.refs.createValuesInput);
    this._curFocusValuesItem = item;
    this.setState(
      {
        showCreateValues: true
      },
      function () {
        createValuesInput.focus();
      }
    );
  },
  showHttpsSettingsDialog: function () {
    $(ReactDOM.findDOMNode(this.refs.rootCADialog)).modal('show');
  },
  interceptHttpsConnects: function (e) {
    var self = this;
    var checked = e.target.checked;
    dataCenter.interceptHttpsConnects(
      { interceptHttpsConnects: checked ? 1 : 0 },
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.state.interceptHttpsConnects = checked;
        } else {
          util.showSystemError(xhr);
        }
        self.setState({});
      }
    );
  },
  enableHttp2: function (e) {
    if (!dataCenter.supportH2) {
      var self = this;
      win.confirm(
        'The current version of Node.js cannot support HTTP/2.\nPlease upgrade to the latest LTS version.',
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
          util.showSystemError(xhr);
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
    var target = ReactDOM.findDOMNode(self.refs.createRulesInput);
    var name = target.value.trim();
    if (!name) {
      message.error('The name cannot be empty.');
      return;
    }
    var modal = self.state.rules;
    var type = e && e.target.getAttribute('data-type');
    var isGroup;
    if (type === 'group') {
      isGroup = true;
      name = '\r' + name;
    }
    if (modal.exists(name)) {
      message.error('The name \'' + name + '\' already exists.');
      return;
    }
    var addToTop = type === 'top' ? 1 : '';
    var curItem = self._curFocusRulesItem;
    var params = { name: name, addToTop: addToTop };
    if (curItem) {
      params.groupName = curItem.name;
    }
    dataCenter.rules.add(params, function (data, xhr) {
      if (data && data.ec === 0) {
        var item = modal[addToTop ? 'unshift' : 'add'](name);
        target.value = '';
        target.blur();
        modal.moveToGroup(name, params.groupName, addToTop);
        !isGroup && self.setRulesActive(name);
        params.groupName && events.trigger('expandRulesGroup', params.groupName);
        self.setState(isGroup ? {} : {
          activeRules: item
        }, function() {
          isGroup && events.trigger('scrollRulesBottom');
        });
        self.triggerRulesChange('create');
      } else {
        util.showSystemError(xhr);
      }
    }
    );
  },
  createValues: function (e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var self = this;
    var target = ReactDOM.findDOMNode(self.refs.createValuesInput);
    var name = target.value.trim();
    if (!name) {
      message.error('The name cannot be empty.');
      return;
    }

    if (/\s/.test(name)) {
      message.error('The name cannot contain spaces.');
      return;
    }

    if (/#/.test(name)) {
      message.error('The name cannot contain #.');
      return;
    }

    var modal = self.state.values;
    var type = e && e.target.getAttribute('data-type');
    var isGroup;
    if (type === 'group') {
      isGroup = true;
      name = '\r' + name;
    }
    if (modal.exists(name)) {
      message.error('The name \'' + name + '\' already exists.');
      return;
    }
    var curItem = self._curFocusValuesItem;
    var params = { name: name };
    if (curItem) {
      params.groupName = curItem.name;
    }
    dataCenter.values.add(params, function (data, xhr) {
      if (data && data.ec === 0) {
        var item = modal.add(name);
        target.value = '';
        target.blur();
        modal.moveToGroup(name, params.groupName);
        !isGroup && self.setValuesActive(name);
        params.groupName && events.trigger('expandValuesGroup', params.groupName);
        self.setState(isGroup ? {} : {
          activeValues: item
        }, function() {
          isGroup && events.trigger('scrollValuesBottom');
        });
        self.triggerValuesChange('create');
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  showEditRules: function (item) {
    this.currentFocusRules = item;
    var modal = this.state.rules;
    var activeItem = item || modal.getActive();
    if (!activeItem || activeItem.isDefault) {
      return;
    }
    var editRulesInput = ReactDOM.findDOMNode(this.refs.editRulesInput);
    editRulesInput.value = activeItem.name;
    this.setState(
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
    this.currentFocusValues = item;
    var modal = this.state.values;
    var activeItem = item || modal.getActive();
    if (!activeItem || activeItem.isDefault) {
      return;
    }

    var editValuesInput = ReactDOM.findDOMNode(this.refs.editValuesInput);
    editValuesInput.value = activeItem.name;
    this.setState(
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
    var activeItem = this.currentFocusRules || modal.getActive();
    if (!activeItem) {
      return;
    }
    var target = ReactDOM.findDOMNode(self.refs.editRulesInput);
    var isGroup = util.isGroup(activeItem.name);
    var name = (isGroup ? '\r' : '') + target.value.trim();
    if (!name) {
      message.error('The name cannot be empty.');
      return;
    }

    if (modal.exists(name)) {
      message.error('The name \'' + name + '\' already exists.');
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
          events.trigger('rulesNameChanged', [curName, name]);
          self.setState({ activeRules: modal.getActive() });
          self.triggerRulesChange('rename');
        } else {
          util.showSystemError(xhr);
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
    var activeItem = this.currentFocusValues || modal.getActive();
    if (!activeItem) {
      return;
    }
    var target = ReactDOM.findDOMNode(self.refs.editValuesInput);
    var isGroup = util.isGroup(activeItem.name);
    var name = (isGroup ? '\r' : '') + target.value.trim();
    if (!name) {
      message.error('The name cannot be empty.');
      return;
    }

    if (modal.exists(name)) {
      message.error('The name \'' + name + '\' already exists.');
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
          events.trigger('valuesNameChanged', [curName, name]);
          self.setState({ activeValues: modal.getActive() });
          self.triggerValuesChange('rename');
          checkJson(activeItem);
        } else {
          util.showSystemError(xhr);
        }
      }
    );
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
  onClickRulesOption: function (item) {
    item.selected ? this.unselectRules(item) : this.selectRules(item);
  },
  selectRules: function (item) {
    var self = this;
    dataCenter.rules[item.isDefault ? 'enableDefault' : 'select'](
      item,
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.reselectRules(data);
          self.state.rules.setChanged(item.name, false);
          self.setState({});
          self.triggerRulesChange('save');
          if (self.state.disabledAllRules) {
            win.confirm(
              'Rules has been turn off, do you want to turn on it?',
              function (sure) {
                if (sure) {
                  dataCenter.rules.disableAllRules(
                    { disabledAllRules: 0 },
                    function (data, xhr) {
                      if (data && data.ec === 0) {
                        self.state.disabledAllRules = false;
                        self.setState({});
                      } else {
                        util.showSystemError(xhr);
                      }
                    }
                  );
                }
              }
            );
          }
        } else {
          util.showSystemError(xhr);
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
          self.setState({});
        } else {
          util.showSystemError(xhr);
        }
      }
    );
    return false;
  },
  reselectRules: function (data, autoUpdate) {
    var self = this;
    self.state.rules.clearAllSelected();
    self.setSelected(
      self.state.rules,
      'Default',
      !data.defaultRulesIsDisabled,
      autoUpdate
    );
    data.list.forEach(function (name) {
      self.setSelected(self.state.rules, name, true, autoUpdate);
    });
  },
  saveValues: function (item) {
    if (!item.changed) {
      return;
    }
    var self = this;
    dataCenter.values.add(item, function (data, xhr) {
      if (data && data.ec === 0) {
        self.setSelected(self.state.values, item.name);
        self.triggerValuesChange('save');
        checkJson(item);
      } else {
        util.showSystemError(xhr);
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
      events.trigger('replaySessions', [null, e.shiftKey]);
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
      dataCenter.compose2({
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
        return events.trigger('replayTreeView', [dataId, count]);
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
      events.trigger('replayTreeView', [dataId, count]);
    } else if (this.autoRefresh) {
      this.autoRefresh();
    }
  },
  enableRecord: function () {
    this.refs.recordBtn.enable();
    events.trigger('changeRecordState');
  },
  composer: function () {
    events.trigger('composer');
  },
  showFiles: function () {
    this.refs.filesDialog.show(this.files);
  },
  clear: function () {
    var modal = this.state.network;
    this.setState({
      network: modal.clear(),
      showRemoveOptions: false
    });
  },
  removeRules: function (item) {
    var self = this;
    var modal = this.state.rules;
    var activeItem = item || modal.getActive();
    if (activeItem && !activeItem.isDefault) {
      var name = activeItem.name;
      win.confirm('Are you sure to delete ' + (util.isGroup(name) ? 'group ' : '') + '\'' + name + '\'.', function (sure) {
        if (!sure) {
          return;
        }
        dataCenter.rules.remove({ name: name }, function (data, xhr) {
          if (data && data.ec === 0) {
            var nextItem = item && !item.active ? null : modal.getSibling(name);
            modal.remove(name);
            if (nextItem) {
              self.setRulesActive(nextItem.name);
              events.trigger('expandRulesGroup', nextItem.name);
            }
            self.setState(
              item
                ? {}
                : {
                  activeRules: nextItem
                }
            );
            self.triggerRulesChange('remove');
            events.trigger('focusRulesList');
          } else {
            util.showSystemError(xhr);
          }
        });
      });
    }
  },
  removeValues: function (item) {
    var self = this;
    var modal = this.state.values;
    var activeItem = item || modal.getActive();
    if (activeItem && !activeItem.isDefault) {
      var name = activeItem.name;
      win.confirm('Are you sure to delete ' + (util.isGroup(name) ? 'group ' : '') + '\'' + name + '\'.', function (sure) {
        if (!sure) {
          return;
        }
        dataCenter.values.remove({ name: name }, function (data, xhr) {
          if (data && data.ec === 0) {
            var nextItem = item && !item.active ? null : modal.getSibling(name);
            modal.remove(name);
            if (nextItem) {
              self.setValuesActive(nextItem.name);
              events.trigger('expandValuesGroup', nextItem.name);
            }
            self.setState(item ? {} : { activeValues: nextItem });
            self.triggerValuesChange('remove');
            events.trigger('focusValuesList');
          } else {
            util.showSystemError(xhr);
          }
        });
      });
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
    $(ReactDOM.findDOMNode(this.refs.rulesSettingsDialog)).modal('show');
  },
  showValuesSettings: function () {
    $(ReactDOM.findDOMNode(this.refs.valuesSettingsDialog)).modal('show');
  },
  toggleLeftMenu: function () {
    var showLeftMenu = !this.state.showLeftMenu;
    this.setState({
      showLeftMenu: showLeftMenu
    });
    storage.set('showLeftMenu', showLeftMenu ? 1 : '');
  },
  handleCreate: function () {
    this.state.name == 'rules'
      ? this.showCreateRules()
      : this.showCreateValues();
  },
  saveRulesOrValues: function () {
    var self = this;
    var state = self.state;
    var list;
    var isRules = state.name == 'rules';
    if (isRules) {
      list = state.rules.getChangedList();
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
  showSettings: function (e) {
    var pageName = this.state.name;
    if (pageName === 'rules') {
      this.showRulesSettings();
      return;
    }
    if (pageName === 'values') {
      this.showValuesSettings();
      return;
    }
    this.refs.networkSettings.showDialog();
  },
  activeRules: function (item) {
    storage.set('activeRules', item.name);
    this.setState({ activeRules: item });
  },
  activeValues: function (item) {
    storage.set('activeValues', item.name);
    this.setState({ activeValues: item });
  },
  onRulesThemeChange: function (e) {
    var theme = e.target.value;
    storage.set('rulesTheme', theme);
    this.setState({
      rulesTheme: theme
    });
  },
  onValuesThemeChange: function (e) {
    var theme = e.target.value;
    storage.set('valuesTheme', theme);
    this.setState({
      valuesTheme: theme
    });
  },
  onRulesFontSizeChange: function (e) {
    var fontSize = e.target.value;
    storage.set('rulesFontSize', fontSize);
    this.setState({
      rulesFontSize: fontSize
    });
  },
  onValuesFontSizeChange: function (e) {
    var fontSize = e.target.value;
    storage.set('valuesFontSize', fontSize);
    this.setState({
      valuesFontSize: fontSize
    });
  },
  onRulesLineNumberChange: function (e) {
    var checked = e.target.checked;
    storage.set('showRulesLineNumbers', checked);
    this.setState({
      showRulesLineNumbers: checked
    });
  },
  onValuesLineNumberChange: function (e) {
    var checked = e.target.checked;
    storage.set('showValuesLineNumbers', checked);
    this.setState({
      showValuesLineNumbers: checked
    });
  },
  showFoldGutter: function (e) {
    var checked = e.target.checked;
    storage.set('foldGutter', checked ? '1' : '');
    this.setState({ foldGutter: checked });
  },
  onRulesLineWrappingChange: function (e) {
    var checked = e.target.checked;
    storage.set('autoRulesLineWrapping', checked ? 1 : '');
    this.setState({
      autoRulesLineWrapping: checked
    });
  },
  onValuesLineWrappingChange: function (e) {
    var checked = e.target.checked;
    storage.set('autoValuesLineWrapping', checked ? 1 : '');
    this.setState({
      autoValuesLineWrapping: checked
    });
  },
  confirmDisableAllRules: function (e) {
    var self = this;
    var state = self.state;
    if (state.disabledAllRules) {
      self.disableAllRules();
    } else {
      win.confirm('Are you sure to disable all rules', function (sure) {
        sure && self.disableAllRules();
      });
    }
    e && e.preventDefault();
  },
  confirmDisableAllPlugins: function (e) {
    var self = this;
    var state = self.state;
    if (state.disabledAllPlugins) {
      self.disableAllPlugins();
    } else {
      win.confirm('Are you sure to disable all plugins', function (sure) {
        sure && self.disableAllPlugins();
      });
    }
    e && e.preventDefault();
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
          if (typeof callback === 'function') {
            callback(checked);
          }
        } else {
          util.showSystemError(xhr);
        }
      }
    );
    e && e.preventDefault();
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
          if (typeof callback === 'function') {
            callback(checked);
          }
        } else {
          util.showSystemError(xhr);
        }
      }
    );
    e && e.preventDefault();
  },
  disablePlugin: function (e) {
    var self = this;
    var target = e.target;
    if (self.state.ndp) {
      return message.warn('Not allowed disable plugins.');
    }
    dataCenter.plugins.disablePlugin(
      {
        name: $(target).attr('data-name'),
        disabled: target.checked ? 0 : 1
      },
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.state.disabledPlugins = data.data;
          protocols.setPlugins(self.state);
          self.setState({});
        } else {
          util.showSystemError(xhr);
        }
      }
    );
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
    var self = this;
    var checked = e.target.checked;
    dataCenter.rules.allowMultipleChoice(
      { allowMultipleChoice: checked ? 1 : 0 },
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.setState({
            allowMultipleChoice: checked
          });
        } else {
          util.showSystemError(xhr);
        }
      }
    );
  },
  enableBackRulesFirst: function (e) {
    var self = this;
    var checked = e.target.checked;
    dataCenter.rules.enableBackRulesFirst(
      { backRulesFirst: checked ? 1 : 0 },
      function (data, xhr) {
        if (data && data.ec === 0) {
          self.setState({
            backRulesFirst: checked
          });
        } else {
          util.showSystemError(xhr);
        }
      }
    );
  },
  reinstallAllPlugins: function () {
    events.trigger('updateAllPlugins', 'reinstallAllPlugins');
  },
  chooseFileType: function (e) {
    var value = e.target.value;
    storage.set('exportFileType', value);
    this.setState({
      exportFileType: value
    });
  },
  uploadSessions: function () {
    this.uploadSessionsForm(
      new FormData(ReactDOM.findDOMNode(this.refs.importSessionsForm))
    );
    ReactDOM.findDOMNode(this.refs.importSessions).value = '';
  },
  importHarSessions: function (result) {
    if (!result || typeof result !== 'object') {
      return;
    }
    var entries = result.log.entries;
    var sessions = [];
    entries.forEach(function (entry) {
      if (!entry) {
        return;
      }
      var times = entry.whistleTimes || '';
      var startTime = new Date(
        times.startTime || entry.startedDateTime
      ).getTime();
      if (isNaN(startTime)) {
        return;
      }

      var rawReq = entry.request || {};
      var rawRes = entry.response || {};
      var reqHeaders = util.parseHeadersFromHar(rawReq.headers);
      var resHeaders = util.parseHeadersFromHar(rawRes.headers);
      var clientIp = entry.clientIPAddress || '127.0.0.1';
      var serverIp = entry.serverIPAddress || '';
      var useH2 = H2_RE.test(rawReq.httpVersion || rawRes.httpVersion);
      var version = useH2 ? '2.0' : '1.1';
      var postData = rawReq.postData || '';
      var req = {
        method: rawReq.method,
        ip: clientIp,
        port: rawReq.port,
        httpVersion: version,
        unzipSize: postData.size,
        size: rawReq.bodySize > 0 ? rawReq.bodySize : 0,
        headers: reqHeaders.headers,
        rawHeaderNames: reqHeaders.rawHeaderNames,
        body: ''
      };
      var reqText = postData.base64 || postData.text;
      if (reqText) {
        if (postData.base64) {
          req.base64 = reqText;
        } else {
          req.body = reqText;
        }
      }
      var content = rawRes.content;
      var res = {
        httpVersion: version,
        statusCode: rawRes.statusCode || rawRes.status,
        statusMessage: rawRes.statusText,
        unzipSize: content.size,
        size: rawRes.bodySize > 0 ? rawRes.bodySize : 0,
        headers: resHeaders.headers,
        rawHeaderNames: resHeaders.rawHeaderNames,
        ip: serverIp,
        port: rawRes.port,
        body: ''
      };
      var resCtn = rawRes.content;
      var text = resCtn && resCtn.text;
      if (text) {
        if (resCtn.base64) {
          res.base64 = resCtn.base64;
        } else if (
          util.getContentType(resCtn.mimeType) === 'IMG' ||
          (text.length % 4 === 0 && /^[a-z\d+/]+={0,2}$/i.test(text))
        ) {
          res.base64 = text;
        } else {
          res.body = text;
        }
      }
      var session = {
        useH2: useH2,
        startTime: startTime,
        frames: entry.frames,
        url: rawReq.url,
        req: req,
        res: res,
        fwdHost: entry.whistleFwdHost,
        sniPlugin: entry.whistleSniPlugin,
        rules: entry.whistleRules || {},
        version: entry.whistleVersion,
        nodeVersion: entry.whistleNodeVersion
      };
      if (times && times.startTime) {
        session.dnsTime = times.dnsTime;
        session.requestTime = times.requestTime;
        session.responseTime = times.responseTime;
        session.endTime = times.endTime;
      } else {
        var timings = entry.timings || {};
        var endTime = Math.round(startTime + util.getTimeFromHar(entry.time));
        startTime = Math.floor(startTime + util.getTimeFromHar(timings.dns));
        session.dnsTime = startTime;
        startTime = Math.floor(
          startTime +
            util.getTimeFromHar(timings.connect) +
            util.getTimeFromHar(timings.ssl) +
            util.getTimeFromHar(timings.send) +
            util.getTimeFromHar(timings.blocked) +
            util.getTimeFromHar(timings.wait)
        );
        session.requestTime = startTime;
        startTime = Math.floor(
          startTime + util.getTimeFromHar(timings.receive)
        );
        session.responseTime = startTime;
        session.endTime = Math.max(startTime, endTime);
      }
      sessions.push(session);
    });
    dataCenter.addNetworkList(sessions);
  },
  uploadSessionsForm: function (data) {
    var file = data.get('importSessions');
    if (!file || !/\.(txt|json|saz|har)$/i.test(file.name)) {
      return win.alert('Only supports .txt, .json, .saz or .har file.');
    }

    if (file.size > MAX_FILE_SIZE) {
      return win.alert('The file size cannot exceed 64m.');
    }
    var isText = /\.txt$/i.test(file.name);
    if (isText || /\.har$/i.test(file.name)) {
      var self = this;
      util.readFileAsText(file, function (result) {
        try {
          result = JSON.parse(result);
          if (isText) {
            dataCenter.addNetworkList(result);
          } else {
            self.importHarSessions(result);
          }
        } catch (e) {
          win.alert('Unrecognized format.');
        }
      });
      return;
    }
    dataCenter.upload.importSessions(data, dataCenter.addNetworkList);
  },
  exportSessions: function (type, name) {
    var modal = this.state.network;
    var sessions = this.currentFoucsItem;
    this.currentFoucsItem = null;
    if (
      !sessions ||
      !$(ReactDOM.findDOMNode(this.refs.chooseFileType)).is(':visible')
    ) {
      sessions = modal.getSelectedList();
    }
    if (!sessions || !sessions.length) {
      return;
    }
    var form = ReactDOM.findDOMNode(this.refs.exportSessionsForm);
    ReactDOM.findDOMNode(this.refs.exportFilename).value = name || '';
    ReactDOM.findDOMNode(this.refs.exportFileType).value = type;
    if (type === 'har') {
      sessions = {
        log: {
          version: '1.2',
          creator: {
            name: 'Whistle',
            version: this.state.version,
            comment: ''
          },
          browser: {
            name: 'Whistle',
            version: this.state.version
          },
          pages: [],
          entries: sessions.map(util.toHar),
          comment: ''
        }
      };
    }
    ReactDOM.findDOMNode(this.refs.sessions).value = JSON.stringify(
      sessions,
      null,
      '  '
    );
    form.submit();
  },
  exportBySave: function (e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    var input = ReactDOM.findDOMNode(this.refs.sessionsName);
    var name = input.value.trim();
    input.value = '';
    this.exportSessions(this.state.exportFileType, name);
    $(ReactDOM.findDOMNode(this.refs.chooseFileType)).modal('hide');
  },
  replayRepeat: function (e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    this.refs.setReplayCount.hide();
    this.replay('', this.replayList, this.state.replayCount);
    events.trigger('focusNetworkList');
  },
  showAboutDialog: function (e) {
    if ($(e.target).closest('.w-menu-enable').length) {
      this.refs.aboutDialog.showAboutInfo();
    }
  },
  showCustomCertsInfo: function () {
    var self = this;
    if (self.loadingCerts) {
      return;
    }
    self.loadingCerts = true;
    dataCenter.certs.all(function (data, xhr) {
      self.loadingCerts = false;
      if (!data) {
        util.showSystemError(xhr);
        return;
      }
      self.refs.certsInfoDialog.show(data.certs, data.dir);
    });
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
    e.preventDefault();
  },
  onClickContextMenu: function (action) {
    var self = this;
    var state = self.state;
    var list = LEFT_BAR_MENUS;
    switch (action) {
    case 'Tree View':
      list[2].checked = !state.network.isTreeView;
      self.toggleTreeView();
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
  forceShowLeftMenu: function () {
    var self = this;
    clearTimeout(self.hideTimer);
    clearTimeout(self.showTimer);
    self.showTimer = setTimeout(function () {
      self.setState({ forceShowLeftMenu: true });
    }, 200);
  },
  selectCAType: function(e) {
    var caType = e.target.value;
    if (caType !== 'cer' && caType !== 'pem') {
      caType = 'crt';
    }
    this.setState({ caType: caType });
    storage.set('caType', caType);
  },
  forceHideLeftMenu: function () {
    var self = this;
    clearTimeout(self.hideTimer);
    clearTimeout(self.showTimer);
    self.hideTimer = setTimeout(function () {
      self.setState({ forceShowLeftMenu: false });
    }, 500);
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
  getTabName: function () {
    var state = this.state;
    var networkMode = state.networkMode;
    var rulesMode = state.rulesMode;
    var rulesOnlyMode = state.rulesOnlyMode;
    var pluginsMode = state.pluginsMode;
    var name = state.name;
    if (networkMode) {
      name = 'network';
    } else if (rulesOnlyMode) {
      name = name === 'values' ? 'values' : 'rules';
    } else if (rulesMode && pluginsMode) {
      name = 'plugins';
      networkMode = true;
    } else if (rulesMode) {
      name = name === 'network' ? 'rules' : name;
    } else if (pluginsMode) {
      name = name !== 'plugins' ? 'network' : name;
    }
    return name || 'network';
  },
  render: function () {
    var state = this.state;
    var networkMode = state.networkMode;
    var rulesMode = state.rulesMode;
    var rulesOnlyMode = state.rulesOnlyMode;
    var pluginsMode = state.pluginsMode;
    var multiEnv = state.multiEnv;
    var name = this.getTabName();
    var isNetwork = name == 'network';
    var isRules = name == 'rules';
    var isValues = name == 'values';
    var isPlugins = name == 'plugins';
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
    var modal = state.network;
    var isTreeView = modal.isTreeView;
    var networkType = isTreeView ? 'tree-conifer' : 'globe';
    if (rulesOptions[0].name === DEFAULT) {
      rulesOptions.forEach(function (item, i) {
        item.icon = !i || !state.multiEnv ? 'checkbox' : 'edit';
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
      REMOVE_OPTIONS.forEach(function (option) {
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
      REMOVE_OPTIONS.forEach(function (option) {
        if (OPTIONS_WITH_SELECTED.indexOf(option.id) !== -1) {
          option.disabled = true;
        } else if (option.id === 'removeUnselected') {
          option.disabled = !hasUnselected;
        }
      });
    }
    var pendingSessions = state.pendingSessions;
    var pendingRules = state.pendingRules;
    var pendingValues = state.pendingValues;
    var mustHideLeftMenu = hideLeftMenu && !state.forceShowLeftMenu;
    var pluginsOnlyMode = pluginsMode && rulesMode;
    var showLeftMenu = (networkMode || state.showLeftMenu) && !pluginsOnlyMode;
    var disabledAllPlugins = state.disabledAllPlugins;
    var disabledAllRules = state.disabledAllRules;
    var forceShowLeftMenu, forceHideLeftMenu;
    if (showLeftMenu && hideLeftMenu) {
      forceShowLeftMenu = this.forceShowLeftMenu;
      forceHideLeftMenu = this.forceHideLeftMenu;
    }
    LEFT_BAR_MENUS[2].hide = rulesMode;
    LEFT_BAR_MENUS[3].hide = pluginsMode;
    LEFT_BAR_MENUS[4].hide = rulesOnlyMode;

    var caType = state.caType || 'crt';
    var qrCode = 'img/qrcode.png';
    var caUrl = 'cgi-bin/rootca';
    var caShortUrl = 'http://rootca.pro/';

    if (caType !== 'crt') {
      qrCode = 'img/qrcode-' + caType + '.png';
      caUrl += '?type=' + caType;
      caShortUrl += caType;
    }

    return (
      <div
        className={
          'main orient-vertical-box' + (showLeftMenu ? ' w-show-left-menu' : '')
        }
      >
        <div className={'w-menu w-' + name + '-menu-list'}>
          <a
            onClick={this.toggleLeftMenu}
            draggable="false"
            className="w-show-left-menu-btn"
            onMouseEnter={forceShowLeftMenu}
            onMouseLeave={forceHideLeftMenu}
            style={{
              display: networkMode || pluginsOnlyMode ? 'none' : undefined
            }}
            title={
              'Dock to ' +
              (showLeftMenu ? 'top' : 'left') +
              ' (Ctrl[Command] + M)'
            }
          >
            <span
              className={
                'glyphicon glyphicon-chevron-' +
                (showLeftMenu ? (mustHideLeftMenu ? 'down' : 'up') : 'left')
              }
            ></span>
          </a>
          <div
            style={{ display: rulesMode ? 'none' : undefined }}
            onMouseEnter={this.showNetworkOptions}
            onMouseLeave={this.hideNetworkOptions}
            className={
              'w-nav-menu w-menu-wrapper' +
              (showNetworkOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={this.showNetwork}
              onDoubleClick={this.toggleTreeView}
              className={
                'w-network-menu' + (name == 'network' ? ' w-menu-selected' : '')
              }
              title={
                'Double click to show' +
                (isTreeView ? ' List View' : ' Tree View')
              }
              draggable="false"
            >
              <span className={'glyphicon glyphicon-' + networkType}></span>
              Network
            </a>
            <MenuItem
              ref="networkMenuItem"
              options={state.networkOptions}
              className="w-network-menu-item"
              onClickOption={this.handleNetwork}
            />
          </div>
          <div
            style={{ display: pluginsMode ? 'none' : undefined }}
            onMouseEnter={this.showRulesOptions}
            onMouseLeave={this.hideRulesOptions}
            className={
              'w-nav-menu w-menu-wrapper' +
              (showRulesOptions ? ' w-menu-wrapper-show' : '') +
              (isRules ? ' w-menu-auto' : '')
            }
          >
            <a
              onClick={this.showRules}
              className={
                'w-rules-menu' + (name == 'rules' ? ' w-menu-selected' : '')
              }
              draggable="false"
            >
              <span
                className={
                  'glyphicon glyphicon-list' +
                  (disabledAllRules ? ' w-disabled' : '')
                }
              ></span>
              Rules
            </a>
            <MenuItem
              ref="rulesMenuItem"
              name={name == 'rules' ? null : 'Open'}
              options={rulesOptions}
              checkedOptions={uncheckedRules}
              disabled={disabledAllRules}
              className="w-rules-menu-item"
              onClick={this.showRules}
              onClickOption={this.showAndActiveRules}
              onChange={this.selectRulesByOptions}
            />
          </div>
          <div
            style={{ display: pluginsMode ? 'none' : undefined }}
            onMouseEnter={this.showValuesOptions}
            onMouseLeave={this.hideValuesOptions}
            className={
              'w-nav-menu w-menu-wrapper' +
              (showValuesOptions ? ' w-menu-wrapper-show' : '') +
              (isValues ? ' w-menu-auto' : '')
            }
          >
            <a
              onClick={this.showValues}
              className={
                'w-values-menu' + (name == 'values' ? ' w-menu-selected' : '')
              }
              draggable="false"
            >
              <span className="glyphicon glyphicon-folder-close"></span>Values
            </a>
            <MenuItem
              ref="valuesMenuItem"
              name={name == 'values' ? null : 'Open'}
              options={state.valuesOptions}
              className="w-values-menu-item"
              onClick={this.showValues}
              onClickOption={this.showAndActiveValues}
            />
          </div>
          <div
            style={{
              display: rulesOnlyMode || pluginsOnlyMode ? 'none' : undefined
            }}
            ref="pluginsMenu"
            onMouseEnter={this.showPluginsOptions}
            onMouseLeave={this.hidePluginsOptions}
            className={
              'w-nav-menu w-menu-wrapper' +
              (showPluginsOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={this.showPlugins}
              className={
                'w-plugins-menu' + (name == 'plugins' ? ' w-menu-selected' : '')
              }
              draggable="false"
            >
              <span
                className={
                  'glyphicon glyphicon-list-alt' +
                  (disabledAllPlugins ? ' w-disabled' : '')
                }
              ></span>
              Plugins
            </a>
            <MenuItem
              ref="pluginsMenuItem"
              name={name == 'plugins' ? null : 'Open'}
              options={pluginsOptions}
              checkedOptions={state.disabledPlugins}
              disabled={disabledAllPlugins}
              className="w-plugins-menu-item"
              onClick={this.showPlugins}
              onChange={this.disablePlugin}
              onClickOption={this.showAndActivePlugins}
            />
          </div>
          {!state.ndr && (
            <a
              onClick={this.confirmDisableAllRules}
              className="w-enable-rules-menu"
              title={
                disabledAllRules ? 'Enable all rules' : 'Disable all rules'
              }
              style={{
                display: isRules ? '' : 'none',
                color: disabledAllRules ? '#f66' : undefined
              }}
              draggable="false"
            >
              <span
                className={
                  'glyphicon glyphicon-' +
                  (disabledAllRules ? 'play-circle' : 'off')
                }
              />
              {disabledAllRules ? 'ON' : 'OFF'}
            </a>
          )}
          {!state.ndp && (
            <a
              onClick={this.confirmDisableAllPlugins}
              className="w-enable-plugin-menu"
              title={
                disabledAllPlugins
                  ? 'Enable all plugins'
                  : 'Disable all plugins'
              }
              style={{
                display: isPlugins ? '' : 'none',
                color: disabledAllPlugins ? '#f66' : undefined
              }}
              draggable="false"
            >
              <span
                className={
                  'glyphicon glyphicon-' +
                  (disabledAllPlugins ? 'play-circle' : 'off')
                }
              />
              {disabledAllPlugins ? 'ON' : 'OFF'}
            </a>
          )}
          <UpdateAllBtn hide={!isPlugins} />
          <a
            onClick={this.reinstallAllPlugins}
            className={'w-plugins-menu' + (isPlugins ? '' : ' hide')}
            draggable="false"
          >
            <span className="glyphicon glyphicon-download-alt" />
            ReinstallAll
          </a>
          <RecordBtn
            ref="recordBtn"
            hide={!isNetwork}
            onClick={this.handleAction}
          />
          <a
            onClick={this.importData}
            className="w-import-menu"
            style={{ display: isPlugins ? 'none' : '' }}
            draggable="false"
          >
            <span className="glyphicon glyphicon-import"></span>Import
          </a>
          <a
            onClick={this.exportData}
            className="w-export-menu"
            style={{ display: isPlugins ? 'none' : '' }}
            draggable="false"
          >
            <span className="glyphicon glyphicon-export"></span>Export
          </a>
          <div
            onMouseEnter={this.showRemoveOptions}
            onMouseLeave={this.hideRemoveOptions}
            style={{ display: isNetwork ? '' : 'none' }}
            className={
              'w-menu-wrapper w-remove-menu-list w-menu-auto' +
              (state.showRemoveOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={this.clear}
              className="w-remove-menu"
              title="Ctrl[Command] + X"
              draggable="false"
            >
              <span className="glyphicon glyphicon-remove"></span>Clear
            </a>
            <MenuItem
              options={REMOVE_OPTIONS}
              className="w-remove-menu-item"
              onClickOption={this.handleNetwork}
            />
          </div>
          <a
            onClick={this.onClickMenu}
            className="w-save-menu"
            style={{ display: isNetwork || isPlugins ? 'none' : '' }}
            draggable="false"
            title="Ctrl[Command] + S"
          >
            <span className="glyphicon glyphicon-save-file"></span>Save
          </a>
          <a
            className="w-create-menu"
            style={{ display: isNetwork || isPlugins ? 'none' : '' }}
            draggable="false"
            onClick={this.handleCreate}
          >
            <span className="glyphicon glyphicon-plus"></span>Create
          </a>
          <a
            onClick={this.onClickMenu}
            className={'w-edit-menu' + (disabledEditBtn ? ' w-disabled' : '')}
            style={{ display: isNetwork || isPlugins ? 'none' : '' }}
            draggable="false"
          >
            <span className="glyphicon glyphicon-edit"></span>Rename
          </a>
          <div
            onMouseEnter={this.showAbortOptions}
            onMouseLeave={this.hideAbortOptions}
            style={{ display: isNetwork ? '' : 'none' }}
            className={
              'w-menu-wrapper w-abort-menu-list w-menu-auto' +
              (state.showAbortOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={this.clickReplay}
              className="w-replay-menu"
              draggable="false"
            >
              <span className="glyphicon glyphicon-repeat"></span>Replay
            </a>
            <MenuItem
              options={ABORT_OPTIONS}
              className="w-remove-menu-item"
              onClickOption={this.abort}
            />
          </div>
          <a
            onClick={this.composer}
            className="w-composer-menu"
            style={{ display: isNetwork ? '' : 'none' }}
            draggable="false"
          >
            <span className="glyphicon glyphicon-edit"></span>Compose
          </a>
          <a
            onClick={this.onClickMenu}
            className={
              'w-delete-menu' + (disabledDeleteBtn ? ' w-disabled' : '')
            }
            style={{ display: isNetwork || isPlugins ? 'none' : '' }}
            draggable="false"
          >
            <span className="glyphicon glyphicon-trash"></span>Delete
          </a>
          <FilterBtn
            onClick={this.showSettings}
            disabledRules={isRules && disabledAllRules}
            isNetwork={isNetwork}
            hide={isPlugins}
          />
          <a
            onClick={this.showFiles}
            className="w-files-menu"
            draggable="false"
          >
            <span className="glyphicon glyphicon-upload"></span>Files
          </a>
          <div
            onMouseEnter={this.showWeinreOptions}
            onMouseLeave={this.hideWeinreOptions}
            className={
              'w-menu-wrapper' +
              (showWeinreOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              onClick={this.showWeinreOptionsQuick}
              onDoubleClick={this.showAnonymousWeinre}
              className="w-weinre-menu"
              draggable="false"
            >
              <span className="glyphicon glyphicon-console"></span>Weinre
            </a>
            <MenuItem
              ref="weinreMenuItem"
              name="anonymous"
              options={state.weinreOptions}
              className="w-weinre-menu-item"
              onClick={this.showAnonymousWeinre}
              onClickOption={this.showWeinre}
            />
          </div>
          <a
            onClick={this.showHttpsSettingsDialog}
            className="w-https-menu"
            draggable="false"
            style={{ color: dataCenter.hasInvalidCerts ? 'red' : undefined }}
          >
            <span
              className={
                'glyphicon glyphicon-' +
                (state.interceptHttpsConnects ? 'ok' : 'lock')
              }
            ></span>
            HTTPS
          </a>
          <div
            onMouseEnter={this.showHelpOptions}
            onMouseLeave={this.hideHelpOptions}
            className={
              'w-menu-wrapper' + (showHelpOptions ? ' w-menu-wrapper-show' : '')
            }
          >
            <a
              className={
                'w-help-menu' + (state.hasNewVersion ? ' w-menu-enable' : '')
              }
              onClick={this.showAboutDialog}
              title={
                state.hasNewVersion
                  ? 'There is a new version of whistle'
                  : undefined
              }
              href={
                state.hasNewVersion
                  ? undefined
                  : 'https://github.com/avwo/whistle#whistle'
              }
              target={state.hasNewVersion ? undefined : '_blank'}
            >
              <span className="glyphicon glyphicon-question-sign"></span>Help
            </a>
            <MenuItem
              ref="helpMenuItem"
              options={state.helpOptions}
              name={
                <About
                  ref="aboutDialog"
                  onClick={this.hideHelpOptions}
                  onCheckUpdate={this.showHasNewVersion}
                />
              }
              className="w-help-menu-item"
            />
          </div>
          <Online name={name} />
          <div
            onMouseDown={this.preventBlur}
            style={{ display: state.showCreateRules ? 'block' : 'none' }}
            className="shadow w-input-menu-item w-create-rules-input"
          >
            <input
              ref="createRulesInput"
              onKeyDown={this.createRules}
              onBlur={this.hideRulesInput}
              type="text"
              maxLength="64"
              placeholder="Input the name"
            />
            <button
              type="button"
              onClick={this.createRules}
              className="btn btn-primary"
            >
              +Rule
            </button>
            <button
              type="button"
              onClick={this.createRules}
              data-type="top"
              className="btn btn-default"
            >
              +Top
            </button>
            <button
              type="button"
              onClick={this.createRules}
              data-type="group"
              className="btn btn-default"
            >
              +Group
            </button>
          </div>
          <div
            onMouseDown={this.preventBlur}
            style={{ display: state.showCreateValues ? 'block' : 'none' }}
            className="shadow w-input-menu-item w-create-values-input"
          >
            <input
              ref="createValuesInput"
              onKeyDown={this.createValues}
              onBlur={this.hideValuesInput}
              type="text"
              maxLength="64"
              placeholder="Input the name"
            />
            <button
              type="button"
              onClick={this.createValues}
              className="btn btn-primary"
            >
              +Key
            </button>
            <button
              type="button"
              onClick={this.createValues}
              data-type="group"
              className="btn btn-default"
            >
              +Group
            </button>
          </div>
          <div
            onMouseDown={this.preventBlur}
            style={{ display: state.showEditRules ? 'block' : 'none' }}
            className="shadow w-input-menu-item w-edit-rules-input"
          >
            <input
              ref="editRulesInput"
              onKeyDown={this.editRules}
              onBlur={this.hideRenameRuleInput}
              type="text"
              maxLength="64"
            />
            <button
              type="button"
              onClick={this.editRules}
              className="btn btn-primary"
            >
              OK
            </button>
          </div>
          <div
            onMouseDown={this.preventBlur}
            style={{ display: state.showEditValues ? 'block' : 'none' }}
            className="shadow w-input-menu-item w-edit-values-input"
          >
            <input
              ref="editValuesInput"
              onKeyDown={this.editValues}
              onBlur={this.hideRenameValueInput}
              type="text"
              maxLength="64"
            />
            <button
              type="button"
              onClick={this.editValues}
              className="btn btn-primary"
            >
              OK
            </button>
          </div>
        </div>
        <div className="w-container box fill">
          <ContextMenu onClick={this.onClickContextMenu} ref="contextMenu" />
          <div
            onContextMenu={this.onContextMenu}
            onDoubleClick={this.onContextMenu}
            className={
              'w-left-menu' + (forceShowLeftMenu ? ' w-hover-left-menu' : '')
            }
            style={{
              display: networkMode || mustHideLeftMenu ? 'none' : undefined
            }}
            onMouseEnter={forceShowLeftMenu}
            onMouseLeave={forceHideLeftMenu}
          >
            <a
              onClick={this.showNetwork}
              className={
                'w-network-menu' + (name == 'network' ? ' w-menu-selected' : '')
              }
              style={{ display: rulesMode ? 'none' : undefined }}
              draggable="false"
            >
              <span className={'glyphicon glyphicon-' + networkType}></span>
              <i className="w-left-menu-name">Network</i>
            </a>
            <a
              onClick={this.showRules}
              className={
                'w-save-menu w-rules-menu' +
                (name == 'rules' ? ' w-menu-selected' : '')
              }
              style={{ display: pluginsMode ? 'none' : undefined }}
              draggable="false"
            >
              <span
                className={
                  'glyphicon glyphicon-list' +
                  (disabledAllRules ? ' w-disabled' : '')
                }
              ></span>
              <i className="w-left-menu-name">Rules</i>
              <i
                className="w-menu-changed"
                style={{
                  display: state.rules.hasChanged() ? undefined : 'none'
                }}
              >
                *
              </i>
            </a>
            <a
              onClick={this.showValues}
              className={
                'w-save-menu w-values-menu' +
                (name == 'values' ? ' w-menu-selected' : '')
              }
              style={{ display: pluginsMode ? 'none' : undefined }}
              draggable="false"
            >
              <span className="glyphicon glyphicon-folder-close"></span>
              <i className="w-left-menu-name">Values</i>
              <i
                className="w-menu-changed"
                style={{
                  display: state.values.hasChanged() ? undefined : 'none'
                }}
              >
                *
              </i>
            </a>
            <a
              onClick={this.showPlugins}
              className={
                'w-plugins-menu' + (name == 'plugins' ? ' w-menu-selected' : '')
              }
              style={{
                display: rulesOnlyMode || pluginsOnlyMode ? 'none' : undefined
              }}
              draggable="false"
            >
              <span
                className={
                  'glyphicon glyphicon-list-alt' +
                  (disabledAllPlugins ? ' w-disabled' : '')
                }
              ></span>
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
              onSelect={this.selectRules}
              onUnselect={this.unselectRules}
              onActive={this.activeRules}
              modal={state.rules}
              hide={name == 'rules' ? false : true}
              name="rules"
            />
          ) : undefined}
          {state.hasValues ? (
            <List
              theme={valuesTheme}
              onDoubleClick={this.showEditValuesByDBClick}
              fontSize={valuesFontSize}
              lineWrapping={autoValuesLineWrapping}
              lineNumbers={showValuesLineNumbers}
              onSelect={this.saveValues}
              onActive={this.activeValues}
              modal={state.values}
              hide={name == 'values' ? false : true}
              className="w-values-list"
              foldGutter={state.foldGutter}
            />
          ) : undefined}
          {state.hasNetwork ? (
            <Network
              ref="network"
              hide={name === 'rules' || name === 'values' || name === 'plugins'}
              modal={modal}
            />
          ) : undefined}
          {state.hasPlugins ? (
            <Plugins
              {...state}
              onOpen={this.activePluginTab}
              onClose={this.closePluginTab}
              onActive={this.activePluginTab}
              onChange={this.disablePlugin}
              ref="plugins"
              hide={name == 'plugins' ? false : true}
            />
          ) : undefined}
        </div>
        <div
          ref="rulesSettingsDialog"
          className="modal fade w-rules-settings-dialog"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
                <EditorSettings
                  theme={rulesTheme}
                  fontSize={rulesFontSize}
                  lineNumbers={showRulesLineNumbers}
                  lineWrapping={autoRulesLineWrapping}
                  onLineWrappingChange={this.onRulesLineWrappingChange}
                  onThemeChange={this.onRulesThemeChange}
                  onFontSizeChange={this.onRulesFontSizeChange}
                  onLineNumberChange={this.onRulesLineNumberChange}
                />
                {!state.drb && (
                  <p className="w-editor-settings-box">
                    <label>
                      <input
                        type="checkbox"
                        checked={state.backRulesFirst}
                        onChange={this.enableBackRulesFirst}
                      />{' '}
                      Back rules first
                    </label>
                  </p>
                )}
                {!state.drm && (
                  <p className="w-editor-settings-box">
                    <label style={{ color: multiEnv ? '#aaa' : undefined }}>
                      <input
                        type="checkbox"
                        disabled={multiEnv}
                        checked={!multiEnv && state.allowMultipleChoice}
                        onChange={this.allowMultipleChoice}
                      />{' '}
                      Use multiple rules
                    </label>
                  </p>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-default"
                  data-dismiss="modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          ref="valuesSettingsDialog"
          className="modal fade w-values-settings-dialog"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
                <EditorSettings
                  theme={valuesTheme}
                  fontSize={valuesFontSize}
                  lineNumbers={showValuesLineNumbers}
                  lineWrapping={autoValuesLineWrapping}
                  onLineWrappingChange={this.onValuesLineWrappingChange}
                  onThemeChange={this.onValuesThemeChange}
                  onFontSizeChange={this.onValuesFontSizeChange}
                  onLineNumberChange={this.onValuesLineNumberChange}
                />
                <p className="w-editor-settings-box">
                  <label>
                    <input
                      type="checkbox"
                      checked={state.foldGutter}
                      onChange={this.showFoldGutter}
                    />{' '}
                    Show fold gutter
                  </label>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-default"
                  data-dismiss="modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        <NetworkSettings ref="networkSettings" />
        <div ref="rootCADialog" className="modal fade w-https-dialog">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
                <div>
                  <a
                    className="w-help-menu"
                    title="Click here to learn how to install root ca"
                    href="https://avwo.github.io/whistle/webui/https.html"
                    target="_blank"
                  >
                    <span className="glyphicon glyphicon-question-sign"></span>
                  </a>
                  <a
                    className="w-download-rootca"
                    title={caShortUrl}
                    href={caUrl}
                    target="downloadTargetFrame"
                  >
                    Download RootCA
                  </a>
                  <select className="w-root-ca-type" value={caType} onChange={this.selectCAType}>
                    <option value="crt">rootCA.crt</option>
                    <option value="cer">rootCA.cer</option>
                    <option value="pem">rootCA.pem</option>
                  </select>
                </div>
                <a
                  title={caShortUrl}
                  href={caUrl}
                  target="downloadTargetFrame"
                >
                  <img src={qrCode} width="320" />
                </a>
                <div className="w-https-settings">
                  <p>
                    <label
                      title={
                        multiEnv
                          ? 'Use `pattern enable://capture` in rules to replace global configuration'
                          : undefined
                      }
                    >
                      <input
                        disabled={multiEnv}
                        checked={state.interceptHttpsConnects}
                        onChange={this.interceptHttpsConnects}
                        type="checkbox"
                      />{' '}
                      Capture TUNNEL CONNECTs
                    </label>
                  </p>
                  <p>
                    <label>
                      <input
                        checked={dataCenter.supportH2 && state.enableHttp2}
                        onChange={this.enableHttp2}
                        type="checkbox"
                      />{' '}
                      Enable HTTP/2
                    </label>
                  </p>
                  <a
                    draggable="false"
                    style={{
                      color: dataCenter.hasInvalidCerts ? 'red' : undefined
                    }}
                    onClick={this.showCustomCertsInfo}
                  >
                    View custom certs info
                  </a>
                  <CertsInfoDialog ref="certsInfoDialog" />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-default"
                  data-dismiss="modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        <div ref="chooseFileType" className="modal fade w-choose-filte-type">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <label className="w-choose-filte-type-label">
                  Save as:
                  <input
                    ref="sessionsName"
                    onKeyDown={this.exportBySave}
                    placeholder="Input the filename"
                    className="form-control"
                    maxLength="64"
                  />
                  <select
                    ref="fileType"
                    className="form-control"
                    value={state.exportFileType}
                    onChange={this.chooseFileType}
                  >
                    <option value="whistle">*.txt</option>
                    <option value="Fiddler">*.saz</option>
                    <option value="har">*.har</option>
                  </select>
                </label>
                <a
                  type="button"
                  onKeyDown={this.exportBySave}
                  tabIndex="0"
                  onMouseDown={this.preventBlur}
                  className="btn btn-primary"
                  onClick={this.exportBySave}
                >
                  Export
                </a>
              </div>
            </div>
          </div>
        </div>
        <Dialog ref="setReplayCount" wstyle="w-replay-count-dialog">
          <div className="modal-body">
            <label>
              Times:
              <input
                ref="replayCount"
                placeholder={'<= ' + MAX_REPLAY_COUNT}
                onKeyDown={this.replayRepeat}
                onChange={this.replayCountChange}
                value={state.replayCount}
                className="form-control"
                maxLength="3"
              />
            </label>
            <button
              type="button"
              onKeyDown={this.replayRepeat}
              tabIndex="0"
              onMouseDown={this.preventBlur}
              className="btn btn-primary"
              disabled={!state.replayCount}
              onClick={this.replayRepeat}
            >
              Replay
            </button>
          </div>
        </Dialog>
        <Dialog ref="importRemoteRules" wstyle="w-import-remote-dialog">
          <div className="modal-body">
            <input
              readOnly={pendingRules}
              ref="rulesRemoteUrl"
              maxLength="2048"
              onKeyDown={this.importRemoteRules}
              placeholder="Input the url"
              style={{ 'ime-mode': 'disabled' }}
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              disabled={pendingRules}
              onMouseDown={this.preventBlur}
              onClick={this.importRemoteRules}
            >
              {pendingRules ? 'Importing rules' : 'Import rules'}
            </button>
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              Close
            </button>
          </div>
        </Dialog>
        <Dialog ref="importRemoteSessions" wstyle="w-import-remote-dialog">
          <div className="modal-body">
            <input
              readOnly={pendingSessions}
              ref="sessionsRemoteUrl"
              maxLength="2048"
              onKeyDown={this.importRemoteSessions}
              placeholder="Input the url"
              style={{ 'ime-mode': 'disabled' }}
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              disabled={pendingSessions}
              onMouseDown={this.preventBlur}
              onClick={this.importRemoteSessions}
            >
              {pendingSessions ? 'Importing sessions' : 'Import sessions'}
            </button>
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              Close
            </button>
          </div>
        </Dialog>
        <Dialog ref="importRemoteValues" wstyle="w-import-remote-dialog">
          <div className="modal-body">
            <input
              readOnly={pendingValues}
              ref="valuesRemoteUrl"
              maxLength="2048"
              onKeyDown={this.importRemoteValues}
              placeholder="Input the url"
              style={{ 'ime-mode': 'disabled' }}
            />
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-primary"
              disabled={pendingValues}
              onMouseDown={this.preventBlur}
              onClick={this.importRemoteValues}
            >
              {pendingValues ? 'Importing values' : 'Import values'}
            </button>
            <button
              type="button"
              className="btn btn-default"
              data-dismiss="modal"
            >
              Close
            </button>
          </div>
        </Dialog>
        <div
          ref="showUpdateTipsDialog"
          className="modal fade w-show-update-tips-dialog"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
                <p className="w-show-update-tips">
                  whistle has important updates, it is recommended that you
                  update to the latest version.
                </p>
                <p>Current version: {state.version}</p>
                <p>The latest stable version: {state.latestVersion}</p>
                <p>
                  View change:{' '}
                  <a
                    title="Change log"
                    href="https://github.com/avwo/whistle/blob/master/CHANGELOG.md"
                    target="_blank"
                  >
                    CHANGELOG.md
                  </a>
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={this.donotShowAgain}
                  data-dismiss="modal"
                >
                  Don't show again
                </button>
                <a
                  type="button"
                  className="btn btn-primary"
                  onClick={this.hideUpdateTipsDialog}
                  href="https://avwo.github.io/whistle/update.html"
                  target="_blank"
                >
                  Update now
                </a>
              </div>
            </div>
          </div>
        </div>
        <Dialog ref="confirmReload" wstyle="w-confirm-reload-dialog">
          <div className="modal-body w-confirm-reload">
            <button type="button" className="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span>
            </button>
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
              onClick={this.reloadData}
              data-dismiss="modal"
            >
              Yes
            </button>
          </div>
        </Dialog>
        <Dialog ref="confirmImportRules" wstyle="w-confirm-import-dialog">
          <div className="modal-body w-confirm-import">
            <button type="button" className="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span>
            </button>
            Whether to replace the existing rules?
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-danger"
              onClick={this.uploadRules}
              data-dismiss="modal"
            >
              Replace
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.uploadRules}
              data-dismiss="modal"
            >
              Reserve
            </button>
          </div>
        </Dialog>
        <Dialog ref="confirmImportValues" wstyle="w-confirm-import-dialog">
          <div className="modal-body w-confirm-import">
            <button type="button" className="close" data-dismiss="modal">
              <span aria-hidden="true">&times;</span>
            </button>
            Whether to replace the existing values?
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-danger"
              onClick={this.uploadValues}
              data-dismiss="modal"
            >
              Replace
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={this.uploadValues}
              data-dismiss="modal"
            >
              Reserve
            </button>
          </div>
        </Dialog>
        <FilesDialog ref="filesDialog" />
        <ListDialog
          ref="selectRulesDialog"
          name="rules"
          list={state.rules.list}
        />
        <ListDialog
          ref="selectValuesDialog"
          name="values"
          list={state.values.list}
        />
        <iframe name="downloadTargetFrame" style={{ display: 'none' }} />
        <form
          ref="exportSessionsForm"
          action="cgi-bin/sessions/export"
          style={{ display: 'none' }}
          method="post"
          target="downloadTargetFrame"
        >
          <input ref="exportFilename" name="exportFilename" type="hidden" />
          <input ref="exportFileType" name="exportFileType" type="hidden" />
          <input ref="sessions" name="sessions" type="hidden" />
        </form>
        <form
          ref="importSessionsForm"
          encType="multipart/form-data"
          style={{ display: 'none' }}
        >
          <input
            ref="importSessions"
            onChange={this.uploadSessions}
            type="file"
            name="importSessions"
            accept=".txt,.json,.saz,.har"
          />
        </form>
        <form
          ref="importRulesForm"
          encType="multipart/form-data"
          style={{ display: 'none' }}
        >
          <input
            ref="importRules"
            onChange={this.uploadRulesForm}
            name="rules"
            type="file"
            accept=".txt,.json"
          />
        </form>
        <form
          ref="importValuesForm"
          encType="multipart/form-data"
          style={{ display: 'none' }}
        >
          <input
            ref="importValues"
            onChange={this.uploadValuesForm}
            name="values"
            type="file"
            accept=".txt,.json"
          />
        </form>
        <SyncDialog ref="syncDialog" />
      </div>
    );
  }
});
dataCenter.getInitialData(function (data) {
  ReactDOM.render(<Index modal={data} />, document.getElementById('container'));
});
