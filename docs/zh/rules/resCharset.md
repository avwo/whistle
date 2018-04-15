# resCharset
修改响应头`content-type`的charset，配置方式：

	pattern resCharset://charset

charset可以为`utf8`、`gbk`等等字符编码，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)

例子：

	www.ifeng.com resCharset://utf8
