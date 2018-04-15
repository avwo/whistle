# replaceStatus

替换响应的状态码 (状态码范围 100~999)，这个与[statusCode](rules/statusCode.md) 的区别是，replaceStatus 是请求响应后再修改状态码，而后者的请求不会发出去，设置完状态码直接返回，配置模式：

	pattern replaceStatus://code

其中：code >= 100 && code <= 999，pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。


例子：

	www.ifeng.com replaceStatus://500
