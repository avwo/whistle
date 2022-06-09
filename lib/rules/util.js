var fs = require('fs');
var path = require('path');
var rules = require('./index');
var util = require('../util');
var config = require('../config');
var Storage = require('./storage');
var httpMgr = require('../util/http-mgr');
var Buffer = require('safe-buffer').Buffer;

var INTERVAL = 1000 * 60 * 60;
var MAX_URL_LEN = 10 * 1024;
var MAX_HEADERS_LEN = 128 * 1024;
var MAX_BODY_LEN = 256 * 1024;
var MAX_METHOD_LEN = 64;
var MAX_HISTORY_LEN = 64;
var history = [];
var rulesStorage = new Storage(
  config.rulesDir,
  { Default: true },
  config.disableWebUI
);
var valuesStorage = new Storage(config.valuesDir, null, config.disableWebUI);
var propertiesStorage = new Storage(
  config.propertiesDir,
  null,
  config.disableWebUI
);
var LINE_END_RE = /\n|\r\n|\r/g;
var MAX_REMOTE_RULES_COUNT = 16;
var REMOTE_RULES_RE =
  /^\s*@(`?)(whistle\.[a-z\d_\-]+(?:\/[^\s#]*)?|(?:https?:\/\/|[a-z]:[\\/]|~?\/)[^\s#]+|\$(?:whistle\.)?[a-z\d_-]+[/:][^\s#]+)\s*?\1(?:#.*)?$/gim;
var MAX_COUNT_BY_IMPORT = 60;
var uploadFiles = [];
var MAX_FILENAME_LEN = 60;
var ILLEGAL_FILENAME_RE = /[\\/:*?"<>|\s]/;
var LOCAL_FILES = config.LOCAL_FILES;
var inlineValues, proxy, pluginMgr ;
var CONTROL_RE =
  /[\u001e\u001f\u200e\u200f\u200d\u200c\u202a\u202d\u202e\u202c\u206e\u206f\u206b\u206a\u206d\u206c]+/g;
var MULTI_LINE_VALUE_RE =
  /^[^\n\r\S]*(```+)[^\n\r\S]*(\S+)[^\n\r\S]*[\r\n]([\s\S]+?)[\r\n][^\n\r\S]*\1\s*$/gm;

try {
  history = JSON.parse(propertiesStorage.readFile('composerHistory'));
  if (Array.isArray(history)) {
    history = history.filter(checkHistory);
    history = history.slice(0, MAX_HISTORY_LEN);
  } else {
    history = [];
  }
} catch (e) {}

function limitValueLen(name, len) {
  var value = propertiesStorage.getProperty(name);
  if (typeof value !== 'string') {
    propertiesStorage.setProperty(name, name);
  } else if (value.length > len) {
    propertiesStorage.setProperty(name, value.substring(0, len));
  }
}

limitValueLen('Custom1', 16);
limitValueLen('Custom2', 16);

function checkFilename(name) {
  if (!name || typeof name !== 'string' || name.length > MAX_FILENAME_LEN) {
    return false;
  }
  return !ILLEGAL_FILENAME_RE.test(name);
}

try {
  var _files = fs.readdirSync(LOCAL_FILES).filter(checkFilename);
  for (var i = 0, len = _files.length; i < len; i++) {
    var _name = _files[i];
    try {
      var stat = fs.statSync(path.join(LOCAL_FILES, _name));
      if (stat.isFile) {
        uploadFiles.push({
          name: _name,
          date: stat.mtime.getTime()
        });
      }
    } catch (e) {}
    if (uploadFiles.length >= MAX_FILENAME_LEN) {
      break;
    }
  }
  if (uploadFiles.length) {
    uploadFiles.sort(function (prev, next) {
      return util.compare(prev.date, next.date);
    });
  }
} catch (e) {}

function checkHistory(data) {
  if (
    typeof data.url === 'string' &&
    typeof data.method === 'string' &&
    typeof data.headers === 'string'
  ) {
    if (!data.body) {
      data.body = '';
      return true;
    }
    return typeof data.body === 'string';
  }
}

/**
 * rules
 */

function resolveInlineValues(str) {
  str = str && str.replace(CONTROL_RE, '').trim();
  if (!str || str.indexOf('```') === -1) {
    return str;
  }
  return str.replace(MULTI_LINE_VALUE_RE, function (_, __, key, value) {
    inlineValues = inlineValues || {};
    if (!inlineValues[key]) {
      inlineValues[key] = value;
    }
    return '';
  });
}

function reverseRules(text, orig) {
  if (!text) {
    return '';
  }
  text = resolveInlineValues(text);
  text = text.split(LINE_END_RE).reverse();
  return orig ? text : text.join('\n');
}

httpMgr.addChangeListener(function() {
  var disableRules =
    !config.notAllowedDisableRules &&
    propertiesStorage.getProperty('disabledAllRules');
  var shadowRules =
    disableRules && config.allowDisableShadowRules ? null : config.shadowRules;
  var value = [];
  if (!disableRules && !config.multiEnv) {
    getAllRulesFile().forEach(function (file) {
      if (file.selected && !util.isGroup(file.name)) {
        value.push(file.data);
      }
    });
  }
  var backRulesFirst =
    !config.disabledBackOption &&
    propertiesStorage.getProperty('backRulesFirst') === true;
  var defaultRules =
    disableRules || defaultRulesIsDisabled() ? null : getDefaultRules();
  if (defaultRules) {
    if (backRulesFirst) {
      value.unshift(defaultRules);
    } else {
      value.push(defaultRules);
    }
  }

  if (backRulesFirst) {
    value = reverseRules(value.join('\n'), true);
  }
  value = value && value.join('\r\n');
  if (shadowRules) {
    if (backRulesFirst) {
      value = reverseRules(shadowRules) + '\n' + value;
    } else {
      value += '\n' + shadowRules;
    }
  }
  var rulesText = value;
  if (rulesText) {
    var index = 0;
    rulesText = rulesText.replace(REMOTE_RULES_RE, function (_, apo, rulesUrl) {
      if (index >= MAX_REMOTE_RULES_COUNT) {
        return '';
      }
      ++index;
      var remoteRules = util.getRemoteRules(apo, rulesUrl);
      return backRulesFirst ? reverseRules(remoteRules) : remoteRules;
    });
  }
  rules._rawRulesText = rulesText;
  pluginMgr.emit('updateRules', true);
  rules.parse(rulesText, null, inlineValues);
  inlineValues = null;
});

function parseRules() {
  return httpMgr.triggerChange();
}

exports.parseRules = parseRules;

function setDefaultRules(data) {
  data = typeof data != 'string' ? '' : data;
  var oldData = rulesStorage.getProperty('defalutRules') || '';
  rulesStorage.setProperty('defalutRules', data);
  parseRules();
  return data !== oldData;
}

function getDefaultRules() {
  return rulesStorage.getProperty('defalutRules');
}

function disableDefaultRules() {
  rulesStorage.setProperty('disabledDefalutRules', true);
  parseRules();
}

function enableDefaultRules() {
  rulesStorage.setProperty('disabledDefalutRules', false);
  parseRules();
}

function defaultRulesIsDisabled() {
  return rulesStorage.getProperty('disabledDefalutRules');
}

function selectRulesFile(file) {
  if (!rulesStorage.existsFile(file) || config.multiEnv) {
    return;
  }

  var selectedList = allowMultipleChoice() ? getSelectedRulesList() : [];
  if (selectedList.indexOf(file) == -1) {
    selectedList.push(file);
    rulesStorage.setProperty('selectedList', selectedList);
  }
  parseRules();
  return selectedList;
}

function unselectRulesFile(file, force) {
  if (!force && config.multiEnv) {
    return;
  }
  var selectedList = getSelectedRulesList();
  var index = selectedList.indexOf(file);
  if (index != -1) {
    selectedList.splice(index, 1);
    rulesStorage.setProperty('selectedList', selectedList);
  }
  parseRules();

  return selectedList;
}

function allowMultipleChoice() {
  return (
    !config.disabledMultipleOption &&
    propertiesStorage.getProperty('allowMultipleChoice')
  );
}

function clearSelection() {
  rulesStorage.setProperty('selectedList', []);
  parseRules();
}

function getSelectedRulesList() {
  if (config.multiEnv) {
    return [];
  }
  var selectedList = rulesStorage.getProperty('selectedList');
  if (!Array.isArray(selectedList)) {
    selectedList = [];
    rulesStorage.setProperty('selectedList', selectedList);
  }
  return selectedList;
}

function removeRulesFile(file) {
  unselectRulesFile(file, true);
  return rulesStorage.removeFile(file);
}

function renameRulesFile(file, newFile) {
  if (!rulesStorage.renameFile(file, newFile)) {
    return;
  }

  var selectedList = getSelectedRulesList();
  var index = selectedList.indexOf(file);
  if (index != -1) {
    selectedList[index] = newFile;
    rulesStorage.setProperty('selectedList', selectedList);
  }
  return true;
}

function addRulesFile(file, data) {
  return rulesStorage.writeFile(file, data);
}

function getAllRulesFile() {
  var list = rulesStorage.getFileList();
  var selectedList = getSelectedRulesList();
  list.forEach(function (file) {
    file.selected = !util.isGroup(file.name) && selectedList.indexOf(file.name) != -1;
  });
  return list;
}

function getFirstGroup(storage) {
  var list = storage.getFileList();
  for (var i = 0, len = list.length; i < len; i++) {
    if (util.isGroup(list[i].name)) {
      return list[i];
    }
  }
}

function resetRulesIfResort(fromName, toName) {
  var selectedList = getSelectedRulesList();
  if (
    selectedList.indexOf(fromName) == -1 &&
    selectedList.indexOf(toName) == -1
  ) {
    return;
  }
  parseRules();
}

function moveRulesTo(fromName, toName, clientId, group, toTop) {
  if (rulesStorage.moveTo(fromName, toName, group, toTop)) {
    resetRulesIfResort(fromName, toName);
    config.setModified(clientId, true);
    proxy.emit('rulesDataChange', 'move', fromName, toName);
    return true;
  }
}

exports.rules = {
  getRawRulesText: function() {
    return rules._rawRulesText || '';
  },
  moveGroupToTop: function(groupName, clientId) {
    var result = rulesStorage.moveGroupToTop(groupName);
    result && config.setModified(clientId, true);
    return result;
  },
  exists: function(name) {
    return rulesStorage.existsFile(name);
  },
  recycleBin: rulesStorage.recycleBin,
  enableBackRulesFirst: function (backRulesFirst) {
    var curFlag = propertiesStorage.getProperty('backRulesFirst') === true;
    if (curFlag !== backRulesFirst) {
      propertiesStorage.setProperty('backRulesFirst', backRulesFirst);
      parseRules();
    }
  },
  moveTo: moveRulesTo,
  moveToTop: function (name, clientId) {
    var first = name && getAllRulesFile()[0];
    first && moveRulesTo(name, first.name, clientId, null, true);
  },
  moveToGroup: function(name, groupName, isTop) {
    return rulesStorage.moveToGroup(name, groupName, isTop);
  },
  get: function (file) {
    return rulesStorage.readFile(file);
  },
  remove: function (file, clientId) {
    if (removeRulesFile(file)) {
      config.setModified(clientId, true);
      proxy.emit('rulesDataChange', 'remove', file);
    }
  },
  getFirstGroup: function() {
    return getFirstGroup(rulesStorage);
  },
  add: function (file, data, clientId) {
    if (file === 'Default') {
      return;
    }
    var result = addRulesFile(file, data);
    if (result) {
      config.setModified(clientId, true);
      proxy.emit('rulesDataChange', 'add', file);
    }
    return result;
  },
  rename: function (file, newFile, clientId) {
    if (renameRulesFile(file, newFile)) {
      config.setModified(clientId, true);
      proxy.emit('rulesDataChange', 'rename', file, newFile);
    }
  },
  select: selectRulesFile,
  unselect: unselectRulesFile,
  list: getAllRulesFile,
  getDefault: getDefaultRules,
  setDefault: function (value, clientId) {
    if (setDefaultRules(value)) {
      config.setModified(clientId, true);
      proxy.emit('rulesDataChange', 'add', 'Default');
    }
  },
  enableDefault: enableDefaultRules,
  disableDefault: disableDefaultRules,
  defaultRulesIsDisabled: defaultRulesIsDisabled,
  parseRules: parseRules,
  clearSelection: clearSelection,
  getSelectedList: getSelectedRulesList
};

/**
 * values
 */

function addValuesFile(file, data) {
  return valuesStorage.writeFile(file, data);
}

function indexOfUploadFiles(name) {
  for (var i = 0, len = uploadFiles.length; i < len; i++) {
    var file = uploadFiles[i];
    if (file.name === name) {
      return i;
    }
  }
  return -1;
}

exports.values = {
  recycleBin: valuesStorage.recycleBin,
  getUploadFiles: function () {
    return uploadFiles;
  },
  download: function (name, res) {
    if (!checkFilename(name)) {
      return res.end();
    }
    res.download(path.join(LOCAL_FILES, name), name);
  },
  existsFile: function (name) {
    return name && indexOfUploadFiles(name) !== -1;
  },
  exists: function(name) {
    return valuesStorage.existsFile(name);
  },
  LIMIMT_FILES_COUNT: MAX_FILENAME_LEN,
  addUploadFile: function (options, callback) {
    var name = options.name;
    if (!checkFilename(name)) {
      return callback();
    }
    if (
      uploadFiles.length >= MAX_FILENAME_LEN &&
      indexOfUploadFiles(name) === -1
    ) {
      return callback(
        new Error('The number of uploaded files cannot exceed 60.')
      );
    }
    var content = '';
    var base64 = options.base64;
    var headers = options.headers;

    if (headers && typeof headers === 'string') {
      try {
        content = Buffer.from(headers + '\r\n\r\n');
      } catch (e) {
        return callback();
      }
    }

    if (base64 && typeof base64 === 'string') {
      try {
        base64 = Buffer.from(base64, 'base64');
        content = content ? Buffer.concat([content, base64]) : base64;
      } catch (e) {
        return callback();
      }
    }
    if (!content) {
      return callback();
    }
    fs.writeFile(path.join(LOCAL_FILES, name), content, function (err) {
      if (!err) {
        var index = indexOfUploadFiles(name);
        if (index !== -1) {
          uploadFiles.splice(index, 1);
        }
        uploadFiles.unshift({
          name: name,
          date: Date.now()
        });
      }
      callback(err);
    });
  },
  removeUploadFile: function (name, callback) {
    if (!checkFilename(name) || indexOfUploadFiles(name) === -1) {
      return callback();
    }
    fs.unlink(path.join(LOCAL_FILES, name), function (err) {
      var index = indexOfUploadFiles(name);
      if (index === -1 || !err || err.code === 'ENOENT') {
        if (index !== -1) {
          uploadFiles.splice(index, 1);
        }
        return callback();
      }
      callback(err);
    });
  },
  moveTo: function (fromName, toName, clientId, group) {
    if (valuesStorage.moveTo(fromName, toName, group)) {
      config.setModified(clientId);
      proxy.emit('valuesDataChange', 'move', fromName, toName);
      return true;
    }
  },
  moveToGroup: function(name, groupName, isTop) {
    return valuesStorage.moveToGroup(name, groupName, isTop);
  },
  getFirstGroup: function() {
    return getFirstGroup(valuesStorage);
  },
  add: function (file, data, clientId) {
    var result = addValuesFile(file, data);
    if (result) {
      config.setModified(clientId);
      proxy.emit('valuesDataChange', 'add', file);
    }
    return result;
  },
  get: function (file) {
    return valuesStorage.readFile(file);
  },
  remove: function remove(file, clientId) {
    if (valuesStorage.removeFile(file)) {
      config.setModified(clientId);
      proxy.emit('valuesDataChange', 'remove', file);
    }
  },
  rename: function (file, newFile, clientId) {
    if (valuesStorage.renameFile(file, newFile)) {
      config.setModified(clientId);
      proxy.emit('valuesDataChange', 'rename', file, newFile);
    }
  },
  list: function list() {
    return valuesStorage.getFileList();
  }
};

setTimeout(function getWhistleVersion() {
  util.getLatestVersion(config.registry, function (ver) {
    ver && propertiesStorage.writeFile('latestVersion', ver);
    setTimeout(getWhistleVersion, INTERVAL);
  });
}, 1000); //等待package的信息配置更新完成

function setEnableCapture(enable) {
  config.isEnableCapture = enable;
  propertiesStorage.setProperty('interceptHttpsConnects', enable);
}

if (config.persistentCapture && config.isEnableCapture) {
  setEnableCapture(true);
}

/**
 * properties
 */
var composerTimer;
function saveComposerHistory() {
  composerTimer = null;
  try {
    propertiesStorage.writeFile('composerHistory', JSON.stringify(history));
  } catch (e) {}
}

exports.properties = {
  getLatestVersion: function () {
    var version = propertiesStorage.readFile('latestVersion');
    return typeof version === 'string' && version.length < 60 ? version : '';
  },
  isEnableCapture: function () {
    if (config.multiEnv) {
      return false;
    }
    if (config.isEnableCapture != null) {
      return config.isEnableCapture;
    }
    return !!propertiesStorage.getProperty('interceptHttpsConnects');
  },
  setEnableCapture: setEnableCapture,
  isEnableHttp2: function () {
    if (config.isEnableHttp2 != null) {
      return config.isEnableHttp2;
    }
    return propertiesStorage.getProperty('enableHttp2') !== false;
  },
  setEnableHttp2: function (enable) {
    config.isEnableHttp2 = enable;
    propertiesStorage.setProperty('enableHttp2', enable);
  },
  set: function (name, value) {
    typeof name == 'string'
      ? propertiesStorage.setProperty(name, value)
      : propertiesStorage.setProperties(name);
  },
  remove: function (name) {
    propertiesStorage.removeProperty(name);
  },
  get: function (name) {
    return propertiesStorage.getProperty(name);
  },
  getHistory: function () {
    return history;
  },
  addHistory: function (data) {
    if (!data.needResponse || !checkHistory(data)) {
      return;
    }
    var url = data.url;
    var method = data.method;
    var headers = data.headers;
    var body = data.body;
    var result = {
      date: Date.now(),
      useH2: data.useH2,
      url: url.length > MAX_URL_LEN ? url.substring(0, MAX_URL_LEN) : url,
      method:
        method.length > MAX_METHOD_LEN
          ? method.substring(0, MAX_METHOD_LEN)
          : method,
      headers:
        headers.length > MAX_HEADERS_LEN
          ? headers.substring(0, MAX_HEADERS_LEN)
          : headers,
      body: body.length > MAX_BODY_LEN ? body.substring(0, MAX_BODY_LEN) : body,
      isHexText: !!data.isHexText
    };
    for (var i = 0, len = history.length; i < len; i++) {
      var item = history[i];
      if (
        item.url === result.url &&
        item.method === result.method &&
        item.headers === result.headers &&
        item.body === result.body &&
        !item.useH2 !== result.useH2
      ) {
        history.splice(i, 1);
        break;
      }
    }
    history.unshift(result);
    var overflow = history.length - MAX_HISTORY_LEN;
    if (overflow > 0) {
      history.splice(MAX_HISTORY_LEN, overflow);
    }
    if (!composerTimer) {
      composerTimer = setTimeout(saveComposerHistory, 2000);
    }
  }
};

function getRules(rules) {
  if (Array.isArray(rules)) {
    return rules.join('\n');
  }
  if (typeof rules === 'string') {
    return rules;
  }
}

exports.addRules = function (rules, replace, clientId) {
  if (rules == null) {
    return;
  }
  replace = replace !== false;
  var hasChanged;
  if (Array.isArray(rules) || typeof rules == 'string') {
    if (replace !== false || !getDefaultRules()) {
      hasChanged = setDefaultRules(getRules(rules));
    }
  } else {
    var keys = Object.keys(rules).slice(keys, MAX_COUNT_BY_IMPORT);
    keys.forEach(function (name) {
      var item = name ? rules[name] : null;
      if (Array.isArray(item) || typeof item === 'string') {
        item = { rules: item };
      }
      if (item) {
        item.rules = getRules(item.rules);
        if (typeof item.replace !== 'boolean') {
          item.replace = replace;
        }
        if (name === 'Default') {
          if (
            typeof item.rules === 'string' &&
            (item.replace !== false || !getDefaultRules())
          ) {
            if (setDefaultRules(item.rules)) {
              hasChanged = true;
            }
          }
          if (item.enable) {
            enableDefaultRules();
          } else if (item.enable === false) {
            disableDefaultRules();
          }
        } else {
          if (
            typeof item.rules === 'string' &&
            (item.replace !== false || !rulesStorage.existsFile(name))
          ) {
            if (addRulesFile(name, item.rules)) {
              hasChanged = true;
            }
          }
          if (item.enable) {
            selectRulesFile(name);
          } else if (item.enable === false) {
            unselectRulesFile(name);
          }
        }
      }
    });
  }
  if (hasChanged) {
    config.setModified(clientId, true);
  }
};

exports.addValues = function (values, replace, clientId) {
  if (values == null || Array.isArray(values)) {
    return;
  }
  replace = replace !== false;
  var hasChanged;
  var keys = Object.keys(values).slice(0, MAX_COUNT_BY_IMPORT);
  keys.forEach(function (name) {
    var isGroup = name[0] === '\r';
    name = name.trim();
    if (!name || /\s/.test(name)) {
      return;
    }
    if (isGroup) {
      name = '\r' + name;
    }
    if (!replace && valuesStorage.existsFile(name)) {
      return;
    }
    var value = name ? values[name] : null;
    if (value == null) {
      return;
    }
    if (typeof value !== 'string') {
      value = JSON.stringify(value, null, '  ');
    }
    if (addValuesFile(name, value)) {
      hasChanged = true;
    }
  });
  if (hasChanged) {
    config.setModified(clientId);
  }
};

exports.setup = function (p) {
  proxy = p;
};

exports.setPluginMgr = function(p) {
  pluginMgr = p;
};
