# htmlBody

替换content-type为html的响应内容，这个与[resBody](resBody.html)的区别是[resBody](resBody.html)不区分类型，对所有匹配的响应都会替换，配置方式：

	pattern htmlBody://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com htmlBody://{test.html}

test.html:

	<iframe style="width: 100%; height: 600px;" src="http://www.aliexpress.com/"></iframe>
