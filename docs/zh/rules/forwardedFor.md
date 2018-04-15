# forwardedFor

修改请求头的 `x-forwarded-for` 字段 (`whistle >= v1.6.1`)，配置模式：

	pattern forwardedFor://ip

pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

例子：

	# 修改 www.ifeng.com 请求头的 `x-forwarded-for` 字段为 1.1.1.1
	www.ifeng.com forwardedFor://1.1.1.1
