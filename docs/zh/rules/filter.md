# filter(=[ignore](rules/ignore.md) + [enable](rules/enable.md))

用于忽略指定配置的规则：

	pattern filter://rule|proxy|pac

可以同时设置多个规则 [协议列表](./.md) 里面的规则，其中 rule 包含[file、tpl 等](rule/.md)；

也可以用来开启拦截 https：

	pattern filter://https

也可以用来隐藏请求：

	pattern filter://hide

同时配置多种过滤规则的配置模式：

	pattern filetr://operator1|operator2|operatorN

pattern 参见[匹配方式](pattern.md)，更多模式请参考[配置模式](mode.md)。

例子：

开启拦截 [www.baidu.com](http://www.baidu.com/) 的 HTTPS 及去除 [rule](rules/rule.md) 配置

	www.baidu.com filter://https|rule
	www.ifeng.com filter://hide|proxy|rule

开启拦截 HTTPS 也可以通过界面上方的 Https 按钮来启用，filter 提供了一种可配置的方式，`filter://hide` 可以让 www.ifeng.com 的请求不在界面上显示，这个与界面上的 Filter 设置效果相反，可以配合使用。
