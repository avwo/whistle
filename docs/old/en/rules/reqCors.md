# reqCors

修改请求的[cors](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS)，配置方式：

	pattern reqCors://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	origin: *
	method: POST
	headers: x-test

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，json格式参考[操作值](../data.html)。

例子：

	www.ifeng.com reqCors://{test-reqCors.json}


test-reqCors.json:

	origin: *
	method: POST
	headers: x-test
