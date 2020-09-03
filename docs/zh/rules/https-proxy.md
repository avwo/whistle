# https-proxy
> 如果需要用到该协议，建议 Node >= 10 ，否则可能出现 whistle 无异常退出，新版本 Node 不会有这个问题 

设置https代理（即用https代理协议，也支持[socks代理](socks.html)、[http代理](proxy.html)），配置方式：

	pattern https-proxy://ip:port

	# 加用户名密码
	pattern https-proxy://username:password@ip:port

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。


例子：

把所有请求代理到`127.0.0.1:8888`的代理服务器：

	* https-proxy://127.0.0.1:8888
	www.facebook.com https-proxy://test:123@127.0.0.1:8888

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
