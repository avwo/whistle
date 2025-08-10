# urlParams
动态修改请求 URL 的查询参数，支持多种参数注入方式。

## 规则语法
``` txt
pattern urlParams://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作数据对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
``` txt
www.example.com/path urlParams://test=123
```
访问 `https://www.example.com/path/to` 服务器收到的 URL：`https://www.example.com/path/to?test=123`

<img src="/img/url-params.png" width="360" />

```` txt
``` test.json
test1: 1
test2:
test3: 3
```
www.example.com/path2 urlParams://{test.json}
````
访问 `https://www.example.com/path2/to` 服务器收到的 URL：`https://www.example.com/path2?test1=1&test2=&test3=3`

<img src="/img/url-params2.png" width="360" />

#### 本地/远程资源

```` txt
www.example.com/path1 urlParams:///User/xxx/test.json
www.example.com/path2 urlParams://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 urlParams://temp/blank.json
````

## 关联协议
1. 更灵活的修改请求参数的方式：[pathReplace](./pathReplace)
2. 删除请求参数：[delete://urlParams.xxx](./delete)
