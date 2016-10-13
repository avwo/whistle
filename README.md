<p align="center">
  <a href="https://avwo.github.io/whistle/">
    <img alt="whistle logo" src="https://github.com/avwo/whistle/blob/master/biz/webui/htdocs/img/whistle.png">
  </a>
</p>


# whistle
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square)](http://nodejs.org/download/)
[![build status](https://img.shields.io/travis/avwo/whistle.svg?style=flat-square)](https://travis-ci.org/avwo/whistle)
[![Test coverage](https://codecov.io/gh/avwo/whistle/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/whistle)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)
[![David deps](https://img.shields.io/david/avwo/whistle.svg?style=flat-square)](https://david-dm.org/avwo/whistle)
[![License](https://img.shields.io/npm/l/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)

> 当前whistle的最新版本为[v1.1.0](https://github.com/avwo/whistle/blob/master/CHANGELOG.md#-)，为确保使用whistle所有功能，请及时[更新whistle](https://avwo.github.io/whistle/update.html)

[whistle](https://github.com/avwo/whistle)是跨平台的web调试代理工具，功能类似Windows平台上的[Fiddler](http://www.telerik.com/fiddler/)，主要用于查看或修改HTTP、HTTPS、Websocket的请求或响应，不同于Fiddler通过断点修改请求响应的方式，whistle采用的是类似配置系统hosts的方式，通过配置规则修改请求响应，并支持规则分组及通过域名、路径、正则三种匹配方式(系统的hosts配置只支持域名匹配)，特别针对终端调试提供了[weinre](https://avwo.github.io/whistle/rules/weinre.html)，[log](https://avwo.github.io/whistle/rules/log.html)等功能，且支持通过Node模块扩展功能，具体实现过程请参见[whistle帮助文档](https://avwo.github.io/whistle/)。

安装使用whistle请参见[whistle帮助文档](https://avwo.github.io/whistle/install.html)。

# 基本功能
![基本功能](https://raw.githubusercontent.com/avwo/whistleui/master/assets/functions.png)

完整功能请参见[whistle帮助文档](https://avwo.github.io/whistle/rules/)。

# 配置模式
传统hosts的配置模式：

	# 单个host
	ip hostname

	# 组合host
	ip hostname1 hostname2 ... hostnameN

	# 例如
	127.0.0.1 www.example.com
	127.0.0.1 a.example.com b.example.com c.example.com

whistle的配置模式：

	# 单个操作
	pattern operator-uri
	# 如果pattern和operator-uri不同时为域名或路径的一种组合，位置可以调换
	operator-uri pattern

	# 组合模式
	pattern operator-uri1 operator-uri2 ... operator-uriN
	# pattern1和operator-uri不同时为域名或路径的一种组合，可以如下配置
	operator-uri pattern1 pattern2 ... patternN

其中，pattern可以为：

1. 域名：`www.test.com`(所有该域名下的请求都会匹配`operator-uri`)
2. 路径：`http://www.test.com/xxx`(`http://www.test.com/xxx`及其子路径的请求都会匹配`operator-uri`)，或不加协议`protocol://www.test.com/xxx`，protocol可以为http、https、ws、wss(`http://www.test.com/xxx`及其子路径的请求都会匹配`operator-uri`)
3. 正则:`/^https?:\/\/([^\/]+)\/xxx/`(`http(s)://host:port/xxx`及其子路径的请求都会匹配`operator-uri`，且在`operator-uri`中可以通过`$1, $2, ..., $9`获取`url`里面的子匹配)

详细内容请参见[配置模式](https://avwo.github.io/whistle/mode.html)、[匹配方式](https://avwo.github.io/whistle/pattern.html)。

operator-uri由上述[基本功能](#基本功能)抽象成的形如`protocol://ruleValue`的URI，whistle会根据匹配到的operator-uri的`protocol`及`ruleValue`修改请求或响应，具体实现过程请参见[whistle帮助文档](https://avwo.github.io/whistle/)。

例如：
	
	# 修改www.example.com的响应cors
	www.example.com resCors://*
	# 或
	resCors://* www.example.com

	# 同时修改多个自定域名或路径
	resCors://* /example\.com/ a.test.com b.test.com
	# 修改www.test.com的带端口host、referer和响应的cors
	www.test.com 127.0.0.1:8080 referer://http://www.example.com resCors://*


完整功能参见[whistle帮助文档](https://avwo.github.io/whistle/)。

# Network

![Network](https://raw.githubusercontent.com/avwo/whistleui/master/img/network.gif)

# Rules
![Rules](https://raw.githubusercontent.com/avwo/whistleui/master/img/rules.gif)

# Values
![Values](https://raw.githubusercontent.com/avwo/whistleui/master/img/values.gif)

完整功能请参见[whistle帮助文档](https://avwo.github.io/whistle/)。

# License
[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)
