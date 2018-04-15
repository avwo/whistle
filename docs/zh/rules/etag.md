# etag

修改请求头的 etag 字段，配置模式：

	pattern etag://etagValue

pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

例子：

	# 删除 etag
	www.ifeng.com etag://

	# etag 修改为 xxx
	www.ifeng.com etag://xxx
