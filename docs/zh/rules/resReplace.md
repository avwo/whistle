# resReplace

类似 js 字符串的 replace 方法，利用正则或字符串来匹配替换响应文本内容(响应的 content-type 必须文本类型：html、json、xml、text 等)，配置模式：

	pattern resReplace://filepath

filepath 为 [Values](http://local.whistlejs.com/#values) 里面的 {key} 或者本地文件(如：`e:\test\xxx`、`e:/test/xxx`、`/User/username/test/xxx` 等):

	/user=([^&])/ig: user=$1$1
	str: replacement

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)，json 格式参考[数据格式](data.md)。

例子：

	www.ifeng.com resReplace://{test-resReplace.json}


test-resReplace.json:

	/user=([^&])/ig: user=$1$1
	<script: <script crossorigin
