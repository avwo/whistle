# auth
修改请求头的 `authorization` 字段的快捷协议，设置鉴权信息。

## 规则语法
``` txt
pattern auth://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | `username:password` 或包含 `username` 和 `password` 的对象，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
```` txt
# 内联方式
www.example.com/path auth://test:123

# 或
www.example.com/path auth://username=test&password=123

# 内嵌/Values
``` auth.json
username: test
password: 123
```

# 或
``` auth.json
{
  username: test,
  password: 123
}
```

www.example.com/path auth://{auth.json}

````

#### 本地/远程资源

```` txt
www.example.com/path1 auth:///User/xxx/auth.json
www.example.com/path2 auth://https://www.xxx.com/xxx/auth.json
# 通过编辑临时文件
www.example.com/path3 auth://temp/blank.json
````
## 关联协议
1. 直接修改请求头：[reqHeaders://authorization=value](./reqHeaders)

