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

#### 过滤规则
需要确保whistle是最新版本：[更新whistle](../update.html)

如果要过滤指定请求或指定协议的规则匹配，可以用如下协议：

1. [ignore](./ignore.html)：忽略指定规则
2. [filter](./filter.html)：过滤指定pattern，支持根据请求方法、请求头、请求客户端IP过滤

例子：

```
# 下面表示匹配pattern的同时不能为post请求且请求头里面的cookie字段必须包含test(忽略大小写)、url里面必须包含 cgi-bin 的请求
# 即：过滤掉匹配filter里面的请求
pattern operator1 operator2 excludeFilter://m:post includeFilter://h:cookie=test includeFilter:///cgi-bin/i

# 下面表示匹配pattern1、pattern2的请求方法为post、或请求头里面的cookie字段不能包含类似 `uin=123123` 且url里面必须包含 cgi-bin 的请求
operator pattern1 pattern2 includeFilter://m:post excludeFilter://h:cookie=/uin=o\d+/i excludeFilter:///cgi-bin/i

# 下面表示匹配pattern的请求忽略除了host以外的所有规则
pattern ignore://*|!host

# 下面表示匹配pattern的请求忽略file和host协议的规则
pattern ignore://file|host
```
