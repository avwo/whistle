# style
> 该协议 v1.15.11 及以上版本才支持

设置Network列表行样式：

	pattern style://color=@fff&fontStyle=italic&bgColor=red

pattern参见[匹配方式](../pattern.html)，更多模式请参考[配置方式](../mode.html)；style可以设置：

1. color: 字体颜色，跟css的color属性一致，但由于Hex颜色值里的 `#` 是whistle的注释符号，这里需要用 `@` 代替。如 `#fff` 需要写成 `@fff`
2. fontStyle: 字体样式，可以设置为 `normal`、`italic`、`oblique` 等
3. bgColor: 对应列表行的背景颜色，具体设置同 `color`

例子：
``` txt
www.test.com style://color=@fff&fontStyle=italic&bgColor=red
```

![效果](https://user-images.githubusercontent.com/11450939/61267997-a8e11100-a7cc-11e9-9c24-fbbba591ae9b.png)

可以同时设置多个 `style` ，后面的会覆盖前面，如果先把前面的属性覆盖掉，可以用 `style://color=`。
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
