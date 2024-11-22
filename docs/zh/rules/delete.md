# delete

删除指定的请求响应头字段，也可以通过[reqHeaders](reqHeaders.html)、[resHeaders](resHeaders.html)把字段设置为空字符串，配置方式：

	pattern delete://req.headers.xxx|req.headers.x22|res.headers.yyy|query.zzz

pattern参见[匹配方式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

其中：

1. `urlParams.xxx`: 删除请求 url 的参数里面的 `xxx` 字段（可以通过 `delete://urlParams` 删除 url 的所有请求参数）
2. `reqHeaders.xxx`: 删除请求头的 `xxx` 字段
3. `resHeaders.xxx`: 删除响应头的 `xxx` 字段
4. `reqBody`: 删除请求内容 (`版本 >= v2.5.14`)
5. `resBody`: 删除响应内容 (`版本 >= v2.5.14`)
6. `reqBody.xxx.yyy`: 删除请求类型为表单或 JSON 的请求内容里的 `xxx.yyy` 字段  (`版本 >= v2.9.87`)
7. `resBody.xxx.yyy`: 删除响应类型为 JSONP 或 JSON 的响应内容里的 `xxx.yyy` 字段  (`版本 >= v2.9.87`)
8. `reqType`: 删除请求头 `content-type` 里的类型，不包含可能存在的 charset (`版本 >= v2.9.87`)
9. `resType`: 删除响应头 `content-type` 里的类型，不包含可能存在的 charset (`版本 >= v2.9.87`)
10. `reqCharset`: 删除请求头 `content-type` 里可能存在的 charset (`版本 >= v2.9.87`)
11. `resCharset`: 删除响应头 `content-type` 里可能存在的 charset (`版本 >= v2.9.87`)
12. `reqCookies.xxx`: 删除请求头的里面名为 `xxx` 的 cookie (`版本 >= v2.9.34`)
13. `resCookies.xxx`: 删除响应头的里面名为 `xxx` 的 cookie (`版本 >= v2.9.34`)

注意：
1. 上述删除 cookie 操作只会影响请求或响应过程的 cookie，不会影响已存在浏览器的 cookie如果需要修改浏览器上的 cookie 可以通过 [resCookies](./resCookies.html) 设置 cookie 或 [headerReplace](./headerReplace.html) 局部修改
2. 修改 url 可以用 [url映射](./rule/replace.html) 或 [pathReplace](./pathReplace.html)

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
