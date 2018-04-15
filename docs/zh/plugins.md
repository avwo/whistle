# 插件开发

有些功能用的比较少的功能，及一些跟业务相关的功能，如：

- 查看 websocket 的传输内容
- 查看如图片等富媒体资源
- 集成一些本地服务(处理[combo 请求](https://github.com/whistle-plugins/whistle.tianma))
- 动态设置规则(通过远程服务器动态判断请求设置哪些规则)
- 加载本地指定的规则文件

等等，考虑到会导致安装过程比较长或者占用内存空间或者适应范围比较小，whistle 没有把这些功能加进去，但提供了插件的方式扩展这些功能。

whistle 插件本身就是一个普通的 Node 模块，只是名字要按照 `whistle.xxx` 的形式命名，其中 `xxx` 指插件的名称且只能包含小写字母、数字、_、- 四种字符，如：[whistle.helloworld](https://github.com/whistle-plugins/whistle.helloworld)、[whistle.tianma](https://github.com/whistle-plugins/whistle.tinama)、[whistle.vase](https://github.com/whistle-plugins/whistle.vase)，而 `xxx` 就是扩展的协议，可以直接在 Rules 里面配置使用，我们先看下 whistle 的时序图及插件的结构，了解 whistle 如何加载执行插件，然后再讲下如何开发、发布、安装插件。

whistle 的时序图：

![whistle 的时序图](https://avwo.github.io/whistle/img/seq.png)

### 编写插件

whistle 插件目录结构：

	whistle.xxx
		|__ package.json
		|__ rules.txt
		|__ _rules.txt
		|__ index.js
		|__ lib
			  |__ uiServer.js
			  |__ statusServer.js
			  |__ rulesServer.js
			  |__ server.js
			  |__ resRulesServer.js

除了 package.json，其它都是可选的，其中(参考时序图)：

- package.json

		{
		    "name": "whistle.xxx",
		    "version": "0.0.1",
		    "description": "xxxx",
		    "homepage": "插件的帮助或官网链接",
		    //others
		}

- rules.txt: 插件的全局规则，只要插件启用，所有请求都会查找匹配
- _rules.txt: 插件的私有规则，只有请求匹配插件的规则 `xxx://value`，才会去查找匹配
- index.js

		module.exports = require('./lib/server');
		module.exports.uiServer = require('./lib/uiServer');
		module.exports.rulesServer = require('./lib/rulesServer');
		module.exports.resRulesServer = require('./lib/resRulesServer');

- lib/uiServer: `xxx.local.whistlejs.com` 域名下的请求都会直接访问该 server，可用于后台管理界面

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的相关事件处理 ui 相关的请求(http 或 websocket)
			*/
		};

- lib/statusServer: 状态服务器，whistle 会把请求的各种状态 post 过来，请求只要匹配了插件的协议规则 `xxx://value 或 plugin://xxx(value)`(`xxx` 为插件 `whistle.xxx` 的名称)

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的 request 事件获取请求信息，
			* 并返回新的规则
			*/
		};

- lib/rulesServer: 规则服务器，请求只要匹配了插件的协议规则 `xxx://value 或 plugin://xxx(value)`(`xxx` 为插件 `whistle.xxx` 的名称)，就会把一些请求带放在头部请求该 server，该 server 可以根据需要返回新的规则

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的 request 事件获取请求信息，
			* 并返回新的规则
			*/
		};

- lib/server: 处理请求的 server，可以做请求合并等，返回的数据就是请求的响应数据

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的相关事件处理 whistle 转发过来的请求
			*/
		};

- lib/resRulesServer: 响应规则服务器，在请求响应后到达浏览器前 whistle 会把一些请求信息传给该 server，该 server 可以返回新的规则

		module.exports = function(server, options) {
			/*
			* options 包含一些自定义的头部字段名称及配置信息，后面单独统一讲
			* server 是 whistle 传给插件的 http.Server 对象，
			* 开发者通过监听 server 的 request 事件获取响应信息，
			* 并返回新的处理响应的规则
			*/
		};


- options

		{
			name: // 插件的名称,
			RULE_VALUE_HEADER: // 存储配置的规则值的请求头字段,
			SSL_FLAG_HEADER: // 判断是否为 HTTPS 请求的请求头字段,
			FULL_URL_HEADER: // 存储请求完整 url 的请求头字段,
			REAL_URL_HEADER: // 存储配置映射到 url 的请求头字段,
			NEXT_RULE_HEADER: // 存储配置的下个规则 (第一规则为插件) 的请求头字段,
			REQ_ID_HEADER: // 请求的 id，可以用于区分响应和请求是否同一个,
			DATA_ID_HEADER: // 数据包对应的 id，不一定存在,
			STATUS_CODE_HEADER: // 配置的响应状态码,
			LOCAL_HOST_HEADER: // 配置的 hosts,
			HOST_PORT_HEADER: // 配置的端口,
			METHOD_HEADER: // 请求方法,
			debugMode: // 是否是通过 w2 run 启动的,
			config: // 包括 whistle 的端口号 port 等一系列 whistle 的配置,
			storage: // 提供本地存储的接口，用法参考：https://github.com/avwo/whistle/blob/master/lib/rules/util.js
		}

whistle 插件的每部分都可以独立存在，各个部分的关系及与 whistle 的关系可以看时序图，也可以参考其它参加的实现方式：[https://github.com/whistle-plugins](https://github.com/whistle-plugins)，[whistle.helloworld](https://github.com/whistle-plugins/whistle.helloworld)

### 调试插件

把本地 node 模块 link 到全局目录：

	$ npm link
	或 sudo npm link

	# 开启 whistle 的调试模式
	$ w2 run

这样 whistle 会自动加载改插件，如果插件有代码更新，需要触发修改 package.json 这个文件，比如加个空格，或者直接加个字段，每次修改下这个字段，whistle 会检查 package.json 是否有更改，如果更改的话会自动重启。

卸载本地插件：

	npm unlink
	# 或 sudo npm unlink

	# 如果 npm link 不是在模块所在根目录执行，可以采用下面这种方式卸载本地开发的全局模块
	npm unlink whistle.xxx -g
	# 或 sudo npm unlink whistle.xxx -g

### 发布插件
同发布正常的 node 模块，模块编写完毕，可以通过以下几种方式发布：

1. 公共的 node 模块，直接上传到 npm 仓库：

		# 登陆 npm login 后，在模块的根目录 (package.json 所在目录) 执行
		npm publish

2. 自建的 npm 仓库，有些公司会自建自己的仓库

		xnpm publish

### 安装插件
同安装全局的 node 模块，只需直接通过 npm 安装，需要安装到全局

	npm install -g whistle.protocol
	# 或
	xnpm install -g whistle.protocol
	# 或
	xnpm install -g @org/whistle.protocol


### 更新插件
可以通过直接重复上述安装插件的方式强制更新，直接通过 npm 更新:

	npm update -g whistle.protocol
	# 或
	xnpm update -g whistle.protocol
	# 或
	xnpm update -g @org/whistle.protocol


### 卸载插件


	npm uninstall -g whistle.protocol
	# 或
	xnpm uninstall -g whistle.protocol
	# 或
	xnpm uninstall -g @org/whistle.protocol



### 使用插件
安装完插件，直接可以在 whistle 中配置

	pattern   protocol://ruleValue

	配置完以后 whistle 会自动把匹配到的请求转发到对应 protocol 的插件 whistle.protocol 上，并把 ruleValue 传给插件服务器



更多内容可以参考：

1. [https://github.com/whistle-plugins/whistle.helloworld](https://github.com/whistle-plugins/whistle.helloworld)
2. [https://github.com/whistle-plugins](https://github.com/whistle-plugins)
