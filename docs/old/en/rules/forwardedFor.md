# forwardedFor

修改请求头的 `x-forwarded-for` 字段(`whistle >= v1.6.1`)，配置方式：

	pattern forwardedFor://ip

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	# 修改www.ifeng.com请求头的`x-forwarded-for` 字段为 1.1.1.1
	www.ifeng.com forwardedFor://1.1.1.1
