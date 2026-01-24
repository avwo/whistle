<p align="center">
  <a href="https://avwo.github.io/whistle/">
    <img alt="whistle logo" src="https://user-images.githubusercontent.com/11450939/168828068-99e38862-d5fc-42bc-b5ab-6262b2ca27d6.png">
  </a>
</p>

# whistle

[![NPM version](https://img.shields.io/npm/v/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![node version](https://img.shields.io/badge/node.js->=_8-green.svg?style=flat-square)](http://nodejs.org/download/)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/github/license/avwo/whistle?style=flat-square)](https://www.npmjs.com/package/whistle)

中文 · [English](./README-en_US.md)

Whistle（发音 /ˈwisəl/）是基于 Node.js 的跨平台网络抓包与调试工具，特点如下：
1. **功能强大**
   - 支持 HTTP、HTTPS、HTTP/2、WebSocket、TCP 的抓包与修改请求/响应
   - 支持 HTTP、HTTPS、Socks、反向代理等多种代理模式
   - 内置常用调试工具：Weinre（远程 DOM 检查）、Console（查看 console 日志）、Composer（请求重放与编辑）等
2. **操作简单**
   - 通过规则配置即可修改请求/响应
   - 提供一站式管理界面：抓包、规则、插件、Weinre/Console/Composer 等集中管理
3. **可扩展**
   - 支持插件扩展规则与界面功能
   - 可作为 NPM 模块在项目中引用
4. **跨平台**
   - 支持 macOS、Windows、Linux（Ubuntu / Fedora）等桌面系统
   - 支持无界面 Linux 服务器环境

# 安装（推荐）

桌面用户（macOS/Windows/Linux）推荐使用 Whistle 客户端：https://github.com/avwo/whistle-client

> 客户端可以免去大部分手动安装与配置步骤

# 无界面 Linux / 服务器 安装（命令行）

按以下 4 步在无界面服务器上快速部署：
1. 安装 Whistle（推荐使用 npm）
   - 需要先安装 Node.js：https://nodejs.org/
   - 安装命令：`npm i -g whistle`
      > 也支持 Homebrew：`brew install whistle`
1. 启动 Whistle
   - 命令：`w2 start`
2. 安装根证书（用于 HTTPS 抓包）
   - 命令：`w2 ca`
   - 安装过程中可能需手动确认：
      - Windows：最后选择 “是 (Y)” 确认
      - macOS：可能需要输入开机密码或 Touch ID 验证
3. 设置代理
   - 命令：`w2 proxy`
   - 设置指定 IP: `w2 proxy "10.x.x.x:8888"`
   - 关闭系统代理： `w2 proxy 0`

其它代理方式：
- 推荐：使用 Chrome 插件 ZeroOmega（便于在浏览器间切换代理）
  > Chrome 商店地址（若无法访问可手动安装）：https://chromewebstore.google.com/detail/proxy-switchyomega-3-zero/pfnededegaaopdmhkdmcofjmoldfiped
- 浏览器或开发者工具自带代理设置（例如 Firefox、微信开发者工具）
- 对于无法直接设置代理的应用，可使用 Proxifier（Windows / macOS）

# 快速上手

详细使用指南与示例请查看官方文档：https://wproxy.org/docs/getting-started.html

# 常见命令速查
- 启动：`w2 start`
- 停止：`w2 stop`
- 重启：`w2 restart`
- 查看状态：`w2 status`
- 安装证书：`w2 ca`
- 设置代理：`w2 proxy [host:port]`（`w2 proxy 0` 关闭）

# License

[MIT（详见 LICENSE 文件）](./LICENSE)

