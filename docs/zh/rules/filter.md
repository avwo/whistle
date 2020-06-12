# filter (excludeFilter|includeFilter)
> 以下功能需要把whistle(`>= v2.4.3`)[升级到最新版本](../update.html)

excludeFilter和includeFilter是作为二级条件，用来过滤匹配已匹配的规则：

1. `excludeFilter`：表示排除匹配的请求
2. `includeFilter`：只保留匹配的请求

```
pattern operatorURI excludeFilter://p1 includeFilter://p2 includeFilter://p3
```
其中：p1、p2、... 可以为匹配模式里面的正则表达式、通配符、通配路径，具体参见：[匹配模式](../pattern.html)，且支持匹配请求头、请求方法、请求IP等

```
pattern operatorURI excludeFilter://p0 excludeFilter://p1 includeFilter://p2 includeFilter://p3
```

上述表示：
```js
匹配：!(p0 || p1) && (p2 || p3)
```
即：通过url匹配 `pattern` 的请求，要不能匹配`p1`、或匹配 `p2`、或不匹配 `p3`，后面过滤条件可以任意个。

如：
```
pattern operatorURI1  operatorURIx excludeFilter://*/cgi-bin includeFilter:///test/i excludeFilter://m:options includeFilter://m:get includeFilter://m:/^p/i excludeFilter://m:/^c/ excludeFilter://h:cookie=test excludeFilter://i:127.0.0.1
```

完整匹配条：

1. `b:pattern`：pattern为正则或关键字，表示匹配请求内容
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

### 例子
``` txt
www.test.com/path/to file:///Usr/test/ excludeFilter://*/path/to/abc/cgi-bin includeFilter://*/path/to/abc/ includeFilter://b:test
```

