# urlReplace

类似 js 字符串的 replace 方法，利用正则或字符串来匹配替换请求 url 的 path 部分(如 `http://www.test.com/xxx?xxx`，只能替换 url 中 `xxx?xxx` 这部分的内容)，配置模式：

	pattern urlReplace://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	/user=([^&])/ig: user=$1$1
	str: replacement

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)，json 格式参考[数据格式](data.md)。

例子：

	www.ifeng.com urlReplace://{test-resReplace.json}


test-urlReplace.json:

	/user=([^&])/ig: user=$1$1
	index: news
