# 操作值

whistle的操作值可以分两类，字符串和JSON对象。

1. 如果**字符串**不包含空格，可以直接写到配置里面：

		pattern opProtocol://(strValue)

		# 有些操作值不能放到本地文件，则可以不用括号，如：proxy、referer等等，具体参见协议列表
		pattern opProtocol://strValue

2. 如果**字符串**里面包含空格，则可以把操作值先放到whistle界面的[Values](./webui/values.html)或本地文件：

		# 在Values里面创建一个key为 test.txt 的 key-value 对
		pattern opProtocol://{test.txt}

		# 或者放到本地文件 /User/docs/test.txt
		pattern opProtocol:///User/docs/test.txt
		# windows
		pattern opProtocol://E:\docs\test.txt

	注意：不是所有操作值都可以从本地文件加载，具体使用时参考：[协议列表](./rules)

3. 如果操作值为**JSON对象**，则可以用以下几种格式：

  正常的JSON格式：

			{
			  "key1": value1,
			  "key2": value2,
			  "keyN": valueN
			}

  行格式：

			# 以 `冒号+空格` 分隔
			key1: value1
			key2: value2
			keyN: valueN

			# 如果没有 `冒号+空格` ，则以第一个冒号分隔，如果没有冒号，则value为空字符串
			key1: value1
			key2:value2
			key3
			keyN: valueN

  内联格式(请求参数格式)：

			# key和value最好都encodeURIComponent
			key1=value1&key2=value2&keyN=valueN


注意：新版 Whistle 的内联规则解析成对象将会保留配置的值，不再自动 encodeURIComponent。

#### 内嵌多行操作值
在[v1.12.12](./update.html)之前的版本，操作值有三种存储方式：

1. 内联到规则里面(`pattern protocol://(value)`)，`value` 不能有空格
2. 直接存放到 [Values](./webui/values.html)(`pattern protocol://{key}`)
3. 存放到本地文件或目录(`pattern protocol:///User/xxx`)

whistle [v1.12.12](./update.html)开始支持在Rules内联多行的Value，如：

`````
www.test.com/index.html file://{test.html}
``` test.html
Hello world.
Hello world1.
Hello world2.
```
www.test.com/index2.html reqScript://{test.rules}
```` test.rules
* file://{test.html} # 表示下面的test.html，无法获取上面的test.html
``` test.html
reqScrip,
reqScript,
```
````
`````
这种内嵌值位置可以在Rules里面任意放置，格式如下：
````
``` keyName
content
```
````

这样可以在Rules里面的任意位置引用该内容：
```
pattern protocol://{keyName}
```

这种方式设置的Value只对当前阶段的规则生效，且优先级高于[Values](./webui/values.html)设置的Key-Value，所以如果是插件里面的规则最好能加个前缀如：
````
```whistle.helloworld/test.html
Hello world.
Hello world1.
Hello world2.
```
www.test.com/index.html file://{whistle.helloworld/test.html}
````


#### 模板字符串
`v1.12.9` 版本开始，whistle支持类似es6的模板字符串，通过模板字符串可以读取请求的一些信息并设置到规则中：

```
pattern1 protocol://`xxx${reqCookie.cookieName}yyy`
www.test.com/api http://`${clientIp}:8080`
pattern3 protocol://`{test.json}`
```
test.json:
```
{
	"url": "${url}",
	"port": "${port}",
	"version": "${version}",
	"query": "${query}", // 相当于 location.search ，如果 url 里面没有 ? 则为空字符串
	"search": "${search}", // 相当于 location.search ，如果 url 里面没有 ? 则为空字符串
	"queryString": "${queryString}",  // 相当于 location.search ，但如果 url 里面没有 ? 则为 ?
	"searchString": "${searchString}",  // 相当于 location.search ，但如果 url 里面没有 ? 则为 ?
	"queryValue": "${query.name}",
	"host": "${host}",
	"hostname": "${hostname}",
	"path": "${path}",
	"pathname": "${pathname}",
	"reqId": "${reqId}",
	"now": ${now},
	"method": "${method}",
	"xff": "${reqHeaders.x-test}",
	"other": "${reqHeaders.other}",
	"cookie": "${reqCookie}",
	"cookieValue": "${reqCookie.cookieName}",
	"clientIp": "${clientIp}"
}
```

这里 `test.json` 在规则中一定要用模板字符串引入：
```
 protocol://`{test.json}`
 ```

 如下配置：
 ```
www.test.com/api http://`${clientIp}:8080`
 ```
 `10.12.2.1` 的请求  `https://www.test.com/api/test` 会转成 `http://10.12.2.1:8080/test`

 如果想获取响应阶段的状态码、服务端IP、响应头、响应cookie，可以通过以下两种方式设置规则：

 1. [resScript](./rules/resScript.html)
 2. [插件的resRulesServer](./plugins.html)

 通过这两种方式设置的响应规则，除了可以设置上述请求信息，还可以设置如下响应信息：
 ```
pattern3 protocol://`{test2.json}`
```
test2.json:
```
{
	"url": "${url}",
	"search": "${url.search}",
	"query": "${url.query}",
	"queryValue": "${url.query.name}",
	"host": "${url.host}",
	"hostname": "${url.hostname}",
	"path": "${url.path}",
	"pathname": "${url.pathname}",
	"reqId": "${reqId}",
	"now": ${now},
	"method": "${method}",
	"xff": "${reqHeaders.x-forwarded-for}",
	"other": "${reqHeaders.other}",
	"cookie": "${reqCookie}",
	"cookieValue": "${reqCookie.cookieName}",
	"clientIp": "${clientIp}",
	"statusCode": "${statusCode}",
	"serverIp": "${serverIp}",
	"resHeaderValue": "${resHeaders.x-res-header-name}",
	"resCookieValue": "${resCookie.res_cookie_name}"
}
```

`${xxx}` 里面如果对应的值不存在则返回空字符串；如果涉及到 query、cookie 会自动 `decode`，如果你不想自动对 `key` 和 `value` 做 `decode`，可以加多一个 `$${xxx}`。

`v1.12.13` 版本开始支持 `replace(pattern,replacement)`功能，如：
```
protocol://`${search.replace(/course=([^&]+)/ig,name=$1)}`
protocol://`${search.replace(a,b)}`
```


`${query}` 和 `${queryString}` 的用途，如配置[redirect](rules/redirect.html) 重定向：
``` txt
# 不需要追加参数
www.test.com/index.html redirect://`https://ke.qq.com/test${query}`

# 需要追加参数
www.test.com/index.html redirect://`https://ke.qq.com/test${queryString}&test=1`

# 追加参数
www.test.com redirect://`https://ke.qq.com${url.path}`

# 修改为 301
www.test.com redirect://`https://ke.qq.com${url.path}` replaceStatus://301
```
