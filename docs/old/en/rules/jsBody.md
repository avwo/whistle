# jsBody

替换往content-type为html或js的响应内容，如果是html，则会自动加上 script 标签再替换响应内容，如果是js，则会自动替换整个js文件，这个与[resBody](resBody.html)的区别是[resAppend](resBody.html)不区分类型，对所有匹配的响应都会追加指定的数据，配置方式：

	pattern jsBody://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com jsBody://{test.js}

test.js:

	alert(2);
