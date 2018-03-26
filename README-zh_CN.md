<p align="center">
  <a href="https://avwo.github.io/whistle/">
    <img alt="whistle logo" src="https://raw.githubusercontent.com/avwo/whistle/master/biz/webui/htdocs/img/whistle.png">
  </a>
</p>


# whistle
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat-square)](http://nodejs.org/download/)
[![build status](https://img.shields.io/travis/avwo/whistle.svg?style=flat-square)](https://travis-ci.org/avwo/whistle)
[![Test coverage](https://codecov.io/gh/avwo/whistle/branch/master/graph/badge.svg?style=flat-square)](https://codecov.io/gh/avwo/whistle)
[![npm download](https://img.shields.io/npm/dm/whistle.svg?style=flat-square)](https://npmjs.org/package/whistle)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/npm/l/whistle.svg?style=flat-square)](https://www.npmjs.com/package/whistle)

whistle(读音`[ˈwɪsəl]`，拼音`[wēisǒu]`)是基于Node实现的跨平台调试代理工具。

[README in English](README.md)

它提供了如下基本功能：

1. 提供HTTP代理服务
2. 抓包、重放或构造HTTP、HTTPS、WebSocket及普通的Socket(TCP)请求
3. 通过类似hosts的简单配置方式操作请求或响应，且支持域名、路径、正则表达式、通配符、通配路径等多种[匹配模式](https://avwo.github.io/whistle/pattern.html)
4. 内置移动调试功能

如果以上功能仍无法满足你对调试代理的需求，你可以通过[插件](https://avwo.github.io/whistle/plugins.html)进行扩展。

具体功能如下：

![基本功能](https://raw.githubusercontent.com/avwo/whistleui/master/assets/whistle.png)

whistle的所有操作都可以通过类似如下配置方式实现：

	pattern operatorURI


其中：

1. **pattern** 为匹配请求url的表达式，可以为：域名，路径，正则及通配符等等多种匹配方式：

		# 域名匹配
		www.example.com
		# 带端口的域名
		www.example.com:6666
		# 带协议的域名，支持：http、https、ws、wss、tunnel
		http://www.example.com

		# 路径匹配，同样支持带协议、端口
		www.example.com/test
		https:/www.exapmle.com/test
		https:/www.exapmle.com:6666/test

		# 正则匹配
		/^https?://www\.example\.com\/test/(.*)/ referer://http://www.test.com/$1

		# 通配符匹配
		^www.example.com/test/*** referer://http://www.test.com/$1

	完整内容参见：[匹配模式](https://avwo.github.io/whistle/pattern.html)
2. **operatorURI** 为对应的操作，由操作协议+操作值组成(`operatorURI = opProtocol://opValue`)：
	**opProtocol**(操作协议) 对应某类操作，如：
		
			# host：设置请求服务器IP
			pattern host://opValue	

			# file协议：本地替换
			pattern file://opValue

	**opValue**(操作值) 对应具体操作的参数值，如：

			# host协议：设置请求服务器IP
			pattern host://127.0.0.1:6666 # 或 pattern 127.0.0.1:6666	

			# file协议：本地替换
			pattern file:///User/test/dirOrFile # 或 pattern /User/test/dirOrFile
			pattern file://E:\test\dirOrFile # 或 pattern E:\test\dirOrFile

	完整内容参见：[操作值](https://avwo.github.io/whistle/data.html)
3. **pattern** 和 **operatorURI** 在多数情况下位置可以调换，且支持组合模式，具体参见：[配置方式](https://avwo.github.io/whistle/mode.html)

# 安装启动

#### 安装Node
推荐安装最新的 `LTS` 版本Node，如果本地没有安装Node或安装了低版本的Node，可以按下面的指引安装最新版的Node：

1. **Windows系统**，访问[https://nodejs.org/](https://nodejs.org/)，下载最新的 `LTS` 版本Node，点击默认安装即可。
2. **Mac系统**安装方式跟Windows一样。
3. **Linux系统**，推荐使用源码安装方式，这样无需自己配置 `path`，如果无法用源码安装，也可以直接二进制版本的Node，解压后把里面的bin目录路径加到系统的 `PATH` 即可：
	- **源码安装**：从[Node官网](https://nodejs.org/en/download/)下载最新版的**Source Code**(或者用`wget`命令下载)，解压文件(`tar -xzvf node-xxx.tar.gz`)，进入解压后的根目录(`node-xxx`)，依次执行`./configure`、`./make`和`./make install`。
	- **直接用二进制版本**：从[Node官网](https://nodejs.org/en/download/)下载最新版的**Linux Binaries**(或者用`wget`命令下载)，解压文件(`tar -xzvf node-xxx.tar.gz`)，解压后将Node二进制文件的bin目录完整路径加到系统的 `PATH`。

Node安装完成后，在命令行执行 `node -v` 查看下对应的Node版本是否安装成功：

	$ node -v
	v8.9.4

#### 安装whistle
Node安装成功后，执行如下npm命令安装whistle （**Mac或Linux的非root用户需要在命令行前面加`sudo`，如：`sudo npm install -g whistle`**）

	npm install -g whistle

npm默认镜像是在国外，有时候安装速度很慢或者出现安装不了的情况，如果无法安装或者安装很慢，可以使用taobao的镜像安装：

	npm install cnpm -g --registry=https://registry.npm.taobao.org
	cnpm install -g whistle

	或者直接指定镜像安装：
	npm install whistle -g --registry=https://registry.npm.taobao.org


whistle安装完成后，执行命令 `whistle help` 或 `w2 help`，查看whistle的帮助信息：

	$ w2 help
	Usage: whistle <command> [options]


	Commands:

		run       Start a front service
		start     Start a background service
		stop      Stop current background service
		restart   Restart current background service
		help      Display help information

	Options:

		-h, --help                                      output usage information
		-D, --baseDir [baseDir]                         the base dir of config data
		-A, --ATS                                       generate Root CA for iOS ATS (Node >= 6 is required)
		-z, --certDir [directory]                       custom certificate path
		-l, --localUIHost [hostname]                    local ui host (local.whistlejs.com by default)
		-n, --username [username]                       the username of whistle
		-w, --password [password]                       the password of whistle
		-N, --guestName [username]                      the guest name
		-W, --guestPassword [password]                  the guest password
		-s, --sockets [number]                          max sockets (60 by default)
		-S, --storage [newStorageDir]                   the new local storage directory
		-C, --copy [storageDir]                         copy storageDir to newStorageDir
		-c, --dnsCache [time]                           the cache time of DNS (30000ms by default)
		-H, --host [host]                               whistle listening host(:: or 0.0.0.0 by default)
		-p, --port [port]                               whistle listening port (8899 by default)
		-P, --uiport [uiport]                           whistle ui port (8900 by default)
		-m, --middlewares [script path or module name]  express middlewares path (as: xx,yy/zz.js)
		-M, --mode [mode]                               the whistle mode (as: pureProxy|debug|multiEnv)
		-u, --uipath [script path]                      web ui plugin path
		-t, --timeout [ms]                              request timeout (66000 ms by default)
		-e, --extra [extraData]                         extra data for plugin
		-f, --secureFilter [secureFilter]               the script path of secure filter
		-R, --reqCacheSize [reqCacheSize]               the cache size of request data (512 by default)
		-F, --frameCacheSize [frameCacheSize]           the cache size of socket frames (512 by default)
		-V, --version                                   output the version number

#### 启动whistle
启动:

	w2 start

*Note: 如果要防止其他人访问配置页面，可以在启动时加上登录用户名和密码 `-n yourusername -w yourpassword`。*

重启:

	w2 restart


停止:

	w2 stop

启动调试模式:

	w2 run

更多内容参考：[安装启动](https://avwo.github.io/whistle/install.html)

# 设置代理
##### 配置信息
1. 代理服务器：127.0.0.1(如果部署在远程服务器或虚拟机上，改成对应服务器或虚拟机的ip即可)
2. 默认端口：8899(如果端口被占用，可以在启动是通过 `-p` 来指定新的端口，更多信息可以通过执行命令行 `w2 help` (`v0.7.0`及以上版本也可以使用`w2 help`) 查看)

> 勾选上 **对所有协议均使用相同的代理服务器**

##### 代理配置方式(把上面配置信息配置上即可)
1. 直接配置系统代理：　
  * [Windows](http://jingyan.baidu.com/article/0aa22375866c8988cc0d648c.html) 
  * [Mac](http://jingyan.baidu.com/article/a378c960849144b3282830dc.html)

2. 设置浏览器代理 (**推荐**)

	* 安装Chrome代理插件： [whistle-for-chrome插件](https://github.com/avwo/whistle-for-chrome) 或者 [Proxy SwitchySharp](https://chrome.google.com/webstore/detail/proxy-switchysharp/dpplabbmogkhghncfbfdeeokoefdjegm)

	* Firefox设置代理： 在Firefox浏览器的`选项` -> `常规` -> `网络代理`中直接设置手动代理为whistle
  ![](http://7tszky.com1.z0.glb.clouddn.com/FoMjvBC9svsUyfKFkYENq18zGOT8)
	
3. 移动端需要在`设置`中配置当前Wi-Fi的代理

PS: 如果配置完代理，手机无法访问，可能是whistle所在的电脑防火墙限制了远程访问whistle的端口，关闭防火墙或者设置白名单：[ http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html]( http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html)

更多内容参考：[安装启动](https://avwo.github.io/whistle/install.html)

# 访问界面

上述操作完成后，打开whistle界面[http://local.whistlejs.com](http://local.whistlejs.com/)：

![whistle webui](https://raw.githubusercontent.com/avwo/whistleui/master/assets/whistle.gif)

1. Network：主要用来查看请求信息，构造请求，页面 `console` 打印的日志及抛出的js错误等
2. Rules：配置操作规则
3. Plugins：安装的插件信息，及启用或禁用插件
4. Weinre：设置的weinre列表
5. HTTPS：设置是否拦截HTTPS请求，及下载whistle根证书

# 安装证书
安装根证书及开启https拦截后才可以正常操作或抓取https及websocket请求，具体参见：[安装根证书](https://avwo.github.io/whistle/webui/https.html)

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

	利用whistle提供的[weinre](rules/weinre.html)和[log](rules/log.html)两个协议，可以实现修改远程页面DOM结构及自动捕获页面js错误及console打印的信息，还可以在页面顶部或js文件底部注入指定的脚步调试页面信息。
	
	使用whistle的功能前，先把要相应的系统代理或浏览器代理指向whistle，如何设置可以参考：[安装启动](install.html)
	
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
2. [手动更新](https://avwo.github.io/whistle/update.html)
3. [快速上手](https://avwo.github.io/whistle/quickstart.html)
4. [配置方式](https://avwo.github.io/whistle/mode.html)
5. [匹配模式](https://avwo.github.io/whistle/pattern.html)
6. [操作值](https://avwo.github.io/whistle/data.html)
7. [常用功能](https://avwo.github.io/whistle/frequet.html)
8. [插件开发](https://avwo.github.io/whistle/plugins.html)
9. [注意事项](https://avwo.github.io/whistle/attention.html)
10. [关于ATS](https://avwo.github.io/whistle/ats.html)
11. [常见问题](https://avwo.github.io/whistle/questions.html)
12. [界面功能](https://avwo.github.io/whistle/webui/)
13. [协议列表](https://avwo.github.io/whistle/rules/)
14. [用户反馈](https://avwo.github.io/whistle/feedback.html)

# License
[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)
