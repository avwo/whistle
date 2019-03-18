# plugin
从[插件开发](../plugins.html)里面可知，插件里面涉及`uiServer`，`statsServer`，`rulesServer`，`server`，`resRulesServer`，`resStatsServer`共6个功能不同的内部server，这几个server都是可选的；如果存在，插件会把匹配的请求按给定方式传给对应的server，并根据server响应内容做相应的处理，把请求转发到插件的各个server，有两种配置方式：

一种方式是直接根据插件的名称设置匹配，比如插件`whistle.abc`：

	pattern abc://value

这样所有匹配`pattern`的请求都会访问插件里面的`statsServer`，`rulesServer`，`server`，`resRulesServer`，`resStatsServer`中实现的server，这种配置默认会把请求转发给其中`server`处理(除非在`rulesServer`里面设置了[filter://abc](filter.html))，这种配置归类于[rule](./rule/)。

另外一直方式：
```
pattern whistle.abc://value
```
这种配置默认只会访问插件里面的 `statsServer`，`rulesServer`，`resRulesServer`，`resStatsServer`中实现的server，这类配置才属于 `plugin` 协议类型。

> 具体参见：[插件开发](../plugins.html)

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
