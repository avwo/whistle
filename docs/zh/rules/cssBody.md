# cssBody

替换 content-type 为 html 或 css 的响应内容，如果是 html，则会自动加上 style 标签在替换响应内容，如果是 css，则替换整个 css 文件，这个与 [resBody](rules/resBody.md) 的区别是 [resBody](rules/resBody.md) 不区分类型，对所有匹配的响应都会执行替换数据，配置模式：

	pattern cssBody://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	www.ifeng.com cssBody://{test.css}

test.css:

	html, body {background: red!important;}
