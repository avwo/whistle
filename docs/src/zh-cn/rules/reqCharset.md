# reqCharset

修改请求头 `content-type` 的 charset，配置模式：

	pattern reqCharset://charset

charset 可以为 `utf8`、`gbk` 等等字符编码，pattern 参见 [匹配方式](#pattern)，更多模式请参考 [配置模式](#mode)

例子：

	www.ifeng.com reqCharset://utf8
