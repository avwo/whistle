# htmlAppend

往content-type为html的响应内容后面追加数据，这个与[resAppend](resAppend.html)的区别是[resAppend](resAppend.html)不区分类型，对所有匹配的响应都会追加指定的数据，配置方式：

	pattern htmlAppend://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com htmlAppend://{test.html}

test.html:

	<iframe style="width: 100%; height: 600px;" src="http://www.aliexpress.com/"></iframe>
