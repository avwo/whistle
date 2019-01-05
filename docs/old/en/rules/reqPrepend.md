# reqPrepend

把指定的内容添加到请求内容前面(GET等请求没有内容无法添加)，配置方式：

	pattern reqPrepend://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	Prepend body

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com method://post reqPrepend://{test-reqPrepend.html}


test-reqPrepend.html:

	Prepend body
