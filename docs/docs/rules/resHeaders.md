# resHeaders
动态修改响应头部信息，支持多种数据源和批量操作方式。

## 规则语法
``` txt
pattern resHeaders://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作数据对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例

#### 基础配置
``` txt
www.example.com/path resHeaders://x-proxy=Whistle
```
访问 `https://www.example.com/path/to` 新增响应头：
``` txt
x-proxy: Whistle
```

#### 设置多个响应头

```` txt
``` test.json
x-test1: 1
x-test2:
x-test3: abc
```
www.example.com/path2 resHeaders://{test.json}

# 等价于：www.example.com/path2 resHeaders://x-test1=1&x-test2=&x-test3=abc
````
访问 `https://www.example.com/path2/to` 在 Whistle Network 或后台服务器可以看到新增响应头：
``` txt
x-test1: 1
x-test2: 
x-test3: abc
```

#### 本地/远程资源

```` txt
www.example.com/path1 resHeaders:///User/xxx/test.json
www.example.com/path2 resHeaders://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 resHeaders://temp/blank.json
````

## 关联协议
1. 更灵活的修改响应头的方式：[headerReplace](./headerReplace)
2. 删除响应头字段：[delete://resHeaders.xxx](./delete)

