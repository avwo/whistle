# resType
修改请求头的`content-type`，配置方式：

	pattern resType://mimeType

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，mimeType为新的`content-type`，如：`text/plain`、`text/html`、`image/png`等等，还有一些后缀关键字，whistle会自动把它转成对应的type：

	json: application/json
	xml: text/xml
	js: text/javascript
	txt: text/plain
	html: text/html
等等

例子：

	www.ifeng.com resType://text
