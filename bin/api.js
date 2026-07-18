
var http = require('http');
var extend = require('extend');
var use = require('./use');
var util = require('./util');
var unzip = require('../lib/util/zlib').unzip;
var common = require('../lib/util/common');

var getConfig = use.getConfig;
var getReqOpts = use.getReqOpts;

function getOptions() {
  return new Promise((resolve, reject) => {
    getConfig(function(e, conf) {
      if (e) {
        return getConfig(true, function(err, config) {
          if (err) {
            return reject(err);
          }
          var options = config.options;
          options.isClient = true;
          resolve(options);
        });
      }
      return resolve(conf.options);
    });
  });
}

async function request(options) {
  if (common.isString(options)) {
    options = { url: options };
  }
  var opts = await getOptions();
  var data = options.data;
  var isJson = data && typeof data === 'object' && !Buffer.isBuffer(data);
  var reqOpts = getReqOpts(opts, options.url, isJson || options.isJson);
  reqOpts.method = options.method || (data ? 'POST' : 'GET');
  if (options.headers) {
    extend(reqOpts.headers, options.headers);
  }
  return new Promise((resolve, reject) => {
    var req = http.request(reqOpts, function(res) {
      res.on('error', reject);
      util.getBody(res, function(err, body) {
        if (err) {
          return reject(err);
        }
        resolve(body);
      }, options.type === 'raw');
    });
    req.on('error', reject);
    req.end(isJson ? JSON.stringify(data) : data);
  });
}

exports.getRootCA = async function() {
  return request({ url: 'rootca', type: 'raw' });
};

exports.isEnabledHTTPS = function() {
  return request({ url: 'is-enabled-https' }).then(function(data) {
    return data.enabled;
  });
};

exports.setEnableHTTPS = async function (enabled) {
  await request({ url: 'intercept-https-connects', data: 'interceptHttpsConnects=' + (enabled ? 1 : 0) });
};

exports.setLaterRulesFirst = async function (laterRulesFirst) {
  await request({ url: 'rules/enable-back-rules-first', data: 'backRulesFirst=' + (laterRulesFirst ? 1 : 0) });
};

exports.createFile = function(data) {
  if (Buffer.isBuffer(data)) {
    data = { base64: data.toString('base64') };
  } else {
    data = { value: common.toString(data) };
  }
  return request({ url: 'temp/create', data: data }).then(function(data) {
    return data.filepath;
  });
};

exports.getFile = function(filepath) {
  return request('temp/get?filename=' + encodeURIComponent(filepath))
  .then(getValue);
};

function getSessionOptions(options) {
  return typeof options === 'number' ? { count: options } : options;
}

exports.network = {
  /**
   * count: 1 - 120
   * lastest: true
   * startId
   * startTime
   * type
   * url
   * urlMType
   * method
   * reqHMType: 0（不区分大小写） 1（区分大小写） 2（完全匹配）
   * resHMType
   * statusCode
   * reqHKey
   * reqHValue
   * resHKey
   * resHValue
   **/
  getSessions: function(options) {
    options = getSessionOptions(options);
  },
  saveSessions: async function(sessions, name) {
    if (!Array.isArray(sessions) || !sessions.length) {
      return;
    }
    return request({ url: 'saved/save', data: {
      sessions: sessions,
      filename: common.isString(name) ? name.trim() : ''
    }}).then(function(data) {
      if (data.ec !== 0) {
        throw new Error(data.em || 'Failed to save sessions');
      }
      return data.filename;
    });
  },
  getSavedSessions: function(filename) {
    filename = common.getSavedFileItem(filename);
    if (!filename) {
      throw new Error('Invalid filename');
    }
    return request({
      url: 'saved/sessions?filename=' + encodeURIComponent(filename.filename) +
        '&count=' + filename.count + '&time=' + filename.time,
      type: 'raw'
    }).then(function(buf) {
      return new Promise(function(resolve, reject) {
        unzip('gzip', buf, function(err, data) {
          if (err) {
            return reject(err);
          }
          try {
            resolve(JSON.parse(data.toString()));
          } catch(e) {
            reject(e);
          }
        });
      });
    });
  },
  /**
   * count: 1 - 120
   * lastest: true
   * startId
   * startTime
   * from: 0 all 1 send 2 receive
   */
  getFrames: function(reqId, options) {
    if (!reqId) {
      return [];
    }
    options = getSessionOptions(options);
  },
  request: function(options) {
    var base64;
    var body;
    if (options.body) {
      if (Buffer.isBuffer(options.body)) {
        base64 = options.body.toString('base64');
      } else {
        body = common.toString(options.body);
      }
    } else if (options.base64) {
      base64 = options.base64;
    }
    return request({
      url: 'composer',
      data: {
        rules: options.rules,
        useH2: options.enableH2 || options.enableHTTP2 ? 1 : '',
        needResponse: options.needResponse !== false,
        url: options.url,
        headers: options.headers,
        method: options.method,
        body: body,
        base64: base64,
        repeatCount: options.times,
        disabledGlobalRules: options.disabledGlobalRules
      }
    });
  },
  abort: async function(reqId) {
    if (Array.isArray(reqId)) {
      reqId = reqId.join();
    }
    if (!reqId) {
      return;
    }
    await request({ url: 'abort', data: { list: reqId } });
  }
};

async function disableAllRules(disabled) {
  await request({ url: 'rules/disable-all-rules', data: 'disabledAllRules=' + (disabled ? 1 : 0) });
}

function getValue(item) {
  return item.value;
}

function checkSuccess(data) {
  return data.ec === 0;
}

exports.rules = {
  getStatus: function() {
    return request('rules/status');
  },
  turnOff: function() {
    return disableAllRules(true);
  },
  turnOn: function() {
    return disableAllRules(false);
  },
  isMultiSelect: function() {
    return request('rules/is-multi-select').then(function(data) {
      return data.multiSelect;
    });
  },
  setMultiSelect: async function(multiSelect) {
    await request({ url: 'rules/allow-multiple-choice', data: 'allowMultipleChoice=' + (multiSelect ? 1 : 0) });
  },
  getList: function() {
    return request('rules/list').then(function(data) {
      return data.list.map(function(item) {
        return {
          name: item.name,
          value: item.data || '',
          selected: item.selected
        };
      });
    });
  },
  add: async function(name, value, selected) {
    var addToTop = false;
    if (selected && typeof selected !== 'boolean') {
      addToTop = selected.addToTop || selected.top;
      selected = selected.selected;
    }
    var data = { name: name, value: value, selected: selected, addToTop: addToTop };
    await request({ url: 'rules/add', data: data });
  },
  get: function(name) {
    return name ? request('rules/value?name=' + encodeURIComponent(name)).then(getValue) : null;
  },
  select: function(name) {
    return !!name && request({ url: 'rules/select2', data: { name: name } }).then(checkSuccess);
  },
  unselect: function(name) {
    var data ={ name: name === undefined ? false : name };
    return request({ url: 'rules/unselect2', data: data }).then(checkSuccess);
  },
  moveToTop: function(name) {
    return common.isString(name) && request({ url: 'rules/move-top', data: { name: name } })
      .then(checkSuccess);
  }
};

exports.values = {
  getList: function() {
    return request('values/list').then(function(data) {
      return data.list.map(function(item) {
        return {
          name: item.name,
          value: item.data || ''
        };
      });
    });
  },
  get: function(name) {
    return name ? request('values/value?key=' + encodeURIComponent(name)).then(getValue) : null;
  },
  add: async function(name, value) {
    await request({ url: 'values/add', data: { name: name, value: value } });
  }
};

async function disableAllPlugins(disabled) {
  await request({ url: 'plugins/disable-all-plugins', data: 'disabledAllPlugins=' + (disabled ? 1 : 0) });
}

function disablePlugin(name, disabled) {
  return request({ url: 'plugins/disable-plugin', data: { name: name, disabled: disabled ? 1 : 0 } }).then(function(data) {
    return data.exists;
  });
}

exports.plugins = {
  getStatus: function() {
    return request('plugins/status');
  },
  turnOff: function() {
    return disableAllPlugins(true);
  },
  turnOn: function() {
    return disableAllPlugins(false);
  },
  getList: function() {
    return request('plugins/list').then(function(list) {
      return list.map(function(item) {
        var name = item.moduleName;
        item.name = name.substring(name.lastIndexOf('.') + 1);
        return item;
      });
    });
  },
  get: function(name) {
    return name ? request('plugins/plugin?name=' + encodeURIComponent(name)).then(function(data) {
      return data.plugin;
    }) : undefined;
  },
  select: function(name) {
    return disablePlugin(name, false);
  },
  unselect: function(name) {
    return disablePlugin(name, true);
  }
};

exports.utils = {
  isUtf8: function() {},
  toText: function() {},
  createRule: function() {

  },
  getReqBody: function() {},
  getResBody: function() {},
  getReqRaw: function() {},
  getResRaw: function() {},
  getRules: function() {},
  getRulesRaw: function() {},
  getTiming: function() {},
  formatSession: function() {}
};
