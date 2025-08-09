# ua
修改请求头的 `Uer-Agent` 字段的快捷协议，可用于模拟各种机器访问。

## 规则语法
``` txt
pattern ua://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 自定义请求的 `User-Agent` 字符串<br/>• 内联/内嵌/Values内容<br/>⚠️ 不支持从文件/远程 URL 加载数据 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
```` txt
# 将原来的 user-agent 改成 `Whistle/2.9.100`
www.example.com/path ua://Whistle/2.9.100

# 存在空格的 UA
``` ua.txt
Test Whistle/2.9.100 
```
www.example.com/path ua://{ua.txt}

# 使用 reqHeaders
``` ua.json
user-agent: Test Whistle/2.9.100 
```
www.example.com/path reqHeaders://{ua.json}
````

## 关联协议
1. 直接修改请求头：[reqHeaders://User-Agent=value](./reqHeaders)
