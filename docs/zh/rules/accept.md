# accept

修改请求头的 accept 字段，accept 字段主要告诉服务器该请求可以接受什么类型的数据，配置模式：

	pattern accept://mime-type

pattern 参见 [匹配方式](pattern.md)，更多模式请参考 [配置模式](mode.md)。

例子：

只接受图片类型的数据

	www.test.com accept://image/*
