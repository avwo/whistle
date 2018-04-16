# reqBody

把指定的内容替换请求内容(GET等请求没有内容没有替换一说)，配置方式：

	pattern reqBody://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	Body body

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com method://post reqBody://{test-reqBody.html}


test-reqBody.html:

	Body body
