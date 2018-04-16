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


注意：最后一种内联格式可以把JSON对象直接转化为字符串，这样可以用第一种方式直接写到配置里面，如果key或value里面出现 `空格`、`&`、`%` 或 `=`，则需要把它们 `encodeURIComponent`，whistle会对每个key和value尝试 `decodeURIComponent`。
