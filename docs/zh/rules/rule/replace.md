# 请求替换

把请求替换成请求其它 url，配置模式：

	pattern http://host:port/xxx
	pattern https://host:port/xxx

	# 自动补充协议(与请求的协议一样)
	pattern host:port/xxx

其中，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

把 [www.ifeng.com](http://www.ifeng.com/) 域名下的请求全部替换成 www.aliexpress.com 的请求：

		www.ifeng.com www.aliexpress.com

用 [http://www.ifeng.com](http://www.ifeng.com/) 访问 HTTPS 的[https://www.baidu.com](https://www.baidu.com/)

		http://www.ifeng.com https://www.baidu.com
