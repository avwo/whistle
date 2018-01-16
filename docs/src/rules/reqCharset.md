# reqCharset
修改请求头`content-type`的charset，配置模式：

	pattern reqCharset://charset
	
charset可以为`utf8`、`gbk`等等字符编码，pattern参见[匹配方式](../pattern.html)，更多模式请参考[配置模式](../mode.html)

例子：

	www.ifeng.com reqCharset://utf8