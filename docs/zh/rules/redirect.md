# redirect

设置 302 调整，配置模式：

	pattern redirect://jumpUrl

jumpUrl 为请求要 302 跳转的目标 url，pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。


例子：

	www.ifeng.com redirect://http://www.aliexpress.com/
