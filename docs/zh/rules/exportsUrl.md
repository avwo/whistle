# exportsUrl

用于把请求的完整url列表按顺序导出到指定文件(如果该文件不存在，则会自动创建)，配置方式：

	pattern exportsUrl://filepath

filepath指本地文件路径，pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

导出所有请求url到指定文件:

	/./ exportsUrl:///User/xxx/exports.txt
