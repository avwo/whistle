
# req
> 不推荐使用该协议，为方便使用，whistle已将此协议的功能拆分成多个协议，具体参见其它协议

修改请求的方法、请求头、请求内容、请求速度等等，配置方式：

	pattern req://params

params为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，内容为:

	{
	    "method": "post", //修改请求方法
	    "headers": { //修改请求头
	        "referer": "http://www.example.com/xxx"
	    },
	    "top": "preappend body", //请求内容前面添加的文本
	    "prepend": "/User/xxx/top.txt", //请求内容前面添加的文件路径
	    "body": "request body", //替换请求内容的文本
	    "replace": "/User/xxx/body.txt", //替换请求内容的文件路径
	    "bottom": "append body", //追加到请求内容后面的文本
	    "append": "/User/xxx/bottom.txt", //追加到请求内容后面的文件路径
	    "delay": 6000, //延迟请求的毫秒数
	    "speed": 20, //请求速度(单位：kb/s，千比特/每秒)
	    "timeout": 36000, //超时时间
	    "charset": "utf8" //请求内容编码
	}

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

把[www.ifeng.com](http://www.ifeng.com/)改成post请求，及referer改成`http://wproxy.org`

	www.ifeng.com req://{test-req}

Values的`test-req`:

	{
	    "method": "post",
	    "headers": {
	        "referer": "http://wproxy.org"
	    }
    }
