# reqType

修改请求头的 `content-type`，配置模式：

	pattern reqType://mimeType

pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)，mimeType 为新的 `content-type`，如：`text/plain`、`text/html`、`image/png` 等等，还有一些关键字，whistle 会自动把它转成对应的 type：

	urlencoded: application/x-www-form-urlencoded
	form: application/x-www-form-urlencoded
	json: application/json
	xml: text/xml
	text: text/plain
	upload: multipart/form-data
	multipart: multipart/form-data
	defaultType: application/octet-stream

例子：

	www.ifeng.com reqType://text
