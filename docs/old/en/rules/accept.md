# accept

修改请求头的accept字段，accept字段主要告诉服务器该请求可以接受什么类型的数据，配置方式：

	pattern accept://mime-type

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

只接受图片类型的数据

	www.test.com accept://image/*
