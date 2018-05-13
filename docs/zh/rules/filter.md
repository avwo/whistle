# filter
> 可用于过滤pattern，要求 `whistle>=v1.10.x`

如配置：
```
www.test.com/cgi-bin/ file:///home/test/
```
该配置对 `www.test.com/cgi-bin/` 的所有协议及其子路径的请求都生效，想让其中包含`/test/`路段的请求不匹配该规则(且忽略大小写)：
```
www.test.com/cgi-bin/ file:///home/test/ filter:///\/test\//i
```

filter配置方式：
```
pattern operator1 operator2 ignore://reg1 ignore://!reg2 ignore://!reg3 ignore://reg4
```  
  > 其中 `reg1~reg4` 为形如 `/xxx/` 或 `/xxx/i` 的正则表达式，`!reg` 表示 `reg` 取非， 该配置表示请求要匹配`pattern`，但要过滤掉匹配 `reg1` 或 `reg4`，或不匹配`reg2` 或 `reg3`

