
var http = require('http');
var extend = require('extend');
var STATUS_CODES = require('http').STATUS_CODES || {};
var use = require('./use');
var util = require('./util');
var unzip = require('../lib/util/zlib').unzip;
var common = require('../lib/util/common');

var getConfig = use.getConfig;
var getReqOpts = use.getReqOpts;
var isUtf8 = common.isUtf8;
var getHttpMeta = common.getHttpMeta;

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

exports.network = {
  /**
   * 获取 whistle 相关配置信息
   * @returns {Object} 包含存储目录名称、应用名称和版本号的对象
   * @property {boolean} client - 是否为客户端
   * @property {string} storage - 自定义的存储目录名称
   * @property {string} name - 应用名称，固定为 'whistle'
   * @property {string} version - 当前安装的 whistle 版本号
   * @example
   * // 返回值示例
   * {
   *   storage: '',
   *   name: 'whistle',
   *   version: '2.10.7'
   * }
   */
  getStatus: function() {
    return request('status');
  },
  /**
   * 查询抓包数据的请求参数
   * @description
   * 用于按条件检索 HTTP/WebSocket 等协议的抓包记录。支持基于游标、时间、资源类型、URL 关键词、请求方法、状态码以及请求/响应头的组合筛选。
   *
   * **过滤逻辑**：
   * - 所有非空条件均以 **AND** 关系叠加（即需同时满足）；
   * - 对于 `method` 和 `statusCode`，传入多个值时采用 **OR** 关系（匹配任一即可）；
   * - `latest` 优先级最高，一旦为 `true`，则 `startId` 和 `startTime` 均被忽略；
   * - 若同时提供 `startId` 与 `startTime`，系统将以其中对应位置更靠近最新数据的一端作为起始点（即取较新的起点）；
   * - `reqHeader` 和 `resHeader` 为对象类型，支持按请求头/响应头的字段名和值进行子串匹配。
   *
   * @param {Object} options - 配置对象
   * @param {boolean} [options.latest=false] - 是否仅获取最新的 N 条数据（N 由外部 `count` 参数指定，本接口入参不包含 `count`）。
   *                                           - `true`：直接返回最新的 N 条记录，忽略 `startId` 和 `startTime`；
   *                                           - `false`：配合 `startId` 或 `startTime` 进行增量拉取。
   * @param {string|number} [options.startId] - 游标 ID（通常为记录的自增主键或唯一序号）。
   *                                            获取记录 ID **大于**此值的增量数据。
   *                                            若同时提供 `startTime`，则取两者中更靠近最新数据的一个作为起始位置。
   * @param {number} [options.startTime] - 起始时间戳（Unix 毫秒级）。
   *                                       获取记录生成时间 **大于**此值的增量数据。
   *                                       若同时提供 `startId`，则取两者中更靠近最新数据的一个作为起始位置。
   * @param {string} [options.type] - 资源类型过滤，同抓包界面 Network 底部过滤栏选项（不区分大小写）。
   *                                  支持以下枚举值（传入其它字符串表示不过滤）：
   *                                  - `JSON`：JSON 请求/响应
   *                                  - `HTML`：HTML 文档
   *                                  - `CSS`：样式表
   *                                  - `JS`：JavaScript 脚本
   *                                  - `Font`：字体文件
   *                                  - `Img`：图片资源
   *                                  - `Media`：音视频媒体
   *                                  - `WS`：WebSocket 帧数据
   *                                  - `Tunnel`：隧道连接（如 WebSocket 升级）
   *                                  - `Wasm`：WebAssembly 模块
   *                                  - `Mock`：Mock 数据
   *                                  - `Rules`：匹配规则的请求
   *                                  - `Import`：导入的数据
   *                                  - `Composer`：通过 Composer 发送的请求
   *                                  - `Error`：错误请求（状态码 >= 400、captureError、中断的请求等请求）
   *                                  - `captureError`：解析 HTTPS 失败的 Tunnel 请求
   * @param {string} [options.subUrl] - URL 中包含该字符串的请求（不区分大小写）。
   *                                    例如 `"/api/user"` 将匹配所有包含该路径的 URL。
   * @param {string|string[]} [options.method] - HTTP 请求方法，支持多个（数组或逗号分隔字符串，如 `"GET,POST"`，不区分大小写）。
   *                                             匹配任一方法即满足条件。
   * @param {number|number[]} [options.statusCode] - HTTP 响应状态码，支持多个（数组或逗号分隔字符串，如 `"200,404"`）。
   *                                                 匹配任一状态码即满足条件。
   * @param {Object} [options.reqHeader] - 请求头过滤条件。
   * @param {string} options.reqHeader.name - 请求头字段名称（如 `X-Request-Id`,不区分大小写）。
   * @param {string} [options.reqHeader.subValue] - 可选，请求头字段值需要包含的子字符串（不区分大小写）。
   *                                                若不填，则表示仅要求存在该请求头字段（无论值为何）。
   * @param {Object} [options.resHeader] - 响应头过滤条件。
   * @param {string} options.resHeader.name - 响应头字段名称（如 `Content-Type`,不区分大小写）。
   * @param {string} [options.resHeader.subValue] - 可选，响应头字段值需要包含的子字符串（不区分大小写）。
   *                                                若不填，则表示仅要求存在该响应头字段（无论值为何）。
   *
   * @example
   * // 使用游标增量拉取（不限制类型）
   * getSessions({ reqId: '1784905385369-123', startId: '1784905385300-003' });
   *
   * @example
   * // 直接获取最新数据（需外部指定 count）
   * getSessions({ reqId: '1784905385369-123', latest: true });
   *
   * @example
   * // 组合过滤：查询状态码为 200 或 304 的 GET 请求，且 URL 包含 "/v1"，同时要求存在特定请求头
   * getSessions({
   *   reqId: '1784905385369-789',
   *   subUrl: '/v1',
   *   method: 'GET',
   *   statusCode: [200, 304],
   *   reqHeader: { key: 'X-Token', subValue: 'abc' }
   * });
   */
  getSessions: function(options) {
    return request({ url: 'sessions', data: options || {} });
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
   * WebSocket/Socket 帧数据查询请求参数
   * @param {Object} options - 配置对象
   * @param {string} options.reqId - 请求唯一标识 ID，用于链路追踪
   * @param {number} {options.count} - 本次查询返回的最大记录数。取值范围：1 ~ 120（含），默认为 120
   * @param {boolean} [options.latest=false] - 是否仅获取最新的 count 条数据（需外部定义 count）
   *                                           - true：配合 startId 或 startTime 返回最新数据
   *                                           - false：配合 startId 或 startTime 进行增量拉取
   * @param {string|number} [options.startId] - 游标 ID，获取记录 ID 大于此值的增量数据
   *                                            若同时存在 startTime，取离最新数据最近的那个
   * @param {number} [options.startTime] - 起始时间戳（Unix 毫秒级），获取生成时间大于此值的增量数据
   *                                       若同时存在 startId，取离最新数据最近的那个
   * @param {string} {options.from} - 过滤从哪里发出的请求，默认为全部
   *                                - client：表示只获取从客户端发出的帧数据
   *                                - server：表示只获取从服务端发出的帧数据
   *                                - 其它：表示获取该连接的所有帧数据
   *
   * @example
   * // 使用游标增量拉取
   * getFrames({ reqId: '1784885309943-086', startId: '1784903620142-000', startTime: 1784903620156, count: 10, from: 'client' });
   *
   * @example
   * // 直接获取最新数据（需配合 count）
   * getFrames({ reqId: '1784885309943-086', startId: '1784903620142-000', startTime: 1784903620156 latest: true });
   */
  getFrames: function(options) {
    if (common.isString(options)) {
      options = { reqId: options };
    } else if (!options || !options.reqId) {
      throw new Error('reqId is required');
    }
    return request({ url: 'frames', data: options });
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

function getText(data, charset) {
  if (!data) {
    return '';
  }
  if (!Buffer.isBuffer(data)) {
    if (!common.isString(data)) {
      data = data.base64;
      if (!common.isString(data)) {
        return '';
      }
    }
    data = Buffer.from(data, 'base64');
  }
  return common.bufferToString(data, charset);
}

function getUtf8Buf(data, charset) {
  if (common.isString(data)) {
    data = Buffer.from(data, 'base64');
  } else if (!Buffer.isBuffer(data)) {
    return Buffer.from(common.toString(data));
  }
  return common.getUtf8Buf(data, charset);
}

function getReqBody(req) {
  req = req.req || req;
  return req ? getText(req.base64) : '';
}

function getResBody(res) {
  res = res.res || res;
  return res ? getText(res.base64) : '';
}

function getHttpVersion(req) {
  return 'HTTP/' + ((req && req.httpVersion) || '1.1');
}

function getRawReq(session) {
  var req = session.req || session;
  if (!req) {
    return '';
  }
  return getHttpMeta(req.method, session.url, getHttpVersion(req), req.headers) + getReqBody(req);
}

function getRawRes(session) {
  var res = session.res || session;
  if (!res) {
    return '';
  }
  var msg = res.statusMessage || STATUS_CODES[res.statusCode] || '';
  return getHttpMeta(getHttpVersion(session.req), res.statusCode, msg, res.headers) + getResBody(res);
}

function getRules(rules) {
  rules = rules.rules || rules;
  var result = [];
  if (!rules) {
    return result;
  }
  var addRule = function(rule) {
    if (result.indexOf(rule.raw) === -1) {
      result.push(rule.raw);
    }
  };
  Object.keys(rules).forEach(function(name) {
    var rule = rules[name];
    if (Array.isArray(rule.list)) {
      rule.list.forEach(addRule);
    } else {
      addRule(rule);
    }
  });
  return result;
}

function isNum(val) {
  return typeof val === 'number' && !isNaN(val);
}

function getDiffTime(start, end) {
  return isNum(start) && isNum(end) ? end - start : null;
}

function getTimings(session) {
  var startTime = session.startTime;
  var requestTime = session.requestTime;
  var responseTime = session.responseTime;
  var dnsTime = session.dnsTime;
  var endTime = session.endTime;

  return {
    start: startTime, // 请求开始的时间戳
    ttfb: session.ttfb >= 0 ? session.ttfb : null, // 首字节时间
    dns: getDiffTime(startTime, dnsTime), // dns 解析耗时
    connect: getDiffTime(dnsTime, session.connectTime), // tcp 连接耗时（从dns结束到建立连接耗时）
    request: getDiffTime(dnsTime, requestTime), // 请求发送耗时（从dns结束到请求结束耗时）
    response: getDiffTime(requestTime, responseTime), // 响应接收耗时（从请求结束到接收到响应头耗时）
    download: getDiffTime(responseTime, endTime), // 下载耗时（从接收到响应头到接收完响应体耗时）
    total: getDiffTime(startTime, endTime) // 总耗时
  };
}

exports.utils = {
  isUtf8: isUtf8,
  getText: getText,
  getUtf8Buf: getUtf8Buf,
  getReqBody: getReqBody,
  getResBody: getResBody,
  getReqJson: function(session) {
    return JSON.parse(getReqBody(session));
  },
  getResJson: function(session) {
    return JSON.parse(getResBody(session));
  },
  getRawReq: getRawReq,
  getRawRes: getRawRes,
  getRules: getRules,
  getTimings: getTimings
};
