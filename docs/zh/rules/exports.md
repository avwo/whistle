# exports
用于把请求的一些信息导出到指定文件(如果该文件不存在，则会自动创建)，每个请会导出以下信息:

	{
	    startTime: '请求的开始时间',
	    dnsTime: 'dns结束时间',
	    requestTime: '请求结束时间',
	    responseTime: '开始响应的时间',
	    endTime: '响应结束的时间',
	    url: '请求的url',
	    realUrl: '实际请求的url(一般设置了替换规则，才会有realUrl，否则不会显示该字段)',
	    method: '请求使用的方法',
	    httpVersion: 'http版本号',
	    clientIp: '用户ip',
	    hostIp: '服务器ip',
	    reqError: '是否请求阶段出错',
	    reqSize: '请求内容的长度',
	    reqHeaders: '请求头',
	    reqTrailers: '请求的trailers',
	    statusCode: '响应状态码',
	    resError: '是否在响应阶段出错',
	    resSize: '响应内容的长度',
	    resHeaders: '响应头',
	    resTrailers: '响应的trailers',
	    rules: '匹配到的规则'
	}

配置方式：

	pattern exports://filepath

filepath指本地文件路径，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

导出所有请求信息到指定文件:

	/./ exports:///User/xxx/exports.txt
