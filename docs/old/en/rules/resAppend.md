# resAppend

把指定的内容追加到响应内容后面(304等响应没有内容无法追加)，配置方式：

	pattern resAppend://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	Append body

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com resAppend://{test-resAppend.html}


test-resAppend.html:

	Append body
