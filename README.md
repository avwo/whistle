# whistle
[![node version](https://img.shields.io/badge/node.js-%3E=_0.10-green.svg?style=flat)](http://nodejs.org/download/)
[![NPM count](https://img.shields.io/npm/dt/whistle.svg?style=flat)](https://www.npmjs.com/package/whistle)
[![License](https://img.shields.io/npm/l/whistle.svg?style=flat)](https://www.npmjs.com/package/whistle)

> whistle@0.9.0及以上版本修复了[启用HTTPS](https://github.com/avwo/whistle/wiki/启用HTTPS)后POST请求可能失败的问题，建议大家[更新到最新版本](https://github.com/avwo/whistle/wiki/更新whistle)，变更点请查看：[CHANGELOG](https://github.com/avwo/whistle/blob/master/CHANGELOG.md#-)

# 目录

1. [概述](#概述)
2. [安装](#安装)
3. [使用方法](#使用方法)

### 概述

whistle是用node实现的跨平台web调试代理工具，支持windows、mac、linux等操作系统，支持操作http、https、websocket请求，查看请求数据等，可以部署在本地电脑、虚拟机、或远程服务器，并通过本地浏览器访问whistle的配置页面，查看操作请求；内置 `weinre` 支持移动端页面调试，且通过log模块可以自动获取页面js错误、查看console打印出来的数据及注入自定义的js手动调试页面，有以下主要特点(详细内容请参考：[使用方法](https://github.com/avwo/whistle/wiki))：

1. 简单自然的配置方式，把每个规则抽象成一个uri，并通过配置请求url到规则uri，实现对请求的操作
	
	-  匹配方式 --> 操作规则

			pattern   operator-uri 

	- 如果 `pattern` 和 `operator-uri` 其中有一个不是http[s]、ws[s]协议，则两个的位置可以调换
		
			operator-uri pattern

2. 灵活的匹配方式(**pattern**)，支持三种[匹配方式](https://github.com/avwo/whistle/wiki/%E5%8C%B9%E9%85%8D%E6%96%B9%E5%BC%8F)：
	- 域名匹配：把规则作用于所有该域名的请求
	- 路径匹配：把规则作用于该路径或该路径的子路径
	-. 正则匹配：通过正则匹配规则，支持通过子匹配把请求url里面的参数带到新的url

3. 丰富的操作规则，通过简单类hosts的映射配置，可以实现如下功能(完整功能请参考：[功能列表](https://github.com/avwo/whistle/wiki/功能列表))：

	- 配置host
	- 修改请求，包括： 请求方法、请求头、修改内容、延迟发送请求、限制请求速度，设置timeout
	- 修改响应，包括： 响应状态码、响应头、修改内容、 延迟响应、 限制响应速度
	- 替换请求： 
		- 替换本地文件(支持替换jsonp请求)
		- 设置代理(支持http、socks代理)
		- 请求转发
		- 通过插件扩展
	- 内置weinre，通过weinre可以修改手机端或远程网页的DOM结构，调试页面等
	- 设置过滤，用于过滤一些已设置的规则([filter](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#filter)、[disable](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#disable))
	- 导出数据：[exports](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#exports)、[exportsUrl](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#exportsurl)、[reqWrite](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#reqwrite)、[resWrite](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#reswrite)、[reqRawWrite](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#reqrawwrite)、[resRawWrite](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#resrawwrite)
	- 自定义脚本修改url的请求参数，实现动态匹配规则的功能：[dispatch](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#dispatch)
	- 支持自动捕获手机端或远程页面的js异常，且可以嵌入脚本打印console等：[log](https://github.com/avwo/whistle/wiki/%E5%8A%9F%E8%83%BD%E5%88%97%E8%A1%A8#log)、[界面操作](https://github.com/avwo/whistle/wiki/%E7%95%8C%E9%9D%A2%E6%93%8D%E4%BD%9C)
	

4. 友好的[配置页面](https://github.com/avwo/whistle/wiki/界面操作)，支持配置分组，高亮显示，可以把规则内容配置的ui的values系统里面，无需用本地文件承载，查看请求信息，重发请求，构造请求:

	- 配置页面：[http://local.whistlejs.com/](http://local.whistlejs.com/)
		
		![Rules](https://raw.githubusercontent.com/avwo/whistleui/master/img/rules.png)

	- 请求列表：[http://local.whistlejs.com/index.html](http://local.whistlejs.com/index.html)

		![Network](https://raw.githubusercontent.com/avwo/whistleui/master/img/network.png)
		
更多功能请查看：[https://github.com/avwo/whistle/wiki](https://github.com/avwo/whistle/wiki)


下面先讲下如何安装启动whistle，然后再对上述功能给出一些例子。

# 安装

安装启动whistle，需要以下四个步骤： **安装node**、**安装whistle**、**启动whistle**、**配置代理**。

### 安装node

如果你的机器上已经安装了 `v0.10.0` 及以上版本的node(推荐安装最新的node版本)，可以忽略此步骤。

windows或mac可以直接访问[https://nodejs.org/](https://nodejs.org/)点击页面中间的 **INSTALL** 按钮下载安装包，下载完毕后默认安装即可。

linux可以参考（推荐使用源码安装）：[http://my.oschina.net/blogshi/blog/260953](http://my.oschina.net/blogshi/blog/260953)

安装完node后，执行下面命令，查看当前node版本

	$ node -v
	v0.12.7

如果能正常输出node的版本号，表示node已安装成功。

### 安装whistle

执行npm命令 `npm install -g whistle`，开始安装whistle （**mac或linux用户，如果安装过程出现异常，可以使用 `sudo npm install -g whistle`安装，下面命令类同，如果max或linux用户执行命令过程出现异常信息，都在命令前面加个 `sudo`**）

	$ npm install -g whistle
	
npm默认镜像是在国外，有时候安装速度很慢或者出现安装不了的情况，如果无法安装或者安装很慢，可以使用taobao的镜像安装：

	$ npm install cnpm -g --registry=https://registry.npm.taobao.org
	
安装成功后，直接执行：

	$ cnpm install -g whistle
	
*mac或linux用户，如果安装过程出现异常，可以使用 `sudo cnpm install -g whistle`安装*


whistle安装完成后，执行命令 `whistle help` (`v0.7.0`及以上版本也可以使用`w2 help`)，查看whistle的帮助信息

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
	    -d, --debug [debug]                             debug mode
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
	    -V, --version                                   output the version number
	    -c, --custom <custom>                           custom parameters ("node --h
	armony")

	
如果能正常输出whistle的帮助信息，表示whistle已安装成功。


### 启动whistle

执行如下命令启动whistle (`v0.7.0`及以上版本也可以使用`w2 start`)

	$ whistle start


*Note: 如果要防止其他机器访问配置页面，可以在启动时加上登录用户名和密码 `-n yourusername -w yourpassword`。*

重启whsitle (`v0.7.0`及以上版本也可以使用`w2 restart`)

	$ whistle restart

停止whistle (`v0.7.0`及以上版本也可以使用`w2 stop`)

	$ whistle stop

如果whistle无法启动，可以执行如下命令启动whistle可以打印出错误信息 (`v0.7.0`及以上版本也可以使用`w2 run`)

	$ whistle run

启动完whistle后，最后一步需要配置代理，并把代理指向whistle。

### 配置代理

######配置信息：

1. IP： 127.0.0.1(如果部署在远程服务器或虚拟机上，把ip改成对应服务器或虚拟机的ip即可)

2. 端口： 8899(默认端口为8899，如果端口被占用，可以在启动是通过 `-p` 来指定新的端口，更多信息可以通过执行命令行 `whistle help` (`v0.7.0`及以上版本也可以使用`w2 help`) 查看)

3. 勾选上 **对所有协议均使用相同的代理服务器**

######两种代理配置方式(任选其中一个，并把上面配置信息配置上即可)：

1. 直接配置系统代理：　


	1) [Windows](http://jingyan.baidu.com/article/0aa22375866c8988cc0d648c.html) 

	2) [Mac](http://jingyan.baidu.com/article/a378c960849144b3282830dc.html)

2. 安装浏览器代理插件 (**推荐**)

	1) 安装chrome代理插件： [whistle管理插件](https://github.com/avwo/whistle-for-chrome#whistle-for-chrome) 或者 [Proxy SwitchySharp](https://chrome.google.com/webstore/detail/proxy-switchysharp/dpplabbmogkhghncfbfdeeokoefdjegm)

	2) 安装firefox代理插件： [Proxy Selector](https://addons.mozilla.org/zh-cn/firefox/addon/proxy-selector/)
	

### 访问配置页面
启动whistle及配置完代理后，用chrome(或safari)访问配置页面 [http://local.whistlejs.com/](http://local.whistlejs.com/)或请求列表页面[http://local.whistlejs.com/index.html](http://local.whistlejs.com/index.html)，如果能正常打开页面，whistle安装启动完毕，可以开始使用。

*Note: 也支持直接用ip访问配置页面： [http://whistleServerIP:whistlePort/](http://127.0.0.1:8899)*


至此，whistle已经安装启动配置完毕，匹配方式、规则配置、ui操作、查看抓包数据、重发请求、构造请求等功能请参考：

# [使用方法](https://github.com/avwo/whistle/wiki)

[https://github.com/avwo/whistle/wiki](https://github.com/avwo/whistle/wiki)

目录

1. [**功能列表**](https://github.com/avwo/whistle/wiki/功能列表)
2. [界面操作](https://github.com/avwo/whistle/wiki/界面操作)
3. [配置模式](https://github.com/avwo/whistle/wiki/配置模式)
4. [匹配方式](https://github.com/avwo/whistle/wiki/匹配方式) 
5. [启用HTTPS](https://github.com/avwo/whistle/wiki/启用HTTPS)
6. [JSON格式](https://github.com/avwo/whistle/wiki/JSON格式)
7. [更新whistle](https://github.com/avwo/whistle/wiki/更新whistle)
8. [老版本手册(供参考)](https://github.com/avwo/whistle/wiki/老版本手册)
9. [CHANGELOG](https://github.com/avwo/whistle/blob/master/CHANGELOG.md)
10. [自定义插件](https://github.com/avwo/whistle/wiki/自定义插件)



有什么问题可以通过QQ群反馈： 462558941
	


