# Local Agent API

Whistle's local API, for AI agents or third-party processes to programmatically operate the Whistle proxy service. It supports core functions such as rule management, plugin control, packet capture data retrieval, HTTPS proxy toggling, certificate management, and more. Usage details are as follows (ensure Whistle is globally installed and version >= 2.10.7):

``` javascript
const cp = require('child_process');
const qs = require('querystring');

const loadModule = require;
let w2Api;

/**
 * @async Asynchronously loads the Whistle API module
 * @function loadApi
 * @description
 * Attempts to load Whistle's API module and verifies that its version meets the minimum requirement (≥ 2.10.7).
 * If the version is too low, or any error occurs during loading (e.g., child process failure, module loading error, network status retrieval failure),
 * the corresponding error will be thrown.
 *
 * @returns {Promise<Object>} Returns the Whistle API module object (usually contains network, rules, etc.)
 *
 * @throws {Error} Throws when executing `w2 root bin/api` fails (e.g., whistle is not installed or not in PATH, need to install via `npm install -g whistle`)
 * @throws {Error} Throws when calling `api.network.getStatus()` fails (e.g., whistle or whistle client service is not started)
 * @throws {Error} Throws when Whistle version is below 2.10.7, with error message 'Whistle version must be >= 2.10.7'
 *
 * @example
 * try {
 *   const api = await loadApi();
 *   // Use api.network.getStatus() etc.
 * } catch (err) {
 *   console.error('Failed to load Whistle API:', err.message);
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
 * @abstract Checks whether HTTPS proxy is currently enabled in Whistle
 * @function isEnabledHTTPS
 * @description
 * Uses the Whistle API to check if the current proxy has HTTPS proxy enabled.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @returns {Promise<boolean>} Whether HTTPS proxy is currently enabled
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.isEnabledHTTPS()` call fails
 *
 * @example
 * try {
 *   const enabled = await isEnabledHTTPS();
 *   console.log(`HTTPS proxy enabled: ${enabled}`);
 * } catch (err) {
 *   console.error('Failed to check HTTPS proxy status:', err.message);
 * }
 */
const isEnabledHTTPS = async () => {
  const api = await loadApi();
  return await api.isEnabledHTTPS();
};

/**
 * @async Sets whether Whistle enables HTTPS proxy
 * @function setEnableHTTPS
 * @description
 * Uses the Whistle API to set whether the current proxy enables HTTPS proxy.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {boolean} enable - Whether to enable HTTPS proxy
 * @returns {Promise<void>} No return value, resolves on success
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.setEnableHTTPS()` call fails
 *
 * @example
 * try {
 *   await setEnableHTTPS(true);
 *   console.log('Successfully set HTTPS proxy enable state');
 * } catch (err) {
 *   console.error('Failed to set HTTPS proxy state:', err.message);
 * }
 */
const setEnableHTTPS = async (enable) => {
  const api = await loadApi();
  await api.setEnableHTTPS(enable);
};

/**
 * @async Gets Whistle's root certificate information
 * @function getRootCA
 * @description
 * Uses the Whistle API to retrieve the current proxy's root certificate information, including certificate content, private key, etc.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @returns {Promise<Buffer>} Returns a Buffer object of the root certificate, which can be saved as a .crt file or used for other operations
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.getRootCA()` call fails
 */
const getRootCA = async () => {
  const api = await loadApi();
  return await api.getRootCA();
};

/**
 * @async Creates a temporary file and writes the specified content
 * @function createFile
 * @description
 * Uses the Whistle API to create a temporary file and write the given content into it.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {Buffer|string} data - The file content to create, can be Buffer or string
 * @returns {Promise<string>} Returns the created file path
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.createFile()` call fails
 *
 * @example
 * try {
 *   const filePath = await createFile('test');
 *   console.log(`Temporary file created: ${filePath}`);
 *   // Temporary file created: temp/7d2e9a424672279e5bcaab948a7a63fd47cb381626555835e828438762f86a96
 * } catch (err) {
 *   console.error('Failed to create temporary file:', err.message);
 * }
 */
const createFile = async (data) => {
  const api = await loadApi();
  return await api.createFile(data);
};

/**
 * @async Gets the content of a specified file
 * @function getFile
 * @description
 * Uses the Whistle API to read the content of a file at the given path and returns it as a string.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {string} filePath - The file path to read
 * @returns {Promise<string>} Returns the file content as a string
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.getFile()` call fails (e.g., file does not exist)
 */
const getFile = async (filePath) => {
  const api = await loadApi();
  return await api.getFile(filePath);
};

/**
 * @async Gets the current rule engine status configuration of Whistle
 * @function getRulesStatus
 * @description
 * Uses the Whistle API to retrieve the rule list, enable status, and priority policies at runtime.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @returns {Promise<{
 *   laterRulesFirst: boolean,   // Whether "later rules first" strategy is enabled (later matched rules override earlier ones)
 *   multiSelect: boolean,       // Whether multi-select mode is enabled
 *   pluginsDisabled: boolean,   // Whether all plugin rules are globally disabled
 *   disabled: boolean,          // Whether Whistle proxy is globally disabled (all rules ineffective)
 *   list: Array<{
 *     name: string,            // Rule file/configuration name
 *     selected: boolean        // Whether currently active (checked)
 *   }>
 * }>} Returns an object containing rule status and list
 *
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.rules.getStatus()` call fails
 *
 * @example
 * try {
 *   const { list, disabled, multiSelect, laterRulesFirst } = await getRulesStatus();
 *   const activeRules = list.filter(r => r.selected);
 *   console.log(`Active rules (${activeRules.length}):`, activeRules.map(r => r.name));
 * } catch (err) {
 *   console.error('Failed to get rule status:', err.message);
 * }
 */
const getRulesStatus = async () => {
  const api = await loadApi();
  return await api.rules.getStatus();
};

/**
 * @async Turns off Whistle rule engine globally
 * @function turnOffRules
 * @description
 * Uses the Whistle API to globally disable all rules (excluding plugin rules).
 * This operation takes effect immediately, affecting all request handling in the current proxy session.
 * Depends on `loadApi()` to load the API module; fails if Whistle service is not running or version is incompatible.
 *
 * @returns {Promise<void>} No return value, resolves on success
 *
 * @throws {Error} Whistle API loading failure (e.g., `w2` command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not started or `api.rules.turnOff()` call fails (e.g., network error)
 *
 * @example
 * try {
 *   await turnOffRules();
 *   console.log('Rules turned off, requests will no longer be affected by Whistle rules');
 * } catch (err) {
 *   console.error('Failed to turn off rules:', err.message);
 *   // Can fallback or retry based on error type
 * }
 */
const turnOffRules = async () => {
  const api = await loadApi();
  await api.rules.turnOff();
};

/**
 * @async Turns on Whistle rule engine globally
 * @function turnOnRules
 * @description
 * Uses the Whistle API to globally enable all previously configured rules (excluding plugin rules).
 * This operation takes effect immediately, restoring rule processing logic for proxy requests.
 * Depends on `loadApi()` to load the API module; fails if Whistle service is not running or version is incompatible.
 *
 * @returns {Promise<void>} No return value, resolves on success
 *
 * @throws {Error} Whistle API loading failure (e.g., `w2` command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not started or `api.rules.turnOn()` call fails (e.g., network error)
 *
 * @example
 * try {
 *   await turnOnRules();
 *   console.log('Rules enabled, requests will be processed according to configured rules');
 * } catch (err) {
 *   console.error('Failed to enable rules:', err.message);
 *   // Can fallback or retry based on error type
 * }
 */
const turnOnRules = async () => {
  const api = await loadApi();
  await api.rules.turnOn();
};

/**
 * @async Selects (activates) a specified Whistle rule file and automatically enables rule engine
 * @function selectRule
 * @description
 * Calls the Whistle API to select a rule file with the given name (typically from the rule list).
 * If selection succeeds (returns truthy), it automatically calls `turnOnRules()` to enable the global rule engine,
 * making the rule effective immediately. Depends on `loadApi()` to load the API module.
 *
 * @param {string} ruleName - The name of the rule file to activate (must exactly match a name in the rule list)
 *
 * @returns {Promise<boolean>} Whether the ruleName exists
 *
 * @throws {Error} Whistle API loading failure (e.g., `w2` command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not started or `api.rules.select()` call fails (e.g., network error)
 * @throws {Error} Throws if enabling rule engine (`turnOnRules()`) fails after successful selection
 *
 * @example
 * try {
 *   await selectRule('dev-rules');
 *   console.log('Rule "dev-rules" selected and enabled');
 * } catch (err) {
 *   console.error('Operation failed:', err.message);
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
 * @async Deselects (deactivates) a specified Whistle rule file
 * @function unselectRule
 * @description
 * Calls the Whistle API to deselect a rule file with the given name (typically from the rule list).
 * Depends on `loadApi()` to load the API module.
 *
 * @param {string} ruleName - The name of the rule file to deactivate (must exactly match a name in the rule list; if omitted, deselects all rules)
 *
 * @returns {Promise<boolean>} Whether the ruleName exists
 *
 * @throws {Error} Whistle API loading failure (e.g., `w2` command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not started or `api.rules.unselect()` call fails (e.g., network error)
 *
 * @example
 * try {
 *   await unselectRule('dev-rules');
 *   console.log('Rule "dev-rules" deselected');
 * } catch (err) {
 *   console.error('Operation failed:', err.message);
 * }
 */
const unselectRule = async (ruleName) => {
  const api = await loadApi();
  const result = await api.rules.unselect(ruleName);
  await result;
};

/**
 * @async Gets the content details of a specified rule file
 * @function getRule
 * @description
 * Uses the Whistle API to read the content of a rule file with the given name, returning its detailed configuration.
 * Depends on `loadApi()` to load the API module.
 *
 * @param {string} ruleName - The name of the rule file (must exactly match a name in the Whistle rule list)
 *
 * @returns {Promise<{
 *   value: string,       // Rule content (e.g., "* www.example.com 127.0.0.1")
 *   selected: boolean,     // Whether currently selected
 * }>} Returns the rule object; fields may vary by Whistle version
 *
 * @throws {Error} Whistle API loading failure (e.g., `w2` command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not started or `api.rules.get()` call fails (e.g., rule name does not exist)
 *
 * @example
 * try {
 *   const rule = await getRule('my-rules');
 *   console.log(`Rule content:\n${rule.value}`);
 *   if (rule.selected) {
 *     console.log('This rule is currently active');
 *   }
 * } catch (err) {
 *   console.error('Failed to get rule:', err.message);
 * }
 */
const getRule = async (ruleName) => {
  const api = await loadApi();
  return await api.rules.get(ruleName);
};

/**
 * @async Gets the current Whistle rule list
 * @function getRuleList
 * @description
 * Uses the Whistle API to retrieve all configured rule files, including each rule's name, content, and activation status.
 * Depends on `loadApi()` to load the API module.
 *
 * @returns {Promise<Array<{
 *   name: string,      // Rule file name
 *   value: string,     // Rule content (e.g., "* www.example.com 127.0.0.1")
 *   selected: boolean  // Whether currently selected (active)
 * }>>} Returns an array of rule objects; may return empty array if none
 *
 * @throws {Error} Whistle API loading failure (e.g., `w2` command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not started or `api.rules.getList()` call fails (e.g., network error)
 *
 * @example
 * try {
 *   const rules = await getRuleList();
 *   console.log(`Total ${rules.length} rules`);
 *   const activeRules = rules.filter(r => r.selected);
 *   console.log(`Active rules (${activeRules.length}):`, activeRules.map(r => r.name));
 * } catch (err) {
 *   console.error('Failed to get rule list:', err.message);
 * }
 */
const getRuleList = async () => {
  const api = await loadApi();
  return await api.rules.getList();
};

/**
 * @async Checks whether Whistle has multi-select mode enabled
 * @function isMultiSelect
 * @description
 * Uses the Whistle API to check if the rule engine has multi-select mode enabled.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @returns {Promise<boolean>} Whether multi-select mode is currently enabled
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.rules.isMultiSelect()` call fails
 *
 * @example
 * try {
 *   const multiSelect = await isMultiSelect();
 *   console.log(`Multi-select mode enabled: ${multiSelect}`);
 * } catch (err) {
 *   console.error('Failed to check multi-select mode status:', err.message);
 * }
 */
const isMultiSelect = async () => {
  const api = await loadApi();
  return await api.rules.isMultiSelect();
};

/**
 * @async Sets whether Whistle rule engine enables multi-select mode
 * @function setMultiSelect
 * @description
 * Uses the Whistle API to set whether the rule engine enables multi-select mode.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {boolean} enable - Whether to enable multi-select mode
 * @returns {Promise<void>} No return value, resolves on success
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.rules.setMultiSelect()` call fails
 *
 * @example
 * try {
 *   await setMultiSelect(true);
 *   console.log('Multi-select mode enabled');
 * } catch (err) {
 *   console.error('Failed to set multi-select mode:', err.message);
 * }
 */
const setMultiSelect = async (enable) => {
  const api = await loadApi();
  await api.rules.setMultiSelect(enable);
};

/**
 * @async Sets whether Whistle rule engine enables "later rules first"
 * @function setLaterRulesFirst
 * @description
 * Uses the Whistle API to set whether the rule engine enables the "later rules first" policy.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {boolean} enable - Whether to enable later rules first
 * @returns {Promise<void>} No return value, resolves on success
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.rules.setLaterRulesFirst()` call fails
 *
 * @example
 * try {
 *   await setLaterRulesFirst(true);
 *   console.log('Later rules first enabled');
 * } catch (err) {
 *   console.error('Failed to set later rules first:', err.message);
 * }
 */
const setLaterRulesFirst = async (enable) => {
  const api = await loadApi();
  await api.rules.setLaterFirst(enable);
};

/**
 * @async Adds a new rule file to Whistle rule engine
 * @function addRule
 * @description
 * Uses the Whistle API to add a new rule file, with an option to immediately select (activate) it.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {string} name - Rule name
 * @param {string} value - Rule content
 * @param {boolean} selected - Whether to select it
 * @returns {Promise<void>} No return value, resolves on success
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.rules.add()` call fails
 *
 * @example
 * try {
 *   await addRule('my-rule', '* www.example.com 127.0.0.1', true);
 *   console.log('Rule added');
 * } catch (err) {
 *   console.error('Failed to add rule:', err.message);
 * }
 */
const addRule = async (name, value, selected) => {
  const api = await loadApi();
  await api.rules.add(name, value, selected);
};

/**
 * @async Moves the specified rule file to the top of the rule list
 * @function moveRuleToTop
 * @description
 * Uses the Whistle API to move the specified rule file to the top of the rule list.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {string} ruleName - The name of the rule file (must exactly match a name in the rule list)
 * @returns {Promise<void>} No return value, resolves on success
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.rules.moveToTop()` call fails
 *
 * @example
 * try {
 *   await moveRuleToTop('my-rule');
 *   console.log('Rule moved to top');
 * } catch (err) {
 *   console.error('Failed to move rule:', err.message);
 * }
 */
const moveRuleToTop = async (ruleName) => {
  const api = await loadApi();
  await api.rules.moveToTop(ruleName);
};

/**
 * @async Gets the list of Whistle Values
 * @function getValueList
 * @description
 * Uses the Whistle API to retrieve the current list of configured Values, returning each Value's name and value.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @returns {Promise<Array<{ name: string, value: string }>>} Returns an array of Value objects; may return empty array if none
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.values.getList()` call fails
 *
 * @example
 * try {
 *   const values = await getValueList();
 *   console.log(`Total ${values.length} Values`);
 *   values.forEach(v => console.log(`${v.name}: ${v.value}`));
 * } catch (err) {
 *   console.error('Failed to get Values list:', err.message);
 * }
 */
const getValueList = async () => {
  const api = await loadApi();
  return await api.values.getList();
};

/**
 * @async Gets a specified Value
 * @function getValue
 * @description
 * Uses the Whistle API to retrieve a specified Value.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {string} name - The name of the Value
 * @returns {Promise<{ name: string, value: string }>} Returns the Value object, or `null`/`undefined` if not found
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.values.get()` call fails
 *
 * @example
 * try {
 *   const value = await getValue('my-value');
 *   console.log(`${value.name}: ${value.value}`);
 * } catch (err) {
 *   console.error('Failed to get Value:', err.message);
 * }
 */
const getValue = async (name) => {
  const api = await loadApi();
  return await api.values.get(name);
};

/**
 * @async Adds a new Value
 * @function addValue
 * @description
 * Uses the Whistle API to add a new Value.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {string} name - The name of the Value
 * @param {string} value - The value of the Value
 * @returns {Promise<void>} No return value, resolves on success
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.values.add()` call fails
 *
 * @example
 * try {
 *   await addValue('my-value', 'some-value');
 *   console.log('Value added');
 * } catch (err) {
 *   console.error('Failed to add Value:', err.message);
 * }
 */
const addValue = async (name, value) => {
  const api = await loadApi();
  await api.values.add(name, value);
};

/**
 * @async Gets the status information of Whistle plugins
 * @function getPluginsStatus
 * @description
 * Uses the Whistle API to retrieve the status of currently installed plugins, including each plugin's name, enable status, etc.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @returns {Promise<Array<{ name: string, moduleName: string, version: string, selected: boolean }>>} Returns an array of plugin status objects; may return empty array if none
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.plugins.getStatus()` call fails
 *
 * @example
 * try {
 *   const plugins = await getPluginsStatus();
 *   console.log(`Total ${plugins.length} plugins`);
 *   plugins.forEach(p => console.log(`${p.name}: ${p.selected ? 'Enabled' : 'Disabled'}`));
 * } catch (err) {
 *   console.error('Failed to get plugin status:', err.message);
 * }
 */
const getPluginsStatus = async () => {
  const api = await loadApi();
  return await api.plugins.getStatus();
};

/**
 * @async Enables all Whistle plugins
 * @function turnOnPlugins
 * @description
 * Uses the Whistle API to enable all installed plugins.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @returns {Promise<void>} No return value, resolves on success
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.plugins.turnOn()` call fails
 *
 * @example
 * try {
 *   await turnOnPlugins();
 *   console.log('All plugins enabled');
 * } catch (err) {
 *   console.error('Failed to enable plugins:', err.message);
 * }
 */
const turnOnPlugins = async () => {
  const api = await loadApi();
  await api.plugins.turnOn();
};

/**
 * @async Disables all Whistle plugins
 * @function turnOffPlugins
 * @description
 * Uses the Whistle API to disable all installed plugins.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @returns {Promise<void>} No return value, resolves on success
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.plugins.turnOff()` call fails
 *
 * @example
 * try {
 *   await turnOffPlugins();
 *   console.log('All plugins disabled');
 * } catch (err) {
 *   console.error('Failed to disable plugins:', err.message);
 * }
 */
const turnOffPlugins = async () => {
  const api = await loadApi();
  await api.plugins.turnOff();
};

/**
 * @async Gets the list of Whistle plugins
 * @function getPluginList
 * @description
 * Uses the Whistle API to retrieve all currently installed plugins, including plugin metadata, version, description, rule configuration, and activation status.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @returns {Promise<Array<{
 *   moduleName: string,          // Plugin module name (e.g., 'whistle.inspect')
 *   name: string,                // Plugin short name (e.g., 'inspect')
 *   mtime: number,               // Plugin last modification time (Unix milliseconds timestamp)
 *   version: string,             // Plugin version (e.g., '2.3.0')
 *   description: string,         // Plugin description
 *   homepage: string,            // Plugin homepage URL
 *   rules: string,               // Custom rule content (may be empty)
 *   _rules: string,              // Internal rule expression (usually contains dynamic replacement logic)
 *   resRules: string,            // Response rule content (may be empty)
 *   selected: boolean            // Whether the plugin is currently enabled
 * }>>} Returns an array of plugin objects; returns empty array if no plugins
 *
 * @throws {Error} Whistle API loading failure (e.g., `w2` command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.plugins.getList()` call fails
 *
 * @example
 * try {
 *   const plugins = await getPluginList();
 *   console.log(`Total ${plugins.length} plugins`);
 *   plugins.forEach(p => {
 *     console.log(`${p.name} (${p.version}): ${p.selected ? 'Enabled' : 'Disabled'}`);
 *     console.log(`  Description: ${p.description}`);
 *   });
 * } catch (err) {
 *   console.error('Failed to get plugin list:', err.message);
 * }
 */
const getPluginList = async () => {
  const api = await loadApi();
  return await api.plugins.getList();
};

/**
 * @async Gets a specified Whistle plugin
 * @function getPlugin
 * @description
 * Uses the Whistle API to retrieve a specified plugin's information.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {string} name - The name of the plugin
 * @returns {Promise<{
 *   moduleName: string,          // Plugin module name (e.g., 'whistle.inspect')
 *   name: string,                // Plugin short name (e.g., 'inspect')
 *   mtime: number,               // Plugin last modification time (Unix milliseconds timestamp)
 *   version: string,             // Plugin version (e.g., '2.3.0')
 *   description: string,         // Plugin description
 *   homepage: string,            // Plugin homepage URL
 *   rules: string,               // Custom rule content (may be empty)
 *   _rules: string,              // Internal rule expression (usually contains dynamic replacement logic)
 *   resRules: string,            // Response rule content (may be empty)
 *   selected: boolean            // Whether the plugin is currently enabled
 * }>} Returns the plugin object, or `null`/`undefined` if not found
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.plugins.get()` call fails
 *
 * @example
 * try {
 *   const plugin = await getPlugin('my-plugin');
 *   console.log(`${plugin.name}: ${plugin.selected ? 'Enabled' : 'Disabled'}`);
 * } catch (err) {
 *   console.error('Failed to get plugin:', err.message);
 * }
 */
const getPlugin = async (name) => {
  const api = await loadApi();
  return await api.plugins.get(name);
};

/**
 * @async Selects a specified Whistle plugin
 * @function selectPlugin
 * @description
 * Uses the Whistle API to select a specified plugin.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {string} name - The name of the plugin
 * @returns {Promise<boolean>} Returns selection result; `true` on success, `false` on failure
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.plugins.select()` call fails
 *
 * @example
 * try {
 *   const result = await selectPlugin('my-plugin');
 *   if (result) {
 *     console.log('Plugin selected and enabled');
 *   } else {
 *     console.log('Plugin selection failed, may not exist');
 *   }
 * } catch (err) {
 *   console.error('Failed to select plugin:', err.message);
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
 * @async Deselects a specified Whistle plugin
 * @function unselectPlugin
 * @description
 * Uses the Whistle API to deselect a specified plugin.
 * Depends on `loadApi()` to load the API module; throws if loading fails or version is too low.
 *
 * @param {string} name - The name of the plugin
 * @returns {Promise<boolean>} Returns deselect result; `true` on success, `false` on failure
 * @throws {Error} Whistle API loading failure (e.g., w2 command unavailable, module load error)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not running or `api.plugins.unselect()` call fails
 *
 * @example
 * try {
 *   const result = await unselectPlugin('my-plugin');
 *   if (result) {
 *     console.log('Plugin deselected and disabled');
 *   } else {
 *     console.log('Plugin deselect failed, may not exist');
 *   }
 * } catch (err) {
 *   console.error('Failed to deselect plugin:', err.message);
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
 * @async Retrieves captured session data (supports automatic pagination)
 * @function getSessions
 * @description
 * Used to retrieve HTTP/WebSocket capture records based on various filters such as cursor, time, resource type, URL keyword, request method, status code, and request/response headers.
 *
 * **Filter Logic**:
 * - All non-empty conditions are combined with **AND** (must all be satisfied);
 * - For `method` and `statusCode`, multiple values are combined with **OR** (any match satisfies);
 * - `latest` has the highest priority; if `true`, count is limited to at most 120 latest records;
 * - If both `startId` and `startTime` are provided, the system uses the later one as the starting point in the **first request**, subsequent pagination uses only `startId` (`startTime` is automatically cleared);
 * - `reqHeader` and `resHeader` are objects that support substring matching on header field names and values.
 *
 * **Pagination Mechanism**:
 * - Each request pulls at most 120 records from the Whistle service (API limit). The function **automatically loops pagination** until the specified `count` is satisfied or the end of data is reached.
 * - The pagination cursor automatically uses the `id` of the last record in the previous page as the `startId` for the next page, and clears `startTime` to ensure subsequent pagination uses only the cursor.
 * - If `latest=true`, only one request is made, returning the most recent records (up to 120), ignoring `count` and any cursor/time parameters.
 * - **Important Limitation**: Since Whistle API's `startId` uses a "**greater than**" semantics (i.e., can only scroll to later times), **if `startId` or `startTime` is not provided**, the function will start from the newest data and **can only get the first page (up to 120 records)**. Subsequent requests to get newer data will usually be empty. To retrieve a large amount of historical data, you should obtain an earlier `startId` as the starting point through other means.
 *
 * @param {Object} options - Configuration object
 * @param {number} [options.count=3600] - Maximum number of records expected. Actual returned count ≤ this value and is limited by the per-page limit of 120 and actual data availability. If `latest=true`, this parameter is ignored.
 * @param {boolean} [options.latest=false] - Whether to fetch only the latest records.
 *                                           - `true`: Only one request, returns the newest records (up to 120);
 *                                           - `false`: Used with `startId` or `startTime` for incremental pulling, automatically paginating until `count` is met or end of data.
 * @param {string|number} [options.startId] - Cursor ID (usually an auto-increment primary key or unique sequence, format like `"1784905385300-003"`).
 *                                            Fetches records with ID **greater than** this value (i.e., newer data).
 *                                            If both `startTime` and `startId` are provided, the first request uses the one closer to the newest data as the starting point; subsequent pagination uses only `startId`.
 * @param {number} [options.startTime] - Start timestamp (Unix milliseconds).
 *                                        Fetches records with generation time **greater than** this value.
 *                                        Only effective in the first request (if `startId` is also provided, the newer one is used); cleared in subsequent pagination.
 * @param {string} [options.type] - Resource type filter, same as the filter options in the Network panel (case-insensitive).
 *                                   Supports the following enum values (any other string means no filter):
 *                                  - `JSON`: JSON requests/responses
 *                                  - `HTML`: HTML documents
 *                                  - `CSS`: Stylesheets
 *                                  - `JS`: JavaScript scripts
 *                                  - `Font`: Font files
 *                                  - `Img`: Image resources
 *                                  - `Media`: Audio/Video media
 *                                  - `WS`: WebSocket frames
 *                                  - `Tunnel`: Tunnel connections (e.g., WebSocket upgrades)
 *                                  - `Wasm`: WebAssembly modules
 *                                  - `Mock`: Mock data
 *                                  - `Rules`: Requests matching rules
 *                                  - `Import`: Imported data
 *                                  - `Composer`: Requests sent via Composer
 *                                  - `Error`: Error requests (status code >= 400, captureError, interrupted requests, etc.)
 *                                  - `captureError`: Tunnel requests that failed to parse HTTPS
 * @param {string} [options.subUrl] - Requests whose URL contains this substring (case-insensitive).
 *                                     Example `"/api/user"` matches all URLs containing that path.
 * @param {string|string[]} [options.method] - HTTP request method, supports multiple (array or comma-separated string like `"GET,POST"`, case-insensitive).
 *                                              Matches if any method is satisfied.
 * @param {number|number[]} [options.statusCode] - HTTP response status code, supports multiple (array or comma-separated string like `"200,404"`).
 *                                                  Matches if any status code is satisfied.
 * @param {Object} [options.reqHeader] - Request header filter condition.
 * @param {string} options.reqHeader.name - Request header field name (e.g., `"X-Request-Id"`, case-insensitive).
 * @param {string} [options.reqHeader.subValue] - Optional, substring that the request header value must contain (case-insensitive).
 *                                                 If not provided, merely requiring the existence of the header field (regardless of value) is sufficient.
 * @param {Object} [options.resHeader] - Response header filter condition.
 * @param {string} options.resHeader.name - Response header field name (e.g., `"Content-Type"`, case-insensitive).
 * @param {string} [options.resHeader.subValue] - Optional, substring that the response header value must contain (case-insensitive).
 *                                                 If not provided, merely requiring the existence of the header field (regardless of value) is sufficient.
 *
 * @returns {Promise<Array<Object>>} Returns an array of captured records that match the conditions (formatted by `formatSession`).
 *                                    Each record contains the following main fields (may vary slightly due to `formatSession`):
 *                                    - `id` (string): Unique record identifier, format `"timestamp-sequence"` (e.g., `"1785144349945-573"`)
 *                                    - `startTime` (number): Request start timestamp (Unix milliseconds)
 *                                    - `url` (string): Full request URL
 *                                    - `req` (Object): Request details
 *                                      - `method` (string): Request method
 *                                      - `ip` (string): Client IP
 *                                      - `port` (string): Client port
 *                                      - `headers` (Object): Request headers key-value pairs
 *                                      - `json` (Object): Parsed JSON request body (if exists)
 *                                      - `body` (string): Raw request body (may be empty)
 *                                      - `raw` (string): Raw request data
 *                                    - `res` (Object): Response details
 *                                      - `ip` (string): Server IP
 *                                      - `port` (string): Server port
 *                                      - `statusCode` (number): HTTP status code
 *                                      - `headers` (Object): Response headers key-value pairs
 *                                      - `json` (Object): Parsed JSON response body (if exists)
 *                                      - `body` (string): Raw response body (may be empty)
 *                                      - `raw` (string): Raw response data
 *                                    - `timings` (Object): Timing breakdown (milliseconds)
 *                                      - `start` (number): Request start timestamp (relative to some base)
 *                                      - `ttfb` (number | null): Time to first byte
 *                                      - `dns` (number | null): DNS resolution time
 *                                      - `connect` (number | null): TCP connect time (from DNS end to connect)
 *                                      - `request` (number | null): Request sending time (from DNS end to request end)
 *                                      - `response` (number | null): Response receiving time (from request end to response headers)
 *                                      - `download` (number | null): Download time (from response headers to response body completion)
 *                                      - `total` (number | null): Total time
 *                                    - `rules` (Object): Matched rule object
 *                                    - `rawRules` (string): Raw rule string
 *                                    - `version` (string): Whistle version
 *                                    - `nodeVersion` (string): Node.js version
 *                                    - `dnsTime` (number): DNS completion timestamp
 *                                    - `requestTime` (number): Request send completion timestamp
 *                                    - `connectTime` (number): Connection establishment completion timestamp
 *                                    - `responseTime` (number): Response header completion timestamp
 *                                    - `endTime` (number): Request end timestamp
 *
 * @throws {Error} Whistle API loading failure (e.g., `w2` command unavailable, module load error; ensure whistle is installed globally)
 * @throws {Error} Whistle version below 2.10.7
 * @throws {Error} Whistle service not started or `api.network.getSessions()` call fails (e.g., network error, parameter error)
 * @throws {Error} Underlying API call may throw other runtime errors (e.g., timeout, data format anomaly)
 *
 * @example
 * // Incremental pull using cursor (up to 100 records)
 * const sessions = await getSessions({ startId: '1784905385300-003', count: 100 });
 *
 * @example
 * // Get latest JSON type records (up to 120)
 * const sessions = await getSessions({ latest: true, type: 'JSON' });
 *
 * @example
 * // Combined filters: GET requests with status code 200 or 304, URL contains "/v1", and require a specific request header
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
 * @async Retrieves WebSocket/Socket frame data (supports automatic pagination)
 * @function getFrames
 * @description
 * Retrieves WebSocket/Socket communication frames for a specified connection (identified by `reqId`), supporting filtering by cursor, time, and direction.
 *
 * **Filter Logic**:
 * - The `from` parameter filters frame direction: `client` (client→server), `server` (server→client); if omitted, returns all directions.
 * - `latest` has highest priority; if `true`, count is limited to 120.
 * - If both `startId` and `startTime` are provided, the system uses the later one as the starting point in the **first request**, subsequent pagination uses only `startId` (`startTime` is cleared).
 *
 * **Pagination Mechanism**:
 * - Each request pulls at most 120 frame records from the Whistle service (API limit). The function **automatically loops pagination** until the specified `count` is satisfied or the end of frames is reached.
 * - The pagination cursor automatically uses the `frameId` of the last frame in the previous page as the `startId` for the next page, and clears `startTime` to ensure subsequent pagination uses only the cursor.
 * - If `latest=true`, only one request is made, returning the newest frames (up to 120), ignoring `count`.
 * - **Important Limitation**: Since Whistle API's `startId` uses "**greater than**" semantics (i.e., can only scroll to later times), **if `startId` or `startTime` is not provided**, the function starts from the newest frames and **can only get the first page (up to 120)**. Subsequent requests to get newer frames will usually be empty. To retrieve a large number of historical frames, you should obtain an earlier `startId` as the starting point through other means.
 *
 * @param {Object} options - Configuration object
 * @param {string} options.reqId - Session ID, corresponding to the `id` field of a capture record, used to associate frames with the connection
 * @param {number} [options.count=3600] - Maximum number of frames expected. Actual returned count ≤ this value and is limited by per-page limit of 120 and actual frame count. If `latest=true`, this parameter is ignored.
 * @param {boolean} [options.latest=false] - Whether to fetch only the latest frames.
 *                                           - `true`: Only one request, returns the newest frames (up to 120);
 *                                           - `false`: Used with `startId` or `startTime` for incremental pull, automatically paginating until `count` is met or end of data.
 * @param {string|number} [options.startId] - Cursor ID (unique frame sequence number), fetches frames with frame ID **greater than** this value (i.e., newer frames).
 *                                             If both `startTime` and `startId` are provided, the first request uses the one closer to the newest data as the starting point; subsequent pagination uses only `startId`.
 * @param {number} [options.startTime] - Start timestamp (Unix milliseconds), fetches frames with generation time **greater than** this value.
 *                                        Only effective in the first request (if `startId` is also provided, the newer one is used); cleared in subsequent pagination.
 * @param {string} [options.from] - Frame direction filter (case-insensitive):
 *                                   - `'client'`: only frames from client→server
 *                                   - `'server'`: only frames from server→client
 *                                   - If omitted or any other value, returns all frames for that connection
 *
 * @returns {Promise<Array<Object>>} Returns an array of frame data that matches the conditions (formatted by `formatFrame`).
 *                                    Each frame contains the following main fields:
 *                                    - `reqId` (string): Associated session ID, corresponding to the capture record's `id`
 *                                    - `frameId` (string): Unique identifier for the frame data (can be used as cursor)
 *                                    - `mask` (boolean): Whether the frame is masked (WebSocket mask)
 *                                    - `compressed` (boolean): Whether the frame data is compressed
 *                                    - `length` (number): Original length of frame data (bytes)
 *                                    - `opcode` (number): Frame opcode; `1` for text frame, `2` for binary frame
 *                                    - `base64` (string): Base64-encoded frame data (for binary or large text)
 *                                    - `body` (string): Decoded frame content (text or readable string)
 *                                    - `json` (Object): If frame data is JSON, parsed object; otherwise empty object `{}`
 *
 * @throws {Error} Depends on `loadApi` possible errors (e.g., Whistle not installed, version too low, service not started)
 * @throws {Error} Underlying `api.network.getFrames()` call fails (e.g., `reqId` not found, parameter error, network error)
 *
 * @example
 * // Incremental pull using cursor, get first 10 frames from client
 * const frames = await getFrames({
 *   reqId: '1784885309943-086',
 *   startId: '1784903620142-000',
 *   startTime: 1784903620156,
 *   count: 10,
 *   from: 'client'
 * });
 *
 * @example
 * // Get latest frames (up to 120)
 * const frames = await getFrames({
 *   reqId: '1784885309943-086',
 *   latest: true
 * });
 *
 * @example
 * // Pull all subsequent frames from a given cursor (until latest)
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
