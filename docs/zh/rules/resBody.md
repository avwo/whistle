# resBody

把指定的内容替换响应内容(304 等响应没有内容无法替换)，配置模式：

	pattern resBody://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	Body body

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	www.ifeng.com resBody://{test-resBody.html}


test-resBody.html:

	Body body
