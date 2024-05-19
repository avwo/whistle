# weinre

weinre可以用于调试远程页面特别是移动端的网页，配置方式：

	pattern weinre://key

key为任意的字符串，主要用于区分页面，pattern参见[匹配方式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

如何使用weinre：

1. 配置手机代理：先把手机的请求代理到whistle，ip为whistle所在机器的ip，端口号为whistle的监听的端口号(默认为：8899)
配置要注入的请求(系统会自动判断是否为html，如果不是则不会自动注入)：

		# xxx为对应的weinre id，主要用于页面分类，默认为anonymous
		www.example.com weinre://xxx
2. 手机打开配置的页面，然后点击 network 页面顶部操作栏的 Weinre 按钮，在下拉列表就可以找到设置的weinre id的，点击会新开一个weinre调试页面，可以开始使用weinre

3. 手机调试或者远程访问时，可能会因为whistle所在机器的防火墙设置，导致无法远程访问，可以通过设置白名单，或者关闭防火墙：[http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html](http://jingyan.baidu.com/article/870c6fc317cae7b03ee4be48.html)

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
