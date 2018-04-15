# exports

用于把请求的一些信息导出到指定文件 (如果该文件不存在，则会自动创建)，每个请会导出以下信息:

	{
	    startTime: '请求的开始时间',
	    dnsTime: 'dns 结束时间',
	    requestTime: '请求结束时间',
	    responseTime: '开始响应的时间',
	    endTime: '响应结束的时间',
	    url: '请求的 url',
	    realUrl: '实际请求的 url(一般设置了替换规则，才会有 realUrl，否则不会显示该字段)',
	    method: '请求使用的方法',
	    httpVersion: 'http 版本号',
	    clientIp: '用户 ip',
	    hostIp: '服务器 ip',
	    reqError: '是否请求阶段出错',
	    reqSize: '请求内容的长度',
	    reqHeaders: '请求头',
	    reqTrailers: '请求的 trailers',
	    statusCode: '响应状态码',
	    resError: '是否在响应阶段出错',
	    resSize: '响应内容的长度',
	    resHeaders: '响应头',
	    resTrailers: '响应的 trailers',
	    rules: '匹配到的规则'
	}

配置模式：

	pattern exports://filepath

filepath 指本地文件路径，pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

例子：

导出所有请求信息到指定文件:

	/./ exports:///User/xxx/exports.txt
