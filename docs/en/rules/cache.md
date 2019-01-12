# cache
设置响应的缓存头，配置方式：

	pattern cache://maxAge

maxAge为缓存的秒数，也可以代表一些关键字: `no`、`no-cache`、`no-store`，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	# 去除缓存
	www.ifeng.com cache://no

	# 设置一分钟的缓存
	www.ifeng.com cache://60


如果如果后台返回304设置这个字段没有用，要防止后台返回`304`，需要用[disable](disable.html)://cache。
