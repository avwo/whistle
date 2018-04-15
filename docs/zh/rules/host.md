# host

whistle 不仅完全兼容操作系统的 hosts 配置模式，也支持域名、路径、正则三种匹配方式，而且支持配置端口号，配置模式：

1. 传统的 hosts 配置模式：

		ip pattern

		# 组合模式
		ip pattern1 pattern2 patternN

	* 其中，pattern 可以为域名、路径、正则，具体参考 [匹配方式](pattern.md)*

2. whistle 还支持以下配置模式：

		ip pattern
		pattern host://ip
		host://ip pattern

		# 带端口号，whistle 会把请求转发的指定 ip 和端口上
		pattern ip:port
		ip:port pattern

		# 类似 DNS 的 cname
		pattern host://hostname
		pattern host://hostname:port
		host://hostname:port pattern

		# 组合模式
		pattern ip1 operator-uri1 operator-uriN
		host://ip:port pattern1 pattern2 patternN

	* 其中，pattern 可以为域名、路径、正则，具体参考 [匹配方式](rules/pattern.md)*

### 例子：

	# 传统 hosts 配置
	127.0.0.1 www.example.com # 等价于： www.example.com  127.0.0.1
	127.0.0.1 a.example.com b.example.com c.example.com

	# 支持带端口
	127.0.0.1:8080 www.example.com # 等价于： www.example.com  127.0.0.1：8080
	127.0.0.1:8080 a.example.com b.example.com c.example.com

	# 支持通过域名获取 host，类似 DNS 的 cname
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
