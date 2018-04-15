# resWriteRaw
将响应的完整内容(包括协议、状态码、状态信息、响应头、内容)写入的指定的文件夹或文件；whistle会根据请求的url和配置自动拼接成路径，且whistle不会覆盖已存在的文件，配置方式：

	pattern resWriteRaw://filepath

filepath为本地目录或文件，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	# 匹配http://www.ifeng.com/，指定特定的文件
	/^http:\/\/www.ifeng.com\/$/ resWriteRaw:///User/test/index.html
	www.ifeng.com resWriteRaw:///User/test
