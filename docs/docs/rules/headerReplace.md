# headerReplace
通过关键字匹配或正则表达式替换指定请求头/响应头。

## 规则语法
``` txt
pattern headerReplace://value [filters...]
```
> `header-name` 不区分大小写

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 三种情况：<br/>• `req.header-name:p1=v1&p2=v2`<br/>• `res.header-name:p1=v1&p2=v2`<br/>• `trailer.trailer-name:p1=v1&p2=v2` | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 请求头 `accept` 字段值的第一个 `html` 关键字被改成 `abc`
www.example.com/path headerReplace://req.accept:html=abc

# 请求头 `accept` 字段值的所有 `ml` 关键字被改成 `abc`
www.example.com/path2 headerReplace://req.accept:/ml/g=abc

# 修改响应头
www.example.com/path3 headerReplace://res.Content-Type:html=plain
```

`headerReplace` 是用来替换请求/响应头的局部内容，如果要修改请求/响应字段内容，还可以用：
- 设置请求头：[reqHeaders](./reqHeaders)
- 设置响应头：[resHeaders](./resHeaders)
