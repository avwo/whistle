# filter(excludeFilter|includeFilter)
> 以下功能需要把whistle[升级到最新版本](../update.html)

excludeFilter和includeFilter是作为二级条件，用来过滤匹配已匹配的规则,：
1. `excludeFilter`：表示排除匹配的请求
2. `includeFilter`：只保留匹配的请求

```
pattern operatorURI excludeFilter://p1 includeFilter://p2 includeFilter://p3
```
其中：p1、p2、... 可以为匹配模式里面的正则表达式、通配符、通配路径，具体参见：[匹配模式](../pattern.html)，且支持匹配请求头、请求方法、请求IP等

```
pattern operatorURI excludeFilter://p1 includeFilter://p2 includeFilter://!p3
```

上述表示：
```
if (pattern.test(req.url) && (!p1.test(req) || p2.test(req) || !p3.test(req))) {
  // do operatorURI
}

```
即：通过url匹配 `pattern` 的请求，要不能匹配`p1`、或匹配 `p2`、或不匹配 `p3`，后面过滤条件可以任意个。

如：
```
pattern operatorURI1  operatorURIx excludeFilter://*/cgi-bin includeFilter:///test/i excludeFilter://m:options includeFilter://m:get includeFilter://m:/^p/i excludeFilter://m:/^c/ excludeFilter://h:cookie=test excludeFilter://i:127.0.0.1
```

上述表示：
```
if (pattern.test(req.url) && (
  !/^\/cgi-bin(?:[\/?]|$)/.test(req.pathname)
  || /test/i.test(req.url) || req.method.toUpperCase() !== 'OPTIONS'
  || req.method.toUpperCase() === 'GET' || /^p/.test(req.method) ||
  !/^c/.test(req.method) || req.headers.cookie.indexOf('test') !== -1 ||
  req.clientIp !== '127.0.0.1
)) {
 // do operatorURI1 & operatorURIx
}
```

完整匹配条：

1. `m:name`：name为方法名称或正则表达式，表示匹配对应方法
2. `i:ip`：ip表示具体客户(服务)端ip或匹配ip的正则表达式
3. `clientIp:ip`：ip表示具体客户端ip或匹配ip的正则表达式
4. `serverIp:ip`：ip表示具体服务端ip或匹配ip的正则表达式
5. `s:code`：code表示响应状态码，或正则表达式
6. `h:name=pattern`：匹配请求或响应头字段 `name`，pattern为该字段对应值里面的关键字或正则表示
7. `reqH:name=pattern`：同上，但只会匹配请求头
8. `resH:name=pattern`：同上，但只会匹配响应头
9. `*/cgi-*`：表示匹配 `xxx://x.y.z/cgi-.../...`，具体可以参见[pattern](../pattern.html)里面的通配路径
9. `其它字符串`：表示[pattern](../pattern.html)里面的通配符匹配



#### 下面的功能在最新版本(>= v1.13.8)里面已不建议使用，请使用上述协议
<del>
功能与[ignore](./ignore.html)类似，主要用于过滤当前行配置的规则，也可以根据请求头、请求方法、请求IP过滤规则(后面这个要[最新版本的whistle >= v1.12.6](../update.html)才能支持)

配置方式：
```
pattern operatorURI1  operatorURIx filter://regExp1 filter://!regExp1 filter://m:method1 filter://m:!method2 filter://m:!regExp3 filter://m:regExp4 filter://h:cookie=test filter://i:127.0.0.1
```
上述 operatorUI后面的filter表示过滤匹配的请求，只要满足其中的一个就不会匹配该行的规则，这些过滤当前行配的过滤器都支持`取非 !=`、以及正则表达式，其中 `m:xxx` 表示方法为 `xxx`(自动忽略大小写)的请求将不匹配改行规则，如果 `xxx` 为正则表达式也可以；`h:key=value` 表示名为`key`的请求头里面包含 `value`(自动忽略大小写)，如果 `xxx` 为正则表达式也可以；`i:xxx` 表示匹配clientIp，具体功能同上。

如配置：
```
www.test.com/cgi-bin/ file:///home/test/ filter://m:options filter://h:!cookie=5454545  filter:///\/test\//i
www.test.com/cgi-bin/ filter:///home/test/
```
上述`www.test.com/cgi-bin/xxx` 请求的方法如果为 `OPTIONS` 或 cookie里面包含 `5454545`、或url里面包含 `test`，则该请求只会匹配第二条。

支持过滤路径：
```
# 针对路径 http://www.test.com/xxx/yyy/...
www.test.com/xxx file:///hostm/test/ file://*/xxx/yyy
```
</del>



