whistle是一个跨平台的web代理工具，支持windows、mac、linux等所有支持nodejs的操作系统，主要用于请求转发、端口转换、本地文件替换、协议转换（http转https）、配置hosts（实时生效，不受dns缓存影响）、且通过支持正则表达式匹配、并集成了天马及独角兽的功能，也可以自定义插件，替换请求（或响应）的头或内容,新增伪协议扩展hosts的功能，自定义ui配置界面，获取抓包数据等等
###安装###

首先要确保操作系统安装了0.10.0及以上的node，执行npm命令安装whistle

	npm install -g whistle

安装结束后，执行命令

C:\Users\xxx>whistle help

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

###启动###

	whistle start

如果默认会使用到以下5个端口：9527（代理端口）、9528（ui的http端口）、9529（ui的https端口）、19528（tianma的http端口）、19529（tianma的https端口），如果端口有冲突，可以根据上面的帮助修改启动的端口号

**重启**

	whistle restart

**停止**

	whistle stop

###配置代理##

	在操作系统配置代理ip: 127.0.0.1，端口：9527(默认是这个端口号，如果启动是修改了whistle port，
	则配置代理的时候换成对应的端口即可)，并勾选上对所有有协议均使用相同的代理服务器

###操作界面###
配置完代理，访问 [http://127.0.0.1:9527/](http://127.0.0.1:9527/),(9527为whistle的默认端口号，如该端口号改了，访问ui的端口号也要同步修改)

###hosts功能###
whistle扩展了传统的hosts功能，增加了端口转换，请求转发，协议转换，本地文件替换，独角兽功能、正则匹配。

1. hosts(映射规则的左右位置可以调换）
	
	支持一般的hosts配置功能，下面配置方式是等价的

		127.0.0.1         www.exammple.com
		127.0.0.1         http://www.exammple.com
		127.0.0.1         www.exammple.com:8080
		www.exammple.com  			127.0.0.1
		http://www.exammple.com  	127.0.0.1
		www.exammple.com:8080  		127.0.0.1

	但不支持：**<del>127.0.0.1  localhost www.test.com www.example.com</del>**这种合并方式

2. 端口转换

	具有反向代理的功能，支持配置端口转发，可以实现端口共享（特别是80端口）

		#把http://www.example.com/*的请求转换为请求http://www.example.com:8080/*
		www.exammple.com         www.example.com:8080

		#同上
		www.example.com:8888     www.example.com:6666

3. 请求转发
		
		#请求http://www.example.com/*将返回http://www.qq.com/test/*的内容
		www.example.com             www.qq.com/test
		
		#请求http://www.example.com:7080/test/*将返回http://www.qq.com:8888/*的内容
		www.example.com:7080/test    www.qq.com:8888

4. 本地文件替换（映射规则的左右位置可以调换）

	有3种本地文件的替换方式，分别通过伪协议file://、 xfile://、 xsfile://来区分
	
	file://协议

		#请求http://www.example.com/*将返回对应文件D:\test\*的内容，
		#如果文件不存在则终止请求
		www.example.com/  	file://D:\test   #也可以用/作为路径分隔符，如file://D:/test
		file://D:\test		www.example.com   #与上面配置方式等价
		
		#linux、mac
		www.example.com/abc  	file:///home/test
		file:///home/test		www.example.com/abc
		
	xfile://协议

		#请求http://www.example.com/*将返回对应文件D:\test\*的内容，
		#如果文件不存在则会自动请求http://www.example.com/*的内容并返回
		www.example.com/  	xfile://D:\test   #也可以用/作为路径分隔符，如file://D:/test
		xfile://D:\test		www.example.com   #与上面配置方式等价
		
		#linux、mac
		www.example.com/abc  	xfile:///home/test
		xfile:///home/test		www.example.com/abc

	xfile://协议(与xfile的区别是如果文件不存在则会发一个https请求去线上获取)

		#请求http://www.example.com/*将返回对应文件D:\test\*的内容，
		#如果文件不存在则会自动请求https://www.example.com/*的内容并返回
		www.example.com/  	xsfile://D:\test   #也可以用/作为路径分隔符，如file://D:/test
		xsfile://D:\test		www.example.com   #与上面配置方式等价
		
		#linux、mac
		www.example.com/abc  	xsfile:///home/test
		xfile:///home/test		www.example.com/abc
	
5. 协议转换（映射规则的左右位置可以调换）
	
	支持http转https请求
	
		#请求http://www.baidu.com/*将返回https://www.baidu.com/*的内容
		www.baidu.com   		https://www.baidu.com/	

		#请求http://www.baidu.com/yyy/*将返回https://www.baidu.com/xxx/*的内容
		http://www.baidu.com/yyy    https://www.baidu.com/xxx

6. 独角兽功能(映射规则的左右位置可以调换）
	配置方式
		
		a.b.c				tianma://D:\htdocs
		tianma://D:\htdocs	a.b.c		 

7. 正则匹配(映射规则的左右位置可以调换）
	
	有些情况我们需要根据url或其参数来映射不同的规则，这种情况我们可以采用js的正则表达式来实现，语法同js的正则语法。

		#所有style.***.com请求的ip为127.0.0.1
		127.0.0.1  			/style\..+\.com/i
		/style\..+\.com/i	127.0.0.1  

		#上面1~6的功能都可以用正则来配置

		#自动拦截请求功能
		/\brap=([^&]+)/			www.rap.com/?id=$1
		#$1~9分别对应js正则的子匹配，如果url里面先保留$n(n=1~9)，
		#可采用www.test.com/?id=\$1，则匹配后的结果为www.test.com/?id=$1

###插件扩展###
1. 自定义ui操作界面

		开发者可用自定义操作界面，启动时指定入口文件如： whistle start -u xxx/index.js，
		whistle会自动调用index.js的exports方法，
		并传入proxy对象，通过该对象可以获取ui的端口号及一些工具类，如操作hosts的工具类；
		还有通过监听传入的proxy对象可以对通过代理的请求进行抓包，
		修改http head，过滤数据等，具体可以参考whistleui的实现

	
3. 扩展hosts功能
	
		通过express中间件的方式实现扩展hosts的伪协议，具体实现参考whistle的./http-proxy.js，
		并通过命令行启动参数**--plugins**时来加载运行多个插件（以逗号分隔）