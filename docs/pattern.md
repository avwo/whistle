# 匹配方式

> HTTPS、Websocket需要[开启HTTPS拦截](webui/https.html)，whistle才能获取完整的请求url，对这部分请求只有域名匹配能完整支持(路径匹配只支持`tunnel://host 或 tunnel://host:port`)，为了让匹配方式对所有请求都生效请先[开启HTTPS拦截](webui/https.html)

whistle对所有操作支持**域名、路径、正则、精确匹配**四种匹配方式(精确匹配需[v1.1.2及以上版本](https://github.com/avwo/whistle/blob/master/CHANGELOG.md#v112)才支持)。

1. 域名匹配(如果operator-uri不为请求路径，pattern和operator-uri位置可以调换)

	域名匹配可以匹配整个域名、限定域名的端口号、限定域名的请求协议

		# 匹配域名www.test.com下的所有请求，包括http、https、ws、wss
		www.test.com operator-uri

		# 匹配域名www.test.com下的所有http请求
		http://www.test.com operator-uri

		# 匹配域名www.test.com下的所有https、ws、wss请求
		https://www.test.com operator-uri
		
		# 上述匹配也可以限定域名的端口号
		www.test.com:8888 operator-uri # 8888端口
		www.test.com/ operator-uri # http为80端口，其它443端口
		
2. 路径匹配(如果operator-uri不为请求路径，pattern和operator-uri位置可以调换)

	路径匹配可以通过设置父路径来匹配请求url，父路径也可以去掉请求协议，这样所有请求只要是该路径或该路径下的子路径都可以匹配。
	
		# 限定请求协议，只能匹配http请求
		http://www.test.com/xxx operator-uri
		http://www.test.com:8080/xxx operator-uri
		
		# 匹配指定路径下的所有请求
		www.test.com/xxx operator-uri
		www.test.com:8080/xxx operator-uri
		
3. 正则匹配(pattern和operator-uri位置可以调换)

	正则的语法及写法跟js的正则表达式一致，支持两种模式：/reg/、/reg/i 忽略大小写，支持子匹配，<del>但不支持/reg/g</del>，且可以通过正则的子匹配把请求url里面的部分字符串传给operator-uri。
		
		#匹配所有请求
		/./ operator-uri

		#匹配url里面包含摸个关键字的请求，且忽略大小写
		/keyword/i operator-uri

		#利用子匹配把url里面的参数带到匹配的操作uri
		#下面正则将把请求里面的文件名称，带到匹配的操作uri
		/[^?#]\/([^\/]+)\.html/ protocol://...$1... #最多支持9个子匹配 $1...9

4. 精确匹配(pattern和operator-uri位置可以调换)

	与上面的路径匹配不同，路径匹配不仅匹配对应的路径，而且还会匹配该路径下面的子路径，而精确匹配只能指定的路径，只要在路径前面加`$`即可变成精确匹配，类似`$url operator-uri`(v1.1.1及以下版本可以用正则实现)。

	- 包含请求协议
	
			$http://www.test.com operator-uri
			$https://www.test.com/xxx? operator-uri

		这种情况分别只能匹配这两种请求：
		
		- `http://www.test.com`(浏览器会自动改为`http://www.test.com/`这两种等价)
		- `https://www.test.com/xxx?`

	- 不包含请求协议

			$www.test.com/xxx operator-uri

		这种情况可以匹配如下四种请求：
		
		- `http://www.test.com/xxx`
		- `https://www.test.com/xxx`
		- `ws://www.test.com/xxx`
		- `wss://www.test.com/xxx`
