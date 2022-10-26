# enable
通过配置开启指定的设置(https拦截、隐藏请求)，配置方式：

```javascript
	pattern enable://https|intercept|hide|abort|gzip|proxyHost|proxyTunnel|h2|safeHtml|strictHtml|clientIp|bigData|useLocalHost|useSafePort|forceReqWrite|forceResWrite|authCapture
```

其中，`pattern`参见[匹配模式](../pattern.html)，`https`或`intercept`(或 `capture`)表示拦截pattern匹配的tunnel请求(如果是https或wss请求需要安装whistle的根证书：[点击这里](../webui/https.html)，拦截后可以查看https请求的具体内容)；`hide`表示隐藏pattern匹配的所有请求，将不显示在[Network](../webui/network.html)上；通过`|`可以同时设置多个操作。

例子：
```javascript
# 拦截url里面有baidu的https请求
/baidu/ enable://intercept

# 拦截域名www.google.com下的所有https请求，且不在Network上显示
www.google.com enable://intercept|hide

# abort掉请求(v1.5.17+)
www.xiaoying.com enable://abort

# gzip本地内容
ke.qq.com file:///User/xxx/test enable://gzip

# 给上游代理设置 hosts(10.10.10.20:8888)
ke.qq.com proxy://10.1.1.1:8080 10.10.10.20:8888 enable://proxyHost

# 通过上游 http 代理(10.1.1.1:8080)将请求转发到指定的 http 代理(10.10.10.20:8080) (>= v2.5.26)
ke.qq.com proxy://10.1.1.1:8080 10.10.10.20:8080 enable://proxyHost|proxyTunnel

# 局部开启 `http2`
ke.qq.com enable://h2

# 在使用 htmlXxx, jsXxx, cssXxx` 注入内容到html页面时，会先判断是否第一个非空白字符不是 `{{` 才会注入 （用于统一给某个域名的页面注入脚本等时，防止一些非标准等接口响应类型设置为 `html` ，导致误注入的问题）
ke.qq.com enable://safeHtml

# 在使用 `htmlXxx, jsXxx, cssXxx` 注入内容到 `html` 页面时，会先判断是否第一个非空白字符是 `<` 才会注入
ke.qq.com enable://strictHtml

# 自动设置 `x-forwarded-for` 请求头
ke.qq.com enable://clientIp

# `Whistle` 默认显示的抓包数据不超过 1.5m，可以通过如下设置扩大到 `2.5m`
ke.qq.com enable://bigData

# 修改 `log` 和 `weinre` 请求 `URL` 的域名或端口
ke.qq.com enable://useLocalHost|useSafePort

# 强制 `reqWrite`、`reqWriteRaw` 和 `resWrite`、`resWriteRaw`
ke.qq.com enable://forceReqWrite|forceResWrite

# 插件的 `auth hook` 默认情况下如果开启了捕获 `https`，则对这部分请求只会对解析后的 `https` 请求生效，如果需要对隧道代理生效可以设置
ke.qq.com enable://authCapture
```
	


#### 过滤规则
需要确保whistle是最新版本：[更新whistle](../update.html)

如果要过滤指定请求或指定协议的规则匹配，可以用如下协议：

1. [ignore](./ignore.html)：忽略指定规则
2. [filter](./filter.html)：过滤指定pattern，支持根据请求方法、请求头、请求客户端IP过滤

例子：

```javascript
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
