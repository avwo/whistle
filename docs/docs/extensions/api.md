# Local Agent API

Whistle 的本地 API，供 AI Agent 或第三方进程以编程方式操作 Whistle 代理服务。支持规则管理、插件控制、抓包数据获取、HTTPS 代理开关、证书管理等核心功能，具体用法如下（确保已全局安装 Whistle 且版本 ≥ 2.10.7）：

``` javascript
const cp = require('child_process');
const qs = require('querystring');

const loadModule = require;
let w2Api;

/**
 * @async 异步加载 Whistle API 模块
 * @function loadApi
 * @description
 * 尝试加载 Whistle 的 API 模块，并校验其版本是否符合最低要求（≥ 2.10.7）。
 * 如果版本过低，或加载过程中发生任何错误（如子进程调用失败、模块加载异常、网络状态获取失败等），
 * 都会抛出对应的错误。
 * 
 * @returns {Promise<Object>} 返回 Whistle API 模块对象（通常包含 network、rules 等接口）
 * 
 * @throws {Error} 当执行 `w2 root bin/api` 命令失败时抛出（例如 whistle 未安装或未在 PATH 中，需要通过 `npm install -g whistle` 安装）
 * @throws {Error} 当调用 `api.network.getStatus()` 失败时抛出（例如 whistle 或 whistle client 服务未启动）
 * @throws {Error} 当 Whistle 版本低于 2.10.7 时抛出，错误信息为 'Whistle version must be >= 2.10.7'
 * 
 * @example
 * try {
 *   const api = await loadApi();
 *   // 使用 api.network.getStatus() 等
 * } catch (err) {
 *   console.error('加载 Whistle API 失败:', err.message);
 * }
 */
const loadApi = async () => {
  if (!w2Api) {
    w2Api = loadModule(cp.spawnSync('w2', ['root', 'bin/api']).stdout.toString().trim());
  }
  const { version } = await w2Api.network.getStatus();
  const [major, minor, patch] = version.split('.').map(Number);
  w2Api.version = version;
  if (major > 2 || (major == 2 && (minor > 10 || (minor == 10 && patch >= 7)))) {
    return w2Api;
  }
  throw new Error('Whistle version must be >= 2.10.7');
};

/**
 * @abstract 判断当前 Whistle 是否启用了 HTTPS 代理
 * @function isEnabledHTTPS
 * @description
 * 通过 Whistle API 检查当前代理是否启用了 HTTPS 代理功能。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 * 
 * @returns {Promise<boolean>} 当前是否启用了 HTTPS 代理
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.isEnabledHTTPS()` 调用失败
 *
 * @example
 * try {
 *   const enabled = await isEnabledHTTPS();
 *   console.log(`当前 HTTPS 代理是否启用: ${enabled}`);
 * } catch (err) {
 *   console.error('检查 HTTPS 代理状态失败:', err.message);
 * }
 */
const isEnabledHTTPS = async () => {
  const api = await loadApi();
  return await api.isEnabledHTTPS();
};

/**
 * @async 设置 Whistle 是否启用 HTTPS 代理
 * @function setEnableHTTPS
 * @description
 * 通过 Whistle API 设置当前代理是否启用 HTTPS 代理功能。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 * 
 * @param {boolean} enable - 是否启用 HTTPS 代理
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.setEnableHTTPS()` 调用失败
 *
 * @example
 * try {
 *   await setEnableHTTPS(true);
 *   console.log('设置 HTTPS 代理启用状态成功');
 * } catch (err) {
 *   console.error('设置 HTTPS 代理状态失败:', err.message);
 * }
 */
const setEnableHTTPS = async (enable) => {
  const api = await loadApi();
  await api.setEnableHTTPS(enable);
};

/**
 * @async 获取 Whistle 的根证书信息
 * @function getRootCA
 * @description
 * 通过 Whistle API 获取当前代理的根证书信息，包括证书内容、私钥等。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 * 
 * @returns {Promise<Buffer>} 返回根证书的 Buffer 对象，可用于保存为 .crt 文件或进行其他操作
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.getRootCA()` 调用失败
 */
const getRootCA = async () => {
  const api = await loadApi();
  return await api.getRootCA();
};

/**
 * @async 创建一个临时文件并写入指定内容
 * @function createFile
 * @description
 * 通过 Whistle API 创建一个临时文件，并将指定的内容写入该文件。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 * 
 * @param {Buffer|string} data - 要创建的文件内容，可以是 Buffer 或字符串
 * @returns {Promise<string>} 返回创建的文件路径
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.createFile()` 调用失败
 *
 * @example
 * try {
 *   const filePath = await createFile('test');
 *   console.log(`临时文件已创建: ${filePath}`);
 *   // 临时文件已创建: temp/7d2e9a424672279e5bcaab948a7a63fd47cb381626555835e828438762f86a96
 * } catch (err) {
 *   console.error('创建临时文件失败:', err.message);
 * }
 */
const createFile = async (data) => {
  const api = await loadApi();
  return await api.createFile(data);
};

/**
 * @async 获取指定文件的内容
 * @function getFile
 * @description
 * 通过 Whistle API 获取指定路径的文件内容，返回其字符串内容。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 * 
 * @param {string} filePath - 要读取的文件路径
 * @returns {Promise<string>} 返回文件内容的字符串
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.getFile()` 调用失败（如文件不存在）
 */
const getFile = async (filePath) => {
  const api = await loadApi();
  return await api.getFile(filePath);
};

/**
 * @async 获取 Whistle 规则引擎的当前状态配置
 * @function getRulesStatus
 * @description
 * 通过 Whistle API 获取规则列表、启用状态以及优先级策略等运行时配置。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @returns {Promise<{
 *   laterRulesFirst: boolean,   // 是否启用“后置规则优先”策略（即后匹配的规则覆盖前匹配的）
 *   multiSelect: boolean,       // 是否启用多选模式
 *   pluginsDisabled: boolean,   // 是否全局禁用所有插件规则
 *   disabled: boolean,          // 是否全局禁用 Whistle 代理（所有规则失效）
 *   list: Array<{
 *     name: string,            // 规则文件/配置的名称
 *     selected: boolean        // 当前是否处于激活（勾选）状态
 *   }>
 * }>} 返回包含规则状态和列表的对象
 *
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.rules.getStatus()` 调用失败
 *
 * @example
 * try {
 *   const { list, disabled, multiSelect, laterRulesFirst } = await getRulesStatus();
 *   const activeRules = list.filter(r => r.selected);
 *   console.log(`激活规则 (${activeRules.length}):`, activeRules.map(r => r.name));
 * } catch (err) {
 *   console.error('获取规则状态失败:', err.message);
 * }
 */
const getRulesStatus = async () => {
  const api = await loadApi();
  return await api.rules.getStatus();
};

/**
 * @async 关闭 Whistle 规则引擎
 * @function turnOffRules
 * @description
 * 通过 Whistle API 全局禁用所有规则（不包括插件规则）。
 * 该操作会立即生效，影响当前代理会话中的所有请求处理。
 * 依赖 `loadApi()` 加载 API 模块，若 Whistle 服务未运行或版本不兼容则会失败。
 *
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 *
 * @throws {Error} Whistle API 加载失败（如 `w2` 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未启动或 `api.rules.turnOff()` 调用失败（如网络异常）
 *
 * @example
 * try {
 *   await turnOffRules();
 *   console.log('规则已关闭，所有请求将不再受 Whistle 规则影响');
 * } catch (err) {
 *   console.error('关闭规则失败:', err.message);
 *   // 可依据错误类型进行降级或重试
 * }
 */
const turnOffRules = async () => {
  const api = await loadApi();
  await api.rules.turnOff();
};

/**
 * @async 启用 Whistle 规则引擎
 * @function turnOnRules
 * @description
 * 通过 Whistle API 全局启用之前配置的所有规则（不包括插件的规则）。
 * 该操作会立即生效，恢复代理请求的规则处理逻辑。
 * 依赖 `loadApi()` 加载 API 模块，若 Whistle 服务未运行或版本不兼容则会失败。
 *
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 *
 * @throws {Error} Whistle API 加载失败（如 `w2` 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未启动或 `api.rules.turnOn()` 调用失败（如网络异常）
 *
 * @example
 * try {
 *   await turnOnRules();
 *   console.log('规则已启用，请求将按配置规则处理');
 * } catch (err) {
 *   console.error('启用规则失败:', err.message);
 *   // 可依据错误类型进行降级或重试
 * }
 */
const turnOnRules = async () => {
  const api = await loadApi();
  await api.rules.turnOn();
};

/**
 * @async 选中（激活）指定的 Whistle 规则文件，并自动启用规则引擎
 * @function selectRule
 * @description
 * 调用 Whistle API 选中指定名称的规则文件（通常从规则列表中选择），
 * 若选中操作成功（返回 truthy 值），则自动调用 `turnOnRules()` 启用全局规则引擎，
 * 使该规则立即生效。该操作依赖 `loadApi()` 加载 API 模块。
 *
 * @param {string} ruleName - 要激活的规则文件名称（需与规则列表中的名称精确匹配）
 *
 * @returns {Promise<boolean>} 对应 ruleName 是否存在
 *
 * @throws {Error} Whistle API 加载失败（如 `w2` 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未启动或 `api.rules.select()` 调用失败（如网络异常）
 * @throws {Error} 若选中成功但启用规则引擎（`turnOnRules()`）失败时抛出
 *
 * @example
 * try {
 *   await selectRule('dev-rules');
 *   console.log('规则 "dev-rules" 已选中并启用');
 * } catch (err) {
 *   console.error('操作失败:', err.message);
 * }
 */
const selectRule = async (ruleName) => {
  const api = await loadApi();
  const result = await api.rules.select(ruleName);
  if (result) {
    await turnOnRules();
  }
  await result;
};

/**
 * @async 取消选中（停用）指定的 Whistle 规则文件
 * @function unselectRule
 * @description
 * 调用 Whistle API 取消选中指定名称的规则文件（通常从规则列表中选择），
 * 该操作依赖 `loadApi()` 加载 API 模块。
 *
 * @param {string} ruleName - 要取消激活的规则文件名称（需与规则列表中的名称精确匹配，如果 ruleName 不填则取消所有规则）
 *
 * @returns {Promise<boolean>} 对应 ruleName 是否存在
 *
 * @throws {Error} Whistle API 加载失败（如 `w2` 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未启动或 `api.rules.unselect()` 调用失败（如网络异常）
 *
 * @example
 * try {
 *   await unselectRule('dev-rules');
 *   console.log('规则 "dev-rules" 已取消选中');
 * } catch (err) {
 *   console.error('操作失败:', err.message);
 * }
 */
const unselectRule = async (ruleName) => {
  const api = await loadApi();
  const result = await api.rules.unselect(ruleName);
  await result;
};

/**
 * @async 获取指定规则文件的内容详情
 * @function getRule
 * @description
 * 通过 Whistle API 读取指定名称的规则文件内容，返回其详细配置信息。
 * 依赖 `loadApi()` 加载 API 模块。
 *
 * @param {string} ruleName - 规则文件的名称（需与 Whistle 规则列表中的名称精确匹配）
 *
 * @returns {Promise<{
 *   value: string,       // 规则内容（如 "* www.example.com 127.0.0.1"）
 *   selected: boolean,     // 当前是否被选中
 * }>} 返回规则对象，具体字段可能因 Whistle 版本而异
 *
 * @throws {Error} Whistle API 加载失败（如 `w2` 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未启动或 `api.rules.get()` 调用失败（如规则名称不存在）
 *
 * @example
 * try {
 *   const rule = await getRule('my-rules');
 *   console.log(`规则的内容:\n${rule.value}`);
 *   if (rule.selected) {
 *     console.log('该规则当前已激活');
 *   }
 * } catch (err) {
 *   console.error('获取规则失败:', err.message);
 * }
 */
const getRule = async (ruleName) => {
  const api = await loadApi();
  return await api.rules.get(ruleName);
};

/**
 * @async 获取当前 Whistle 规则列表
 * @function getRuleList
 * @description
 * 通过 Whistle API 获取所有已配置的规则文件列表，包含每个规则的名称、内容及激活状态。
 * 依赖 `loadApi()` 加载 API 模块。
 *
 * @returns {Promise<Array<{
 *   name: string,      // 规则文件名称
 *   value: string,     // 规则内容（如 "* www.example.com 127.0.0.1"）
 *   selected: boolean  // 当前是否被选中（激活）
 * }>>} 返回规则对象数组，若无可返回空数组
 *
 * @throws {Error} Whistle API 加载失败（如 `w2` 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未启动或 `api.rules.getList()` 调用失败（如网络异常）
 *
 * @example
 * try {
 *   const rules = await getRuleList();
 *   console.log(`共 ${rules.length} 条规则`);
 *   const activeRules = rules.filter(r => r.selected);
 *   console.log(`激活规则 (${activeRules.length}):`, activeRules.map(r => r.name));
 * } catch (err) {
 *   console.error('获取规则列表失败:', err.message);
 * }
 */
const getRuleList = async () => {
  const api = await loadApi();
  return await api.rules.getList();
};

/**
 * @async 判断当前 Whistle 是否启用了多选模式
 * @function isMultiSelect
 * @description
 * 通过 Whistle API 检查当前规则引擎是否启用了多选模式。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 * 
 * @returns {Promise<boolean>} 当前是否启用了多选模式
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.rules.isMultiSelect()` 调用失败
 *
 * @example
 * try {
 *   const multiSelect = await isMultiSelect();
 *   console.log(`当前规则引擎是否启用多选模式: ${multiSelect}`);
 * } catch (err) {
 *   console.error('检查多选模式状态失败:', err.message);
 * }
 */
const isMultiSelect = async () => {
  const api = await loadApi();
  return await api.rules.isMultiSelect();
};

/**
 * @async 设置 Whistle 规则引擎是否启用多选模式
 * @function setMultiSelect
 * @description
 * 通过 Whistle API 设置当前规则引擎是否启用了多选模式。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 * 
 * @param {boolean} enable - 是否启用多选模式
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.rules.setMultiSelect()` 调用失败
 *
 * @example
 * try {
 *   await setMultiSelect(true);
 *   console.log('已启用多选模式');
 * } catch (err) {
 *   console.error('设置多选模式失败:', err.message);
 * }
 */
const setMultiSelect = async (enable) => {
  const api = await loadApi();
  await api.rules.setMultiSelect(enable);
};

/**
 * @async 设置 Whistle 规则引擎是否启用后置规则优先
 * @function setLaterRulesFirst
 * @description
 * 通过 Whistle API 设置当前规则引擎是否启用了后置规则优先。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @param {boolean} enable - 是否启用后置规则优先
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.rules.setLaterRulesFirst()` 调用失败
 *
 * @example
 * try {
 *   await setLaterRulesFirst(true);
 *   console.log('已启用后置规则优先');
 * } catch (err) {
 *   console.error('设置后置规则优先失败:', err.message);
 * }
 */
const setLaterRulesFirst = async (enable) => {
  const api = await loadApi();
  await api.rules.setLaterFirst(enable);
};

/**
 * @async 添加一个新的规则文件到 Whistle 规则引擎中
 * @function addRule
 * @description
 * 通过 Whistle API 添加一个新的规则文件，并可选择是否立即选中（激活）该规则。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 * 
 * @param {string} name - 规则名称
 * @param {string} value - 规则内容
 * @param {boolean} selected - 是否选中
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.rules.add()` 调用失败
 *
 * @example
 * try {
 *   await addRule('my-rule', '* www.example.com 127.0.0.1', true);
 *   console.log('已添加规则');
 * } catch (err) {
 *   console.error('添加规则失败:', err.message);
 * }
 */
const addRule = async (name, value, selected) => {
  const api = await loadApi();
  await api.rules.add(name, value, selected);
};

/**
 * @async 将指定规则文件移动到规则列表顶部
 * @function moveRuleToTop
 * @description
 * 通过 Whistle API 将指定规则文件移动到规则列表的顶部。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @param {string} ruleName - 规则文件的名称（需与规则列表中的名称精确匹配）
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.rules.moveToTop()` 调用失败
 *
 * @example
 * try {
 *   await moveRuleToTop('my-rule');
 *   console.log('已将规则移动到顶部');
 * } catch (err) {
 *   console.error('移动规则失败:', err.message);
 * }
 */
const moveRuleToTop = async (ruleName) => {
  const api = await loadApi();
  await api.rules.moveToTop(ruleName);
};

/**
 * @async 获取 Whistle 的 Values 列表
 * @function getValueList
 * @description
 * 通过 Whistle API 获取当前配置的 Values 列表，返回每个 Value 的名称和值。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 * 
 * @returns {Promise<Array<{ name: string, value: string }>>} 返回 Values 对象数组，若无可返回空数组
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.values.getList()` 调用失败
 *
 * @example
 * try {
 *   const values = await getValueList();
 *   console.log(`共 ${values.length} 个 Values`);
 *   values.forEach(v => console.log(`${v.name}: ${v.value}`));
 * } catch (err) {
 *   console.error('获取 Values 列表失败:', err.message);
 * }
 */
const getValueList = async () => {
  const api = await loadApi();
  return await api.values.getList();
};

/**
 * @async 获取指定的 Value
 * @function getValue
 * @description
 * 通过 Whistle API 获取指定的 Value。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @param {string} name - Value 的名称
 * @returns {Promise<{ name: string, value: string }>} 返回 Value 对象，若不存在返回 `null` 或 `undefined`
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.values.get()` 调用失败
 *
 * @example
 * try {
 *   const value = await getValue('my-value');
 *   console.log(`${value.name}: ${value.value}`);
 * } catch (err) {
 *   console.error('获取 Value 失败:', err.message);
 * }
 */
const getValue = async (name) => {
  const api = await loadApi();
  return await api.values.get(name);
};

/**
 * @async 添加一个新的 Value
 * @function addValue
 * @description
 * 通过 Whistle API 添加一个新的 Value。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @param {string} name - Value 的名称
 * @param {string} value - Value 的值
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.values.add()` 调用失败
 *
 * @example
 * try {
 *   await addValue('my-value', 'some-value');
 *   console.log('已添加 Value');
 * } catch (err) {
 *   console.error('添加 Value 失败:', err.message);
 * }
 */
const addValue = async (name, value) => {
  const api = await loadApi();
  await api.values.add(name, value);
};

/**
 * @async 获取 Whistle 插件的状态信息
 * @function getPluginsStatus
 * @description
 * 通过 Whistle API 获取当前已安装插件的状态信息，包括每个插件的名称、启用状态等。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @returns {Promise<Array<{ name: string, moduleName: string, version: string, selected: boolean }>>} 返回插件状态对象数组，若无可返回空数组
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.plugins.getStatus()` 调用失败
 * 
 * @example
 * try {
 *   const plugins = await getPluginsStatus();
 *   console.log(`共 ${plugins.length} 个插件`);
 *   plugins.forEach(p => console.log(`${p.name}: ${p.selected ? '启用' : '禁用'}`));
 * } catch (err) {
 *   console.error('获取插件状态失败:', err.message);
 * }
 */
const getPluginsStatus = async () => {
  const api = await loadApi();
  return await api.plugins.getStatus();
};

/**
 * @async 启用 Whistle 插件
 * @function turnOnPlugins
 * @description
 * 通过 Whistle API 启用所有已安装的插件。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.plugins.turnOn()` 调用失败
 * 
 * @example
 * try {
 *   await turnOnPlugins();
 *   console.log('已启用所有插件');
 * } catch (err) {
 *   console.error('启用插件失败:', err.message);
 * }
 */
const turnOnPlugins = async () => {
  const api = await loadApi();
  await api.plugins.turnOn();
};

/**
 * @async 禁用 Whistle 插件
 * @function turnOffPlugins
 * @description
 * 通过 Whistle API 禁用所有已安装的插件。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @returns {Promise<void>} 无返回值，成功时 Promise 解析为空
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.plugins.turnOff()` 调用失败
 * 
 * @example
 * try {
 *   await turnOffPlugins();
 *   console.log('已禁用所有插件');
 * } catch (err) {
 *   console.error('禁用插件失败:', err.message);
 * }
 */
const turnOffPlugins = async () => {
  const api = await loadApi();
  await api.plugins.turnOff();
};

/**
 * @async 获取 Whistle 插件列表
 * @function getPluginList
 * @description
 * 通过 Whistle API 获取当前已安装的所有插件信息，包括插件元数据、版本、描述、规则配置及激活状态等。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @returns {Promise<Array<{
 *   moduleName: string,          // 插件模块名（如 'whistle.inspect'）
 *   name: string,                // 插件短名称（如 'inspect'）
 *   mtime: number,               // 插件最后修改时间（Unix 毫秒时间戳）
 *   version: string,             // 插件版本号（如 '2.3.0'）
 *   description: string,         // 插件描述信息
 *   homepage: string,            // 插件主页 URL
 *   rules: string,               // 自定义规则内容（可能为空）
 *   _rules: string,              // 内部规则表达式（通常包含动态替换逻辑）
 *   resRules: string,            // 响应规则内容（可能为空）
 *   selected: boolean            // 当前是否启用该插件
 * }>>} 返回插件对象数组，若无插件则返回空数组
 *
 * @throws {Error} Whistle API 加载失败（如 `w2` 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.plugins.getList()` 调用失败
 *
 * @example
 * try {
 *   const plugins = await getPluginList();
 *   console.log(`共 ${plugins.length} 个插件`);
 *   plugins.forEach(p => {
 *     console.log(`${p.name} (${p.version}): ${p.selected ? '启用' : '禁用'}`);
 *     console.log(`  描述: ${p.description}`);
 *   });
 * } catch (err) {
 *   console.error('获取插件列表失败:', err.message);
 * }
 */
const getPluginList = async () => {
  const api = await loadApi();
  return await api.plugins.getList();
};

/**
 * @async 获取指定的 Whistle 插件
 * @function getPlugin
 * @description
 * 通过 Whistle API 获取指定的插件信息。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @param {string} name - 插件的名称
 * @returns {Promise<{
 *   moduleName: string,          // 插件模块名（如 'whistle.inspect'）
 *   name: string,                // 插件短名称（如 'inspect'）
 *   mtime: number,               // 插件最后修改时间（Unix 毫秒时间戳）
 *   version: string,             // 插件版本号（如 '2.3.0'）
 *   description: string,         // 插件描述信息
 *   homepage: string,            // 插件主页 URL
 *   rules: string,               // 自定义规则内容（可能为空）
 *   _rules: string,              // 内部规则表达式（通常包含动态替换逻辑）
 *   resRules: string,            // 响应规则内容（可能为空）
 *   selected: boolean            // 当前是否启用该插件
 * }>} 返回插件对象，若不存在返回 `null` 或 `undefined`
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.plugins.get()` 调用失败
 * 
 * @example
 * try {
 *   const plugin = await getPlugin('my-plugin');
 *   console.log(`${plugin.name}: ${plugin.enabled ? '启用' : '禁用'}`);
 * } catch (err) {
 *   console.error('获取插件失败:', err.message);
 * }
 */
const getPlugin = async (name) => {
  const api = await loadApi();
  return await api.plugins.get(name);
};

/**
 * @async 选择指定的 Whistle 插件
 * @function selectPlugin
 * @description
 * 通过 Whistle API 选择指定的插件。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @param {string} name - 插件的名称
 * @returns {Promise<boolean>} 返回选择结果，成功返回 `true`，失败返回 `false`
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.plugins.select()` 调用失败
 * 
 * @example
 * try {
 *   const result = await selectPlugin('my-plugin');
 *   if (result) {
 *     console.log('插件已选择并启用');
 *   } else {
 *     console.log('插件选择失败，可能不存在');
 *   }
 * } catch (err) {
 *   console.error('选择插件失败:', err.message);
 * }
 */
const selectPlugin = async (name) => {
  const api = await loadApi();
  const result = await api.plugins.select(name);
  if (result) {
    await turnOnPlugins();
  }
  return result;
};

/**
 * @async 取消选择指定的 Whistle 插件
 * @function unselectPlugin
 * @description
 * 通过 Whistle API 取消选择指定的插件。
 * 依赖 `loadApi()` 加载 API 模块，若加载失败或版本过低会抛出异常。
 *
 * @param {string} name - 插件的名称
 * @returns {Promise<boolean>} 返回取消选择结果，成功返回 `true`，失败返回 `false`
 * @throws {Error} Whistle API 加载失败（如 w2 命令不可用、模块加载错误）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未运行或 `api.plugins.unselect()` 调用失败
 * @example
 * try {
 *   const result = await unselectPlugin('my-plugin');
 *   if (result) {
 *     console.log('插件已取消选择并禁用');
 *   } else {
 *     console.log('插件取消选择失败，可能不存在');
 *   }
 * } catch (err) {
 *   console.error('取消选择插件失败:', err.message);
 * }
 */
const unselectPlugin = async (name) => {
  const api = await loadApi();
  return await api.plugins.unselect(name);
};

const URLENCODED_RE = /application\/x-www-form-urlencoded/i;
const POST_RE = /^post$/i;
const isUrlEncoded = (req) => {
  var type = req.headers?.['content-type'];
  if (!type || !POST_RE.test(req.method)) {
    return;
  }
  return URLENCODED_RE.test(type);
};

const formatData = (session, utils, isRes) => {
  let data = session[isRes ? 'res' : 'req'];
  let body = data.body || '';
  let raw;
  let json;

  const getBody = () => {
    if (body == null) {
      raw = raw || (isRes ? utils.getRawRes(data) : utils.getRawReq(data));
      body = raw ? raw.substring(raw.indexOf('\r\n\r\n') + 4) : '';
    }
    return body;
  };

  Object.defineProperties(data, {
    body: {
      configurable: true,
      get: getBody,
    },
    json: {
      configurable: true,
      get() {
        if (json) {
          return json;
        }
        getBody();
        if (body) {
          if (!isRes && isUrlEncoded(data)) {
            json = qs.parse(body);
          } else {
            try {
              json = JSON.parse(body);
            } catch (e) {}
          }
        }
        json = json || {};
        return json;
      }
    },
    raw: {
      configurable: true,
      get() {
        if (raw == null) {
          raw = isRes ? utils.getRawRes(data) : utils.getRawReq(data);
        }
        return raw;
      }
    },
  });
};

const formatSession = (session, utils) => {
  let timings;
  let rules;
  Object.defineProperties(session, {
    timings: {
      configurable: true,
      get() {
        timings = timings || utils.getTimings(session);
        return timings;
      }
    },
    rawRules: {
      configurable: true,
      get() {
        rules = rules || utils.getRules(session);
        return rules.join('\n');
      }
    },
  });
  formatData(session, utils);
  formatData(session, utils, false);
  return session;
};

/**
 * @async 获取抓包数据（支持自动分页拉取）
 * @function getSessions
 * @description
 * 用于按条件检索 HTTP/WebSocket 等协议的抓包记录。支持基于游标、时间、资源类型、URL 关键词、请求方法、状态码以及请求/响应头的组合筛选。
 *
 * **过滤逻辑**：
 * - 所有非空条件均以 **AND** 关系叠加（即需同时满足）；
 * - 对于 `method` 和 `statusCode`，传入多个值时采用 **OR** 关系（匹配任一即可）；
 * - `latest` 优先级最高，一旦为 `true`，count 最多只返回 120 条最新记录；
 * - 若同时提供 `startId` 与 `startTime`，系统将在**首轮请求**中以较新者作为起始点，后续分页仅使用 `startId`（`startTime` 会被自动清除）；
 * - `reqHeader` 和 `resHeader` 为对象类型，支持按请求头/响应头的字段名和值进行子串匹配。
 *
 * **分页机制**：
 * - 每次最多从 Whistle 服务拉取 120 条记录（底层 API 限制），函数会**自动循环分页**，直到满足 `count` 指定的总数或到达最新数据末尾。
 * - 分页游标自动使用上一页最后一条记录的 `id` 作为下一页的 `startId`，并清除 `startTime`，确保后续分页仅基于游标。
 * - 若 `latest=true`，则只请求一次，返回最新的若干条（最多 120 条），忽略 `count` 和任何游标/时间参数。
 * - **重要限制**：由于 Whistle API 的 `startId` 是“**大于**”语义（即只能向更晚时间滚动），**若未提供 `startId` 或 `startTime`**，函数将从最新数据开始拉取，**只能获取第一页（最多 120 条）**，后续请求尝试获取更新的数据通常为空。如需获取大量历史数据，请先通过其他方式获取一个较早的 `startId` 作为起点。
 *
 * @param {Object} options - 配置对象
 * @param {number} [options.count=3600] - 期望获取的最大记录数。实际返回数量 ≤ 此值，且受每页 120 条限制及数据实际数量影响。若 `latest=true`，此参数无效。
 * @param {boolean} [options.latest=false] - 是否仅获取最新的记录。
 *                                           - `true`：只请求一次，返回最新的若干条（最多 120 条）；
 *                                           - `false`：配合 `startId` 或 `startTime` 进行增量拉取，并自动分页直到凑够 `count` 条或到达数据末尾。
 * @param {string|number} [options.startId] - 游标 ID（通常为记录的自增主键或唯一序号，格式如 `"1784905385300-003"`）。
 *                                            获取记录 ID **大于**此值的增量数据（即更新的数据）。
 *                                            若同时提供 `startTime`，则首轮请求取两者中更靠近最新数据的一个作为起始点，后续分页仅使用 `startId`。
 * @param {number} [options.startTime] - 起始时间戳（Unix 毫秒级）。
 *                                       获取记录生成时间 **大于**此值的增量数据。
 *                                       仅在首轮请求中生效（若同时提供 `startId` 则取较新者），后续分页会被清除。
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
 *                                  - `Error`：错误请求（状态码 >= 400、captureError、中断的请求等）
 *                                  - `captureError`：解析 HTTPS 失败的 Tunnel 请求
 * @param {string} [options.subUrl] - URL 中包含该字符串的请求（不区分大小写）。
 *                                    例如 `"/api/user"` 将匹配所有包含该路径的 URL。
 * @param {string|string[]} [options.method] - HTTP 请求方法，支持多个（数组或逗号分隔字符串，如 `"GET,POST"`，不区分大小写）。
 *                                             匹配任一方法即满足条件。
 * @param {number|number[]} [options.statusCode] - HTTP 响应状态码，支持多个（数组或逗号分隔字符串，如 `"200,404"`）。
 *                                                 匹配任一状态码即满足条件。
 * @param {Object} [options.reqHeader] - 请求头过滤条件。
 * @param {string} options.reqHeader.name - 请求头字段名称（如 `"X-Request-Id"`，不区分大小写）。
 * @param {string} [options.reqHeader.subValue] - 可选，请求头字段值需要包含的子字符串（不区分大小写）。
 *                                                若不填，则表示仅要求存在该请求头字段（无论值为何）。
 * @param {Object} [options.resHeader] - 响应头过滤条件。
 * @param {string} options.resHeader.name - 响应头字段名称（如 `"Content-Type"`，不区分大小写）。
 * @param {string} [options.resHeader.subValue] - 可选，响应头字段值需要包含的子字符串（不区分大小写）。
 *                                                若不填，则表示仅要求存在该响应头字段（无论值为何）。
 *
 * @returns {Promise<Array<Object>>} 返回符合条件的抓包记录数组（经过 `formatSession` 格式化处理）。
 *                                    每条记录包含以下主要字段（可能因 `formatSession` 处理而略有增减）：
 *                                    - `id` (string): 记录唯一标识，格式为 `"时间戳-序号"`（如 `"1785144349945-573"`）
 *                                    - `startTime` (number): 请求开始时间戳（Unix 毫秒级）
 *                                    - `url` (string): 完整请求 URL
 *                                    - `req` (Object): 请求详情
 *                                      - `method` (string): 请求方法
 *                                      - `ip` (string): 客户端 IP
 *                                      - `port` (string): 客户端端口
 *                                      - `headers` (Object): 请求头键值对
 *                                      - `json` (Object): 解析后的 JSON 请求体（若存在）
 *                                      - `body` (string): 原始请求体（可能为空）
 *                                      - `raw` (string): 原始请求数据
 *                                    - `res` (Object): 响应详情
 *                                      - `ip` (string): 服务器 IP
 *                                      - `port` (string): 服务器端口
 *                                      - `statusCode` (number): HTTP 状态码
 *                                      - `headers` (Object): 响应头键值对
 *                                      - `json` (Object): 解析后的 JSON 响应体（若存在）
 *                                      - `body` (string): 原始响应体（可能为空）
 *                                      - `raw` (string): 原始响应数据
 *                                    - `timings` (Object): 请求各阶段耗时（单位：毫秒）
 *                                      - `start` (number): 请求开始的时间戳（相对于某个基准点）
 *                                      - `ttfb` (number | null): 首字节时间
 *                                      - `dns` (number | null): DNS 解析耗时
 *                                      - `connect` (number | null): TCP 连接耗时（从 DNS 结束到连接建立）
 *                                      - `request` (number | null): 请求发送耗时（从 DNS 结束到请求结束）
 *                                      - `response` (number | null): 响应接收耗时（从请求结束到接收到响应头）
 *                                      - `download` (number | null): 下载耗时（从接收响应头到接收完响应体）
 *                                      - `total` (number | null): 总耗时
 *                                    - `rules` (Object): 匹配的规则对象
 *                                    - `rawRules` (string): 原始规则字符串
 *                                    - `version` (string): Whistle 版本号
 *                                    - `nodeVersion` (string): Node.js 版本号
 *                                    - `dnsTime` (number): DNS 完成时间戳
 *                                    - `requestTime` (number): 请求发送完成时间戳
 *                                    - `connectTime` (number): 连接建立完成时间戳
 *                                    - `responseTime` (number): 响应头接收完成时间戳
 *                                    - `endTime` (number): 请求结束时间戳
 *
 * @throws {Error} Whistle API 加载失败（如 `w2` 命令不可用、模块加载错误，需确保 whistle 已全局安装）
 * @throws {Error} Whistle 版本低于 2.10.7
 * @throws {Error} Whistle 服务未启动或 `api.network.getSessions()` 调用失败（如网络异常、参数错误）
 * @throws {Error} 底层 API 调用可能抛出其他运行时错误（如超时、数据格式异常）
 *
 * @example
 * // 使用游标增量拉取（最多 100 条）
 * const sessions = await getSessions({ startId: '1784905385300-003', count: 100 });
 *
 * @example
 * // 获取最新的 JSON 类型记录（最多 120 条）
 * const sessions = await getSessions({ latest: true, type: 'JSON' });
 *
 * @example
 * // 组合过滤：查询状态码为 200 或 304 的 GET 请求，且 URL 包含 "/v1"，同时要求存在特定请求头
 * const sessions = await getSessions({
 *   subUrl: '/v1',
 *   method: 'GET',
 *   statusCode: [200, 304],
 *   reqHeader: { name: 'X-Token', subValue: 'abc' },
 *   count: 50
 * });
 */
const getSessions = async (options) => {
  options = { ...options };
  let count = +options.count || 3600;
  const result = [];
  const api = await loadApi();
  while (count > 0) {
    const sessions = await api.network.getSessions(options);
    const len = sessions.length;
    for (let i = 0; i < len; i++) {
      result.push(formatSession(sessions[i], api.utils));
    }
    if (len < 120 || options.latest) {
      break;
    }
    options.startId = sessions[len - 1]?.id;
    options.startTime = undefined;
    count = count - len;
  }
  return result;
};


const formatFrame = (frame, utils) => {
  let body;
  let json;

  const getBody = () => {
    if (body == null) {
      body = utils.getText(frame);
    }
    return body;
  };
  Object.defineProperties(frame, {
    body: {
      configurable: true,
      get: getBody,
    },
    json: {
      configurable: true,
      get() {
        getBody();
        if (body) {
          try {
            json = JSON.parse(getBody());
          } catch (e) {}
        }
        json = json || {};
        return json;
      },
    }
  });
  return frame;
}

/**
 * @async 获取 WebSocket/Socket 的帧数据（支持自动分页拉取）
 * @function getFrames
 * @description
 * 按条件检索指定连接（通过 `reqId` 关联）的 WebSocket/Socket 通信帧，支持基于游标、时间、来源方向的组合筛选。
 *
 * **过滤逻辑**：
 * - `from` 参数用于过滤帧的发送方向：`client`（客户端→服务端）、`server`（服务端→客户端），不传则返回全部方向；
 * - `latest` 优先级最高，一旦为 `true`，count 最大为 120；
 * - 若同时提供 `startId` 与 `startTime`，系统将在**首轮请求**中以较新者作为起始点，后续分页仅使用 `startId`（`startTime` 会被自动清除）；
 *
 * **分页机制**：
 * - 每次最多从 Whistle 服务拉取 120 条帧记录（底层 API 限制），函数会**自动循环分页**，直到满足 `count` 指定的总数或到达最新帧末尾。
 * - 分页游标自动使用上一页最后一条帧的 `id` 作为下一页的 `startId`，并清除 `startTime`，确保后续分页仅基于游标。
 * - 若 `latest=true`，则只请求一次，返回最新的若干条（最多 120 条），忽略 `count`。
 * - **重要限制**：由于 Whistle API 的 `startId` 是“**大于**”语义（即只能向更晚时间滚动），**若未提供 `startId` 或 `startTime`**，函数将从最新帧开始拉取，**只能获取第一页（最多 120 条）**，后续请求尝试获取更新的帧通常为空。如需获取大量历史帧，请先通过其他方式获取一个较早的 `startId` 作为起点。
 *
 * @param {Object} options - 配置对象
 * @param {string} options.reqId - 会话 ID，对应抓包记录的 `id` 字段，用于关联帧所属的连接
 * @param {number} [options.count=3600] - 期望获取的最大帧数。实际返回数量 ≤ 此值，且受每页 120 条限制及实际帧数量影响。若 `latest=true`，此参数无效。
 * @param {boolean} [options.latest=false] - 是否仅获取最新的帧。
 *                                           - `true`：只请求一次，返回最新的若干条（最多 120 条）；
 *                                           - `false`：配合 `startId` 或 `startTime` 进行增量拉取，并自动分页直到凑够 `count` 条或到达数据末尾。
 * @param {string|number} [options.startId] - 游标 ID（帧的唯一序号），获取帧 ID **大于**此值的增量数据（即更新的帧）。
 *                                            若同时提供 `startTime`，则首轮请求取两者中更靠近最新数据的一个作为起始点，后续分页仅使用 `startId`。
 * @param {number} [options.startTime] - 起始时间戳（Unix 毫秒级），获取帧生成时间 **大于**此值的增量数据。
 *                                       仅在首轮请求中生效（若同时提供 `startId` 则取较新者），后续分页会被清除。
 * @param {string} [options.from] - 帧的来源方向过滤（不区分大小写）：
 *                                   - `'client'`：仅获取客户端→服务端的帧
 *                                   - `'server'`：仅获取服务端→客户端的帧
 *                                   - 不传或传入其他值：获取该连接的所有帧
 *
 * @returns {Promise<Array<Object>>} 返回符合条件的帧数据数组（经过 `formatFrame` 格式化处理）。
 *                                    每条帧包含以下主要字段：
 *                                    - `reqId` (string): 所属会话 ID，对应抓包记录的 `id`
 *                                    - `frameId` (string): 帧数据的唯一标识 ID（可用于游标）
 *                                    - `mask` (boolean): 是否为掩码帧（WebSocket 掩码）
 *                                    - `compressed` (boolean): 帧数据是否经过压缩
 *                                    - `length` (number): 帧数据的原始长度（字节数）
 *                                    - `opcode` (number): 帧操作码，`1` 表示文本帧，`2` 表示二进制帧
 *                                    - `base64` (string): Base64 编码的帧数据（用于二进制或大文本）
 *                                    - `body` (string): 解码后的帧内容（文本或可读字符串）
 *                                    - `json` (Object): 若帧数据为 JSON 格式，则解析为对象，否则为空对象 `{}`
 *
 * @throws {Error} 依赖 `loadApi` 可能抛出的错误（如 Whistle 未安装、版本过低、服务未启动）
 * @throws {Error} 底层 `api.network.getFrames()` 调用失败（如 `reqId` 不存在、参数错误、网络异常）
 *
 * @example
 * // 使用游标增量拉取，获取客户端发出的前 10 条帧
 * const frames = await getFrames({
 *   reqId: '1784885309943-086',
 *   startId: '1784903620142-000',
 *   startTime: 1784903620156,
 *   count: 10,
 *   from: 'client'
 * });
 *
 * @example
 * // 获取最新的帧（最多 120 条）
 * const frames = await getFrames({
 *   reqId: '1784885309943-086',
 *   latest: true
 * });
 *
 * @example
 * // 从指定游标开始拉取所有后续帧（直到最新）
 * const frames = await getFrames({
 *   reqId: '1784885309943-086',
 *   startId: '1784903620142-000',
 *   count: 3600
 * });
 */
const getFrames = async (options) => {
  options = { ...options };
  let count = +options.count || 3600;
  const result = [];
  const api = await loadApi();
  while (count > 0) {
    const frames = await api.network.getFrames(options);
    const len = frames.length;
    for (let i = 0; i < len; i++) {
      result.push(formatFrame(frames[i], api.utils));
    }
    if (len < 120 || options.latest) {
      break;
    }
    options.startId = frames[len - 1]?.frameId;
    options.startTime = undefined;
    count = count - len;
  }
  return result;
};

```
