# disable

用来禁用 cache、cookie、ua、referer、csp、timeout、301、intercept、dnsCache、keepAlive 等 HTTP(s) 请求的一些基本功能，也可以用来阻止通过 HTTPS 代理的请求 `filter://tunnel`。

配置模式：

	pattern disable://operator1|operator2|operatorN

pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

例子：


	# 禁用请求的缓存，只要经过代理且匹配到的请求都不会使用缓存
	# 跟 cache 协议的区别是，cache 只是用来设置响应的缓存头
	wwww.test.com disable://cache

	# 禁用请求和响应的 cookie
	wwww.test.com disable://cookie # 也可以写成复数形式 cookies

	# 只禁用请求的 cookie
	wwww.test.com disable://reqCookie # 也可以写成复数形式 reqCookies

	# 只禁用响应的 cookie
	wwww.test.com disable://resCookie # 也可以写成复数形式 reqCookies

	# 删除 ua
	wwww.test.com disable://ua

	# 删除 referer
	wwww.test.com disable://referer

	# 删除 csp 策略
	wwww.test.com disable://csp

	# 禁用 timeout，默认情况下 whistle 对每个请求如果 36s 内没有发生数据传输，会认为请求超时
	wwww.test.com disable://timeout

	# 把 301 转成 302，防止 cache
	wwww.test.com disable://301

	# 禁用 https 拦截
	wwww.test.com disable://intercept

	# 不缓存远程的 dns(通过 whistle 配置的 host 是不会缓存)，主要用于测试网页的极端情况的加载速度
	wwww.test.com disable://dnsCache

	# 禁用代理服务器请求链接复用
	wwww.test.com disable://keepAlive

	# 删除请求头 `x-requested-with`
	wwww.test.com disable://ajax

	# 也可以同时禁用多个
	www.example.com disable://cache|cookie|ua|referer|csp|timeout|301|intercept|dnsCache|keepAlive
