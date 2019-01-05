# disable
用来禁用cache、cookie、ua、referer、csp、timeout、301、intercept、dnsCache、keepAlive等HTTP(s)请求的一些基本功能，也可以用来阻止通过HTTPS代理的请求 `filter://tunnel`。

配置方式：

	pattern disable://operator1|operator2|operatorN

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：


	# 禁用请求的缓存，只要经过代理且匹配到的请求都不会使用缓存
	# 跟 cache 协议的区别是，cache 只是用来设置响应的缓存头
	wwww.test.com disable://cache

	# 禁用请求和响应的cookie
	wwww.test.com disable://cookie # 也可以写成复数形式cookies

	# 只禁用请求的cookie
	wwww.test.com disable://reqCookie # 也可以写成复数形式reqCookies

	# 只禁用响应的cookie
	wwww.test.com disable://resCookie # 也可以写成复数形式reqCookies

	# 删除ua
	wwww.test.com disable://ua

	# 删除referer
	wwww.test.com disable://referer

	# 删除csp策略
	wwww.test.com disable://csp

	# 禁用timeout，默认情况下whistle对每个请求如果36s内没有发生数据传输，会认为请求超时
	wwww.test.com disable://timeout

	# 把301转成302，防止cache
	wwww.test.com disable://301

	# 禁用https拦截
	wwww.test.com disable://intercept

	# 不缓存远程的dns(通过whistle配置的host是不会缓存)，主要用于测试网页的极端情况的加载速度
	wwww.test.com disable://dnsCache

	# 禁用代理服务器请求链接复用
	wwww.test.com disable://keepAlive

	# 删除请求头 `x-requested-with`
	wwww.test.com disable://ajax

	# 也可以同时禁用多个
	www.example.com disable://cache|cookie|ua|referer|csp|timeout|301|intercept|dnsCache|keepAlive
