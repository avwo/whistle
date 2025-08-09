# referer
修改请求头的 `referer` 字段，有些服务器会校验请求头的 `referer` 字段，这个协议可以用来绕过这个检测或者测试后台的功能。

## 规则语法
``` txt
pattern referer://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 完整 URL 链接<br/>• 内联/内嵌/Values内容<br/>⚠️ 不支持从文件/远程 URL 加载数据 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
www.example.com/path referer://https://www.test.com/x/y/z?xxx
```

## 关联协议
1. 等价于：[reqHeaders://referer=https://xxx](./reqHeaders)
