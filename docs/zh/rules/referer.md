
# referer

修改请求头的referer字段，有些服务器会校验请求头的referer字段，这个协议可以用来绕过这个检测或者测试后台的功能，配置方式：

	pattern referer://url

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

如果我们在www.test.com域名的页面中发www.aliexpress.com的请求，则请求头的referer为www.test.com域名下的url或为空，这样可能请求到后台会返回403，可以这么修改referer：

	www.aliexpress.com referer://http://www.aliexpress.com

把www.aliexpress.com域名下的请求都加上`http://www.aliexpress.com`这个referer。
