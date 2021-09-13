[English](./README.md) | 简体中文

<p align="center">
  <a href="https://avwo.github.io/whistle/">
    <img alt="whistle logo" src="https://raw.githubusercontent.com/avwo/whistle/master/biz/webui/htdocs/img/whistle.png">
  </a>
</p>

> 建议及时[更新 whistle](https://wproxy.org/whistle/update.html) 和 [Node](https://nodejs.org/) 以确保获取最新特性、bug修复及性能优化。
> 某些版本的 Node 存在 bug 可能导致 whistle 无法正常运行，具体版本参见issue：[#231](https://github.com/avwo/whistle/issues/231)

# whistle
[![NPM version](https://img.shields.io/npm/v/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square)](http://nodejs.org/download/)
[![build status](https://img.shields.io/travis/avwo/whistle.svg?style=flat-square)](https://travis-ci.org/avwo/whistle)
[![Test coverage](https://codecov.io/gh/avwo/whistle/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/whistle)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/npm/l/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)

[README in English](README.md)

whistle(读音 `[ˈwɪsəl]`，拼音 `[wēisǒu]` )是基于 Node 实现的跨平台抓包调试代理工具，有以下基本功能：

1. 查看 HTTP、HTTPS、HTTP2、WebSocket、TCP 请求响应数据
2. 修改 HTTP、HTTPS、HTTP2、WebSocket、TCP 请求响应数据
	- 修改请求 url、方法、头部、内容等
	- 修改响应状态码、头部、内容，并支持本地替换等
	- 修改 WebSocket 和 TCP 收发的帧数据
3. 设置 hosts（支持 IPv6）、http-proxy、https-proxy、socks 
4. 作为HTTP代理或反向代理
5. 集成常用的 web 调试工具，如 weinre 和 log 等
6. 支持用 Node 编写插件扩展

具体功能如下：

![基本功能](https://raw.githubusercontent.com/avwo/whistle/master/docs/assets/whistle-en_US.png)

whistle基本上覆盖了所有抓包调试代理可以实现的功能，且所有操作都可以通过类似配置hosts的方式实现。

传统hosts的配置方式：
```
# 普通模式
127.0.0.1 www.example.com

# 组合模式
127.0.0.1 www.example1.com www.example2.com www.example3.com 
```

> 传统hosts配置方式为 `ip pattern ... patternN`，其中pattern只能为域名，ip为纯ip不能带端口

whistle的配置方式不仅兼容上述传统hosts的配置方式，也支持丰富的匹配模式及操作功能，具体如下：
```
# 默认模式
pattern operatorURI

# 组合模式
pattern operatorURI operatorURI2 operatorURIN

# 如果pattern和operatorURI不同时为普通url，两种位置可以调换
operatorURI pattern

# 组合模式
operatorURI pattern pattern2 patternN

```

其中：

1. **pattern** 为匹配请求url的表达式，可以为：域名，路径，正则及通配符等等多种匹配方式，具体内容参见：[匹配模式](https://avwo.github.io/whistle/pattern.html)
2. **operatorURI** 为对应的操作，由操作协议+操作值组成：

	```
	operatorURI = opProtocol://opValue
	```
	**opProtocol**(操作协议) 对应某类操作，具体内容参见：[协议列表](https://avwo.github.io/whistle/rules/)

	**opValue**(操作值) 对应具体操作的参数值，具体内容参见：[操作值](https://avwo.github.io/whistle/data.html)
3. **pattern** 和 **operatorURI** 不同时为普通url时位置可以调换，且支持组合模式，具体内容参见：[配置方式](https://avwo.github.io/whistle/mode.html)

# 安装启动

whistle安装过程需要以下步骤（**缺一不可**）：
1. 安装Node
2. 安装whistle
3. 启动whistle
4. 配置代理
5. 安装根证书

上述步骤的详细操作分别参见如下文档：
1. [安装启动whistle](http://wproxy.org/whistle/install.html)
2. [安装whistle根证书](http://wproxy.org/whistle/webui/https.html)

安装成功后，可以通过如下命令查看whistle的所有命令行操作:
```
w2 --help
```

启动、停止、重启whistle的命令行命令如下：
```
w2 start
w2 stop
w2 restart
```

更新whistle只需重新安装下whistle即可，具体参见：[更新whistle帮助文档](http://wproxy.org/whistle/update.html)

> whistle有新版时，会自动推送提示升级，建议大家及时更新新版本。

![whistle webui](https://raw.githubusercontent.com/avwo/whistleui/master/assets/whistle.gif)

# 快速上手

打开[Rules](http://local.whistlejs.com/)，通过右键菜单或页面上方菜单栏的 `Create` 按钮创建一个分组 `test`，按照下方的例子输入规则并保存：

1. 设置hosts

	指定[www.ifeng.com](http://www.ifeng.com/)的ip:

		www.ifeng.com 127.0.0.1
		# or
		127.0.0.1 www.ifeng.com

	指定[www.ifeng.com](http://www.ifeng.com/)的ip和端口，把请求转发到本地8080端口，这个在平时开发中可以用来去掉url中的端口号:

		# www.ifeng.com 127.0.0.1
		www.ifeng.com 127.0.0.1:8080
		# or
		127.0.0.1:8080 www.ifeng.com

	也可以用某个域名的ip设置hosts

		www.ifeng.com host://www.qq.com:8080
		# or
		host://www.qq.com:8080 www.ifeng.com

 更多匹配模式参考：[匹配模式](https://avwo.github.io/whistle/pattern.html)

2. 本地替换
	
	平时开发中经常会用到这个功能，把响应替换成本地文件内容。

		# Mac、Linux
		www.ifeng.com file:///User/username/test
		# or www.ifeng.com file:///User/username/test/index.html
		
		# Windows的路径分隔符可以用 \ 或者 /
		www.ifeng.com file://E:\xx\test
		# or www.ifeng.com file://E:\xx\test\index.html

	[http://www.ifeng.com/](http://www.ifeng.com/)会先尝试加载`/User/username/test`这个文件，如果不存在，则会加载`/User/username/test/index.html`，如果没有对应的文件则返回404。
	
	[http://www.ifeng.com/xxx](#)会先尝试加载`/User/username/test/xxx`这个文件，如果不存在，则会加载`/User/username/test/xxx/index.html`，如果没有对应的文件则返回404。
	
	也可以替换jsonp请求，具体参见：[tpl](rules/rule/tpl.html)

	更多匹配模式参考：[匹配模式](https://avwo.github.io/whistle/pattern.html)

3. 请求转发	
	
	[www.ifeng.com](http://www.ifeng.com/)域名下的请求都替换成对应的www.aliexpress.com域名

		www.ifeng.com www.aliexpress.com

	更多匹配模式参考：[匹配模式](https://avwo.github.io/whistle/pattern.html)
4. 注入html、js、css
	
	whistle会自动根据响应内容的类型，判断是否注入相应的文本及如何注入(是否要用标签包裹起来)。
	
		# Mac、Linux
		www.ifeng.com html:///User/xxx/test/test.html
		www.ifeng.com js:///User/xxx/test/test.js
		www.ifeng.com css:///User/xxx/test/test.css
		
		# Windows的路径分隔符可以用`\`和`/`
		www.ifeng.com html://E:\xx\test\test.html
		www.ifeng.com js://E:\xx\test\test.js
		www.ifeng.com css://E:\xx\test\test.css

	所有www.ifeng.com域名下的请求，whistle都会根据响应类型，将处理好的文本注入到响应内容里面，如是html请求，js和css会分别自动加上`script`和`style`标签后追加到内容后面。

	更多匹配模式参考：[匹配模式](https://avwo.github.io/whistle/pattern.html)
5. 调试远程页面

	利用whistle提供的[weinre](http://wproxy.org/whistle/webui/weinre.html)和[log](http://wproxy.org/whistle/webui/log.html)两个协议，可以实现修改远程页面DOM结构及自动捕获页面js错误及console打印的信息，还可以在页面顶部或js文件底部注入指定的脚步调试页面信息。
	
	使用whistle的功能前，先把要相应的系统代理或浏览器代理指向whistle，如何设置可以参考：[安装启动](http://wproxy.org/whistle/install.html)
	
	weinre：

		www.ifeng.com weinre://test
  
	配置后保存，打开[www.ifeng.com](http://www.ifeng.com/)，鼠标放在菜单栏的weinre按钮上会显示一个列表，并点击其中的`test`项打开weinre的调试页面选择对应的url切换到Elements即可。
	
	log:

		www.ifeng.com log://{test.js}

	配置后保存，鼠标放在菜单栏的Values按钮上会显示一个列表，并点击其中的`test.js`项，whistle会自动在Values上建立一个test.js分组，在里面填入`console.log(1, 2, 3, {a: 123})`保存，打开Network -> 右侧Log -> Console，再打开[www.ifeng.com](http://www.ifeng.com/)，即可看到Log下面的Page输出的信息。

	更多匹配模式参考：[匹配模式](https://avwo.github.io/whistle/pattern.html)
	
更多内容参考：[协议列表](https://avwo.github.io/whistle/rules/)

# 帮助文档
1. [安装启动](https://avwo.github.io/whistle/install.html)
2. [命令行操作](https://avwo.github.io/whistle/cli.html)
2. [手动更新](https://avwo.github.io/whistle/update.html)
3. [快速上手](https://avwo.github.io/whistle/quickstart.html)
4. [配置方式](https://avwo.github.io/whistle/mode.html)
5. [匹配模式](https://avwo.github.io/whistle/pattern.html)
6. [操作值](https://avwo.github.io/whistle/data.html)
7. [常用功能](https://avwo.github.io/whistle/frequet.html)
8. [插件开发](https://avwo.github.io/whistle/plugins.html)
9. [注意事项](https://avwo.github.io/whistle/attention.html)
11. [常见问题](https://avwo.github.io/whistle/questions.html)
12. [界面功能](https://avwo.github.io/whistle/webui/)
13. [协议列表](https://avwo.github.io/whistle/rules/)
14. [用户反馈](https://avwo.github.io/whistle/feedback.html)

# License
[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)
