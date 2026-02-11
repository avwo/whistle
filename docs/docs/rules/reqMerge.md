# reqMerge
将指定数据对象智能合并到请求体中，适合修改部分参数而不影响其余内容，支持多种请求格式：
- 常规表单 (`application/x-www-form-urlencoded`)
- 文件上传表单 (`multipart/form-data`)
- JSON 请求 (`application/json`)

## 规则语法
``` txt
pattern reqMerge://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作数据对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例

#### 内联方式
``` txt
www.example.com/path reqMerge://test=123 reqBody://(name=avenwu) reqType://form method://post
```
访问 `https://www.example.com/path/to` 服务器收到的请求内容：
``` txt
name=avenwu&test=123
```

#### 内嵌方式
```` txt
``` reqMerge.json
a.b.c: 123
c\.d\.e: abc
```
www.example.com/path reqMerge://{reqMerge.json} reqBody://({"name":"avenwu"}) reqType://json method://post
````
访问 `https://www.example.com/path/to` 抓包请求内容：
``` js
{"name":"avenwu","a":{"b":{"c":123}},"c.d.e":"abc"}
```

#### 本地/远程资源
```` txt
www.example.com/path1 reqMerge:///User/xxx/test.json
www.example.com/path2 reqMerge://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 reqMerge://temp/blank.json
````

## 注意事项：请求内容大小限制
为了保障处理性能，`reqMerge` 默认对请求内容大小有限制。
- **限制说明**：自动合并处理仅适用于请求体小于 2MB 的请求。超过此大小的响应将被跳过。
- **如何覆盖**：如果您确认需要处理更大的请求内容，可以通过在匹配的规则中添加以下指令来显式启用：

``` txt
pattern enable://reqMergeBigData

# 或
www.example.com/path1 reqMerge:///User/xxx/test.json lineProps://enableBigData
```
启用后，reqMerge 将尝试处理更大体积的请求，请注意这可能增加内存消耗和处理时间。

## 关联协议
1. 通过关键字或正则替换：[reqReplace](./reqReplace)
2. 修改响应内容对象：[resMerge](./resMerge)


