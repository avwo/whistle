<p align="center">
  <a href="https://avwo.github.io/whistle/">
    <img alt="whistle logo" src="https://raw.githubusercontent.com/avwo/whistle/master/biz/webui/htdocs/img/whistle.png">
  </a>
</p>

# whistle
[![NPM version](https://img.shields.io/npm/v/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square)](http://nodejs.org/download/)
[![build status](https://img.shields.io/travis/avwo/whistle.svg?style=flat-square)](https://travis-ci.org/avwo/whistle)
[![Test coverage](https://codecov.io/gh/avwo/whistle/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/whistle)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/npm/l/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)

Whistle 是基于 Node 实现的跨平台抓包调试工具，其主要特点：
1. 完全跨平台：支持 Mac、Windows 等桌面系统，且支持部署在服务端等命令行系统
2. 功能强大
	* 支持抓包及修改 HTTP、HTTPS、HTTP2、WebSocket、TCP 请求
	* 支持重放及构造 HTTP、HTTPS、HTTP2、WebSocket、TCP 请求
	* 支持用 Node 开发插件组合现有功能或扩展功能，也可以作为独立 npm 包引用
3. 操作简单
	* 可以直接用浏览器查看抓包、修改请求
	* 所有修改操作都可以通过类似配置 Hosts 的方式实现，并支持分组管理
	* 支持项目自带代理规则配置，并支持一键设置到本地 Whistle 代理

# 一键安装
1. 安装 Node（建议安装**最新的 LTS 版本**，如已安装忽略此步骤）：https://nodejs.org/
2. 一键安装命令：
	``` sh
	npm i -g whistle && w2 start --init
	```
	> 上述命令会先全局安装 Whistle 的 npm 包后，启动 Whistle 并设置系统全局代理，以及安装系统根证书，目前一键安装只支持 Mac & WIndows 系统，其它系统按照下面 **手动安装** 的方式操作。
3. 一键安装过程中注意事项：
	* Mac 需要两次输入开机密码或指纹验证
	* Windows 需要最后点击 “** 是(Y)**” 确认

上述一键安装过程中出现问题或者需要自己定制（如果代理白名单等）可以通过以下命令行实现：
1. `w2 proxy` 设置系统全局代理：
2. `w2 ca` 设置系统根证书：
3. 也可以按下面的方式 **手动安装**
# 手动安装
1. 设置代理：
2. 安装根证书：

安装成功后，用 Chrome 打开链接 http://local.whistlejs.com 即可看到 Whistle 的抓包配置界面：


详细用户参见：[Whistle 帮助文档]()
# License
[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)
