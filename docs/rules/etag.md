# etag

修改请求头的etag字段，配置模式：

	pattern etag://etagValue
	
pattern参见[匹配方式](../pattern.html)，更多模式请参考[配置模式](../mode.html)。

例子：

	# 删除etag
	www.ifeng.com etag://
	
	# etag修改为xxx
	www.ifeng.com etag://xxx
	
