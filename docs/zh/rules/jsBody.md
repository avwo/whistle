# jsBody

替换往 content-type 为 html 或 js 的响应内容，如果是 html，则会自动加上 script 标签再替换响应内容，如果是 js，则会自动替换整个 js 文件，这个与 [resBody](rules/resBody.md) 的区别是 [resAppend](rules/resBody.md) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern jsBody://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	www.ifeng.com jsBody://{test.js}

test.js:

	alert(2);
