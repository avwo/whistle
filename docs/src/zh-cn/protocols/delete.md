# delete

删除指定的请求响应头字段，也可以通过 [reqHeaders](reqHeaders.html)、[resHeaders](resHeaders.html) 把字段设置为空字符串，配置模式：

	pattern delete://req.headers.xxx|req.headers.x22|res.headers.yyy|headers.zzz

pattern 参见[匹配方式](../pattern.html)，更多模式请参考[配置模式](../mode.html)。

其中：

1. `req.headers.xxx`: 删除 req.headers 的 xxx 字段
2. `res.headers.xxx`: 删除 res.headers 的 xxx 字段
3. `headers.xxx`: 删除 res.headers&res.headers 的 xxx 字段
