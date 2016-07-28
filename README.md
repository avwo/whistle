# whistle
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat)](http://nodejs.org/download/)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/npm/l/whistle.svg?style=flat)](https://www.npmjs.com/package/whistle)

# whistle

whistle是Node实现的类似Fiddler的web调试代理工具，用于查看、修改及构造HTTP(S)、Websocket请求响应。

whistle继承了部分Fiddler的抓包界面的设计，抛弃Fiddler通过断点修改请求响应的方式，采用扩展Hosts配置的方式，实现通过配置操作请求响应，且提供了通过Node模块扩展功能，具体参考[实现原理](https://whistle.gitbooks.io/help/content/)。

如何安装使用whistle请参考：[whistle帮助文档](https://whistle.gitbooks.io/help/content/install.html);

### Network

![Network](https://raw.githubusercontent.com/avwo/whistleui/master/img/network.gif)

### Rules
![Rules](https://raw.githubusercontent.com/avwo/whistleui/master/img/rules.gif)

### Values
![Values](https://raw.githubusercontent.com/avwo/whistleui/master/img/values.gif)

# License
[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)
