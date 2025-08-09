# method
修改请求方法。

## 规则语法
``` txt
pattern method://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | `get`/`post`/`head` 等请求方法名称（不区分大小写） |    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
# 访问 `https://www.example.com/path/to` 在 Whistle 抓包界面上可以看到请求方法为 `POST`
www.example.com/path method://post

# 带过滤条件的方法修改
www.example.com/path2 method://patch includeFilter://reqH.content-type=multipart/form-data
```
