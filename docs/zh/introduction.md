# 介绍
[![NPM version](https://img.shields.io/npm/v/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square)](http://nodejs.org/download/)
[![build status](https://img.shields.io/travis/avwo/whistle.svg?style=flat-square)](https://travis-ci.org/avwo/whistle)
[![Test coverage](https://codecov.io/gh/avwo/whistle/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/whistle)
[![License](https://img.shields.io/npm/l/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)

whistle(读音`ˈwɪsəl`，拼音`wēisǒu`)是基于Node实现的跨平台抓包调试代理工具。

![whistle示例图]()

具有以下特点：

1. **完全跨平台：** 可以安装在任何支持Node的桌面或命令行系统
2. **可远程操作：** 操作界面由web实现，支持通过浏览器远程访问操作
3. **界面友好：** 界面功能充分考虑web开发需要，尽可能供满足一般web开发所需
4. **操作简单：** 所有操作基本上都支持通过简单配置(类似设置系统hosts)即可实现复杂的功能
5. **功能强大：** 基本包含抓包调试代理可以做的任何功能，支持通过配置修改请求的任何数据，且内置移动端页面及小程序调试工具等
6. **配置灵活：** 支持通过域名、路径、正则、通配符等方式匹配请求的URL、请求clientIP、请求头、请求内容，且支持通过正则子匹配或模板字符串的方式在规则里面动态注入请求相关数据等
6. **性能稳定：** 用whistle部署的公共服务，整个部门100多号人频繁使用，稳定运行上千小时，且内存占用小
7. **支持扩展：** 支持通过Node扩展功能，易扩展，且可扩展性强


基本功能如下：

1. 查看HTTP/HTTPS/WebSocket/Socket请求数据
2. 设置hosts、上游HTTP/HTTPS/SOCKS代理
3. 作为HTTP代理或反向代理
4. 修改请求的URL、方法、头部、内容等
5. 修改响应状态码、头部、内容等
6. 修改WebSocket/Socket收发的数包
7. 内置weinre及log平台方便调试移动端页面
8. 支持通过插件无限扩展功能
