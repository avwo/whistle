# resCharset

修改响应头 `content-type` 的 charset，配置模式：

	pattern resCharset://charset

charset 可以为 `utf8`、`gbk` 等等字符编码，pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)

例子：

	www.ifeng.com resCharset://utf8
