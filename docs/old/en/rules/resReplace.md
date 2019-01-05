# resReplace

类似js字符串的replace方法，利用正则或字符串来匹配替换响应文本内容(响应的content-type必须文本类型：html、json、xml、text等)，配置方式：

	pattern resReplace://filepath

filepath为[Values](http://local.whistlejs.com/#values)里面的{key}或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx`等):

	/user=([^&])/ig: user=$1$1
	str: replacement

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)，json格式参考[操作值](../data.html)。

例子：

	www.ifeng.com resReplace://{test-resReplace.json}


test-resReplace.json:

	/user=([^&])/ig: user=$1$1
	<script: <script crossorigin
