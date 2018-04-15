# responseFor

设置响应头的 `x-whistle-response-for` 字段(`whistle >= v1.7.1`)，主要方便自定义 whistle 的 Network SeverIP 显示真实的服务器环境或 IP，配置模式：

	pattern responseFor://env

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

	# 修改 www.ifeng.com 请求头的 `x-whistle-response-for` 字段为 1.1.1.1
	www.ifeng.com responseFor://1.1.1.1


PS：某些情况下需要通过 nigix 转发，可以结合 [resScript](rules/resScript.md) 把响应头的 `x-upstream` 字段设置到 `x-whistle-response-for`，这样就可以在 whistle 的 Network 上看到真实的 IP
