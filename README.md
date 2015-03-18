whistle是用nodejs实现的跨平台web代理工具，支持windows、mac、linux等能安装nodejs的操作系统。主要用于http转https（利用http调试https页面）、配置hosts（实时生效，没有dns缓存）、请求转发、端口转发（访问开发环境的页面无需输端口号）、本地文件替换、并集成了天马及独角兽的功能、且支持正则匹配。通过自定义插件的形式过滤修改请求（响应）的头或内容，新增伪协议扩展功能（如支持vm，dustjs等模板引擎功能），自定义UI配置界面，获取浏览器请求数据等等

###安装###

首先要确保操作系统已安装了**0.10.0**及以上版本的[nodejs](https://nodejs.org/download/)

执行npm命令安装whistle

	npm install -g whistle

安装结束后，执行命令

C:\Users\xxx>**whistle help**

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

重启

	whistle restart

停止

	whistle stop

默认启动whistle会占用以下5个端口：9527（代理端口）、9528（ui的http端口）、9529（ui的https端口）、19528（tianma的http端口）、19529（tianma的https端口），如果端口有冲突，可以根据上面的帮助信息修改启动的端口号


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

打开 [http://127.0.0.1:9527/](http://127.0.0.1:9527/)（9527为对应的代理端口号）可以开始配置各种hosts。

###hosts功能###

whistle对系统的hosts功能进行了扩展，支持原有hosts功能的基础上增加了http转https、请求转发、端口转发、本地文件替换、并集成了天马及独角兽的功能、且支持正则匹配等

1. http转https

	有两种方式可以让http请求转为https请求
	
	1）在配置页面做如下配置

		www.baidu.com           https://www.baidu.com/
		#或
		http://www.baidu.com    https://www.baidu.com/

	使用这种方式访问https，whistle不会自动修改页面里面的https协议，且如果请求已经被301到https了，浏览器将自动把http转成https，导致浏览器地址栏显示的是https，这种方式限制比较多，推荐使用下面的方式

	2）直接请求http://whistle-ssl.github.com/，利用这种方式相当于请求https://github.com，且whistle会自动把页面里面的https://xxx自动转成http://whistle-ssl.xxx。
	
	这种方式也存在一些问题：由于http不会自动把对应的证书带到服务端，如果对应的https请求需要验证客户端证书，可能导致请求失败；还有一个HSTS的问题，导致浏览器会把对应域名及子域名自动转成https请求（如github）：http://blog.csdn.net/lk188/article/details/7221767，后面这种属性目前只有chrome和firefox支持，因此遇到这种问题可以用IE浏览器访问
	

2. hosts（映射规则的左右位置可以调换）
	
	支持一般的hosts配置功能，下面配置方式是等价的

		#http，https请求都生效
		127.0.0.1         www.exammple.com
		www.exammple.com  127.0.0.1
		
		#只对http请求生效
		127.0.0.1         		  http://www.exammple.com
		http://www.exammple.com   127.0.0.1         
		
		#只对https请求生效
		127.0.0.1         		  https://www.exammple.com
		https://www.exammple.com   127.0.0.1
		

	不支持：**<del>127.0.0.1  localhost www.test.com www.example.com</del>**这种合并方式

3. 请求转发

	类似服务器端跳转的功能，可以对某个请求用其它请求数据替换

		
		#请求http(s)://www.example.com/*将返回http(s)://www.qq.com/*的内容
		www.example.com             www.qq.com

		#请求http://www.example.com/*将返回http://www.qq.com/*的内容（下面两种方式等价）
		http://www.example.com             http://www.qq.com
		http://www.example.com             www.qq.com

		#请求https://www.example.com/*将返回https://www.baidu.com/*的内容
		https://www.example.com             https://www.baidu.com
		https://www.example.com             www.baidu.com
		
	

4. 端口转发

	具有反向代理的功能，支持配置端口转发，可以实现端口共享（特别是80端口），通过端口转换，我们不需要再浏览器地址上输入端口号即可访问非80端口的网址

		#请求http(s)://www.test.com/*将返回http(s)://www.test.com:8080/*的内容
		www.test.com         www.test.com:8080

		#请求http://www.test.com:7080/*将返回http://www.test.com:8080/*的内容
		http://www.test.com:7080             http://www.test.com:8080
		http://www.test.com:7080             www.test.com:8080

		#请求https://www.test.com:7080/*将返回https://www.test.com:8080/*的内容
		https://www.test.com             https://www.test.com:8080
		https://www.test.com             www.test.com:8080



5. 本地文件替换（映射规则的左右位置可以调换）

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

	xsfile://协议(与xfile的区别是如果文件不存在则会发一个https请求去线上获取)

		#请求http://www.example.com/*将返回对应文件D:\test\*的内容，
		#如果文件不存在则会自动请求https://www.example.com/*的内容并返回
		www.example.com/  	xsfile://D:\test   #也可以用/作为路径分隔符，如file://D:/test
		xsfile://D:\test		www.example.com   #与上面配置方式等价
		
		#linux、mac
		www.example.com/abc  	xsfile:///home/test
		xfile:///home/test		www.example.com/abc
	

6. 独角兽功能(映射规则的左右位置可以调换）
	配置方式
		
		a.b.c				tianma://D:\htdocs
		tianma://D:\htdocs	a.b.c		 

7. 正则匹配(映射规则的左右位置可以调换）
	
	有些情况我们需要根据url或其参数来映射不同的规则，这种情况我们可以采用js的正则表达式来实现，语法同js的正则语法。上面1~6的配置功能也都可以设置正则匹配。

		#所有style.***.com请求的ip为127.0.0.1
		127.0.0.1  			/style\..+\.com/i
		/style\..+\.com/i	127.0.0.1  

		#自动拦截请求功能
		/\brap=([^&]+)/			www.rap.com/?id=$1
		#$1~9分别对应js正则的子匹配，如果url里面想保留$n(n=1~9)，
		#可采用转义字符：www.test.com/?id=\$1匹配后的结果为www.test.com/?id=$1

###扩展功能###
1. 自定义ui操作界面

		开发者可用自定义操作界面，启动时指定入口文件如： whistle start -u xxx/index.js，
		whistle会自动调用index.js的exports出来的方法，
		并传入proxy对象，通过该对象可以获取ui的端口号及一些工具类，如操作hosts的工具类；
		还有通过监听传入的proxy对象可以对通过代理的请求进行抓包，
		修改http head，过滤数据等，具体可以参考whistleui的实现

	
3. 扩展hosts功能
	
		通过express中间件的方式实现扩展hosts的伪协议，
		并通过命令行启动参数**--plugins**时来加载运行多个插件（以逗号分隔），
		具体实现参考whistle的./http-proxy.js