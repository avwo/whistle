# plugin
从[插件开发](../plugins.html)里面可知，插件里面涉及`uiServer`，`statusServer`，`rulesServer`，`server`，`resRulesServer`共5个内部功能不同的server，这几个server都是可选的；如果存在，插件会把匹配的请求按给定方式传给对应的server，并根据server响应内容做相应的处理，如何把请求转发到插件的各个server？一种方式是直接根据插件的名称设置匹配，比如插件`whistle.abc`：

	pattern abc://value

这样所有匹配`pattern`的请求都会访问插件里面的内置server，这种配置方式比较简单直接，且默认会把请求转发给其中`server`处理(除非在`rulesServer`里面设置了[filter://rule](filter.html))，这种设置方式只能满足要么插件做转发，要么通过`rulesServer`动态设置的规则来做处理。

有些情况，我们需要动态判断请求是否要有插件来做转发，还是直接根据用户设置的[rule](rule/index.html)来处理，这种情况需要用到plugin这个协议：

	pattern plugin://name
	pattern plugin://name(value)
	pattern plugin://name://value

plugin支持上述3种配置方式(位置可以调换)，匹配规则的请求默认只会请求`statusServer`，`rulesServer`，`resRulesServer`，用户可以在这3个server里面获取请求响应信息或动态设置新规则等等。

#### 过滤规则
需要确保whistle是最新版本：[更新whistle](../update.html)

如果要过滤指定请求或指定协议的规则匹配，可以用如下协议：

1. [ignore](./ignore.html)：忽略指定规则
2. [filter](./filter.html)：过滤指定pattern，支持根据请求方法、请求头、请求客户端IP过滤

例子：

```
# 下面表示匹配pattern的同时不能为post请求且请求头里面的cookie字段必须包含test(忽略大小写)、url里面必须包含 cgi-bin 的请求
# 即：过滤掉匹配filter里面的请求
pattern operator1 operator2 filter://m:post filter://h:cookie!=test filter://!/cgi-bin/i

# 下面表示匹配pattern1、pattern2的同时必须为post请求且请求头里面的cookie字段不能包含类似 `uin=123123`、且url里面不能包含 cgi-bin 的请求
operator pattern1 pattern2 filter://m:!post filter://h:cookie=/uin=o\d+/i filter:///cgi-bin/i

# 下面表示匹配pattern的请求忽略除了host以外的所有规则
pattern ignore://*|!host

# 下面表示匹配pattern的请求忽略file和host协议的规则
pattern ignore://file|host
```
