# reqHeaders
动态修改请求头部信息，支持多种数据源和批量操作方式。

## 规则语法
``` txt
pattern reqHeaders://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作数据对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例

#### 基础配置
``` txt
www.example.com/path reqHeaders://x-proxy=Whistle
```
访问 `https://www.example.com/path/to` 在 Whistle Network 或后台服务器可以看到新增请求头：
``` txt
x-proxy: Whistle
```

#### 设置多个请求头

```` txt
``` test.json
x-test1: 1
x-test2:
x-test3: abc
```
www.example.com/path2 reqHeaders://{test.json}

# 等价于：www.example.com/path2 reqHeaders://x-test1=1&x-test2=&x-test3=abc
````
访问 `https://www.example.com/path2/to` 在 Whistle Network 或后台服务器可以看到新增请求头：
``` txt
x-test1: 1
x-test2: 
x-test3: abc
```

#### 本地/远程资源

```` txt
www.example.com/path1 reqHeaders:///User/xxx/test.json
www.example.com/path2 reqHeaders://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 reqHeaders://temp/blank.json
````

## 关联协议
1. 更灵活的修改请求头的方式：[headerReplace](./headerReplace)
2. 删除请求头字段：[delete://reqHeaders.xxx](./delete)

