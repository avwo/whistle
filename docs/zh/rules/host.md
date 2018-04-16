# host
whistle不仅完全兼容操作系统的hosts配置方式，也支持域名、路径、正则三种匹配模式，而且支持配置端口号，配置方式：

1. 传统的hosts配置方式：

		ip pattern

		# 组合模式
		ip pattern1 pattern2 patternN

	*其中，pattern可以为域名、路径、正则，具体参考[匹配模式](../pattern.html)*

2. whistle还支持以下配置方式：

		ip pattern
		pattern host://ip
		host://ip pattern

		# 带端口号，whistle会把请求转发的指定ip和端口上
		pattern ip:port
		ip:port pattern

		# 类似DNS的cname
		pattern host://hostname
		pattern host://hostname:port
		host://hostname:port pattern

		# 组合模式
		pattern ip1 operatorURI1 operatorURIN
		host://ip:port pattern1 pattern2 patternN

	*其中，pattern可以为域名、路径、正则，具体参考[匹配模式](pattern.html)*

### 例子：

	# 传统hosts配置
	127.0.0.1 www.example.com # 等价于： www.example.com  127.0.0.1
	127.0.0.1 a.example.com b.example.com c.example.com

	# 支持带端口
	127.0.0.1:8080 www.example.com # 等价于： www.example.com  127.0.0.1：8080
	127.0.0.1:8080 a.example.com b.example.com c.example.com

	# 支持通过域名获取host，类似DNS的cname
	host://www.qq.com:8080 www.example.com # 等价于： www.example.com  host://www.qq.com:8080
	host://www.qq.com:8080 a.example.com b.example.com c.example.com

	# 支持通过正则表达式匹配
	127.0.0.1:8080 /example\.com/i # 等价于： /example\.com/i  127.0.0.1：8080
	127.0.0.1:8080 /example\.com/ /test\.com/

	# 支持路径匹配
	127.0.0.1:8080 example.com/test # 等价于： example.com/test 127.0.0.1：8080
	127.0.0.1:8080 http://example.com:5555/index.html www.example.com:6666 https://www.test.com/test

	# 支持精确匹配
	127.0.0.1:8080 $example.com/test # 等价于： $example.com/test 127.0.0.1：8080
	127.0.0.1:8080 $http://example.com:5555/index.html $www.example.com:6666 $https://www.test.com/test
