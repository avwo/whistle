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
var CertsInfoDialog = require('./certs-info-dialog');

var JSON_RE = /^\s*(?:[\{｛][\w\W]+[\}｝]|\[[\w\W]+\])\s*$/;
var DEFAULT = 'Default';
var MAX_PLUGINS_TABS = 7;
var MAX_FILE_SIZE = 1024 * 1024 * 64;
var MAX_OBJECT_SIZE = 1024 * 1024 * 6;
var MAX_LOG_SIZE = 1024 * 1024 * 2;
var MAX_REPLAY_COUNT = 30;
var LINK_SELECTOR = '.cm-js-type, .cm-js-http-url, .cm-string, .cm-js-at';
var LINK_RE = /^"(https?:)?(\/\/[^/]\S+)"$/i;
var AT_LINK_RE = /^@(https?:)?(\/\/[^/]\S+)$/i;
var OPTIONS_WITH_SELECTED = ['removeSelected', 'exportWhistleFile', 'exportSazFile'];
var hideLeftMenu = /(?:^\?|&)hideLeft(?:Bar|Menu)=(?:true|1)(?:&|$)/.test(window.location.search);
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
    } catch(e) {
      message.warn('Warning: the value of ' + item.name + ' can\`t be parsed into json. ' + e.message);
    }
  }
}

function getJsonForm(data, name) {
  data = JSON.stringify(data);
  var form = new FormData();
  var file = new File([data], 'data.json', { type: 'application/json'});
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
  return function(data, xhr) {
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
    } catch(e) {
      message.error(e.message);
    }
    callback(true);
  };
}

function stopPropagation(e) {
  e.stopPropagation();
}

function getPageName(options) {
  if (options.networkMode) {
    return 'network';
  }
  var hash = location.hash.substring(1);
  if (hash) {
    hash = hash.replace(/[?#].*$/, '');
  } else {
    hash = location.href.replace(/[?#].*$/, '').replace(/.*\//, '');
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
    return index != -1 && url.substring(1, index) || '';
  }

  return false;
}

var Index = React.createClass({
  getInitialState: function() {
    var modal = this.props.modal;
    var rules = modal.rules;
    var values = modal.values;
    var multiEnv = !!modal.server.multiEnv;
    var state = {
      replayCount: 1,
      allowMultipleChoice: modal.rules.allowMultipleChoice,
      backRulesFirst: modal.rules.backRulesFirst,
      networkMode: !!modal.server.networkMode,
      rulesMode: !!modal.server.rulesMode,
      pluginsMode: !!modal.server.pluginsMode,
      multiEnv: modal.server.multiEnv,
      isWin: modal.server.isWin,
      ndr: modal.server.ndr,
      ndp: modal.server.ndp,
      classic: modal.classic
    };
    hideLeftMenu = hideLeftMenu || modal.server.hideLeftMenu;
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

      rules.list.forEach(function(item) {
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
      values.list.forEach(function(item) {
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
    dataCenter.rulesModal = rulesModal;
    state.rulesTheme = rulesTheme;
    state.valuesTheme = valuesTheme;
    state.rulesFontSize = rulesFontSize;
    state.valuesFontSize = valuesFontSize;
    state.showRulesLineNumbers = showRulesLineNumbers === 'true';
    state.showValuesLineNumbers = showValuesLineNumbers === 'true';
    state.autoRulesLineWrapping = !!autoRulesLineWrapping;
    state.autoValuesLineWrapping = !!autoValuesLineWrapping;
    state.plugins = modal.plugins;
    state.disabledPlugins = modal.disabledPlugins;
    state.disabledAllRules = modal.disabledAllRules;
    state.disabledAllPlugins = modal.disabledAllPlugins;
    state.interceptHttpsConnects = !multiEnv && modal.interceptHttpsConnects;
    state.enableHttp2 = modal.enableHttp2;
    state.rules = rulesModal;
    state.rulesOptions = rulesOptions;
    state.pluginsOptions = this.createPluginsOptions(modal.plugins);
    dataCenter.valuesModal = state.values = valuesModal;
    state.valuesOptions = valuesOptions;

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
        name: 'Import Sessions',
        icon: 'import',
        id: 'importSessions',
        title: 'Ctrl + I'
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
    return state;
  },
  getListByName: function(name, type) {
    var list = this.state[name].list;
    var data = this.state[name].data;
    return {
      type: type,
      url: location.href,
      list: list.map(function(name) {
        var item = data[name];
        return {
          name: name,
          value: item && item.value || ''
        };
      })
    };
  },
  triggerRulesChange: function(type) {
    util.triggerListChange('rules', this.getListByName('rules', type));
  },
  triggerValuesChange: function(type) {
    util.triggerListChange('values', this.getListByName('values', type));
  },
  createPluginsOptions: function(plugins) {
    plugins = plugins || {};
    var pluginsOptions = [{
      name: 'Home'
    }];

    Object.keys(plugins).sort(function(a, b) {
      var p1 = plugins[a];
      var p2 = plugins[b];
      return util.compare(p1.priority, p2.priority) || util.compare(p2.mtime, p1.mtime) || (a > b ? 1 : -1);
    }).forEach(function(name) {
      var plugin = plugins[name];
      pluginsOptions.push({
        name: name.slice(0, -1),
        icon: 'checkbox',
        mtime: plugin.mtime,
        homepage: plugin.homepage,
        latest: plugin.latest,
        hideLongProtocol: plugin.hideLongProtocol,
        hideShortProtocol: plugin.hideShortProtocol
      });
    });
    return pluginsOptions;
  },
  reloadRules: function(data) {
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
    data.list.forEach(function(item) {
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
  reloadValues: function(data) {
    var self = this;
    var selectedName = storage.get('activeValues', true) || data.current;
    var valuesList = [];
    var valuesData = {};
    data.list.forEach(function(item) {
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
  reloadData: function() {
    var self = this;
    var dialog = $('.w-reload-data-tips').closest('.w-confirm-reload-dialog');
    var name = dialog.find('.w-reload-data-tips').attr('data-name');
    var isRules = name === 'rules';
    var handleResponse = function(data, xhr) {
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
    } else {
      dataCenter.values.list(handleResponse);
    }
  },
  showReloadRules: function() {
    if (this.state.name === 'rules' && this.rulesChanged) {
      this.rulesChanged = false;
      var hasChanged = this.state.rules.hasChanged();
      this.showReloadDialog('The rules has been modified.<br/>Do you want to reload it.', hasChanged);
    }
  },
  showReloadValues: function() {
    if (this.state.name === 'values' && this.valuesChanged) {
      this.valuesChanged = false;
      var hasChanged = this.state.values.hasChanged();
      this.showReloadDialog('The values has been modified.<br/>Do you want to reload it.', hasChanged);
    }
  },
  componentDidUpdate: function() {
    this.showReloadRules();
    this.showReloadValues();
  },
  showReloadDialog: function(msg, existsUnsaved) {
    var confirmReload = this.refs.confirmReload;
    confirmReload.show();
    if (existsUnsaved) {
      msg += '<p class="w-confim-reload-note">Note: There are unsaved changes.</p>';
    }
    $('.w-reload-data-tips').html(msg).attr('data-name', this.state.name);
  },
  componentDidMount: function() {
    var self = this;
    var clipboard = new Clipboard('.w-copy-text');
    clipboard.on('error', function(e) {
      alert('Copy failed.');
    });
    clipboard = new Clipboard('.w-copy-text-with-tips');
    clipboard.on('error', function(e) {
      message.error('Copy failed.');
    });
    clipboard.on('success', function(e) {
      message.success('Copied clipboard.');
    });
    var preventDefault = function(e) {
      e.preventDefault();
    };
    events.on('rulesChanged', function() {
      self.rulesChanged = true;
      self.showReloadRules();
    });
    events.on('updateGlobal', function() {
      self.setState({});
    });
    events.on('valuesChanged', function() {
      self.valuesChanged = true;
      self.showReloadValues();
    });
    events.on('disableAllPlugins', function(e) {
      self.disableAllPlugins(e);
    });
    events.on('showFiles', function(_, data) {
      self.files = self.files || data;
      self.showFiles();
    });

    events.on('activeRules', function() {
      var rulesModal = dataCenter.rulesModal;
      if (rulesModal.exists(dataCenter.activeRulesName)) {
        self.setRulesActive(dataCenter.activeRulesName, rulesModal);
        self.setState({});
      }
    });

    events.on('activeValues', function() {
      var valuesModal = dataCenter.valuesModal;
      if (valuesModal.exists(dataCenter.activeValuesName)) {
        self.setValuesActive(dataCenter.activeValuesName, valuesModal);
        self.setState({});
      }
    });

    $(document)
      .on( 'dragleave', preventDefault)
      .on( 'dragenter', preventDefault)
      .on( 'dragover', preventDefault)
      .on('drop', function(e) {
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
              return alert('The file size cannot exceed 2m.');
            }
            util.readFileAsText(file, function(logs) {
              logs = util.parseLogs(logs);
              if (!logs) {
                return;
              }
              if (dataCenter.uploadLogs !== null) {
                dataCenter.uploadLogs = logs;
              }
              events.trigger('showLog');
              events.trigger('uploadLogs', {logs: logs});
            });
            return;
          }
          data = new FormData();
          data.append('importSessions', files[0]);
          self.uploadSessionsForm(data);
        } if (target.closest('.w-divider-left').length) {
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
      }).on('keydown', function(e) {
        if ((e.metaKey || e.ctrlKey) && e.keyCode === 82) {
          e.preventDefault();
        }
      });
    var removeItem = function(e) {
      var target = e.target;
      if ( target.nodeName == 'A'
          && $(target).parent().hasClass('w-list-data')) {
        self.state.name == 'rules' ? self.removeRules() : self.removeValues();
      }
      e.preventDefault();
    };
    $(window).on('hashchange', function() {
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
    }).on('keyup', function(e) {
      if (e.keyCode == 27) {
        self.setMenuOptionsState();
        var dialog = $('.modal');
        if (typeof dialog.modal == 'function') {
          dialog.modal('hide');
        }
      }
    }).on('keydown', function(e) {
      e.keyCode == 46 && removeItem(e);
      if (!e.ctrlKey && !e.metaKey) {
        if (e.keyCode === 112) {
          e.preventDefault();
          window.open('https://avwo.github.io/whistle/webui/' + self.state.name + '.html');
        } else if (e.keyCode === 116) {
          e.preventDefault();
        }
        return;
      }
      if (e.keyCode === 77) {
        self.toggleLeftMenu();
      }
      var isNetwork = self.state.name === 'network';
      if (isNetwork && e.keyCode == 88) {
        if (!util.isFocusEditor() && !$(e.target).closest('.w-frames-list').length) {
          self.clear();
        }
      }
      e.keyCode == 68 && removeItem(e);
      var modal = self.state.network;
      if (isNetwork && e.keyCode === 83) {
        e.preventDefault();
        if ($('.modal.in').length) {
          if ($(ReactDOM.findDOMNode(self.refs.chooseFileType)).is(':visible')) {
            self.exportBySave();
          }
          return;
        }
        var nodeName = e.target.nodeName;
        if (nodeName === 'INPUT' || nodeName === 'TEXTAREA') {
          return;
        }
        var hasSelected = modal && modal.hasSelected();
        if (hasSelected) {
          $(ReactDOM.findDOMNode(self.refs.chooseFileType)).modal('show');
          setTimeout(function() {
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

    var isEditor = function() {
      var name = self.state.name;
      return name === 'rules' || name === 'values';
    };

    $(document.body).on('mouseenter', LINK_SELECTOR, function(e) {
      if (!isEditor() || !(e.ctrlKey || e.metaKey)) {
        return;
      }
      var elem = $(this);
      if (elem.hasClass('cm-js-http-url') || elem.hasClass('cm-string')
        || elem.hasClass('cm-js-at') || getKey(elem.text())) {
        elem.addClass('w-is-link');
      }
    }).on('mouseleave', LINK_SELECTOR, function(e) {
      $(this).removeClass('w-is-link');
    }).on('mousedown', LINK_SELECTOR, function(e) {
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
        self.showAndActiveValues({name: name});
        return;
      }
    });

    if (self.state.name == 'network') {
      self.startLoadData();
    }
    dataCenter.on('settings', function(data) {
      var state = self.state;
      var server = data.server;
      if (state.interceptHttpsConnects !== data.interceptHttpsConnects
        || state.enableHttp2 !== data.enableHttp2
        || state.disabledAllRules !== data.disabledAllRules
        || state.allowMultipleChoice !== data.allowMultipleChoice
        || state.disabledAllPlugins !== data.disabledAllPlugins
        || state.multiEnv != server.multiEnv || state.classic != data.classic
        || state.ndp != server.ndp || state.ndr != server.ndr) {
        state.interceptHttpsConnects = data.interceptHttpsConnects;
        state.enableHttp2 = data.enableHttp2;
        state.disabledAllRules = data.disabledAllRules;
        state.allowMultipleChoice = data.allowMultipleChoice;
        state.disabledAllPlugins = data.disabledAllPlugins;
        state.multiEnv = server.multiEnv;
        state.ndp = server.ndp;
        state.ndr = server.ndr;
        state.classic = data.classic;
        protocols.setPlugins(state);
        self.setState({});
      }
    });
    dataCenter.on('rules', function(data) {
      var modal = self.state.rules;
      var newSelectedNames = data.list;
      if (!data.defaultRulesIsDisabled && newSelectedNames.indexOf('Default') === -1) {
        newSelectedNames.unshift('Default');
      }
      var selectedNames = modal.getSelectedNames();
      if (compareSelectedNames(selectedNames, newSelectedNames)) {
        return;
      }
      self.reselectRules(data, true);
      self.setState({});
    });
    dataCenter.on('serverInfo', function(data) {
      self.serverInfo = data;
    });

    events.on('executeComposer', function() {
      self.autoRefresh && self.autoRefresh();
    });

    var getFocusItemList = function(curItem) {
      if (!curItem || curItem.selected) {
        return;
      }
      return [curItem];
    };

    events.on('updateUI', function() {
      self.setState({});
    });

    events.on('replaySessions', function(e, curItem, shiftKey) {
      var modal = self.state.network;
      var list = getFocusItemList(curItem) || (modal && modal.getSelectedList());
      var len = list && list.length;
      if (shiftKey && len === 1) {
        self.replayList = list;
        self.refs.setReplayCount.show();
        setTimeout(function() {
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
    events.on('exportSessions', function(e, curItem) {
      self.exportData(e, getFocusItemList(curItem));
    });
    events.on('abortRequest', function(e, curItem) {
      self.abort(getFocusItemList(curItem));
    });
    events.on('uploadSessions', function(e, data) {
      var sessions = getFocusItemList(data && data.curItem);
      var upload = data && data.upload;
      if (typeof upload === 'function') {
        if (!sessions) {
          var modal = self.state.network;
          sessions = modal && modal.getSelectedList();
          if (sessions && sessions.length) {
            sessions = $.extend(true, [], sessions);
          }
        }
        sessions && upload(sessions);
      }
    });
    events.on('removeIt', function(e, item) {
      var modal = self.state.network;
      if (item && modal) {
        modal.remove(item);
        self.setState({});
      }
    });
    events.on('removeOthers', function(e, item) {
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
    events.on('removeSelected', function() {
      var modal = self.state.network;
      if (modal) {
        modal.removeSelectedItems();
        self.setState({});
      }
    });
    events.on('removeUnselected', function() {
      var modal = self.state.network;
      if (modal) {
        modal.removeUnselectedItems();
        self.setState({});
      }
    });
    events.on('removeUnmarked', function() {
      var modal = self.state.network;
      if (modal) {
        modal.removeUnmarkedItems();
        self.setState({});
      }
    });
    events.on('saveRules', function(e, item) {
      if (item.changed || !item.selected) {
        self.selectRules(item);
      } else {
        self.unselectRules(item);
      }
    });
    events.on('saveValues', function(e, item) {
      self.saveValues(item);
    });
    events.on('renameRules', function(e, item) {
      self.showEditRules(item);
    });
    events.on('renameValues', function(e, item) {
      self.showEditValues(item);
    });
    events.on('deleteRules', function(e, item) {
      setTimeout(function() {
        self.removeRules(item);
      }, 0);
    });
    events.on('deleteValues', function(e, item) {
      setTimeout(function() {
        self.removeValues(item);
      }, 0);
    });
    events.on('createRules', self.showCreateRules);
    events.on('createValues', self.showCreateValues);
    events.on('createRuleGroup', self.showCreateRuleGroup);
    events.on('createValueGroup', self.showCreateValueGroup);
    events.on('exportRules', self.exportData);
    events.on('exportValues', self.exportData);
    events.on('importRules', self.importRules);
    events.on('importValues', self.importValues);
    events.on('uploadRules', function(e, data) {
      var form = getJsonForm(data);
      form.append('replaceAll', '1');
      self._uploadRules(form, true);
    });
    events.on('uploadValues', function(e, data) {
      var form = getJsonForm(data, 'values');
      form.append('replaceAll', '1');
      self._uploadValues(form, true);
    });
    var timeout;
    $(document).on('visibilitychange', function() {
      clearTimeout(timeout);
      if (document.hidden) {
        return;
      }
      timeout = setTimeout(function() {
        var atBottom = self.scrollerAtBottom && self.scrollerAtBottom();
        self.setState({}, function() {
          atBottom && self.autoRefresh();
        });
      }, 100);
    });

    setTimeout(function() {
      dataCenter.checkUpdate(function(data) {
        if (data && data.showUpdate) {
          self.setState({
            version: data.version,
            latestVersion: data.latestVersion
          }, function() {
            $(ReactDOM.findDOMNode(self.refs.showUpdateTipsDialog)).modal('show');
          });
        }
      });
    }, 10000);

    dataCenter.getLogIdList = this.getLogIdListFromRules;
    dataCenter.importAnySessions = self.importAnySessions;
    dataCenter.on('plugins', function(data) {
      var pluginsOptions = self.createPluginsOptions(data.plugins);
      var oldPluginsOptions = self.state.pluginsOptions;
      var oldDisabledPlugins = self.state.disabledPlugins;
      var disabledPlugins = data.disabledPlugins;
      if (pluginsOptions.length == oldPluginsOptions.length) {
        var hasUpdate;
        for (var i = 0, len = pluginsOptions.length; i < len; i++) {
          var plugin = pluginsOptions[i];
          var oldPlugin = oldPluginsOptions[i];
          if (plugin.name != oldPlugin.name
            || plugin.latest !== oldPlugin.latest || plugin.mtime != oldPlugin.mtime
            || (oldDisabledPlugins[plugin.name] != disabledPlugins[plugin.name])
            || plugin.hideLongProtocol != oldPlugin.hideLongProtocol
            || plugin.hideShortProtocol != oldPlugin.hideShortProtocol) {
            hasUpdate = true;
            break;
          }
        }
        if (!hasUpdate) {
          return;
        }
      }
      var pluginsState = {
        plugins: data.plugins,
        disabledPlugins: data.disabledPlugins,
        pluginsOptions: pluginsOptions
      };
      protocols.setPlugins(pluginsState);
      self.setState(pluginsState);
    });
    try {
      var onReady = window.parent.onWhistleReady;
      if (typeof onReady === 'function') {
        onReady({
          url: location.href,
          importSessions: self.importAnySessions,
          importHarSessions: self.importHarSessions,
          clearSessions: self.clear
        });
      }
    } catch(e) {}
  },
  importAnySessions: function(data) {
    if (data) {
      if (Array.isArray(data)) {
        dataCenter.addNetworkList(data);
      } else {
        this.importHarSessions(data);
      }
    }
  },
  donotShowAgain: function() {
    dataCenter.donotShowAgain();
  },
  hideUpdateTipsDialog: function() {
    $(ReactDOM.findDOMNode(this.refs.showUpdateTipsDialog)).modal('hide');
  },
  getAllRulesText: function() {
    var text = ' ' + this.getAllRulesValue();
    return text.replace(/#[^\r\n]*[\r\n]/g, '\n');
  },
  getLogIdListFromRules: function() {
    var text = this.getAllRulesText();
    if (text = text.match(/\slog:\/\/(?:\{[^\s]{1,36}\}|[^/\\{}()<>\s]{1,36})\s/g)) {
      var flags = {};
      text = text.map(function(logId) {
        logId = util.removeProtocol(logId.trim());
        if (logId[0] === '{') {
          logId = logId.slice(1, -1);
        }
        return logId;
      }).filter(function(logId) {
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
  getWeinreFromRules: function() {
    var values = this.state.values;
    var text = this.getAllRulesText();
    if (text = text.match(/\sweinre:\/\/[^\s#]+\s/g)) {
      var flags = {};
      text = text.map(function(weinre) {
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
      }).filter(function(weinre) {
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
  getValuesFromRules: function() {
    var text = ' ' + this.getAllRulesValue();
    if (text = text.match(/\s(?:[\w-]+:\/\/)?\{[^\s#]+\}/g)) {
      text = text.map(function(key) {
        return getKey(util.removeProtocol(key.trim()));
      }).filter(function(key) {
        return !!key;
      });
    }
    return text;
  },
  getAllRulesValue: function() {
    var result = [];
    var activeList = [];
    var selectedList = [];
    var modal = this.state.rules;
    modal.list.forEach(function(name) {
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
    modal.list.forEach(function(name) {
      if (/\.rules$/.test(name)) {
        result.push(modal.get(name).value);
      }
    });

    return activeList.concat(selectedList).concat(result).join('\r\n');
  },
  preventBlur: function(e) {
    e.target.nodeName != 'INPUT' && e.preventDefault();
  },
  startLoadData: function() {
    var self = this;
    if (self._updateNetwork) {
      self._updateNetwork();
      return;
    }
    var scrollTimeout;
    var baseDom = $('.w-req-data-list .ReactVirtualized__Grid:first').scroll(function() {
      var modal = self.state.network;
      scrollTimeout && clearTimeout(scrollTimeout);
      scrollTimeout = null;
      if (modal && atBottom()) {
        scrollTimeout = setTimeout(function() {
          update(modal, true);
        }, 1000);
      }
    });

    var timeout;
    var con = baseDom[0];
    this.container = baseDom;
    dataCenter.on('data', update);

    function update(modal, _atBottom) {
      modal = modal || self.state.network;
      clearTimeout(timeout);
      timeout = null;
      if (self.state.name != 'network' || !modal) {
        return;
      }
      _atBottom = _atBottom || atBottom();
      if (modal.update(_atBottom) && _atBottom) {
        timeout = setTimeout(update, 3000);
      }
      if (document.hidden) {
        return;
      }
      self.setState({
        network: modal
      }, function() {
        _atBottom && scrollToBottom();
      });
    }

    function scrollToBottom() {
      con.scrollTop = 10000000;
    }

    $(document).on('dblclick', '.w-network-menu-list', function(e) {
      if ($(e.target).hasClass('w-network-menu-list')) {
        con.scrollTop = 0;
      }
    });

    self._updateNetwork = update;
    self.autoRefresh = scrollToBottom;
    self.scrollerAtBottom = atBottom;

    function atBottom() {
      var body = baseDom.find('.ReactVirtualized__Grid__innerScrollContainer')[0];
      if(!body){
        return true;
      }
      return con.scrollTop + con.offsetHeight + 5 > body.offsetHeight;
    }
  },
  showPlugins: function(e) {
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
  handleAction: function(type) {
    if (type === 'top') {
      this.container[0].scrollTop = 0;
      return;
    }
    if (type === 'bottom') {
      return this.autoRefresh();
    }
    if (type === 'pause') {
      return dataCenter.pauseNetworkRecord();
    }
    var refresh = type === 'refresh';
    dataCenter.stopNetworkRecord(!refresh);
    if (refresh) {
      return this.autoRefresh();
    }
  },
  showNetwork: function(e) {
    if (this.state.name == 'network') {
      e  && !this.state.showLeftMenu && this.showNetworkOptions();
      return;
    }
    this.setMenuOptionsState();
    this.setState({
      hasNetwork: true,
      name: 'network'
    }, function() {
      this.startLoadData();
    });
    util.changePageName('network');
  },
  handleNetwork: function(item, e) {
    var modal = this.state.network;
    if (item.id == 'removeAll') {
      this.clear();
    } else if (item.id == 'removeSelected') {
      modal && modal.removeSelectedItems();
    } else if (item.id == 'removeUnselected') {
      modal && modal.removeUnselectedItems();
    } else if (item.id == 'exportWhistleFile') {
      this.exportSessions('whistle');
    } else if (item.id == 'exportSazFile') {
      this.exportSessions('Fiddler');
    } else if (item.id == 'importSessions') {
      this.importSessions(e);
    }
    this.hideNetworkOptions();
  },
  importData: function(e) {
    switch(this.state.name) {
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
  exportData: function(e, curItem) {
    switch(this.state.name) {
    case 'network':
      var modal = this.state.network;
      var hasSelected = Array.isArray(curItem) || (modal && modal.hasSelected());
      this.currentFoucsItem = curItem;
      if (hasSelected) {
        $(ReactDOM.findDOMNode(this.refs.chooseFileType)).modal('show');
        var self = this;
        setTimeout(function() {
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
  importSessions: function(e, data) {
    var self = this;
    var shiftKey = (e && e.shiftKey) || (data && data.shiftKey);
    if (shiftKey) {
      self.refs.importRemoteSessions.show();
      setTimeout(function() {
        var input = ReactDOM.findDOMNode(self.refs.sessionsRemoteUrl);
        input.focus();
        input.select();
      }, 500);
      return;
    }
    ReactDOM.findDOMNode(self.refs.importSessions).click();
  },
  importRemoteSessions: function(e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    var self = this;
    var input = ReactDOM.findDOMNode(self.refs.sessionsRemoteUrl);
    var url = checkUrl(input.value);
    if (!url) {
      return;
    }
    self.setState({ pendingSessions: true });
    dataCenter.importRemote({ url: url },  getRemoteDataHandler(function(err, data) {
      self.setState({ pendingSessions: false });
      if (err) {
        return;
      }
      self.refs.importRemoteSessions.hide();
      self.importAnySessions(data);
    }));
  },
  importRules: function(e, data) {
    var self = this;
    var shiftKey = (e && e.shiftKey) || (data && data.shiftKey);
    if (shiftKey) {
      self.refs.importRemoteRules.show();
      setTimeout(function() {
        var input = ReactDOM.findDOMNode(self.refs.rulesRemoteUrl);
        input.focus();
        input.select();
      }, 500);
      return;
    }
    ReactDOM.findDOMNode(self.refs.importRules).click();
  },
  importRemoteRules: function(e) {
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
    dataCenter.importRemote({ url: url },  getRemoteDataHandler(function(err, data) {
      self.setState({ pendingRules: false });
      if (err) {
        return;
      }
      self.refs.importRemoteRules.hide();
      if (data) {
        self.rulesForm = getJsonForm(data);
        self.refs.confirmImportRules.show();
      }
    }));
  },
  importValues: function(e, data) {
    var self = this;
    var shiftKey = (e && e.shiftKey) || (data && data.shiftKey);
    if (shiftKey) {
      self.refs.importRemoteValues.show();
      setTimeout(function() {
        var input = ReactDOM.findDOMNode(self.refs.valuesRemoteUrl);
        input.focus();
        input.select();
      }, 500);
      return;
    }
    ReactDOM.findDOMNode(self.refs.importValues).click();
  },
  importRemoteValues: function(e) {
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
    dataCenter.importRemote({ url: url },  getRemoteDataHandler(function(err, data) {
      self.setState({ pendingValues: false });
      if (err) {
        return;
      }
      self.refs.importRemoteValues.hide();
      if (data) {
        self.valuesForm = getJsonForm(data, 'values');
        self.refs.confirmImportValues.show();
      }
    }));
  },
  _uploadRules: function(data, showResult) {
    var self = this;
    dataCenter.upload.importRules(data, function(data, xhr) {
      if (!data) {
        util.showSystemError(xhr);
      } else if (data.ec === 0) {
        self.reloadRules(data);
        showResult && message.success('Successful synchronization Rules.');
      } else  {
        alert(data.em);
      }
    });
  },
  _uploadValues: function(data, showResult) {
    var self = this;
    dataCenter.upload.importValues(data, function(data, xhr) {
      if (!data) {
        util.showSystemError(xhr);
      } if (data.ec === 0) {
        self.reloadValues(data);
        showResult && message.success('Successful synchronization Values.');
      } else {
        alert(data.em);
      }
    });
  },
  uploadRules: function(e) {
    var data = this.rulesForm;
    this.rulesForm = null;
    if (!data) {
      return;
    }
    var file = data.get('rules');
    if (!file || !/\.(txt|json)$/i.test(file.name)) {
      return alert('Only supports .txt or .json file.');
    }

    if (file.size > MAX_OBJECT_SIZE) {
      return alert('The file size cannot exceed 6m.');
    }
    if ($(e.target).hasClass('btn-danger')) {
      data.append('replaceAll', '1');
    }
    this._uploadRules(data);
    ReactDOM.findDOMNode(this.refs.importRules).value = '';
  },
  uploadValues: function(e) {
    var data = this.valuesForm;
    this.valuesForm = null;
    if (!data) {
      return;
    }
    var file = data.get('values');
    if (!file || !/\.(txt|json)$/i.test(file.name)) {
      return alert('Only supports .txt or .json file.');
    }

    if (file.size > MAX_OBJECT_SIZE) {
      return alert('The file size cannot exceed 6m.');
    }
    if ($(e.target).hasClass('btn-danger')) {
      data.append('replaceAll', '1');
    }
    this._uploadValues(data);
    ReactDOM.findDOMNode(this.refs.importValues).value = '';
  },
  uploadRulesForm: function() {
    this.rulesForm = new FormData(ReactDOM.findDOMNode(this.refs.importRulesForm));
    this.refs.confirmImportRules.show();
  },
  uploadValuesForm: function() {
    this.valuesForm = new FormData(ReactDOM.findDOMNode(this.refs.importValuesForm));
    this.refs.confirmImportValues.show();
  },
  clearNetwork: function() {
    this.clear();
    this.hideNetworkOptions();
  },
  showAndActiveRules: function(item, e) {
    if (this.state.name === 'rules') {
      switch(item.id) {
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
  showRules: function(e) {
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
  showAndActiveValues: function(item, e) {
    var self = this;
    if (self.state.name === 'values' && item.id) {
      switch(item.id) {
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
        dataCenter.values.add({name: name}, function(data, xhr) {
          if (data && data.ec === 0) {
            var item = modal.add(name);
            self.setValuesActive(name);
            self.setState({
              activeValues: item
            });
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
  showValues: function(e) {
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
  showNetworkOptions: function() {
    if (this.state.name == 'network') {
      this.setState({
        showNetworkOptions: true
      });
    }
  },
  hideNetworkOptions: function() {
    this.setState({
      showRemoveOptions: false,
      showAbortOptions: false,
      showNetworkOptions: false
    });
  },
  showRemoveOptions: function() {
    this.setState({
      showRemoveOptions: true
    });
  },
  showAbortOptions: function() {
    var modal = this.state.network;
    var list = modal && modal.getSelectedList();
    ABORT_OPTIONS[0].disabled = !list || !list.filter(util.canAbort).length;
    this.setState({
      showAbortOptions: true
    });
  },
  showCreateOptions: function() {
    this.setState({
      showCreateOptions: true
    });
  },
  hideCreateOptions: function() {
    this.setState({
      showCreateOptions: false
    });
  },
  hideRemoveOptions: function() {
    this.setState({
      showRemoveOptions: false
    });
  },
  hideAbortOptions: function() {
    this.setState({
      showAbortOptions: false
    });
  },
  showHelpOptions: function() {
    this.setState({
      showHelpOptions: true
    });
  },
  hideHelpOptions: function() {
    this.setState({
      showHelpOptions: false
    });
  },
  showHasNewVersion: function(hasNewVersion) {
    this.setState({
      hasNewVersion: hasNewVersion
    });
  },
  showRulesOptions: function(e) {
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
      rulesList.forEach(function(name) {
        rulesOptions.push(data[name]);
      });
    }
    self.setState({
      rulesOptions: rulesOptions,
      showRulesOptions: true
    });
  },
  hideRulesOptions: function() {
    this.setState({
      showRulesOptions: false
    });
  },
  showValuesOptions: function(e) {
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
      list.forEach(function(name) {
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
  hideValuesOptions: function() {
    this.setState({
      showValuesOptions: false
    });
  },
  showAndActivePlugins: function(option) {
    this.hidePluginsOptions();
    this.showPlugins();
    this.showPluginTab(option.name);
  },
  showPluginTab: function(name) {
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

    if (name &&  this.state.plugins[name + ':']) {
      if (tabs.length >= MAX_PLUGINS_TABS) {
        alert('You can only open ' + MAX_PLUGINS_TABS + ' tabs.');
        return this.showPlugins();
      }
      active = name;
      tabs.push({
        name: name,
        url: 'plugin.' + name + '/'
      });
    }

    this.setState({
      active: active,
      tabs: tabs
    });
  },
  activePluginTab: function(e) {
    this.showPluginTab($(e.target).attr('data-name'));
  },
  closePluginTab: function(e) {
    var name = $(e.target).attr('data-name');
    var tabs = this.state.tabs || [];
    if (tabs) {
      for (var i = 0, len = tabs.length; i < len; i++) {
        if (tabs[i].name == name) {
          tabs.splice(i, 1);
          var active = this.state.active;
          if (active == name) {
            var plugin = tabs[i] || tabs[i - 1];
            this.state.active = plugin ? plugin.name : null;
          }

          return this.setState({
            tabs: tabs
          });
        }
      }
    }
  },
  showPluginsOptions: function(e) {
    this.setState({
      showPluginsOptions: true
    });
  },
  hidePluginsOptions: function() {
    this.setState({
      showPluginsOptions: false
    });
  },
  showWeinreOptionsQuick: function(e) {
    var list = this.getWeinreFromRules();
    if (!list || !list.length) {
      this.showAnonymousWeinre();
      return;
    }
    $(e.target).closest('div').addClass('w-menu-wrapper-show');
  },
  showWeinreOptions: function(e) {
    var self = this;
    var list = self.state.weinreOptions = self.getWeinreFromRules() || [];
    self.state.weinreOptions = util.unique(list).map(function(name) {
      return {
        name: name,
        icon: 'console'
      };
    });
    self.setState({
      showWeinreOptions: true
    });
  },
  hideWeinreOptions: function() {
    this.setState({
      showWeinreOptions: false
    });
  },
  setMenuOptionsState: function(name, callback) {
    var state = {
      showCreateRules: false,
      showCreateValues: false,
      showCreateRuleGroup: false,
      showCreateValueGroup: false,
      showEditRules: false,
      showEditValues: false,
      showCreateOptions: false
    };
    if (name) {
      state[name] = true;
    }
    this.setState(state, callback);
  },
  hideRulesInput: function() {
    this.setState({ showCreateRules: false });
  },
  hideValuesInput: function() {
    this.setState({ showCreateValues: false });
  },
  hideRuleGroup: function() {
    this.setState({ showCreateRuleGroup: false });
  },
  hideValueGroup: function() {
    this.setState({ showCreateValueGroup: false });
  },
  hideRenameRuleInput: function() {
    this.setState({ showEditRules: false });
  },
  hideRenameValueInput: function() {
    this.setState({ showEditValues: false });
  },
  showCreateRules: function() {
    var createRulesInput = ReactDOM.findDOMNode(this.refs.createRulesInput);
    this.setState({
      showCreateRules: true
    }, function() {
      createRulesInput.focus();
    });
  },
  showCreateValues: function() {
    var createValuesInput = ReactDOM.findDOMNode(this.refs.createValuesInput);
    this.setState({
      showCreateValues: true
    }, function() {
      createValuesInput.focus();
    });
  },
  showCreateRuleGroup: function() {
    var createGroupInput = ReactDOM.findDOMNode(this.refs.createRuleGroupInput);
    this.setState({
      showCreateRuleGroup: true
    }, function() {
      createGroupInput.focus();
    });
  },
  showCreateValueGroup: function() {
    var createGroupInput = ReactDOM.findDOMNode(this.refs.createValueGroupInput);
    this.setState({
      showCreateValueGroup: true
    }, function() {
      createGroupInput.focus();
    });
  },
  showHttpsSettingsDialog: function() {
    $(ReactDOM.findDOMNode(this.refs.rootCADialog)).modal('show');
  },
  interceptHttpsConnects: function(e) {
    var self = this;
    var checked = e.target.checked;
    dataCenter.interceptHttpsConnects({interceptHttpsConnects: checked ? 1 : 0},
        function(data, xhr) {
          if (data && data.ec === 0) {
            self.state.interceptHttpsConnects = checked;
          } else {
            util.showSystemError(xhr);
          }
          self.setState({});
        });
  },
  enableHttp2: function(e) {
    if (!dataCenter.supportH2) {
      if (window.confirm('The current version of Node.js cannot support HTTP/2.\nPlease upgrade to the latest LTS version.')) {
        window.open('https://nodejs.org/');
      }
      this.setState({});
      return;
    }
    var self = this;
    var checked = e.target.checked;
    dataCenter.enableHttp2({enableHttp2: checked ? 1 : 0},
        function(data, xhr) {
          if (data && data.ec === 0) {
            self.state.enableHttp2 = checked;
          } else {
            util.showSystemError(xhr);
          }
          self.setState({});
        });
  },
  createRules: function(e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var self = this;
    var target = ReactDOM.findDOMNode(self.refs.createRulesInput);
    var name = $.trim(target.value);
    if (!name) {
      message.error('The name cannot be empty.');
      return;
    }

    var modal = self.state.rules;
    if (modal.exists(name)) {
      message.error('The name \'' + name + '\' already exists.');
      return;
    }

    dataCenter.rules.add({name: name}, function(data, xhr) {
      if (data && data.ec === 0) {
        var item = modal.add(name);
        self.setRulesActive(name);
        target.value = '';
        target.blur();
        self.setState({
          activeRules: item
        });
        self.triggerRulesChange('create');
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  createValues: function(e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var self = this;
    var target = ReactDOM.findDOMNode(self.refs.createValuesInput);
    var name = $.trim(target.value);
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
    if (modal.exists(name)) {
      message.error('The name \'' + name + '\' already exists.');
      return;
    }

    dataCenter.values.add({name: name}, function(data, xhr) {
      if (data && data.ec === 0) {
        var item = modal.add(name);
        self.setValuesActive(name);
        target.value = '';
        target.blur();
        self.setState({
          activeValues: item
        });
        self.triggerValuesChange('create');
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  showEditRules: function(item) {
    this.currentFoucsRules = item;
    var modal = this.state.rules;
    var activeItem = item || modal.getActive();
    if (!activeItem || activeItem.isDefault) {
      return;
    }
    var editRulesInput = ReactDOM.findDOMNode(this.refs.editRulesInput);
    editRulesInput.value = activeItem.name;
    this.setState({
      showEditRules: true,
      selectedRule: activeItem
    }, function() {
      editRulesInput.select();
      editRulesInput.focus();
    });
  },
  showEditValuesByDBClick: function(item) {
    !item.changed && this.showEditValues();
  },
  showEditValues: function(item) {
    this.currentFoucsValues = item;
    var modal = this.state.values;
    var activeItem = item || modal.getActive();
    if (!activeItem || activeItem.isDefault) {
      return;
    }

    var editValuesInput = ReactDOM.findDOMNode(this.refs.editValuesInput);
    editValuesInput.value = activeItem.name;
    this.setState({
      showEditValues: true,
      selectedValue: activeItem
    }, function() {
      editValuesInput.select();
      editValuesInput.focus();
    });
  },
  editRules: function(e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var self = this;
    var modal = self.state.rules;
    var activeItem = this.currentFoucsRules || modal.getActive();
    if (!activeItem) {
      return;
    }
    var target = ReactDOM.findDOMNode(self.refs.editRulesInput);
    var name = $.trim(target.value);
    if (!name) {
      message.error('The name cannot be empty.');
      return;
    }

    if (modal.exists(name)) {
      message.error('The name \'' + name + '\' already exists.');
      return;
    }

    dataCenter.rules.rename({name: activeItem.name, newName: name}, function(data, xhr) {
      if (data && data.ec === 0) {
        modal.rename(activeItem.name, name);
        if (!self.currentFoucsRules) {
          self.setRulesActive(name);
        }
        target.value = '';
        target.blur();
        self.setState(self.currentFoucsRules ? {} : {
          activeValues: activeItem
        });
        self.triggerRulesChange('rename');
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  editValues: function(e) {
    if (e.keyCode != 13 && e.type != 'click') {
      return;
    }
    var self = this;
    var modal = self.state.values;
    var activeItem = this.currentFoucsValues || modal.getActive();
    if (!activeItem) {
      return;
    }
    var target = ReactDOM.findDOMNode(self.refs.editValuesInput);
    var name = $.trim(target.value);
    if (!name) {
      message.error('The name cannot be empty.');
      return;
    }

    if (modal.exists(name)) {
      message.error('The name \'' + name + '\' already exists.');
      return;
    }

    dataCenter.values.rename({name: activeItem.name, newName: name}, function(data, xhr) {
      if (data && data.ec === 0) {
        modal.rename(activeItem.name, name);
        if (!self.currentFoucsValues) {
          self.setValuesActive(name);
        }
        target.value = '';
        target.blur();
        self.setState(self.currentFoucsValues ? {} : {
          activeValues: activeItem
        });
        self.triggerValuesChange('rename');
        checkJson(activeItem);
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  showAnonymousWeinre: function() {
    this.openWeinre();
  },
  showWeinre: function(options) {
    this.openWeinre(options.name);
  },
  openWeinre: function(name) {
    window.open('weinre/client/#' + (name || 'anonymous'));
    this.setState({
      showWeinreOptions: false
    });
  },
  onClickRulesOption: function(item) {
    item.selected ? this.unselectRules(item) : this.selectRules(item);
  },
  selectRules: function(item) {
    var self = this;
    dataCenter.rules[item.isDefault ? 'enableDefault' : 'select'](item, function(data, xhr) {
      if (data && data.ec === 0) {
        self.reselectRules(data);
        self.state.rules.setChanged(item.name, false);
        self.setState({});
        self.triggerRulesChange('save');
        if (self.state.disabledAllRules &&
          confirm('Rules has been turn off, do you want to turn on it?')) {
          dataCenter.rules.disableAllRules({disabledAllRules: 0}, function(data, xhr) {
            if (data && data.ec === 0) {
              self.state.disabledAllRules = false;
              self.setState({});
            } else {
              util.showSystemError(xhr);
            }
          });
        }
      } else {
        util.showSystemError(xhr);
      }
    });
    return false;
  },
  selectRulesByOptions: function(e) {
    var item = this.state.rules.data[$(e.target).attr('data-name')];
    this[e.target.checked ? 'selectRules' : 'unselectRules'](item);
  },
  unselectRules: function(item) {
    var self = this;
    dataCenter.rules[item.isDefault ? 'disableDefault' : 'unselect'](item, function(data, xhr) {
      if (data && data.ec === 0) {
        self.reselectRules(data);
        self.setState({});
      } else {
        util.showSystemError(xhr);
      }
    });
    return false;
  },
  reselectRules: function(data, autoUpdate) {
    var self = this;
    self.state.rules.clearAllSelected();
    self.setSelected(self.state.rules, 'Default', !data.defaultRulesIsDisabled, autoUpdate);
    data.list.forEach(function(name) {
      self.setSelected(self.state.rules, name, true, autoUpdate);
    });
  },
  saveValues: function(item) {
    if (!item.changed) {
      return;
    }
    var self = this;
    dataCenter.values.add(item, function(data, xhr) {
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
  setSelected: function(modal, name, selected, autoUpdate) {
    if (modal.setSelected(name, selected)) {
      if (!autoUpdate) {
        modal.setChanged(name, false);
      }
      this.setState({
        curSelectedName: name
      });
    }
  },
  replayCountChange: function(e) {
    var count = e.target.value.replace(/^\s*0*|[^\d]+/, '');
    var replayCount = count.slice(0, 2);
    if (replayCount > MAX_REPLAY_COUNT) {
      replayCount = MAX_REPLAY_COUNT;
    }
    this.setState({ replayCount: replayCount });
  },
  clickReplay: function(e) {
    if (e.shiftKey) {
      events.trigger('replaySessions', [null, e.shiftKey]);
    } else {
      this.replay(e);
    }
  },
  replay: function(e, list, count) {
    var modal = this.state.network;
    list = Array.isArray(list) ? list : (modal && modal.getSelectedList());
    if (!list || !list.length) {
      return;
    }
    var replayReq = function(item) {
      var req = item.req;
      if (util.canReplay(item)) {
        dataCenter.compose2({
          useH2: item.useH2 ? 1 : '',
          url: item.url,
          headers:   util.getOriginalReqHeaders(item),
          method: req.method,
          base64: req.base64
        });
      }
    };
    if (count > 1) {
      count = Math.min(count, MAX_REPLAY_COUNT);
      var reqItem = list[0];
      if (util.canReplay(reqItem)) {
        for(var i = 0; i < count; i++) {
          replayReq(reqItem);
        }
      }
    } else {
      list.slice(0, MAX_REPLAY_COUNT).forEach(replayReq);
    }
    this.autoRefresh && this.autoRefresh();
  },
  composer: function() {
    events.trigger('composer');
  },
  showFiles: function() {
    this.refs.filesDialog.show(this.files);
  },
  clear: function() {
    var modal = this.state.network;
    modal && this.setState({
      network: modal.clear(),
      showRemoveOptions: false
    });
  },
  removeRules: function(item) {
    var self = this;
    var modal = this.state.rules;
    var activeItem = item || modal.getActive();
    if (activeItem && !activeItem.isDefault) {
      var name = activeItem.name;
      if (confirm('Are you sure to delete this rule group \'' + name + '\'.')) {
        dataCenter.rules.remove({name: name}, function(data, xhr) {
          if (data && data.ec === 0) {
            var nextItem = item && !item.active ? null : modal.getSibling(name);
            nextItem && self.setRulesActive(nextItem.name);
            modal.remove(name);
            self.setState(item ? {} : {
              activeRules: nextItem
            });
            self.triggerRulesChange('remove');
          } else {
            util.showSystemError(xhr);
          }
        });
      }
    }
  },
  removeValues: function(item) {
    var self = this;
    var modal = this.state.values;
    var activeItem = item || modal.getActive();
    if (activeItem && !activeItem.isDefault) {
      var name = activeItem.name;
      if (confirm('Are you sure to delete this Value \'' + name + '\'.')) {
        dataCenter.values.remove({name: name}, function(data, xhr) {
          if (data && data.ec === 0) {
            var nextItem = item && !item.active ? null : modal.getSibling(name);
            nextItem && self.setValuesActive(nextItem.name);
            modal.remove(name);
            self.setState(item ? {} : {
              activeValues: nextItem
            });
            self.triggerValuesChange('remove');
          } else {
            util.showSystemError(xhr);
          }
        });
      }
    }
  },
  setRulesActive: function(name, modal) {
    modal = modal || this.state.rules;
    storage.set('activeRules', name);
    modal.setActive(name);
  },
  setValuesActive: function(name, modal) {
    modal = modal || this.state.values;
    storage.set('activeValues', name);
    modal.setActive(name);
  },
  showRulesSettings: function() {
    $(ReactDOM.findDOMNode(this.refs.rulesSettingsDialog)).modal('show');
  },
  showValuesSettings: function() {
    $(ReactDOM.findDOMNode(this.refs.valuesSettingsDialog)).modal('show');
  },
  toggleLeftMenu: function() {
    var showLeftMenu = !this.state.showLeftMenu;
    this.setState({
      showLeftMenu: showLeftMenu
    });
    storage.set('showLeftMenu', showLeftMenu ? 1 : '');
  },
  handleCreate: function(item) {
    this.state.name == 'rules' ? this.showCreateRules() : this.showCreateValues();
  },
  onClickMenu: function(e) {
    var target = $(e.target).closest('a');
    var self = this;
    var list;
    var isRules = self.state.name == 'rules';
    if (target.hasClass('w-edit-menu')) {
      isRules ? self.showEditRules() : self.showEditValues();
    } else if (target.hasClass('w-delete-menu')) {
      isRules ? self.removeRules() : self.removeValues();
    } else if (target.hasClass('w-save-menu')) {
      if (isRules) {
        list = self.state.rules.getChangedList();
        if(list.length) {
          list.forEach(function(item) {
            self.selectRules(item);
          });
          self.setState({});
        }
      } else {
        list = self.state.values.getChangedList();
        if (list.length) {
          list.forEach(function(item) {
            self.saveValues(item);
          });
          self.setState({});
        }
      }
    }
  },
  showSettings: function(e) {
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
  activeRules: function(item) {
    storage.set('activeRules', item.name);
    this.setState({
      activeRules: item
    });
  },
  activeValues: function(item) {
    storage.set('activeValues', item.name);
    this.setState({
      activeValues: item
    });
  },
  onRulesThemeChange: function(e) {
    var theme = e.target.value;
    storage.set('rulesTheme', theme);
    this.setState({
      rulesTheme: theme
    });
  },
  onValuesThemeChange: function(e) {
    var theme = e.target.value;
    storage.set('valuesTheme', theme);
    this.setState({
      valuesTheme: theme
    });
  },
  onRulesFontSizeChange: function(e) {
    var fontSize = e.target.value;
    storage.set('rulesFontSize', fontSize);
    this.setState({
      rulesFontSize: fontSize
    });
  },
  onValuesFontSizeChange: function(e) {
    var fontSize = e.target.value;
    storage.set('valuesFontSize', fontSize);
    this.setState({
      valuesFontSize: fontSize
    });
  },
  onRulesLineNumberChange: function(e) {
    var checked = e.target.checked;
    storage.set('showRulesLineNumbers', checked);
    this.setState({
      showRulesLineNumbers: checked
    });
  },
  onValuesLineNumberChange: function(e) {
    var checked = e.target.checked;
    storage.set('showValuesLineNumbers', checked);
    this.setState({
      showValuesLineNumbers: checked
    });
  },
  onRulesLineWrappingChange: function(e) {
    var checked = e.target.checked;
    storage.set('autoRulesLineWrapping', checked ? 1 : '');
    this.setState({
      autoRulesLineWrapping: checked
    });
  },
  onValuesLineWrappingChange: function(e) {
    var checked = e.target.checked;
    storage.set('autoValuesLineWrapping', checked ? 1 : '');
    this.setState({
      autoValuesLineWrapping: checked
    });
  },
  disableAllRules: function(e) {
    var target = e.target;
    var checked = e.target.checked;
    var self = this;
    if (target.name !== 'disableAll') {
      checked = !checked;
    }
    dataCenter.rules.disableAllRules({disabledAllRules: checked ? 1 : 0}, function(data, xhr) {
      if (data && data.ec === 0) {
        var state = self.state;
        state.disabledAllRules = checked;
        self.setState({});
      } else {
        util.showSystemError(xhr);
      }
    });
    e.preventDefault();
  },
  disableAllPlugins: function(e) {
    var self = this;
    var state = self.state;
    var checked;
    if (e.target.nodeName === 'INPUT') {
      checked = !e.target.checked;
    } else {
      checked = !state.disabledAllPlugins;
    }
    dataCenter.plugins.disableAllPlugins({disabledAllPlugins: checked ? 1 : 0}, function(data, xhr) {
      if (data && data.ec === 0) {
        state.disabledAllPlugins = checked;
        protocols.setPlugins(state);
        self.setState({});
      } else {
        util.showSystemError(xhr);
      }
    });
    e.preventDefault();
  },
  disablePlugin: function(e) {
    var self = this;
    var target = e.target;
    if (self.state.ndp) {
      return message.warn('Not allowed disable plugins.');
    }
    dataCenter.plugins.disablePlugin({
      name: $(target).attr('data-name'),
      disabled: target.checked ? 0 : 1
    }, function(data, xhr) {
      if (data && data.ec === 0) {
        self.state.disabledPlugins = data.data;
        protocols.setPlugins(self.state);
        self.setState({});
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  abort: function(list) {
    if (!Array.isArray(list)) {
      var modal = this.state.network;
      list = modal && modal.getSelectedList();
    }
    if (list) {
      list = list.map(function(item) {
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
  allowMultipleChoice: function(e) {
    var self = this;
    var checked = e.target.checked;
    dataCenter.rules.allowMultipleChoice({allowMultipleChoice: checked ? 1 : 0}, function(data, xhr) {
      if (data && data.ec === 0) {
        self.setState({
          allowMultipleChoice: checked
        });
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  enableBackRulesFirst: function(e) {
    var self = this;
    var checked = e.target.checked;
    dataCenter.rules.enableBackRulesFirst({backRulesFirst: checked ? 1 : 0}, function(data, xhr) {
      if (data && data.ec === 0) {
        self.setState({
          backRulesFirst: checked
        });
      } else {
        util.showSystemError(xhr);
      }
    });
  },
  reinstallAllPlugins: function() {
    events.trigger('updateAllPlugins', 'reinstallAllPlugins');
  },
  chooseFileType: function(e) {
    var value = e.target.value;
    storage.set('exportFileType', value);
    this.setState({
      exportFileType: value
    });
  },
  uploadSessions: function() {
    this.uploadSessionsForm(new FormData(ReactDOM.findDOMNode(this.refs.importSessionsForm)));
    ReactDOM.findDOMNode(this.refs.importSessions).value = '';
  },
  importHarSessions: function(result) {
    if (!result || typeof result !== 'object') {
      return;
    }
    var entries = result.log.entries;
    var sessions = [];
    entries.forEach(function(entry) {
      if (!entry) {
        return;
      }
      var startTime = new Date(entry.startedDateTime).getTime();
      if (isNaN(startTime)) {
        return;
      }

      var rawReq = entry.request || {};
      var rawRes = entry.response || {};
      var reqHeaders = util.parseHeadersFromHar(rawReq.headers);
      var resHeaders = util.parseHeadersFromHar(rawRes.headers);
      var clientIp = entry.clientIPAddress || '127.0.0.1';
      var serverIp = entry.serverIPAddress || '';
      var req = {
        method: rawReq.method,
        ip: clientIp,
        httpVersion: '1.1',
        size: rawReq.bodySize,
        headers: reqHeaders.headers,
        rawHeaderNames: reqHeaders.rawHeaderNames,
        body: rawReq.postData && rawReq.postData.text || ''
      };
      var res = {
        httpVersion: '1.1',
        statusCode: rawRes.status,
        statusMessage: rawRes.statusText,
        size: rawRes.bodySize,
        headers: resHeaders.headers,
        rawHeaderNames: resHeaders.rawHeaderNames,
        ip: serverIp,
        body: ''
      };
      var resCtn = rawRes.content;
      var text = resCtn && resCtn.text;
      if (text) {
        if (util.getContentType(resCtn.mimeType) === 'IMG' || (text.length % 4 === 0 && /^[a-z\d+/]+={0,2}$/i.test(text))) {
          res.base64 = text;
        } else {
          res.body = text;
        }
      }
      var session = {
        startTime: startTime,
        url: rawReq.url,
        req: req,
        res: res,
        rules: {}
      };
      var timings = entry.timings || {};
      var endTime = Math.round(startTime + util.getTimeFromHar(entry.time));
      startTime = Math.floor(startTime + util.getTimeFromHar(timings.dns));
      session.dnsTime = startTime;
      startTime = Math.floor(startTime + util.getTimeFromHar(timings.connect)
      + util.getTimeFromHar(timings.ssl) + util.getTimeFromHar(timings.send)
      + util.getTimeFromHar(timings.blocked) + util.getTimeFromHar(timings.wait));
      session.requestTime = startTime;
      startTime = Math.floor(startTime + util.getTimeFromHar(timings.receive));
      session.responseTime = startTime;
      session.endTime = Math.max(startTime, endTime);
      sessions.push(session);
    });
    dataCenter.addNetworkList(sessions);
  },
  uploadSessionsForm: function(data) {
    var file = data.get('importSessions');
    if (!file || !/\.(txt|json|saz|har)$/i.test(file.name)) {
      return alert('Only supports .txt, .json, .saz or .har file.');
    }

    if (file.size > MAX_FILE_SIZE) {
      return alert('The file size cannot exceed 64m.');
    }
    var isText = /\.txt$/i.test(file.name);
    if (isText || /\.har$/i.test(file.name)) {
      var self = this;
      util.readFileAsText(file, function(result) {
        try {
          result = JSON.parse(result);
          if (isText) {
            dataCenter.addNetworkList(result);
          } else {
            self.importHarSessions(result);
          }
        } catch (e) {
          alert('Incorrect file format.');
        }
      });
      return;
    }
    dataCenter.upload.importSessions(data, dataCenter.addNetworkList);
  },
  exportSessions: function(type, name) {
    var modal = this.state.network;
    var sessions = this.currentFoucsItem;
    this.currentFoucsItem = null;
    if (!sessions || !$(ReactDOM.findDOMNode(this.refs.chooseFileType)).is(':visible')) {
      sessions = modal && modal.getSelectedList();
    }
    if (!sessions || !sessions.length) {
      return;
    }
    var form = ReactDOM.findDOMNode(this.refs.exportSessionsForm);
    ReactDOM.findDOMNode(this.refs.exportFilename).value = name || '';
    ReactDOM.findDOMNode(this.refs.exportFileType).value = type;
    ReactDOM.findDOMNode(this.refs.sessions).value = JSON.stringify(sessions, null, '  ');
    form.submit();
  },
  exportBySave: function(e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    var input = ReactDOM.findDOMNode(this.refs.sessionsName);
    var name = input.value.trim();
    input.value = '';
    this.exportSessions(this.state.exportFileType, name);
    $(ReactDOM.findDOMNode(this.refs.chooseFileType)).modal('hide');
  },
  replayRepeat: function(e) {
    if (e && e.type !== 'click' && e.keyCode !== 13) {
      return;
    }
    this.refs.setReplayCount.hide();
    this.replay('', this.replayList, this.state.replayCount);
    events.trigger('focusNetworkList');
  },
  showAboutDialog: function(e) {
    if ($(e.target).closest('.w-menu-enable').length) {
      this.refs.aboutDialog.showAboutInfo();
    }
  },
  showCustomCertsInfo: function() {
    var self = this;
    if (self.loadingCerts) {
      return;
    }
    self.loadingCerts = true;
    dataCenter.getCustomCertsInfo(function(data, xhr) {
      self.loadingCerts = false;
      if (!data) {
        util.showSystemError(xhr);
        return;
      }
      self.refs.certsInfoDialog.show(data);
    });
  },
  forceShowLeftMenu: function() {
    var self = this;
    clearTimeout(self.hideTimer);
    clearTimeout(self.showTimer);
    self.showTimer = setTimeout(function() {
      self.setState({ forceShowLeftMenu: true });
    }, 200);
  },
  forceHideLeftMenu: function() {
    var self = this;
    clearTimeout(self.hideTimer);
    clearTimeout(self.showTimer);
    self.hideTimer = setTimeout(function() {
      self.setState({ forceShowLeftMenu: false });
    }, 500);
  },
  render: function() {
    var state = this.state;
    var networkMode = state.networkMode;
    var rulesMode = state.rulesMode;
    var pluginsMode = state.pluginsMode;
    var multiEnv = state.multiEnv;
    var name = state.name;
    if (networkMode) {
      name = 'network';
    } else if (rulesMode) {
      name = name === 'network' ? 'rules' : name;
    } else if (pluginsMode) {
      name = name !== 'plugins' ? 'network' : name;
    }
    var isNetwork = name === undefined || name == 'network';
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

    if (rulesOptions[0].name === DEFAULT) {
      rulesOptions.forEach(function(item, i) {
        item.icon = (!i || !state.multiEnv) ? 'checkbox' : 'edit';
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
    if (state.network) {
      state.network.rulesModal = state.rules;
      state.rules.editorTheme = {
        theme: rulesTheme,
        fontSize: rulesFontSize,
        lineNumbers: showRulesLineNumbers
      };
      var networkOptions = state.networkOptions;
      var hasUnselected = state.network.hasUnselected();
      if (state.network.hasSelected()) {
        networkOptions.forEach(function(option) {
          option.disabled = false;
          if (option.id === 'removeUnselected') {
            option.disabled = !hasUnselected;
          }
        });
        REMOVE_OPTIONS.forEach(function(option) {
          option.disabled = false;
          if (option.id === 'removeUnselected') {
            option.disabled = !hasUnselected;
          }
        });
      } else {
        networkOptions.forEach(function(option) {
          if (OPTIONS_WITH_SELECTED.indexOf(option.id) !== -1) {
            option.disabled = true;
          } else if (option.id === 'removeUnselected') {
            option.disabled = !hasUnselected;
          }
        });
        networkOptions[0].disabled = !hasUnselected;
        REMOVE_OPTIONS.forEach(function(option) {
          if (OPTIONS_WITH_SELECTED.indexOf(option.id) !== -1) {
            option.disabled = true;
          } else if (option.id === 'removeUnselected') {
            option.disabled = !hasUnselected;
          }
        });
      }
    }
    var pendingSessions = state.pendingSessions;
    var pendingRules = state.pendingRules;
    var pendingValues = state.pendingValues;
    var mustHideLeftMenu = hideLeftMenu && !state.forceShowLeftMenu;
    var showLeftMenu = networkMode || state.showLeftMenu;
    var disabledAllPlugins = state.disabledAllPlugins;
    var forceShowLeftMenu, forceHideLeftMenu;
    if (showLeftMenu && hideLeftMenu) {
      forceShowLeftMenu = this.forceShowLeftMenu;
      forceHideLeftMenu = this.forceHideLeftMenu;
    }

    return (
      <div className={'main orient-vertical-box' + (showLeftMenu ? ' w-show-left-menu' : '')}>
        <div className={'w-menu w-' + name + '-menu-list'}>
          <a onClick={this.toggleLeftMenu} draggable="false" className="w-show-left-menu-btn" onMouseEnter={forceShowLeftMenu} onMouseLeave={forceHideLeftMenu}
            style={{display: networkMode ? 'none' : undefined}} title={'Dock to ' + (showLeftMenu ? 'top' : 'left') + ' (Ctrl[Command] + M)'}>
            <span className={'glyphicon glyphicon-chevron-' + (showLeftMenu ? (mustHideLeftMenu ? 'down' : 'up') : 'left')}></span>
          </a>
          <div style={{display: rulesMode ? 'none' : undefined}} onMouseEnter={this.showNetworkOptions} onMouseLeave={this.hideNetworkOptions} className={'w-nav-menu w-menu-wrapper' + (showNetworkOptions ? ' w-menu-wrapper-show' : '')}>
            <a onClick={this.showNetwork} onDoubleClick={this.clearNetwork} className="w-network-menu" title="Double click to remove all sessions" style={{background: name == 'network' ? '#ddd' : null}}
           draggable="false"><span className="glyphicon glyphicon-globe"></span>Network</a>
            <MenuItem ref="networkMenuItem" options={state.networkOptions} className="w-network-menu-item" onClickOption={this.handleNetwork} />
          </div>
          <div style={{display: pluginsMode ? 'none' : undefined}} onMouseEnter={this.showRulesOptions} onMouseLeave={this.hideRulesOptions}
            className={'w-nav-menu w-menu-wrapper' + (showRulesOptions ? ' w-menu-wrapper-show' : '') + (isRules ? ' w-menu-auto' : '')}>
            <a onClick={this.showRules} className="w-rules-menu" style={{background: name == 'rules' ? '#ddd' : null}} draggable="false"><span className="glyphicon glyphicon-list"></span>Rules</a>
            <MenuItem ref="rulesMenuItem"  name={name == 'rules' ? null : 'Open'} options={rulesOptions} checkedOptions={uncheckedRules} disabled={state.disabledAllRules}
              className="w-rules-menu-item"
              onClick={this.showRules}
              onClickOption={this.showAndActiveRules}
              onChange={this.selectRulesByOptions} />
          </div>
          <div style={{display: pluginsMode ? 'none' : undefined}} onMouseEnter={this.showValuesOptions} onMouseLeave={this.hideValuesOptions}
            className={'w-nav-menu w-menu-wrapper' + (showValuesOptions ? ' w-menu-wrapper-show' : '') + (isValues ? ' w-menu-auto' : '')}>
            <a onClick={this.showValues} className="w-values-menu" style={{background: name == 'values' ? '#ddd' : null}} draggable="false"><span className="glyphicon glyphicon-folder-close"></span>Values</a>
            <MenuItem ref="valuesMenuItem" name={name == 'values' ? null : 'Open'} options={state.valuesOptions} className="w-values-menu-item" onClick={this.showValues} onClickOption={this.showAndActiveValues} />
          </div>
          <div ref="pluginsMenu" onMouseEnter={this.showPluginsOptions} onMouseLeave={this.hidePluginsOptions} className={'w-nav-menu w-menu-wrapper' + (showPluginsOptions ? ' w-menu-wrapper-show' : '')}>
            <a onClick={this.showPlugins} className="w-plugins-menu" style={{background: name == 'plugins' ? '#ddd' : null}} draggable="false"><span className="glyphicon glyphicon-list-alt"></span>Plugins</a>
            <MenuItem ref="pluginsMenuItem" name={name == 'plugins' ? null : 'Open'} options={pluginsOptions} checkedOptions={state.disabledPlugins} disabled={disabledAllPlugins}
              className="w-plugins-menu-item" onClick={this.showPlugins} onChange={this.disablePlugin} onClickOption={this.showAndActivePlugins} />
          </div>
          {!state.ndp && <a onClick={this.disableAllPlugins} className="w-enable-plugin-menu"
            style={{display: isPlugins ? '' : 'none', color: disabledAllPlugins ? '#f66' : undefined}}
            draggable="false">
            <span className={'glyphicon glyphicon-' + (disabledAllPlugins ? 'play-circle' : 'off')}/>
            {disabledAllPlugins ? 'ON' : 'OFF'}
          </a>}
          <UpdateAllBtn hide={!isPlugins} />
          <a onClick={this.reinstallAllPlugins} className={'w-plugins-menu' +
            (isPlugins ? '' : ' hide')} draggable="false">
            <span className="glyphicon glyphicon-download-alt" />
            ReinstallAll
          </a>
          <a onClick={this.importData} className="w-import-menu"
            style={{display: isPlugins ? 'none' : ''}}
            draggable="false">
            <span className="glyphicon glyphicon-import"></span>Import
          </a>
          <a onClick={this.exportData} className="w-export-menu"
          style={{display: isPlugins ? 'none' : ''}} draggable="false">
            <span className="glyphicon glyphicon-export"></span>Export
          </a>
          <div onMouseEnter={this.showRemoveOptions} onMouseLeave={this.hideRemoveOptions}
            style={{display: isNetwork ? '' : 'none'}}
            className={'w-menu-wrapper w-remove-menu-list w-menu-auto' + (state.showRemoveOptions ? ' w-menu-wrapper-show' : '')}>
            <a onClick={this.clear} className="w-remove-menu" title="Ctrl[Command] + X"
              draggable="false">
              <span className="glyphicon glyphicon-remove"></span>Clear
            </a>
            <MenuItem options={REMOVE_OPTIONS} className="w-remove-menu-item" onClickOption={this.handleNetwork} />
          </div>
          <a onClick={this.onClickMenu} className="w-save-menu" style={{display: (isNetwork || isPlugins) ? 'none' : ''}} draggable="false" title="Ctrl[Command] + S"><span className="glyphicon glyphicon-save-file"></span>Save</a>
          <a className="w-create-menu"
              style={{display: (isNetwork || isPlugins) ? 'none' : ''}}
              draggable="false"
              onClick={this.handleCreate}
            >
            <span className="glyphicon glyphicon-plus"></span>Create
          </a>
          <a onClick={this.onClickMenu} className={'w-edit-menu' + (disabledEditBtn ? ' w-disabled' : '')} style={{display: (isNetwork || isPlugins) ? 'none' : ''}} draggable="false"><span className="glyphicon glyphicon-edit"></span>Rename</a>
          <div onMouseEnter={this.showAbortOptions} onMouseLeave={this.hideAbortOptions}
            style={{display: isNetwork ? '' : 'none'}}
            className={'w-menu-wrapper w-abort-menu-list w-menu-auto' + (state.showAbortOptions ? ' w-menu-wrapper-show' : '')}>
            <a onClick={this.clickReplay} className="w-replay-menu"
              draggable="false">
              <span className="glyphicon glyphicon-repeat"></span>Replay
            </a>
            <MenuItem options={ABORT_OPTIONS} className="w-remove-menu-item" onClickOption={this.abort} />
          </div>
          <a onClick={this.composer} className="w-composer-menu" style={{display: isNetwork ? '' : 'none'}} draggable="false"><span className="glyphicon glyphicon-edit"></span>Compose</a>
          <RecordBtn hide={!isNetwork} onClick={this.handleAction} />
          <a onClick={this.onClickMenu} className={'w-delete-menu' + (disabledDeleteBtn ? ' w-disabled' : '')} style={{display: (isNetwork || isPlugins) ? 'none' : ''}} draggable="false"><span className="glyphicon glyphicon-trash"></span>Delete</a>
          <FilterBtn onClick={this.showSettings} disabledRules={isRules && state.disabledAllRules} isNetwork={isNetwork} hide={isPlugins} />
          <a onClick={this.showFiles} className="w-files-menu" draggable="false"><span className="glyphicon glyphicon-upload"></span>Files</a>
          <div onMouseEnter={this.showWeinreOptions} onMouseLeave={this.hideWeinreOptions} className={'w-menu-wrapper' + (showWeinreOptions ? ' w-menu-wrapper-show' : '')}>
            <a onClick={this.showWeinreOptionsQuick}
              onDoubleClick={this.showAnonymousWeinre}
              className="w-weinre-menu"
              draggable="false"><span className="glyphicon glyphicon-console"></span>Weinre</a>
            <MenuItem ref="weinreMenuItem" name="anonymous" options={state.weinreOptions} className="w-weinre-menu-item" onClick={this.showAnonymousWeinre} onClickOption={this.showWeinre} />
          </div>
          <a onClick={this.showHttpsSettingsDialog} className="w-https-menu" draggable="false"
            style={{color: dataCenter.hasInvalidCerts ? 'red' : undefined}}
          >
            <span className={'glyphicon glyphicon-' + (state.interceptHttpsConnects ? 'ok' : 'lock')}></span>HTTPS
          </a>
          <div onMouseEnter={this.showHelpOptions} onMouseLeave={this.hideHelpOptions}
            className={'w-menu-wrapper' + (showHelpOptions ? ' w-menu-wrapper-show' : '')}>
            <a className={'w-help-menu' + (state.hasNewVersion ? ' w-menu-enable'  : '')}
              onClick={this.showAboutDialog}
              title={state.hasNewVersion ? 'There is a new version of whistle' : undefined}
              href={state.hasNewVersion ? undefined : 'https://github.com/avwo/whistle#whistle'}
              target={state.hasNewVersion ? undefined : '_blank'}><span className="glyphicon glyphicon-question-sign"></span>Help</a>
            <MenuItem ref="helpMenuItem" options={state.helpOptions}
              name={<About ref="aboutDialog" onClick={this.hideHelpOptions} onCheckUpdate={this.showHasNewVersion} />}
              className="w-help-menu-item" />
          </div>
          <Online name={name} />
          <div onMouseDown={this.preventBlur} style={{display: state.showCreateRules ? 'block' : 'none'}} className="shadow w-input-menu-item w-create-rules-input"><input ref="createRulesInput" onKeyDown={this.createRules} onBlur={this.hideRulesInput} type="text" maxLength="64" placeholder="Input the name" /><button type="button" onClick={this.createRules} className="btn btn-primary">+Rule</button></div>
          <div onMouseDown={this.preventBlur} style={{display: state.showCreateValues ? 'block' : 'none'}} className="shadow w-input-menu-item w-create-values-input"><input ref="createValuesInput" onKeyDown={this.createValues} onBlur={this.hideValuesInput} type="text" maxLength="64" placeholder="Input the key" /><button type="button" onClick={this.createValues} className="btn btn-primary">+Key</button></div>
          <div onMouseDown={this.preventBlur} style={{display: state.showCreateRuleGroup ? 'block' : 'none'}} className="shadow w-input-menu-item w-create-rules-input"><input ref="createRuleGroupInput" onKeyDown={this.createRules} onBlur={this.hideRuleGroup} type="text" maxLength="64" placeholder="Input the group name" /><button type="button" onClick={this.createRuleGroup} className="btn btn-primary">+Group</button></div>
          <div onMouseDown={this.preventBlur} style={{display: state.showCreateValueGroup ? 'block' : 'none'}} className="shadow w-input-menu-item w-create-values-input"><input ref="createValueGroupInput" onKeyDown={this.createValues} onBlur={this.hideValueGroup} type="text" maxLength="64" placeholder="Input the group name" /><button type="button" onClick={this.createValueGroup} className="btn btn-primary">+Group</button></div>
          <div onMouseDown={this.preventBlur} style={{display: state.showEditRules ? 'block' : 'none'}} className="shadow w-input-menu-item w-edit-rules-input"><input ref="editRulesInput" onKeyDown={this.editRules} onBlur={this.hideRenameRuleInput} type="text" maxLength="64"  /><button type="button" onClick={this.editRules} className="btn btn-primary">OK</button></div>
          <div onMouseDown={this.preventBlur} style={{display: state.showEditValues ? 'block' : 'none'}} className="shadow w-input-menu-item w-edit-values-input"><input ref="editValuesInput" onKeyDown={this.editValues} onBlur={this.hideRenameValueInput} type="text" maxLength="64" /><button type="button" onClick={this.editValues} className="btn btn-primary">OK</button></div>
        </div>
        <div className="w-container box fill">
          <div className={'w-left-menu' + (forceShowLeftMenu ? ' w-hover-left-menu' : '')}
            style={{display: networkMode || mustHideLeftMenu ? 'none' : undefined}}
            onMouseEnter={forceShowLeftMenu} onMouseLeave={forceHideLeftMenu}>
            <a onClick={this.showNetwork} onDoubleClick={this.clearNetwork}
              title="Double click to remove all sessions"
              className="w-network-menu"
              style={{
                background: name == 'network' ? '#ddd' : null,
                display: rulesMode ? 'none' : undefined
              }}
               draggable="false">
                <span className="glyphicon glyphicon-globe"></span><i>Network</i>
            </a>
            <a onClick={this.showRules} className="w-save-menu w-rules-menu"
              onDoubleClick={this.onClickMenu}
              title="Double click to save all changed"
              style={{
                background: name == 'rules' ? '#ddd' : null,
                display: pluginsMode ? 'none' : undefined
              }} draggable="false">
              <span className={'glyphicon glyphicon-list' + (state.disabledAllRules ? ' w-disabled' : '')} ></span>
              <i>{!state.classic && !state.ndr && <input onChange={this.disableAllRules} type="checkbox" onClick={stopPropagation} checked={!state.disabledAllRules}
                title={state.disabledAllRules ? 'Click to turn on Rules' : 'Click to turn off Rules'} />} Rules</i>
              <i className="w-menu-changed" style={{display: state.rules.hasChanged() ? undefined : 'none'}}>*</i>
            </a>
            <a onClick={this.showValues} className="w-save-menu w-values-menu"
              onDoubleClick={this.onClickMenu}
              title="Double click to save all changed"
              style={{
                background: name == 'values' ? '#ddd' : null,
                display: pluginsMode ? 'none' : undefined
              }} draggable="false">
              <span className="glyphicon glyphicon-folder-close"></span><i>Values</i>
              <i className="w-menu-changed" style={{display: state.values.hasChanged() ? undefined : 'none'}}>*</i>
            </a>
            <a onClick={this.showPlugins} className="w-plugins-menu"
              style={{background: name == 'plugins' ? '#ddd' : null}} draggable="false">
              <span className={'glyphicon glyphicon-list-alt' + (disabledAllPlugins ? ' w-disabled' : '')}></span>
              <i>{!state.classic && !state.ndp && <input onChange={this.disableAllPlugins} type="checkbox" onClick={stopPropagation} checked={!disabledAllPlugins}
                title={disabledAllPlugins ? 'Click to turn on Plugins' : 'Click to turn off Plugins'}
            />} Plugins</i>
            </a>
          </div>
          {state.hasRules ? <List ref="rules" disabled={state.disabledAllRules} theme={rulesTheme}
            lineWrapping={autoRulesLineWrapping} fontSize={rulesFontSize} lineNumbers={showRulesLineNumbers} onSelect={this.selectRules}
            onUnselect={this.unselectRules} onActive={this.activeRules} modal={state.rules}
            hide={name == 'rules' ? false : true} name="rules" /> : undefined}
          {state.hasValues ? <List theme={valuesTheme} onDoubleClick={this.showEditValuesByDBClick} fontSize={valuesFontSize}
            lineWrapping={autoValuesLineWrapping} lineNumbers={showValuesLineNumbers} onSelect={this.saveValues} onActive={this.activeValues}
            modal={state.values} hide={name == 'values' ? false : true} className="w-values-list" /> : undefined}
          {state.hasNetwork ? <Network ref="network" hide={name === 'rules' || name === 'values' || name === 'plugins'} modal={state.network} /> : undefined}
          {state.hasPlugins ? <Plugins {...state} onOpen={this.activePluginTab} onClose={this.closePluginTab} onActive={this.activePluginTab} onChange={this.disablePlugin} ref="plugins" hide={name == 'plugins' ? false : true} /> : undefined}
        </div>
        <div ref="rulesSettingsDialog" className="modal fade w-rules-settings-dialog">
          <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-body">
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                  <EditorSettings theme={rulesTheme} fontSize={rulesFontSize} lineNumbers={showRulesLineNumbers}
                    lineWrapping={autoRulesLineWrapping}
                    onLineWrappingChange={this.onRulesLineWrappingChange}
                    onThemeChange={this.onRulesThemeChange}
                    onFontSizeChange={this.onRulesFontSizeChange}
                    onLineNumberChange={this.onRulesLineNumberChange} />
                    <p className="w-editor-settings-box"><label><input type="checkbox" checked={state.backRulesFirst} onChange={this.enableBackRulesFirst} /> Back rules first</label></p>
                  <p className="w-editor-settings-box"><label style={{color: multiEnv ? '#aaa' : undefined}}><input type="checkbox" disabled={multiEnv}
                    checked={!multiEnv && state.allowMultipleChoice} onChange={this.allowMultipleChoice} /> Use multiple rules</label></p>
                  {!state.ndr && <p className="w-editor-settings-box">
                    <label style={{color: state.disabledAllRules ? '#f66' : undefined}}>
                      <input type="checkbox" checked={state.disabledAllRules} onChange={this.disableAllRules} name="disableAll" /> Turn off Rules
                    </label>
                  </p>}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                </div>
              </div>
          </div>
        </div>
        <div ref="valuesSettingsDialog" className="modal fade w-values-settings-dialog">
          <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-body">
                  <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                  <EditorSettings theme={valuesTheme} fontSize={valuesFontSize} lineNumbers={showValuesLineNumbers}
                    lineWrapping={autoValuesLineWrapping}
                    onLineWrappingChange={this.onValuesLineWrappingChange}
                    onThemeChange={this.onValuesThemeChange}
                    onFontSizeChange={this.onValuesFontSizeChange}
                    onLineNumberChange={this.onValuesLineNumberChange} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
                </div>
              </div>
            </div>
        </div>
        <NetworkSettings ref="networkSettings" />
        <div ref="rootCADialog" className="modal fade w-https-dialog">
        <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <div>
                  <a className="w-help-menu"
                    title="Click here to learn how to install root ca"
                    href="https://avwo.github.io/whistle/webui/https.html" target="_blank">
                    <span className="glyphicon glyphicon-question-sign"></span>
                  </a>
                  <a className="w-download-rootca" title="http://rootca.pro/" href="cgi-bin/rootca" target="downloadTargetFrame">Download RootCA</a>
                </div>
                <a title="http://rootca.pro/" href="cgi-bin/rootca" target="downloadTargetFrame"><img src="img/qrcode.png" /></a>
                <div className="w-https-settings">
                  <p><label title={multiEnv ? 'Use `pattern enable://capture` in rules to replace global configuration' : undefined}><input
                    disabled={multiEnv}
                    checked={state.interceptHttpsConnects}
                    onChange={this.interceptHttpsConnects}
                    type="checkbox" /> Capture TUNNEL CONNECTs</label></p>
                  <p><label><input checked={dataCenter.supportH2 && state.enableHttp2}
                    onChange={this.enableHttp2} type="checkbox" /> Enable HTTP/2</label></p>
                    <a draggable="false" style={{color: dataCenter.hasInvalidCerts ? 'red' : undefined}} onClick={this.showCustomCertsInfo}>View custom certs info</a>
                    <CertsInfoDialog ref="certsInfoDialog" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
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
                <input ref="sessionsName"
                  onKeyDown={this.exportBySave}
                  placeholder="Input the filename"
                  className="form-control" maxLength="64" />
                <select ref="fileType" className="form-control" value={state.exportFileType} onChange={this.chooseFileType}>
                  <option value="whistle">*.txt</option>
                  <option value="Fiddler">*.saz</option>
                </select>
              </label>
              <a type="button"
                onKeyDown={this.exportBySave}
                tabIndex="0" onMouseDown={this.preventBlur}
                className="btn btn-primary" onClick={this.exportBySave}>Export</a>
            </div>
          </div>
        </div>
      </div>
      <Dialog ref="setReplayCount" wstyle="w-replay-count-dialog">
        <div className="modal-body">
          <label>
            Count:
            <input ref="replayCount"
              onKeyDown={this.replayRepeat}
              onChange={this.replayCountChange}
              value={state.replayCount}
              className="form-control" maxLength="2" />
          </label>
          <a type="button"
            onKeyDown={this.replayRepeat}
            tabIndex="0" onMouseDown={this.preventBlur}
            className="btn btn-primary" onClick={this.replayRepeat}>Replay</a>
        </div>
      </Dialog>
      <Dialog ref="importRemoteRules" wstyle="w-import-remote-dialog">
        <div className="modal-body">
          <input readOnly={pendingRules} ref="rulesRemoteUrl" maxLength="2048"
            onKeyDown={this.importRemoteRules}
            placeholder="Input the url" style={{ 'ime-mode': 'disabled' }} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" disabled={pendingRules} onMouseDown={this.preventBlur}
            onClick={this.importRemoteRules}>{pendingRules ? 'Importing rules' : 'Import rules'}</button>
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
      <Dialog ref="importRemoteSessions" wstyle="w-import-remote-dialog">
        <div className="modal-body">
          <input readOnly={pendingSessions} ref="sessionsRemoteUrl" maxLength="2048"
            onKeyDown={this.importRemoteSessions}
            placeholder="Input the url" style={{ 'ime-mode': 'disabled' }} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" disabled={pendingSessions} onMouseDown={this.preventBlur}
            onClick={this.importRemoteSessions}>{pendingSessions ? 'Importing sessions' : 'Import sessions'}</button>
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
      <Dialog ref="importRemoteValues" wstyle="w-import-remote-dialog">
        <div className="modal-body">
          <input readOnly={pendingValues} ref="valuesRemoteUrl" maxLength="2048"
            onKeyDown={this.importRemoteValues}
            placeholder="Input the url" style={{ 'ime-mode': 'disabled' }} />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-primary" disabled={pendingValues} onMouseDown={this.preventBlur}
            onClick={this.importRemoteValues}>{pendingValues ? 'Importing values' : 'Import values'}</button>
          <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
        </div>
      </Dialog>
      <div ref="showUpdateTipsDialog" className="modal fade w-show-update-tips-dialog">
        <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-body">
                <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <p className="w-show-update-tips">whistle has important updates, it is recommended that you update to the latest version.</p>
                <p>Current version: {state.version}</p>
                <p>The latest stable version: {state.latestVersion}</p>
                <p>View change: <a title="Change log" href="https://github.com/avwo/whistle/blob/master/CHANGELOG.md" target="_blank">CHANGELOG.md</a></p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={this.donotShowAgain} data-dismiss="modal">Don't show again</button>
                <a type="button" className="btn btn-primary" onClick={this.hideUpdateTipsDialog} href="https://avwo.github.io/whistle/update.html" target="_blank">Update now</a>
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
          <button type="button" className="btn btn-default" data-dismiss="modal">No</button>
          <button type="button" className="btn btn-primary" onClick={this.reloadData}  data-dismiss="modal">Yes</button>
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
          <button type="button" className="btn btn-danger"
            onClick={this.uploadRules} data-dismiss="modal">Replace</button>
          <button type="button" className="btn btn-primary"
            onClick={this.uploadRules} data-dismiss="modal">Reserve</button>
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
          <button type="button" className="btn btn-danger"
            onClick={this.uploadValues} data-dismiss="modal">Replace</button>
          <button type="button" className="btn btn-primary"
            onClick={this.uploadValues} data-dismiss="modal">Reserve</button>
        </div>
      </Dialog>
      <FilesDialog ref="filesDialog" />
      <ListDialog ref="selectRulesDialog" name="rules" list={state.rules.list} />
      <ListDialog ref="selectValuesDialog" name="values" list={state.values.list} />
      <iframe name="downloadTargetFrame" style={{display: 'none'}} />
      <form ref="exportSessionsForm" action="cgi-bin/sessions/export" style={{display: 'none'}}
        method="post" target="downloadTargetFrame">
        <input ref="exportFilename" name="exportFilename" type="hidden" />
        <input ref="exportFileType" name="exportFileType" type="hidden" />
        <input ref="sessions" name="sessions" type="hidden" />
      </form>
      <form ref="importSessionsForm" encType="multipart/form-data" style={{display: 'none'}}>
        <input ref="importSessions" onChange={this.uploadSessions} type="file" name="importSessions" accept=".txt,.json,.saz,.har" />
      </form>
      <form ref="importRulesForm" encType="multipart/form-data" style={{display: 'none'}}>
        <input ref="importRules" onChange={this.uploadRulesForm} name="rules" type="file" accept=".txt,.json" />
      </form>
      <form ref="importValuesForm" encType="multipart/form-data" style={{display: 'none'}}>
        <input ref="importValues" onChange={this.uploadValuesForm} name="values" type="file" accept=".txt,.json" />
      </form>
    </div>
    );
  }
});
dataCenter.getInitialData(function(data) {
  ReactDOM.render(<Index modal={data} />, document.getElementById('container'));
});


