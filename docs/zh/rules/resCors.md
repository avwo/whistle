# resCors

修改响应的[cors](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)，配置方式：

	pattern resCors://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	origin: *
	methods: POST
	headers: x-test
	credentials: true
	maxAge: 300000

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，json格式参考[操作值](../data.html)。

一些特性且常用的情形可以用这种方式配置：

	# `*` 表示设置 access-control-allow-origin: *
	www.example.com resCors://*

	#  `enable` 表示设置 access-control-allow-origin: http://originHost
	# 及access-control-allow-credentials: true
	# 可用于script标签上设置为 `crossorigin=use-credentials`的情形
	www.example.com resCors://enable
	# 或
	www.example.com resCors://use-credentials

例子：

	www.ifeng.com resCors://{test-resCors.json}


test-resCors.json:

	origin: *
	methods: POST
	headers: x-test
	credentials: true
	maxAge: 300000

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
