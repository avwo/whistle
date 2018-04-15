# htmlBody

替换 content-type 为 html 的响应内容，这个与 [resBody](rules/resBody.md) 的区别是 [resBody](rules/resBody.md) 不区分类型，对所有匹配的响应都会替换，配置模式：

	pattern htmlBody://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等)，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	www.ifeng.com htmlBody://{test.html}

test.html:

	<iframe style="width: 100%; height: 600px;" src="http://www.aliexpress.com/"></iframe>
