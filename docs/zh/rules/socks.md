# socks

设置 socks 代理，配置模式：

	pattern socks://ip:port

	# 加用户名密码
	pattern socks://username:password@ip:port

pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。


例子：

把所有请求代理到 `127.0.0.1:8888` 的代理服务器：

	/./ socks://127.0.0.1:1080
	www.facebook.com socks://test:123@127.0.0.1:1080
