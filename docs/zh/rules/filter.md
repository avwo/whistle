# filter
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



