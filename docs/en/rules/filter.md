# filter(=[ignore](ignore.html) + [enable](enable.html))
用于忽略指定配置的规则：

	pattern filter://rule|proxy|pac

可以同时设置多个规则[协议列表](./)里面的规则，其中rule包含[file、tpl等](rule/)；

也可以用来开启拦截https：

	pattern filter://https

也可以用来隐藏请求：

	pattern filter://hide

同时配置多种过滤规则的配置方式：

	pattern filetr://operator1|operator2|operatorN

pattern参见[匹配模式](../pattern.html)，更多模式请参考[配置方式](../mode.html)。

例子：

开启拦截[www.baidu.com](http://www.baidu.com/)的HTTPS及去除[rule](rule.html)配置

	www.baidu.com filter://https|rule
	www.ifeng.com filter://hide|proxy|rule

开启拦截HTTPS也可以通过界面上方的Https按钮来启用，filter提供了一种可配置的方式，`filter://hide`可以让www.ifeng.com的请求不在界面上显示，这个与界面上的Filter设置效果相反，可以配合使用。
