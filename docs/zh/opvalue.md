# 操作值

whistle 的所有操作都可以通过配置实现，配置模式扩展于系统 hosts 配置模式 (`ip domain` 或组合模式 `ip domain1 domain2 domainN`)，具有更丰富的[匹配方式](pattern.md) 及更灵活的配置模式。whistle 的匹配顺序是从左到右，这与传统 hosts 从右到左的配置模式不同，但为了兼容传统 hosts 配置模式，除了 pattern 和 operator-uri 都可以为请求 url 外(这种情况 whistle 无法自动区分 pattern 和 operator-uri，只能按约定的顺序匹配)，其它情况 whistle 都支持配置两边的位置对调，即：`pattern operator-uri` 和 `operator-uri pattern` 等价。

> whistle 跟传统 hosts 配置一样也采用 `#` 为注释符号


### whistle 有以下三种匹配模式：

1. 默认模式

	默认是将匹配方式写在左边，操作 uri 写在右边

    pattern operator-uri

	whistle 将请求 url 与 pattern 匹配，如果匹配到就执行 operator-uri 对应的操作

2. 传统模式

	传统模式指的是传统的 hosts 配置模式，操作 URI 写在左边

		operator-uri pattern

	如果 pattern 为路径或域名，且 operator-uri 为域名或路径

		www.test.com www.example.com/index.html
		http://www.test.com www.example.com/index.html

	这种情况下无法区分 pattern 和 operator-uri，whistle 不支持这种传统的模式，只支持默认模式

3. 组合模式

	传统 hosts 的配置对多个域名对于同一个 ip 可以采用这种模式：

		127.0.0.1  www.test1.com www.test2.com www.testN.com

	whistle 完全兼容传统 hosts 配置模式，且支持更多的组合模式：
  ```
  # 传统组合模式
  pattern operator-uri1 operator-uri2 operator-uriN
  # 如果 pattern 部分为路径或域名，且 operator-uri 为域名或路径
  # 这种情况下也支持一个操作对应多个 pattern
  operator-uri pattern1 pattern2 patternN
  ```
其中，pattern 请参考：[匹配方式](pattern.md)
