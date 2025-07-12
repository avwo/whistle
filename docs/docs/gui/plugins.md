# Plugins 界面

Plugins 界面是 Whistle 的插件管理中枢，支持插件的全生命周期管理，包括安装、配置、更新和卸载等操作。

<img src="/img/plugins.png" alt="Plugins 界面" width="1000" />


## 界面基本功能



| 控件         | 功能 |
| ------------ | ---- |
| **ON**       | 关闭或打开所有插件，红色：开启中，灰色：关闭中 |
| **Install**  |  安装插件，详见下文    |
| **Checkbox** | 是否启用该插件  |
| **插件名称** |  点击打开插件管理界面 |
| **版本号**       |  点击打开插件帮助文档  |
| **Option**       |   点击打开插件管理界面   |
| **Rules**       |  打开插件自带的静态规则（`rules.txt`、`reqRules.txt`、`resRules.txt` 文件规则）  |
| **Update**       |  更新插件  |
| **Uninstall**       |  卸载插件   |
| **Help**       |  点击打开插件帮助文档   |
| **Sync**       |  同步插件里面的 Rules 和 Values  |


## 安装流程
1. 点击顶部 `Install` 按钮
2. 输入插件名称（如 `whistle.inspect`）
3. 选择 `npm registry`（默认 `--registry=https://registry.npmjs.org`）
4. 点击 `Install` 开始安装

<img width="1000" alt="install plugins" src="/img/install-plugins.png" />
