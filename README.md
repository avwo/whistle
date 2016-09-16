<p align="center">
  <a href="https://whistle.gitbooks.io/help/content/">
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

> 当前whistle的最新版本为[v1.0.3](https://github.com/avwo/whistle/blob/master/CHANGELOG.md#-)，为确保能使用whistle的所有功能，请及时[更新whistle](https://whistle.gitbooks.io/help/content/update.html)

whistle是[Node](https://nodejs.org/)实现的类似[Fiddler](http://www.telerik.com/fiddler/)的跨平台web调试代理工具，可用于查看、修改及构造HTTP(S)、Websocket请求响应，并继承了Fiddler抓包界面的部分优秀设计，去掉Fiddler通过断点修改请求响应的方式，采用扩展Hosts配置的方式，实现通过配置操作请求响应，且提供了通过Node模块扩展功能的方式，具体参见[实现原理](https://whistle.gitbooks.io/help/content/)。

如何安装使用whistle请参见：[whistle帮助文档](https://whistle.gitbooks.io/help/content/install.html)。

# 基本功能

### 配置模式

  	pattern operator-uri
  
其中，pattern可以为：

1. 域名：`www.test.com`(所有该域名下的请求都会执行`operator-uri`)
2. 路径：`http://www.test.com/xxx`(可以不加协议`www.test.com/xxx`，`http://www.test.com/xx`·路径及其子路径的请求都会执行`operator-uri`)
3. 正则:`/^https?:\/\/([^\/]+)\/xxx/`(`http(s)://host:port/xxx`路径及其子路径的请求都会执行`operator-uri`，且在`operator-uri`中可以通过`$1, $2, ..., $9`获取`url`里面的子匹配)

更多详细内容请参见[配置模式](https://whistle.gitbooks.io/help/content/mode.html)、[匹配方式](https://whistle.gitbooks.io/help/content/pattern.html)。

operator-uri有以下功能：

- 配置host
- 修改请求，包括： 请求方法、请求头、修改内容、延迟发送请求、限制请求速度，设置timeout
- 修改响应，包括： 响应状态码、响应头、修改内容、 延迟响应、 限制响应速度
- 替换请求： 
	- 替换本地文件(支持替换jsonp请求)
	- 设置代理(支持http、socks代理)
	- 请求转发
	- 通过插件扩展
- 内置weinre，通过weinre可以修改手机端或远程网页的DOM结构，调试页面等
- 设置过滤，用于过滤一些已设置的规则
- 导出请求响应的详细信息
- 自定义脚本修改url的请求参数，实现动态匹配规则的功能
- 支持自动捕获手机端或远程页面的js异常，且可以嵌入脚本打印console等

完整功能参见[协议列表](https://whistle.gitbooks.io/help/content/rules/)。

### Network

![Network](https://raw.githubusercontent.com/avwo/whistleui/master/img/network.gif)

### Rules
![Rules](https://raw.githubusercontent.com/avwo/whistleui/master/img/rules.gif)

### Values
![Values](https://raw.githubusercontent.com/avwo/whistleui/master/img/values.gif)

完整功能请参见[whistle帮助文档](https://whistle.gitbooks.io/help/content/)。

# License
[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)
