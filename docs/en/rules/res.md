# res
> 不推荐使用该协议，为方便使用，whistle已将此协议的功能拆分成多个协议，具体参见其它协议

修改响应头、响应内容、响应速度等等，配置方式：

	pattern res://params

params为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等)，内容为:

	{
	    "headers": { //修改响应头部
	        "content-type": "text/plain; charset=utf8"
	    },
	    "top": "preappend body", //在响应内容前面添加文本
	    "prepend": "/User/xxx/top.txt", //在响应内容前面添加的文件路径
	    "body": "request body", //替换响应内容的文本
	    "replace": "/User/xxx/body.txt", //替换响应内容的文件路径
	    "bottom": "append body", //追加响应内容的文本
	    "append": "/User/xxx/bottom.txt", //追加响应内容的文件路径
	    "delay": 6000, //延迟响应的毫秒数
	    "speed": 20 //设置响应速度(单位：kb/s，千比特/每秒)
	}

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

把[www.ifeng.com](http://www.ifeng.com/)后面添加文本及修改`content-type`为`text/plain`

	www.ifeng.com req://{test-res}

Values的`test-res`:

	{
	    "bottom": "\ntest",
	    "headers": {
	        "Content-type": "text/plain"
	    }
    }
