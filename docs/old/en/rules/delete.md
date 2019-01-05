# delete

删除指定的请求响应头字段，也可以通过[reqHeaders](reqHeaders.html)、[resHeaders](resHeaders.html)把字段设置为空字符串，配置方式：

	pattern delete://req.headers.xxx|req.headers.x22|res.headers.yyy|headers.zzz

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

其中：

1. `req.headers.xxx`: 删除req.headers的xxx字段
2. `res.headers.xxx`: 删除res.headers的xxx字段
3. `headers.xxx`: 删除res.headers&res.headers的xxx字段
