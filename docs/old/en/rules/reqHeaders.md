# reqHeaders

修改请求头，配置方式：

	pattern reqHeaders://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	x-test1: value1
	x-test2: value2
	x-testN: valueN

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，json格式参考[操作值](../data.html)。

例子：

	www.ifeng.com reqHeaders://{test-reqHeaders.json}


test-reqHeaders.json:

	x-test1: value1
	x-test2: value2
	x-testN: valueN
