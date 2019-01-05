# cssAppend

往content-type为html或css的响应内容后面追加数据，如果是html，则会自动加上 style 标签在追加到响应内容，如果是css，则会自动追加到文本后面，这个与[resAppend](resAppend.html)的区别是[resAppend](resAppend.html)不区分类型，对所有匹配的响应都会追加指定的数据，配置方式：

	pattern cssAppend://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com cssAppend://{test.css}

test.css:

	html, body {background: red!important;}
