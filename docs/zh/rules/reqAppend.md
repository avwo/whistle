# reqAppend

把指定的内容追加到请求内容后面(GET 等请求没有内容无法追加)，配置模式：

	pattern reqAppend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	Append body

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	www.ifeng.com method://post reqAppend://{test-reqAppend.html}


test-reqAppend.html:

	Append body
