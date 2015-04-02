whistle是用nodejs实现的跨平台web调试工具，支持windows、mac、linux等安装了nodejs的操作系统，主要有四种功能（**每个http请求可以同时设置下面四个功能**）：

1. http请求自动转成https请求
2. 配置hosts（没有dns缓存，支持正则匹配）
3. 支持修改请求或响应头部
4. 配置请求转发规则

并可以通过在启动时加载自定义插件的方式扩展功能：

1. 扩展请求转发规则
2. 自定义UI界面
3. 通过监听事件获取请求数据


###安装###

首先要确保操作系统已安装了**0.10.0**及以上版本的nodejs，如果没有安装可以到这个页面下载安装：[https://nodejs.org/download/](https://nodejs.org/download/)

安装完nodejs后，在命令行执行npm命令安装whistle

	npm install -g whistle

稍等片刻，安装结束后，执行命令 `whistle help`，可以看到完整的帮助信息: 

  	Usage: whistle <command> [options]


  Commands:

    run       Start a front service
    start     Start a background service
    stop      Stop current background service
    restart   Restart current background service
    help      Display help information

  Options:

    -h, --help                       output usage information
    -V, --version                    output the version number
    -f, --hosts [host]               hosts file
    -p, --port [port]                whistle port(9527 by default)
    -m, --plugins [plugins]          express middlewares(plugins) path (as: xx.js,yy/zz.js)
    -d, --uiport [uiport]            web ui http port(9528 by default)
    -s, --uisslport [uisslport]      web ui https port(9529 by default)
    -a, --tianmaport [uisslport]     tianma http port(19528 by default)
    -A, --tianmasslport [uisslport]  tianma https port(19529 by default)
    -u, --uipath [uipath]            web ui plugin path
    -t, --timneout [timneout]        request timeout(10000 ms by default)

执行命令 `whistle start` **启动whistle**（重启： `whistle restart`； 停止： `whistle stop`）


###配置代理##

IP设置为：**127.0.0.1**（如果是部署在虚拟机或其它机器，则配对应机器的IP）

端口： **9527**（如果启动时修改了端口号，则把端口号修改对应的值）

有两种方式配置代理

1. 安装浏览器代理插件

	可以在chrome安装代理插件：[Proxy SwitchySharp](https://chrome.google.com/webstore/detail/proxy-switchysharp/dpplabbmogkhghncfbfdeeokoefdjegm)，按上述配置代理并勾选上**对所有协议均使用相同的代理服务器**。

2. 系统代理

	也可以直接配置系统配置上述代理并勾选上**对所有协议均使用相同的代理服务器**。

PS：每次重启系统后需要手动启动**whistle start**，或者切换代理，否则可能出现**无法连接到代理服务器**的错误

###操作界面###

配置完代理，打开 [http://local.whistlejs.com/](http://local.whistlejs.com/)（如果不能访问，请安装最新版本的whistle： `npm install -g whistle` ，并重启 `whistle restart` ）或[http://127.0.0.1:9527/](http://127.0.0.1:9527/)（9527为对应的代理端口号）可以开始使用whistle。

PS: **设置完代理后，代理会把请求服务器的ip给屏蔽，可以在响应的头信息找到**

###流程图###

![whistle工作流程图](https://raw.githubusercontent.com/avwo/whistle/master/flow-chart.png)

###基本功能（以windows为例，mac、linux等其它系统同理）###

1. `#` 为注释


2. http转https

	在https请求的host前面加 `whistle-ssl.` 即可用http来访问https的网站，如：直接在浏览器访问 [http://whistle-ssl.www.baidu.com/](http://whistle-ssl.www.baidu.com/)，等价于访问 [https://www.baidu.com/](http://www.baidu.com/)

	PS：如果服务器需要验证客户端的证书，由于http无法把客户端证书自动带上，所以这种情况下无法将http转成https； Firefox和chrome有一个特性也可能导致无法用这种方式访问，如github，遇到这种情况可以用IE来访问，想了解原因可以参考： [http://blog.csdn.net/lk188/article/details/7221767](http://blog.csdn.net/lk188/article/details/7221767)

3. Hosts配置


	- 传统的hosts配置
		
			#http，https请求都生效(下面配置方式等价)
			127.0.0.1         www.exammple.com
			www.exammple.com  127.0.0.1
			127.0.0.1         www.exammple.com/...
			www.exammple.com/...  127.0.0.1
	
		

	- 加协议限制

			#只对http请求生效(下面配置方式等价)
			127.0.0.1  http://www.exammple.com
			http://www.exammple.com/  127.0.0.1
			127.0.0.1  http://www.exammple.com/...
			http://www.exammple.com/...  127.0.0.1

			#只对https请求生效(下面两种方式等价)
			127.0.0.1  https://www.exammple.com
			https://www.exammple.com  127.0.0.1
			127.0.0.1  https://www.exammple.com/...
			https://www.exammple.com/...  127.0.0.1

	- 支持合并同类项
			
			127.0.0.1 localhost www.test.com www.example.com

	- 正则匹配

			#对所有style.xxx.com请求生效(下面两种方式等价)
			127.0.0.1  /^https:\/\/style\.[\w-]+\.com/
			/^https:\/\/style\.[\w-]+\.com/  127.0.0.1

4. 支持修改请求或响应头部

	- 修改请求和响应头部

			#所有www.example.com都会到D:\test\找与页面名称一致的文件
			#如果对应的文件存在，且能parseJSON，则会根据json结构来修改对应的请求或响应头部
			#下面两种方式等价，也可以用完整url匹配单个文件，且目录后面的斜杠可以省略
			www.example.com head://D:\test
			head://D:\test\ www.example.com

			#也支持限定某段url
			www.example.com/abc head://D:\test
			head://D:\test\ www.example.com/xxx

			#mac、linux: www.example.com head:///xxx
			
		e.g. 文件路径：D:\test\index.html（头部字段名称都为小写）
		
			{
				"req": {
					"referer": "http://www.example.com/xxx"
				},
				"res": {
					"content-type": "text/plain" 
				}
			}

		http://www.example.com/index.html（或http://whistle-ssl.www.example.com/index.html）的请求头的referer及响应头部的content-type都会被修改

	- 模拟3xx、4xx、5xx请求

		e.g. 文件路径：D:\test\index.html（头部字段名称都为小写）
		
			{
				"statusCode": 500,
				"headers": {
					"content-type": "text/html"
				},
				"body": "error"
			}

		http://www.example.com/index.html（或http://whistle-ssl.www.example.com/index.html）将返回500的错误

	- 加协议限制（可以参考hosts配置）


	- 支持合并同类项
			
			head://D:\test\     www.example.com/ www.example2.com/
		

	- 正则匹配


			#下面两种配置等价
			/^https?:\/\/www\.example\.com\/.*/?([^\/]+)($|\?)/i  head://D:\test$1
			head://D:\test\$1 /^https?:\/\/www\.example\.com\/.*/?([^\/]+)($|\?)/

	http://www.example.com/*/xxx.html（或http://whistle-ssl.www.example.com/*/xxx.html）将加载 `D:\test` 目录下面的xxx.html头部配置文件修改头部

5. 配置请求转发规则

	- 本地文件替换

		支持三种协议：file://、xfile://、xsfile://，支持目录匹配，也可以用完整url匹配单个文件，或者正则匹配。其中，三者的区别第一种如果找不到文件则会输出错误信息，第二种如果找不到文件则会自动请求网络的数据，第三种与第二种的区别是请求会以https的形式发出

			#以file协议为例，其它类似（目录后面的斜杠可以省略，规则左右位置可以对调）
			www.example.com  	file://D:\test
			file://D:\test\     www.example.com/
			
			www.example.com/...  	file://D:\test\
			file://D:\test     www.example.com/...

			www.example.com/xxx/yy.html  	file://D:\test\abc.html
			file://D:\test\abc.html     www.example.com/xxx/yy.html



	- 本地模板渲染（模拟jsonp接口）
	
		同上支持三种协议：dust://、xdust://、xsdust://，与上面的区别是dust协议会获取url的请求参数作为context，并通过dustjs模板引擎来渲染指定的本地文件后输出，可以用于jsonp接口的数据模拟

			{callback}({"ec": 0, "em": "success"})

	- 请求转发

			#可以在whistle配置页面配置后，打开浏览器试试效果
			www.test.com sports.sina.com.cn/g/laliga/
			www.test.com/... sports.sina.com.cn/g/laliga/

			#访问http://www.example.com/g/laliga/
			www.example.com sports.sina.com.cn/

			#http转https
			www.baidu.com           https://www.baidu.com/
			#或
			http://www.baidu.com    https://www.baidu.com/

	- 支持合并同类项
			
			file://D:\test\     www.example.com/ www.example2.com/
			#xfile://D:\test\     www.example.com/ www.example2.com/
			#dust://D:\test\     www.example.com/ www.example2.com/
			#xdust://D:\test\     www.example.com/ www.example2.com/

	- 端口映射

		在平时开发测试过程中，由于每台机器只有一个80端口，所以每个应用都会有一个自定义的端口号，为方便访问调试，需要共享80端口

			www.test1.com  www.test1.com:1080
			www.test2.com/...  www.test2.com:2080/xxx
			www.test3.com  www.test2.com:3080/xxx
			www.test4.com/...  www.test2.com:4080


	- 正则匹配

		上述各种配置都支持正则匹配，且可以通过子匹配替换，具体实现与上面的例子类似，不再举例。


	
###功能扩展###


1. 扩展请求转发规则
	
	通过实现express的中间件来扩展功能，可以参考源码的实现，插件加载可以通过启动是whistle是加载进来(多个插件用逗号 `,` 分隔) `whistle start -m xx/x.js,y.js` 或 `whistle restart -m x.js,y.js`
	
2. 自定义UI界面
	
	UI为独立的web应用，它的限制是必须在启动时通过`whistle start -u xxx/index.js` 或 `whistle restart -u xxx/index.js` 加载，并监听whistle传给它的的http或https端口即可，可以参考whistleui的实现。

3. 通过监听事件获取请求数据

	启动UI插件的时候，whistle会传个ui一个proxy对象，每次有请求通过都会触发proxy的proxy事件，并传递给{request: request, response: response}对象，通过监听reques对象的request、data，error、end（或response的response、data，error、end）事件，可以获取请求头、请求数据，响应头、响应数据，及请求出错信息等。