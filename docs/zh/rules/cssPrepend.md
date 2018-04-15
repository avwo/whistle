# cssPrepend

往content-type为html或css的响应内容前面追加数据，如果是html，则会自动加上 style 标签再追加到响应内容前面，如果是css，则会自动追加到文本前面，这个与[resPrepend](resPrepend.html)的区别是[resPrepend](resPrepend.html)不区分类型，对所有匹配的响应都会追加指定的数据，配置方式：

	pattern cssPrepend://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com cssPrepend://{test.css}

test.css:

	html, body {background: red!important;}
