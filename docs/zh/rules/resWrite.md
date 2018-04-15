# resWrite

将响应的内容 (如果有) 写入的指定的文件夹或文件；whistle 会根据请求的 url 和配置自动拼接成路径，且 whistle 不会覆盖已存在的文件，配置模式：

	pattern resWrite://filepath

filepath 为本地目录或文件，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	# 匹配 http://www.ifeng.com/，指定特定的文件
	/^http:\/\/www.ifeng.com\/$/ resWrite:///User/test/index.html
	www.ifeng.com resWrite:///User/test
