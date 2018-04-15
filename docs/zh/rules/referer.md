# referer

修改请求头的 referer 字段，有些服务器会校验请求头的 referer 字段，这个协议可以用来绕过这个检测或者测试后台的功能，配置模式：

	pattern referer://url

pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

例子：

如果我们在 www.test.com 域名的页面中发 www.aliexpress.com 的请求，则请求头的 referer 为 www.test.com 域名下的 url 或为空，这样可能请求到后台会返回 403，可以这么修改 referer：

	www.aliexpress.com referer://http://www.aliexpress.com

把 www.aliexpress.com 域名下的请求都加上 `http://www.aliexpress.com` 这个 referer。
