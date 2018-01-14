# 配置模式

whistle的所有操作都可以通过配置实现，配置模式扩展于系统hosts配置模式(`ip domain`或组合模式`ip domain1 domain2 domainN`)，具有更丰富的[匹配方式](pattern.html)及更灵活的配置模式。whistle的匹配顺序是从左到右，这与传统hosts从右到左的配置模式不同，但为了兼容传统hosts配置模式，除了pattern和operator-uri都可以为请求url外(这种情况whistle无法自动区分pattern和operator-uri，只能按约定的顺序匹配)，其它情况whistle都支持配置两边的位置对调，即：`pattern operator-uri`和`operator-uri pattern`等价。

> whistle跟传统hosts配置一样也采用`#`为注释符号


## whistle有以下三种匹配模式：

1. 默认模式
	默认是将匹配方式写在左边，操作uri写在右边
	
		pattern operator-uri
		
	whistle将请求url与pattern匹配，如果匹配到就执行operator-uri对应的操作

2. 传统模式

	传统模式指的是传统的hosts配置模式，操作URI写在左边
	
		operator-uri pattern
		
	如果pattern为路径或域名，且operator-uri为域名或路径
	
		www.test.com www.example.com/index.html
		http://www.test.com www.example.com/index.html
		
	这种情况下无法区分pattern和operator-uri，whistle不支持这种传统的模式，只支持默认模式
	
3. 组合模式

	传统hosts的配置对多个域名对于同一个ip可以采用这种模式：
	
		127.0.0.1  www.test1.com www.test2.com www.testN.com
		
	whistle完全兼容传统hosts配置模式，且支持更多的组合模式：
	
		# 传统组合模式
		pattern operator-uri1 operator-uri2 operator-uriN
		
		# 如果pattern部分为路径或域名，且operator-uri为域名或路径
		# 这种情况下也支持一个操作对应多个pattern
		operator-uri pattern1 pattern2 patternN
		
其中，pattern请参考：[匹配方式](pattern.html)
