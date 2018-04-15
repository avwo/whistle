# jsPrepend

往 content-type 为 html 或 js 的响应内容前面添加数据，如果是 html，则会自动加上 script 标签再添加到响应内容前面，如果是 js，则会自动添加到响应内容前面，这个与 [jsPrepend](rules/jsPrepend.md) 的区别是 [jsPrepend](rules/jsPrepend.md) 不区分类型，对所有匹配的响应都会追加指定的数据，配置模式：

	pattern jsPrepend://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	www.ifeng.com jsPrepend://{test.js}

test.js:

	alert(2);
