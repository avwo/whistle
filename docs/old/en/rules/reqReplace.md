# reqReplace

类似js字符串的replace方法，利用正则或字符串来匹配替换请求文本内容请求的content-type必须为表单(application/x-www-form-urlencoded)或其它文本类型：urlencoded、html、json、xml、text等)，配置方式：

	pattern reqReplace://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	/user=([^&])/ig: user=$1$1
	str: replacement

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，json格式参考[操作值](../data.html)。

例子：

	www.ifeng.com reqReplace://{test-reqReplace.json}


test-reqReplace.json:

	/user=([^&])/ig: user=$1$1
	str: replacement
