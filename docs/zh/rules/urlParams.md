# urlParams

修改请求参数，配置方式：

	pattern urlParams://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	field1: value1
	field2: value2
	filedN: valueN

pattern参见[匹配模式](../pattern.html)，更多模式请参考[匹配模式](../mode.html)，json格式参考[操作值](../data.html)。

例子：

	www.ifeng.com urlParams://(test=1)

括号的写法见：[Rules的特殊操作符({}、()、<>)](../webui/rules.html)
