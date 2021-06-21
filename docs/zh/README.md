# whistle

> Github(欢迎+Star): [https://github.com/avwo/whistle](https://github.com/avwo/whistle)

[whistle](https://github.com/avwo/whistle)(读音[ˈwɪsəl]，拼音[wēisǒu])基于Node实现的跨平台web调试代理工具，类似的工具有Windows平台上的[Fiddler](http://www.telerik.com/fiddler/)，主要用于查看、修改HTTP、HTTPS、Websocket的请求、响应，也可以作为HTTP代理服务器使用，不同于Fiddler通过断点修改请求响应的方式，whistle采用的是类似配置系统hosts的方式，一切操作都可以通过配置实现，支持域名、路径、正则表达式、通配符、通配路径等多种[匹配方式](./pattern.html)，且可以通过Node模块[扩展功能](./plugins.html)：

![基本功能](https://user-images.githubusercontent.com/11450939/122700870-b0de4100-d27e-11eb-8d2a-46e352b49727.png)

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

	完整内容参见：[匹配模式](./pattern.html)
2. **operatorURI** 为对应的操作，由操作协议+操作值组成(`operatorURI = opProtocol://opValue`)：

	**opProtocol**(操作协议)， 对应某类操作，如：

			# 设置请求服务器IP--host
			pattern host://opValue

			# 本地替换--file协议
			pattern file://opValue

	**opValue**(操作值)， 对应具体操作的参数值，如：

			# 设置请求服务器IP--host协议
			pattern host://127.0.0.1:6666 # 或 pattern 127.0.0.1:6666

			# 本地替换--file协议
			pattern file:///User/test/dirOrFile # 或 pattern /User/test/dirOrFile
			pattern file://E:\test\dirOrFile # 或 pattern E:\test\dirOrFile

	完整内容参见：[操作值](./data.html)
3. **pattern** 和 **operatorURI** 在多数情况下位置可以调换，且支持组合模式，具体参见：[配置方式](./mode.html)

# 帮助文档

1. [安装启动](install.md)
* [命令行操作](cli.md)
* [手动更新](update.md)
* [快速上手](quickstart.md)
* [配置方式](mode.md)
* [匹配模式](pattern.md)
* [操作值](data.md)
* [常用功能](frequet.md)
* [插件开发](plugins.md)
* [注意事项](attention.md)
* [常见问题](questions.md)
* [界面功能](webui/README.md)
* [协议列表](rules/README.md)
* [用户反馈](feedback.md)

# License

[MIT](https://github.com/avwo/whistle/blob/master/LICENSE)
