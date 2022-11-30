# Network

查看请求响应的详细信息及请求列表的Timeline，还有请求匹配到的规则(见`Overview`)。

![Network](../img/network.gif)

界面操作的一些快捷键：

1. `Ctrl + X`(Mac用`Command + X`): 清空请求列
2. `Ctrl + D`(Mac用`Command + D`):
	- 如果是焦点在下面的过滤输入框，可以清空输入框的内容
	- 如果焦点在Network的其它地方，可以删除选中的请求项

更多功能及快捷键参考下图：

![Network](https://user-images.githubusercontent.com/11450939/122700926-ca7f8880-d27e-11eb-95ff-7c703d4152b5.png)


设置Network列表行样式：

	pattern style://color=@fff&fontStyle=italic&bgColor=red

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)；style可以设置：

1. color: 字体颜色，跟css的color属性一致，但由于 `#` 为whistle但注释符号，这里可以用 `@` 代替
2. fontStyle: 字体样式，可以设置为 `normal`、`italic`、`oblique` 等 
3. bgColor: 对应列表行的背景颜色，具体设置同 `color`

例子：
``` txt
www.test.com style://color=@fff&fontStyle=italic&bgColor=red
```

![效果](https://user-images.githubusercontent.com/11450939/61267997-a8e11100-a7cc-11e9-9c24-fbbba591ae9b.png)

可以同时设置多个 `style` ，后面的会覆盖前面，如果先把前面的属性覆盖掉，可以用 `style://color=`。

# 设置自定义列的值
> 该功能需要 `v2.9.35` 及以上版本才支持，请及时更新 whistle

![修改列名](https://user-images.githubusercontent.com/11450939/78465561-b9099980-7729-11ea-8d02-be7baf5d34e6.png)

> 记得勾上 `Custom1`、`Custom2`

![效果](https://user-images.githubusercontent.com/11450939/78465552-a55e3300-7729-11ea-92b2-9b6a56217385.png)


可以通过 Network 抓包列表右键菜单 / Open / Source 获取想要的 `Data Key`，如：`req.headers.accept` 获取请求头 `accept` 的值，`res.headers.x-server` 获取响应头 `x-server` 的值

# 通过插件自定义列
> 该功能需要 `v2.9.36` 及以上版本才支持，请及时更新 whistle

最新版本支持插件添加一个 Network 的自定义列，具体步骤如下：
1. 在插件的 `package.json` 设置列的名称、列宽度（默认为 `70px`）、从抓包对象里面取值的 `key`（如：`statusCode`、`req.headers.x-test` 等等），是否显示 tips：

	``` json
	{
		...
		"whistleConfig": {
			"networkColumn": {
				"name": "RetCode",
				"width": 90,
				"showTips": true,
				"key": "customData.jtenv.ret"
			}
		},
		...
	}
	```
2. 通过自定义 `webWorker` 自定义 `customData`

	``` json
	{
		...
		"whistleConfig": {
			"networkColumn": {
				"name": "RetCode",
				"width": 90,
				"showTips": true,
				"key": "customData.abc.ret"
			},
			"webWorker": "assets/webWorker.js"
		},
		...
	}
	```
	代码示例：
	``` js
	var URL_RE = /^https?:\/\/[^/?#]+.xxx.com\/fcgi\/common.fcgi\?/;

	module.exports = function(data, next) {
		data = URL_RE.test(data.url) && data.res.json;
		if (!data) {
			return;
		}
		var error = data.ret !== 0;
		var ret = data.ret + (error && data.msg ? '(' + data.msg + ')' : '');
		next({
			abc: { ret: ret }, // 对应上面的 dataKey： customData.abc.ret
			error: error, // 可选，是否显示错误样式
			style: error ? { // 可选，自动样式
				color: '#fff',
				fontStyle: 'italic',
				bgColor: 'red'
			} : undefined
		})
	};
	```
	效果：

	<img width="800" alt="image" src="https://user-images.githubusercontent.com/11450939/204819477-d6e831fb-2269-4a97-a6ad-63b773068a2b.png">