# ua

修改请求头的`user-agent`字段，可用于模拟各种机器访问，配置方式：

	pattern ua://newUA

newUA为新的ua字符串(中间不能有空格)或者[Values](http://local.whistlejs.com/#values)里面的{key}。

例子：

	www.ifeng.com ua://Mozilla/5.0

	# 把完整UA存在Values里面
	www.ifeng.com ua://{test-ua}

test-ua:

	Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36
