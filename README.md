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

Whistle, pronunced `[ˈwɪsəl]`, is a cross-platform debugging and proxying capture tool based on Node.js. Besides offering HTTP proxying service，the more important function is to capture package, to replay request, to compose request for HTTP、HTTPS、WebSocket and normal Socket(TCP).

To achieve these, you can freely and easily use plenty of [patterns](https://avwo.github.io/whistle/pattern.html), domain, path, regular expression, wildcard characters, wildcard path, etc., to operate Request or Response like hosts，and can also use [plugins](https://avwo.github.io/whistle/plugins.html) to meet nearly all the requirements for debugging and proxying. The specific functions are as follows：

[Specific functions](https://processon.com/mindmap/5a796689e4b064e9ddba403e)


All the operations of whistle will be achieved like the following configuration: 

	pattern operatorURI


Description：

1. **pattern** is a expression to match url of request. It can be domain, path, reqular expression, wildcard, and so on：

		# matching domain
		www.example.com
		# domain with port
		www.example.com:6666
		# domain with protocol, supporting http, https, ws, wss, tunnel
		http://www.example.com

		# matching path, supporting protocol, port
		www.example.com/test
		https:/www.exapmle.com/test
		https:/www.exapmle.com:6666/test

		# matching regular expression
		/^https?://www\.example\.com\/test/(.*)/ referer://http://www.test.com/$1

		# matching wildcard
		^www.example.com/test/*** referer://http://www.test.com/$1

	For more details, please visit [matching pattern](https://avwo.github.io/whistle/pattern.html)
2. **operatorURI** is the corresponding operation，made up of opProtocol and opValue：  
	**opProtocol** represents the kind of operation, e.g.
		
			# host：the IP of the server requested
			pattern host://opValue	

			# file：using the local file to replace
			pattern file://opValue

	**opValue** represents the parameter of the specific operation, e.g.

			# host：the IP of the server requested
			pattern host://127.0.0.1:6666 # or pattern 127.0.0.1:6666	

			# file：using the local file to replace
			pattern file:///User/test/dirOrFile # or pattern /User/test/dirOrFile
			pattern file://E:\test\dirOrFile # or pattern E:\test\dirOrFile

	For more details, please visit [operation value](https://avwo.github.io/whistle/data.html)
3. The order of **pattern** and **operatorURI** can be exchanged in most situations while the combination mode is supported. For more details about this, please visit [configuration mode](https://avwo.github.io/whistle/mode.html)

# Install and start

#### install Node
The latest `LTS` version of Node.js is recommended to install. 

Only if none or low version of Node.js is installed, you need install the latest version of Node.js as following instructions：

1. **For Windows**: please visit [https://nodejs.org/](https://nodejs.org/) to download the latest `LTS` version of Node.js. and then, install it using the default option.
2. **For Mac**: the same as for Windows.
3. **For Linux**: install with source code is recommended. In this way, you don't need to configure the `path`.  If failed to install with source code, you can also use the binary version of Node.js directly.
	- **with source package**： visit [Official website of Node](https://nodejs.org/en/download/) to download the latest version of *Source Code**(or using `wget` in shell), unzip(`tar -xzvf node-xxx.tar.gz`), switch to the root directory(`cd node-xxx`), execute `./configure`, `./make` and `./make install` in order。
	- **using binary version**：visit [Official website of Node](https://nodejs.org/en/download/) to download the latest **Linux Binaries**(或者用`wget`命令下载), unzip(`tar -xzvf node-xxx.tar.gz`), add the absolute path of bin directory to system `PATH` after extracting。

You can execute `node -v` in shell to check if the corresponding version of Node.js is installed successfully：

	$ node -v
	v8.9.4

#### install whistle
After the Node.js is installed successfully, you can execute the following npm command to install whistle（**In Mac or Linux, prefix `sudo` is needed if no root user, i.e. `sudo npm install -g whistle`**）

	npm install -g whistle

In china, you can install whistle using npm mirror of taobao to accelerate and to avoid fail：

	npm install cnpm -g --registry=https://registry.npm.taobao.org
	cnpm install -g whistle

	or specify mirror install directly：
	npm install whistle -g --registry=https://registry.npm.taobao.org


Execute `whistle help` or `w2 help` to view helps after installment:

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

#### Start whistle
Start:

	w2 start

*Note: If you don't want others to visit the configuration page of whistle, just add username and password when start, i.e. `-n yourusername -w yourpassword`。*

Restart:

	w2 restart


Stop:

	w2 stop

Debugging mode:

	w2 run

For more details, please visit [install and start](https://avwo.github.io/whistle/install.html)

# Set proxying
##### configuration
1. proxying server：127.0.0.1(if whistle is deployed in remote server or virtual machine, corresponding IP is needed)
2. default port：8899(if port 8899 is used already，you can specify new port when start. More details can be visited by execute `whistle help` while `w2 help` is supported in `v0.7.0` and higher version)

> Make sure **using the same proxying server for all protocol** in system proxying setting is checked.

##### the way to configure proxy(configure the two items above)
1. configure proxy directly in OS：　
  * [Windows](http://jingyan.baidu.com/article/0aa22375866c8988cc0d648c.html) 
  * [Mac](http://jingyan.baidu.com/article/a378c960849144b3282830dc.html)

2. using proxying plugin of browers (**recommended**)

	* for Chrome： [whistle-for-chrome](https://github.com/avwo/whistle-for-chrome) or [Proxy SwitchySharp](https://chrome.google.com/webstore/detail/proxy-switchysharp/dpplabbmogkhghncfbfdeeokoefdjegm)

	* for Firefox： [Proxy Selector](https://addons.mozilla.org/zh-cn/firefox/addon/proxy-selector/)
	
3. in mobiles, configure the proxy of current Wi-Fi in `Setting`

PS: If the mobile failed to use network after configuration, you can try to close the fireworks or congigure white list while the fireworks of the PC has forbidden remote visit to the port of whistle：[ http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html]( http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html)

For more details, please vsit [install and start](https://avwo.github.io/whistle/install.html)

# Web UI

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

	配置后保存，鼠标放在菜单栏的weinre按钮上会显示一个列表，并点击其中的`test.js`项，whistle会自动在Values上建立一个test.js分组，在里面填入`console.log(1, 2, 3, {a: 123})`保存，打开Network -> 右侧Log -> Page，再打开[www.ifeng.com](http://www.ifeng.com/)，即可看到Log下面的Page输出的信息。

	更多匹配模式参考：[匹配模式](https://avwo.github.io/whistle/pattern.html)
	
更多内容参考：[协议列表](https://avwo.github.io/whistle/rules/)

# 帮助文档
1. [Install and start](https://avwo.github.io/whistle/install.html)
2. [How to update](https://avwo.github.io/whistle/update.html)
3. [Quick to start](https://avwo.github.io/whistle/quickstart.html)
4. [Configuration mode](https://avwo.github.io/whistle/mode.html)
5. [Matching pattern](https://avwo.github.io/whistle/pattern.html)
6. [Operation value](https://avwo.github.io/whistle/data.html)
7. [Frequent functions](https://avwo.github.io/whistle/frequet.html)
8. [How to develop plugins](https://avwo.github.io/whistle/plugins.html)
9. [Attentions](https://avwo.github.io/whistle/attention.html)
10. [About ATS](https://avwo.github.io/whistle/ats.html)
11. [Common questions](https://avwo.github.io/whistle/questions.html)
12. [Web UI](https://avwo.github.io/whistle/webui/)
13. [Rules](https://avwo.github.io/whistle/rules/)
14. [Feedback](https://avwo.github.io/whistle/feedback.html)

# License
[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)
