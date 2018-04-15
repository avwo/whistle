# plugin

从 [插件开发](plugins.md) 里面可知，插件里面涉及 `uiServer`，`statusServer`，`rulesServer`，`server`，`resRulesServer` 共 5 个内部功能不同的 server，这几个 server 都是可选的；如果存在，插件会把匹配的请求按给定方式传给对应的 server，并根据 server 响应内容做相应的处理，如何把请求转发到插件的各个 server？一种方式是直接根据插件的名称设置匹配，比如插件 `whistle.abc`：

	pattern abc://value

这样所有匹配 `pattern` 的请求都会访问插件里面的内置 server，这种配置方式比较简单直接，且默认会把请求转发给其中 `server` 处理(除非在 `rulesServer` 里面设置了[filter://rule](rules/filter.md))，这种设置方式只能满足要么插件做转发，要么通过 `rulesServer` 动态设置的规则来做处理。

有些情况，我们需要动态判断请求是否要有插件来做转发，还是直接根据用户设置的 [rule](rules/rule.md) 来处理，这种情况需要用到 plugin 这个协议：

	pattern plugin://name
	pattern plugin://name(value)
	pattern plugin://name://value

plugin 支持上述 3 种配置模式(位置可以调换)，匹配规则的请求默认只会请求 `statusServer`，`rulesServer`，`resRulesServer`，用户可以在这 3 个 server 里面获取请求响应信息或动态设置新规则等等。
