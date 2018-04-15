# resType

修改请求头的 `content-type`，配置模式：

	pattern resType://mimeType

pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)，mimeType 为新的 `content-type`，如：`text/plain`、`text/html`、`image/png` 等等，还有一些后缀关键字，whistle 会自动把它转成对应的 type：

	json: application/json
	xml: text/xml
	js: text/javascript
	txt: text/plain
	html: text/html
等等

例子：

	www.ifeng.com resType://text
