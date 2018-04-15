# reqCookies

修改请求的 cookie，配置模式：

	pattern reqCookies://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	key1: value1
	key2: value2
	keyN: valueN

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)，json 格式参考[数据格式](data.md)。

例子：

	www.ifeng.com reqCookies://{test-reqCookies.json}


test-reqCookies.json:

	test: 123
	key: value
