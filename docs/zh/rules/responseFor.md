# responseFor

设置响应头的 `x-whistle-response-for` 字段(`whistle >= v1.7.1`)，主要方便自定义whistle的Network SeverIP显示真实的服务器环境或IP，配置方式：

	pattern responseFor://env

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	# 修改www.ifeng.com请求头的`x-whistle-response-for` 字段为 1.1.1.1
	www.ifeng.com responseFor://1.1.1.1


PS：某些情况下需要通过nigix转发，可以结合[resScript](./resScript.html)把响应头的`x-upstream`字段设置到`x-whistle-response-for`，这样就可以在whistle的Network上看到真实的IP

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
