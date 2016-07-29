# whistle
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat)](http://nodejs.org/download/)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/npm/l/whistle.svg?style=flat)](https://www.npmjs.com/package/whistle)

[![whistle logo](https://github.com/avwo/whistle/blob/avenwu/biz/webui/htdocs/img/whistle.png)](https://whistle.gitbooks.io/help/content/)

whistle是[Node](https://nodejs.org/)实现的类似[Fiddler](http://www.telerik.com/fiddler/)的web调试代理工具，用于查看、修改及构造HTTP(S)、Websocket请求响应。

whistle继承了Fiddler的抓包界面的部分优秀设计，去掉Fiddler通过断点修改请求响应的方式，采用扩展Hosts配置的方式，实现通过配置操作请求响应，且提供了通过Node模块扩展功能的方式，具体参考[实现原理](https://whistle.gitbooks.io/help/content/)。

如何安装使用whistle请参见：[whistle帮助文档](https://whistle.gitbooks.io/help/content/install.html);

### 配置模式

  pattern operator-uri
  
其中，pattern可以为：

1. 域名：`www.test.com`(所有该域名下的请求都会执行`operator-uri`)
2. 路径：`http://www.test.com/xxx`(可以不加协议，`http://www.test.com/xx`·路径及其子路径的请求都会执行`operator-uri`)
3. 正则:`/^https?:\/\/([^\/]+)\/xxx/`(`http(s)://host:port/xxx`路径及其子路径的请求都会执行`operator-uri`，且在`operator-uri`中可以通过`$1, $2, ..., $N`获取`url`里面的子匹配)

operator-uri参见[协议列表](https://whistle.gitbooks.io/help/content/rules/)

### Network

![Network](https://raw.githubusercontent.com/avwo/whistleui/master/img/network.gif)

### Rules
![Rules](https://raw.githubusercontent.com/avwo/whistleui/master/img/rules.gif)

### Values
![Values](https://raw.githubusercontent.com/avwo/whistleui/master/img/values.gif)

# License
[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)
