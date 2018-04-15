# auth
修改请求头的`authorization`字段，这个字段是网页401弹出的输入框中输入用户名和密码的Base64编码，配置方式:

	pattern auth://username:password

	# 或者采用json格式
	pattern auth://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	username: xxx
	password: ooo

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，json格式参考[操作值](../data.html)。

例子：

	www.ifeng.com auth://test:123
