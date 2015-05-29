# whistle

whistle是用node实现的跨平台web调试代理工具，支持windows、mac、linux等操作系统，具有以下功能：

1. 更灵活的hosts配置方式：没有dns缓存、支持域名匹配、路径匹配、正则匹配
2. 设置代理: 把请求代理到其它代理上，如Fiddler、Charles(可以间接实现数据抓包)或其它机器上的whistle等
3. 修改请求: 修改请求头、请求方法、请求内容，延迟发送请求、限制请求速度
4. 自定义响应方式: 更改请求url(替换成其它请求或端口)、本地替换(支持jsonp、目录替换等)
6. 修改响应: 修改响应状态码、响应头、响应内容，延迟响应、限制响应速度
7. 集成手机web调试工具weinre: 直接在pc的chrome浏览器上调试手机上的页面
8. https转http: 利用http请求https
9. *查看请求过程的详细信息(实现中...)*

每个功能对应一个协议，这样每个功能里面的具体每个操作可以抽象成一个uri，并通过配置请求url到每个操作uri的匹配规则，实现操作http[s]请求，且无需重启whistle。

上述功能对应的协议分别为：

1. 设置hosts: 对应的uri为ipv4、6，如 **127.0.0.1**
2. 设置代理： **proxy://ip:port**
3. 修改请求: **req://[filepath|{key}|(value)]**
4. 响应方式: **[http|https|file|xfile|jsonp|xjsonp|...]://path**
5. 修改响应: **res://[filepath|{key}|(value)]**
6. 注入weinre: **weinre://weirneId** (默认为 `weinreid`)

*Note: `[]` 表示可选*

配置方式为：

	pattern operator-uri

*Note: operator-uri 表示操作的uri*

whistle也可以通过实现express中间件的形式扩展功能，也可以作为第三模块集成到其它应用中，这些后面再详细讲，现在我们先让whistle运行起来。

# Installation

whistle是node实现的web调试代理工具，需要我们的机器上先安装了 `v0.10.0` 及以上版本的node，并通过命令行安装启动whistle，再把系统或浏览器的代理指向部署whistle的机器IP(本机为 `127.0.0.1`)及whistle监听的端口号(默认为 `8899` )即可。

### 安装node

如果机器上已经安装了 `v0.10.0` 及以上版本的node，可以忽略此步骤。

windows或mac可以直接访问[https://nodejs.org/](https://nodejs.org/)点击页面中间的 **INSTALL** 按钮下载安装包，下载完毕后默认安装即可。

linux可以参考：[http://my.oschina.net/blogshi/blog/260953](http://my.oschina.net/blogshi/blog/260953)

安装完node后，执行下面命令，查看当前node版本

	$ node -v
	v0.12.0

如果能正常输出node的版本号，表示node已安装成功。

### 安装whistle

执行npm命令 `npm install -g whistle`，开始安装whistle

	$ npm install -g whistle

*Note: 由于whistle需要写本地文件，可能在mac或linux上有访问权限限制，可以使用 `sudo npm install -g whistle`*

whistle安装完成后，执行命令 `whistle help`，查看whistle的帮助信息

	$ whistle help

	  Usage: whistle <command> [options]

	  Commands:
	
	    run       Start a front service
	    start     Start a background service
	    stop      Stop current background service
	    restart   Restart current background service
	    help      Display help information
	
	  Options:
	
	    -h, --help                                      output usage information
	    -r, --rules [rule file path]                    rules file
	    -n, --username [username]                       login username
	    -w, --password [password]                       login password
	    -p, --port [port]                               whistle port(8899 by default
	)
	    -m, --middlewares [script path or module name]  express middlewares path (as
	: xx,yy/zz.js)
	    -u, --uipath [script path]                      web ui plugin path
	    -t, --timneout [ms]                             request timeout(36000 ms by
	default)
	    -s, --sockets [number]                          max sockets
	    -d, --days [number]                             the maximum days of cache
	    -V, --version                                   output the version number
	    -c, --custom <custom>                           custom parameters ("node --h
	armony")
	
如果能正常输出whistle的帮助信息，表示whistle已安装成功。


### 启动whistle

配置完系统或浏览器代理后，可以执行如下命令启动whistle

	$ whistle start


*Note: 1. 如果要防止其他机器访问配置页面，可以在启动时加上登录用户名和密码 `-n yourusername -w yourpassword`；2. 由于whistle需要写本地文件，可能在mac或linux上有访问权限问题，可以使用 `sudo whistle start`*

重启whsitle

	$ whistle restart

停止whistle

	$ whistle stop

如果whistle无法启动，可以执行如下命令启动whistle可以打印出错误信息

	$ whistle run

启动完whistle后，最后一步需要配置代理，并把代理指向whistle。

### 配置代理

######配置信息：

1. IP： 127.0.0.1(如果部署在远程服务器上，把ip改成对应服务器的ip即可)

2. 端口： 8899(默认端口为8899，如果端口被占用，可以在启动是通过 `-p` 来指定新的端口，更多信息可以通过执行命令行 `whistle help` 查看)

3. 勾选上 **对所有协议均使用相同的代理服务器**

######两种代理配置方式(任选其中一个，并把上面配置信息配置上即可)：

1. 直接配置系统代理：　


	1) [Windows](http://jingyan.baidu.com/article/0aa22375866c8988cc0d648c.html) 

	2) [Mac](http://jingyan.baidu.com/article/a378c960849144b3282830dc.html)

2. 安装浏览器代理插件 (**推荐**)

	1) 安装chrome代理插件： [Proxy SwitchySharp](https://chrome.google.com/webstore/detail/proxy-switchysharp/dpplabbmogkhghncfbfdeeokoefdjegm)

	2) 安装firefox代理插件： [Proxy Selector](https://addons.mozilla.org/zh-cn/firefox/addon/proxy-selector/)

配置完代理，用chrome(或safari)访问配置页面 [http://local.whistlejs.com/](http://local.whistlejs.com/)，如果能正常打开页面，whistle安装启动完毕，可以开始使用。

配置页面默认有一个 **Public** 公用分组(Public分组的作用是配置一些公共的信息，whistle会先在自定义的分组里面找匹配的操作，如果没有找到会到Public分组找)，也可以通过左下角的create按钮创建自定义分组，whistle的配置方式跟配置hosts一样，每一行表示一条规则，注释也是使用 `#`。

下面我们开始详细讲下whistle的匹配方式和基本功能。

# 匹配方式

whistle有三种方式匹配请求url分别为：

1. 域名匹配(与端口号无关)

		# 匹配域名www.example.com下的所有请求
		www.example.com operator-uri

		# 匹配域名www.example.com下的所有http请求
		http://www.example.com operator-uri

		# 匹配域名www.example.com下的所有https、ws、wss请求
		https://www.example.com operator-uri

2. 路径匹配
		
		# 匹配请求 http[s]://www.example.com/[dir1/...[/...]]
		www.example.com/[dir1/...]  operator-uri

		# 匹配请求 http://www.example.com/[dir1/...[/...]] 的请求生效
		http://www.example.com/[dir1/...]  operator-uri

		# 匹配请求 https://www.example.com/[dir1/...[/...]] 的请求生效
		https://www.example.com/[dir1/...]  operator-uri


	域名匹配和路径匹配的 `operator-uri` 的协议如果不是http或https，则配置两边的位置可以调换，即： `pattern operator-uri` 等价于 `operator-uri pattern`

3. 正则匹配

	可以利用js的正则表达式匹配请求url

		# 匹配所有包含 www.example.com 的url
		/www\.example\.com/i operator-uri #忽略大小写

	子匹配

		# 某些情况下我们需要获取请求url里面的部分内容放到匹配的uri中，可以采用如下子匹配
		/[^?#]\/([^\/]+)\.html/ protocol://...$1... #最多支持9个子匹配 $1...9
		
		
	正则匹配的两边位置可以调换，即：`regexp-pattern operator-uri` 等价于 `operator-uri regexp-pattern`

*Note: 由于浏览器发出的https请求只能获取去域名，无法获得路径信息，所以浏览器的非http请求只能确保对域名匹配生效，如果要让上述各种匹配方式适用https请求，需要用到下面的https转http的功能，后面再详细讲*

# 基本功能

下面只以 **域名匹配方式** 说明whistle基本功能，**其它匹配方式(路径、正则)也同样适用**，先用本地的文件保存操作的配置信息，后面讲UI操作的时候，再讲如何直接在页面配置。

### 注释

可以用 `#` 来注释

	# 这是注释

### 配置hosts

	127.0.0.1 www.example.com
	www.example.com 127.0.0.1 #等价于 127.0.0.1 www.example.com

	127.0.0.1 www.example1.com www.example2.com www.examplen.com 
	# 等价于：
	127.0.0.1 www.example1.com
	127.0.0.1 www.example2.com
	127.0.0.1 www.examplen.com
	


### 设置代理

	# 把 www.example.com 的请求代理到本机的Fiddler或Charles 
	www.example.com proxy://127.0.0.1:8888
	# 如果没有端口号，则默认为whistle的端口号(默认8899)
	www.example.com proxy://127.0.0.1

### 修改请求

1. 修改请求头

	
	把请求头的user-agent修改为iPhone的UA *Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53*
		
		# mac
		www.aliexpress.com req:///Users/username/test/req.txt
		# windows
		www.aliexpress.com req://D:\username\test\req.txt

	文件 `/Users/username/test/req.txt` 内容:

		{
			"headers": {
				"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53"
			}
		}

2. 修改请求方法

		# mac
		www.ifeng.com req:///Users/username/test/req.txt
		# windows
		www.ifeng.com req://D:\username\test\req.txt

	文件 `/Users/username/test/req.txt` 内容:

		{
			"method": "post"
		}	

3. 替换请求内容

		# mac
		www.aliexpress.com req:///Users/username/test/req.txt
		# windows
		www.aliexpress.com req://D:\username\test\req.txt

	文件 `/Users/username/test/req.txt` 内容:

		{
			"body": "request body"
		}

4. 在请求内容前面添加新的内容

		# mac
		www.aliexpress.com req:///Users/username/test/req.txt
		# windows
		www.aliexpress.com req://D:\username\test\req.txt

	文件 `/Users/username/test/req.txt` 内容:

		{
			"top": "preappend body"
		}

5. 在请求内容后面追加新的内容

		# mac
		www.aliexpress.com req:///Users/username/test/req.txt
		# windows
		www.aliexpress.com req://D:\username\test\req.txt

	文件 `/Users/username/test/req.txt` 内容:

		{
			"bottom": "append body"
		}

6. 延迟请求
	
		# mac
		www.aliexpress.com req:///Users/username/test/req.txt
		# windows
		www.aliexpress.com req://D:\username\test\req.txt

	文件 `/Users/username/test/req.txt` 内容:(单位：ms):

		{
			"delay": 6000
		}

7. 限制速度


		# mac
		www.aliexpress.com req:///Users/username/test/req.txt
		# windows
		www.aliexpress.com req://D:\username\test\req.txt

	文件 `/Users/username/test/req.txt` 内容:(单位：kb/s，千比特/每秒):

		{
			"speed": 20
		}


8. 设置charset

	如果新增的请求内容包含非ascii字符且后台使用的是非utf8编码，需要设置后台处理请求使用的编码charset，不然后台可能获取到乱码

上述可以功能可以同时作用同一个请求：

文件 `/Users/username/test/req.txt` 内容:

	{
		"method": "post",
		"headers": {
			"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 7_0 like Mac OS X; en-us) AppleWebKit/537.51.1 (KHTML, like Gecko) Version/7.0 Mobile/11A465 Safari/9537.53"
		},
		"top": "preappend body",
		"body": "request body",
		"bottom": "append body",
		"delay": 6000,
		"speed": 20
	}

### 修改响应

1. 修改响应头

	
	把响应头的content-type改为"text/plain"
		
		# mac
		www.aliexpress.com req:///Users/username/test/res.txt
		# windows
		www.aliexpress.com req://D:\username\test\res.txt

	res.txt:

		{
			"headers": {
				"content-type": "text/plain"
			}
		}

2. 修改响应状态码(如果设置了statusCode，请求将不会发送到对应的服务器，whistle将直接按状态码响应后返回给浏览器，利用此功能可以用来模拟 4xx、5xx等响应)

		# mac
		www.ifeng.com req:///Users/username/test/res.txt
		# windows
		www.ifeng.com req://D:\username\test\res.txt

	res.txt:

		{
			"statusCode": "404",
			"body": "Not Found"
		}	

3. 替换响应内容

		# mac
		www.aliexpress.com req:///Users/username/test/res.txt
		# windows
		www.aliexpress.com req://D:\username\test\res.txt

	res.txt:

		{
			"body": "response body"
		}

4. 在响应内容前面添加新的内容

		# mac
		www.aliexpress.com req:///Users/username/test/res.txt
		# windows
		www.aliexpress.com req://D:\username\test\res.txt

	res.txt:

		{
			"top": "preappend body"
		}

5. 在响应内容后面追加新的内容(可用于注入脚本等)

		# mac
		www.aliexpress.com req:///Users/username/test/res.txt
		# windows
		www.aliexpress.com req://D:\username\test\res.txt

	res.txt:

		{
			"bottom": "append body"
		}

6. 延迟响应
	
		# mac
		www.aliexpress.com req:///Users/username/test/res.txt
		# windows
		www.aliexpress.com req://D:\username\test\res.txt

	res.txt(单位：ms):

		{
			"delay": 6000
		}

7. 限制响应速度


		# mac
		www.aliexpress.com req:///Users/username/test/res.txt
		# windows
		www.aliexpress.com req://D:\username\test\res.txt

	res.txt(单位：kb/s，千比特/每秒):

		{
			"speed": 20
		}


8. 设置charset

	如果新增的响应内容包含非ascii字符且响应内容非utf8编码，需要设置响应内容的charset，否则浏览器可能显示乱码

上述可以功能可以同时作用域任何响应：

res.txt:

	{
	
		"headers": {
			"content-type": "text/plain"
		},
		"top": "preappend body",
		"body": "request body",
		"bottom": "append body",
		"delay": 6000,
		"speed": 20
	}

### 自定义响应方式

1. 请求替换

	1). 端口转发

		www.example.com www.example.com:8888
		www.qq.com:8888 www.qq.com
		

		
	2). 请求转发

		www.example.com www.qq.com
		http://www.baidu.com https://www.baidu.com
		

2. 替换本地文件

		# www.example.com[/...] 的请求会替换成文件 /Users/username/test[/...] 的内容
		#如果文件找不到返回500
		# mac
		www.example.com file:///Users/username/test
		# windows
		www.example.com file://D:\username\test

		#如果文件找不到会把直接请求线上
		# mac
		www.example.com xfile:///Users/username/test
		# windows
		www.example.com xfile://D:\username\test

3. 模拟jsonp请求

		#www.test.com/... 的请求会替换成文件 /Users/username/test[/...] 的内容.
		#且用url里面的querystring参数替换文件内容里面的{key}
		#如果文件找不到返回500
		#mac
		www.test.com jsonp:///Users/username/test
		#windows
		www.test.com jsonp://D:\username\test

		#如果文件找不到会把直接请求线上
		#mac
		www.test.com xjsonp:///Users/username/test
		#windows
		www.test.com xjsonp://D:\username\test

	文件内容示例:

		{callback}({"ec": 0, "em": "success"})
 


### 调试手机web页面

什么是weinre： [http://blog.csdn.net/dojotoolkit/article/details/6280924](http://blog.csdn.net/dojotoolkit/article/details/6280924)

whistle内置了weinre，无需再重新安装weinre、注入weinre的js，只需：

1. 配置手机代理，ip为运行whistle的机器的ip，端口为whistle的端口号

2. 在配置页面[http://local.whistlejs.com/](http://local.whistlejs.com/)上配置如下规则：

		m.aliexpress.com weinre://xxx  # xxx为对应的weinre id

3. 用手机打开 [http://m.aliexpress.com/](http://m.aliexpress.com/) 页面后，在pc用chrome打开[http://weinre.local.whistlejs.com/client/#xxx](http://weinre.local.whistlejs.com/client/#xxx)，可以开始用pc调试对应的手机页面。

有些端口系统默认其它机器无法访问，这个时候需要在防火墙上配置入站规则，允许其它机器访问whistle的端口，参考： [http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html](http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html)

*Note: windows按住Ctrl键、mac按住Command键，用鼠标点击 `weinre://xxx` 可以快速打开weinre调试页面*


### https转http

在https请求的host前面加 whistle-ssl. 即可用http来访问https的网站，如：直接在浏览器访问  http://whistle-ssl.www.baidu.com/ ，等价于访问 https://www.baidu.com/ ，这样上面的各种功能也可以应用到https请求上。


*Note: 如果服务器需要验证客户端的证书，由于http无法把客户端证书自动带上，这种情况下无法将https转成http； Firefox和chrome有一个特性也可能导致无法用这种方式访问，如github，遇到这种情况可以用IE来访问，想了解原因请参考： http://blog.csdn.net/lk188/article/details/7221767*

### 查看请求匹配的规则及服务器ip

由于浏览器配置了代理导致调试工具中抓包数据的真实ip被隐藏，whistle把服务器ip，匹配的规则通过响应头返回，详情可以看请求响应头。

# UI操作

注意[配置页面](http://local.whistlejs.com/)左下角的的Create按钮和右上角的Settting、More按钮。

上面每个操作的配置信息都是写在本地的文件，会给使用配置带来一定麻烦，可以借助操作符 `{}`、 `()` 来解决；

在自定义响应方式的时候，whistle会自动根据请求的url拼接operator-uri：

	www.example.com xfile://D:\test\index.html

请求 http://www.example.com/index.html 会去加载文件 D:\test\index.html\index.html ，某些情况我们可能不想让它自动拼接，可以借助操作符 `<>` 来解决

下面详细讲下`{}`、`()`、`<>`三个操作符的作用

### `{}` 操作符

打开[配置页面](http://local.whistlejs.com/)右上角的More --> Values对话框，这是一个key-value配置系统，创建一个key: index.html，并随便写上一段html；

配置规则：

	www.qq.com res://{index.html}

*Note: windows安装Ctrl键(Mac可以安装Command键)，点击配置框里面的 `res://{index.html}`，可以快速打开Values对话框并创建或定位到对应的key*

### `()` 操作符

	可以通过 `()` 直接在[配置页面](http://m.aliexpress.com/)上设置value	

	www.qq.com res://({"delay":6000,"body":"1234567890"}) # () 里面不能有空格

### `<>` 操作符

在做本地替换时，whistle会自动进行路径拼接：	

	www.aliexpress.com xfile://</Users/index.html>

上述配置后请求 http://www.aliexpress.com/index.html 会直接加载本地的 /Users/index.html 文件，不会再自动做url拼接。


# 查看请求过程的详细信息(v0.2.0及以上版本实现)
实现中...

# 扩展功能

### 插件扩展

通过实现express的中间件扩展功能，可以参考源码的实现，插件加载可以通过启动是whistle是加载进来(多个插件用逗号 , 分隔) `whistle start -m xx/x.js,y.js`

### 作为第三方模块使用(可以集成到自己的开发环境中)
参考aeproxy的实现: [https://github.com/avwo/aeproxy](https://github.com/avwo/aeproxy)

### 自定义UI界面

参考whistleui的实现: [https://github.com/avwo/whistleui](https://github.com/avwo/whistleui)

加载自定义ui：

`npm install -g whistleui` 安装whistleui后， 启动是通过 `whistle start -u whistleui` 加载新的ui

### 更多帮助，请执行命令：

	$ whistle help

或者加QQ群： 462558941
	


