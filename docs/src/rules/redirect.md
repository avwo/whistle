# redirect

设置302调整，配置模式：

	pattern redirect://jumpUrl
	
jumpUrl为请求要302跳转的目标url，pattern参见[匹配方式](../pattern.html)，更多模式请参考[配置模式](../mode.html)。


例子：

	www.ifeng.com redirect://http://www.aliexpress.com/