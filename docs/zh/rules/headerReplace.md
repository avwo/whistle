# headerReplace
通过替换字符的方式修改请求或响应头，配置方式：

	# 通过替换的方式修改请求头
	pattern headerReplace://req.header-name:pattern1=replacement1&pattern2=replacement2
	# 通过替换的方式修改响应头
	pattern headerReplace://res.header-name:pattern3=replacement3

	# 通过替换的方式修改trailers
	pattern headerReplace://trailer.header-name:pattern4=replacement4

	# 也可以
	``` replacement.json
	res.header-name:pattern3: replacement3
	trailer.header-name:pattern4: replacement4
	```
	pattern headerReplace://{replacement.json}

版本要求：`>= v2.5.18`，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.test.com headerReplace://req.cookie:/a(.)/=$1&test=a%20bc headerReplace://res.set-cookie:/\bdomain=[^;]%2b(;|\s*$)/=

> 上述是将所有 `www.test.com` 的请求头cookie字段里面的值的 ax 替换成 x 、test替换成 a bc
> 注意：同时多个 str.replace(p1, r1).replace(p2, r2) 通过 `&` 分开，whistle会通过 querystring.parse的方式转成相应的对象 (会对 `%xx` 进行转义)
> 正则里面的 + 号要用 `%2b` 代替

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
