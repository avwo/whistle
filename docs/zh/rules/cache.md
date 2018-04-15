# cache

设置响应的缓存头，配置模式：

	pattern cache://maxAge

maxAge 为缓存的秒数，也可以代表一些关键字: `no`、`no-cache`、`no-store`，pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

例子：

	# 去除缓存
	www.ifeng.com cache://no

	# 设置一分钟的缓存
	www.ifeng.com cache://60


如果如果后台返回 304 设置这个字段没有用，要防止后台返回 `304`，需要用 [disable](rules/disable.md)://cache。
