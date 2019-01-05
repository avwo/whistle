# dispatch

有时需要根据UA或其它请求头信息返回不同的数据，whistle用sandbox执行`dispatch`传人进来的脚本，`dispatch`关联的脚本在全局属性可以获取以下信息：

	url: //请求url
	method: //请求方法
	httpVersion: //请求http版本
	ip: //请求客户端的ip
	headers: //请求的头部
	params: //请求参数，可以动态修改

并通过`params`这个请求参数对象修改或添加请求参数，改变url达到匹配不同规则的效果：

	var ua = headers['user-agent'];
	if (/iphone/i.test(ua)) {
	    params.test=1;
	} else if (/android/i.test(ua)) {
	    params.test=2;
	} else {
	    params.test=3;
	}

配置方式：

	pattern dispatch://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地js文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

	www.ifeng.com dispatch://{dispatch.js}

dispatch.js:

	var ua = headers['user-agent'];
	if (/iphone/i.test(ua)) {
	    params.test=1;
	} else if (/android/i.test(ua)) {
	    params.test=2;
	} else {
	    params.test=3;
	}

[www.ifeng.com](http://www.ifeng.com/)的请求都会在url加上请求参数`test=xxx`
