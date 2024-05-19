# 配置方式

whistle的所有操作都可以通过配置实现，配置方式扩展于系统hosts配置方式(`ip domain`或组合方式`ip domain1 domain2 domainN`)，具有更丰富的[匹配方式](pattern.html)及更灵活的配置方式。whistle的匹配顺序是从左到右，这与传统hosts从右到左的配置方式不同，但为了兼容传统hosts配置方式，除了pattern和operatorURI都可以为请求url外(这种情况whistle无法自动区分pattern和operatorURI，只能按约定的顺序匹配)，其它情况whistle都支持配置两边的位置对调，即：`pattern operatorURI`和`operatorURI pattern`等价。

> whistle跟传统hosts配置一样也采用`#`为注释符号


## whistle有以下三种配置方式：

1. 默认方式

  默认是将匹配表达式写在左边，操作uri写在右边

		pattern operatorURI

	whistle将请求url与pattern匹配，如果匹配到就执行operatorURI对应的操作

2. 传统方式

	传统方式指的是传统的hosts配置方式，操作URI写在左边

		operatorURI pattern

	如果pattern为路径或域名，且operatorURI为域名或路径

		www.test.com www.example.com/index.html
		http://www.test.com www.example.com/index.html

	这种情况下无法区分pattern和operatorURI，whistle不支持这种传统的方式，只支持默认方式

3. 组合方式

	传统hosts的配置对多个域名对于同一个ip可以采用这种方式：

		127.0.0.1  www.test1.com www.test2.com www.testN.com

	whistle完全兼容传统hosts配置方式，且支持更多的组合方式：

		# 传统组合方式
		pattern operatorURI1 operatorURI2 operatorURIN

		# 如果pattern部分为路径或域名，且operatorURI为域名或路径
		# 这种情况下也支持一个操作对应多个pattern
		operatorURI pattern1 pattern2 patternN

[whistle v1.13.4](./update.html)及以上版本支持，配置换行：
```
www.test.com file://(test) filter://*/cgi-bin
# 等价于
line`
www.test.com file://(test)
filter://*/cgi-bin
`
# 或
line`
www.test.com
file://(test)
filter://*/cgi-bin
`
```

其中，pattern请参考：[匹配方式](pattern.html)
