# auth

修改请求头的 `authorization` 字段，这个字段是网页 401 弹出的输入框中输入用户名和密码的 Base64 编码，配置模式:

	pattern auth://username:password

	# 或者采用 json 格式
	pattern auth://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	username: xxx
	password: ooo

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)，json 格式参考[数据格式](data.md)。

例子：

	www.ifeng.com auth://test:123
