# exportsUrl

用于把请求的完整 url 列表按顺序导出到指定文件 (如果该文件不存在，则会自动创建)，配置模式：

	pattern exportsUrl://filepath

filepath 指本地文件路径，pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

例子：

导出所有请求 url 到指定文件:

	/./ exportsUrl:///User/xxx/exports.txt
