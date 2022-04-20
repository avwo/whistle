# ignore (skip)
用于忽略指定协议的匹配规则，也可以忽略当前配置的匹配规则，其配置方式为：
```
pattern ignore://protocol1|protocol2|protocolN
```

`v2.9.9` 版本开始支持以下配置：
```
pattern ignore://pattern=patternX
pattern ignore://operator=operatorUri # 等价于 pattern ignore://matcher=operatorUri
```

`v2.9.10` 版本开始支持以下配置：
```
pattern skip://pattern=patternX
pattern skip://operator=operatorUri # 等价于 pattern skip://matcher=operatorUri
```
> skip 与 ignore 的区别，ignore 是将匹配的规则删除掉，skip 是跳过指定的规则不做匹配

其中，`pattern`参见[匹配模式](../pattern.html)，`protocol1`，...，`protocolN` 对应 [协议列表](../rules/.md) 里面的协议，`|` 为分隔符用于同时设置忽略 (过滤) 多个规则。

如果要忽略所有规则：
```
pattern ignore://*
```

如果要保留某些已设置的规则：
```
pattern ignore://*|-protocol1|-protocol2|-protocolN
```
> 表示保留协议为`protocol1`，...，`protocolN`的规则。

### 例子：

**配置规则：**
```
# www.example.com/test-hosts表示该路径及其子路径配置hosts为 127.0.0.1:8080
www.example.com/test-hosts 127.0.0.1:8080
# www.example.com/test表示该路径及其子路的请求转发到本地/User/xxx/dir目录下的对应文件
www.example.com/test file:///User/xxx/dir
# 该域名的所有请求通过socks协议代理到127.0.0.1:1080
www.example.com socks://127.0.0.1:1080
www.test.com http://www.qq.com
```
> host的优先级高于socks/proxy，更多匹配模式参考：[pattern](../pattern.html)。

**忽略规则：**
```
# 表示www.example.com/test-hosts/xxx及其路径忽略host规则
www.example.com/test-hosts/xxx ignore://host
# 表示www.example.com/test-hosts/yyy及其路径忽略host和socks规则
www.example.com/test-hosts/yyy ignore://host|socks
# 表示wwww.example.com/test/abc及其路径最多只保留socks规则
www.example.com/test/abc ignore://*|-socks
# www.test.com/direct及其子路径不要转发到www.qq.com对应路径
www.test.com ignore://http

www.test.com/test http://www.qq.com
www.test.com/test http://www.qq2.com

# (v2.9.9+) 忽略所有 pattern 为 www.example.com/test 的规则
www.example.com ignore://pattern=www.example.com/test

# (v2.9.9+) 忽略所有 operator 为 http://www.qq.com 的规则
www.test.com ignore://operator=http://www.qq.com

# (v2.9.10+) www.test.com/test 会匹配 www.test.com/test http://www.qq2.com
www.test.com skip://operator=http://www.qq.com

```

