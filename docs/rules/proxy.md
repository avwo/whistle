# proxy

设置http代理，配置模式：

	pattern proxy://ip:port
	
pattern参见[匹配方式](../pattern.html)，更多模式请参考[配置模式](../mode.html)。


例子：

把所有请求代理到`127.0.0.1:8888`的代理服务器：

	/./ proxy://127.0.0.1:8888