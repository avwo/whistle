# js

> `v1.8.0` 及以后的版本用 [jsAppend](rules/jsAppend.md) 代替

往 content-type 为 html 或 js 的响应内容后面追加数据，如果是 html，则会自动加上 script 标签在追加到响应内容，如果是 js，则会自动追加到 js 文本后面，这个与 [resAppend](rules/resAppend.md) 的区别是 [resAppend](rules/resAppend.md) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern js://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	www.ifeng.com js://{test.js}

test.js:

	alert(2);
