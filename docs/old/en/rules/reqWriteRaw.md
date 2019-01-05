# reqWriteRaw
将请求的完整内容(包括请求方法、路径、协议、请求头、内容)写入的指定的文件夹或文件；whistle会根据请求的url和配置自动拼接成路径，且whistle不会覆盖已存在的文件，配置方式：

	pattern reqWriteRaw://filepath

filepath为本地目录或文件，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	# 匹配http://www.ifeng.com/，指定特定的文件
	/^http:\/\/www.ifeng.com\/$/ reqWriteRaw:///User/test/index.html
	www.ifeng.com reqWriteRaw:///User/test
