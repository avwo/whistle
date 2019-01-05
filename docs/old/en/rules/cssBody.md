# cssBody

替换content-type为html或css的响应内容，如果是html，则会自动加上 style 标签在替换响应内容，如果是css，则替换整个css文件，这个与[resBody](resBody.html)的区别是[resBody](resBody.html)不区分类型，对所有匹配的响应都会执行替换数据，配置方式：

	pattern cssBody://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com cssBody://{test.css}

test.css:

	html, body {background: red!important;}
