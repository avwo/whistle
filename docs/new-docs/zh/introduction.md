# 介绍
[![NPM version](https://img.shields.io/npm/v/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square)](http://nodejs.org/download/)
[![build status](https://img.shields.io/travis/avwo/whistle.svg?style=flat-square)](https://travis-ci.org/avwo/whistle)
[![Test coverage](https://codecov.io/gh/avwo/whistle/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/whistle)
[![License](https://img.shields.io/npm/l/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)

whistle(读音`ˈwɪsəl`，拼音`wēisǒu`)是基于Node实现的跨平台抓包调试代理工具，采用配置方式修改请求响应，支持构造HTTP/HTTPS/WebSocket/TCP请求，内置weinre及远程log平台等功能方便移动端开发调试等，具有以下特点：

1. **完全跨平台：** 可以安装在任何支持Node的桌面及命令行系统
2. **可远程操作：** 操作界面由web实现，支持通过浏览器远程抓包及操作
3. **界面友好：** 界面充分考虑web开发需要，尽可能实现满足web开发所需功能
4. **操作简单：** 所有操作都支持通过简单配置实现(系统hosts配置的超集)
5. **配置灵活：** 支持通过域名、路径、正则、通配符等匹配方式，可以匹配URL、clientIP、serverIP、请求响应头、请求方法、响应状态码、请求内容等等，且支持通过正则子匹配或模板字符串的方式在规则里面动态注入请求相关数据
6. **功能强大：** 支持通过配置修改请求响应的**任何数据**，并支持修改构造WebSocket/Socket请求数据包、及限速、延迟请求响应等等，且内置移动端页面及小程序调试工具
7. **性能稳定：** 用whistle部署的公共服务，整个部门(超过200人)频繁使用，稳定运行上千小时没出现Crash，且内存占用小
8. **支持扩展：** 支持通过Node扩展功能，可以动态组合各种配置简化复杂操作或自定义请求服务实现具体业务所需功能(如集成本地的combo服务)

![whistle示例图]()

基本功能如下：

1. 查看 HTTP/HTTPS/WebSocket/Socket 抓包数据
2. 设置hosts、上游 HTTP/HTTPS/SOCKS 代理
3. 作为HTTP代理或反向代理
4. 修改或构造请求的URL、方法、头部、内容等
5. 修改或构造响应状态码、头部、内容等
6. 修改或构造 WebSocket/Socket 收发的数包
7. 内置weinre及log平台方便调试移动端页面
8. 支持插件无限扩展功能
