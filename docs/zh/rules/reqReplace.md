# reqReplace

类似 js 字符串的 replace 方法，利用正则或字符串来匹配替换请求文本内容请求的 content-type 必须为表单 (application/x-www-form-urlencoded) 或其它文本类型：urlencoded、html、json、xml、text 等)，配置模式：

	pattern reqReplace://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	/user=([^&])/ig: user=$1$1
	str: replacement

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)，json 格式参考[数据格式](data.md)。

例子：

	www.ifeng.com reqReplace://{test-reqReplace.json}


test-reqReplace.json:

	/user=([^&])/ig: user=$1$1
	str: replacement
