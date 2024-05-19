
# file (xfile)

__xfile功能同file一样，xfile和file的唯一区别是file找不到对应文件返回404，而xfile则是继续请求线上资源。__

替换本地目录或文件，配置方式：

	pattern file://filepath
	# 也可以匹配一个文件或目录路径列表，whistle会依次查找直到找到存在的文件
	pattern file://path1|path2|pathN

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件，pattern参见[匹配方式](../../pattern.html)，更多模式请参考[配置方式](../../mode.html)。

如果pattern为域名或路径，whistle会自动根据请求url后面剩余的路径跟filepath自动补全，即：

	www.test.com/abc file://filpath

则请求`http://www.test.com/abc/index.html`会替换本地的`filepath/index.html`文件，如果不想自动补全可以使用操作符`<>`：

	www.test.com/abc file://<filepath>

这样所有`www.test.com/abc`的子路径都会被`filepath`替换掉，这种情况也可以用正则匹配解决。


例子：

	www.ifeng.com file:///User/xxx/test|/User/xxx/test/index.html
	# Windows的路径分隔符同时支持\和/
	www.ifeng.com file://D:/xxx/test|D:/xxx/test/index.html
	www.ifeng.com file://D:\xxx\test|D:\xxx\test\index.html

所有www.ifeng.com的请求都会先到目录或文件`/User/xxx/test`，没有匹配的文件再到`/User/xxx/test/index.html`

#### 过滤规则
需要确保whistle是最新版本：[更新whistle](../../update.html)

如果要过滤指定请求或指定协议的规则匹配，可以用如下协议：

1. [ignore](../ignore.html)：忽略指定规则
2. [filter](../filter.html)：过滤指定pattern，支持根据请求方法、请求头、请求客户端IP过滤

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
