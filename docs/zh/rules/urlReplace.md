# urlReplace

类似js字符串的replace方法，利用正则或字符串来匹配替换请求url的path部分(如`http://www.test.com/xxx?xxx`，只能替换url中`xxx?xxx`这部分的内容)，配置方式：

	pattern urlReplace://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	/user=([^&])/ig: user=$1$1
	str: replacement

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，json格式参考[操作值](../data.html)。

例子：

	www.ifeng.com urlReplace://{test-resReplace.json}


test-urlReplace.json:

	/user=([^&])/ig: user=$1$1
	index: news
