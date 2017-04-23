# socks

设置socks代理，配置模式：

	pattern socks://ip:port
	
pattern参见[匹配方式](../pattern.html)，更多模式请参考[配置模式](../mode.html)。


例子：

把所有请求代理到`127.0.0.1:8888`的代理服务器：

	/./ socks://127.0.0.1:1080