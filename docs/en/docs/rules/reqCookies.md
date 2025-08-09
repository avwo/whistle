# reqCookies
修改请求 `Cookie` 头。

## 规则语法
``` txt
pattern reqCookies://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | Cookie 对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容  | [操作指令文档](./operation) |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

Cookie 对象结构：`key-value`

## 配置示例
#### 内联方式
```` txt
www.example.com/path reqCookies://k1=v1&k2=v2
````
请求头新增两个请求 cookie：`k1: v1`/`k2: v2`

### 内嵌模式
```` txt
``` cookies.json
key1: value1
key2: value2
```
# 或
``` cookies.json
{
  key1: 'value1',
  key2: 'value2'
}
```
www.example.com/path reqCookies://{cookies.json}
````
请求头新增两个请求 cookie：`key1: value1`/`key2: value2`

#### 本地/远程资源

```` txt
www.example.com/path1 reqCookies:///User/xxx/test.json
www.example.com/path2 reqCookies://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 reqCookies://temp/blank.json
````

## 关联协议
1. 删除请求 cookie：[delete://reqCookies.xxx](./delete)
2. 删除所有请求 cookie：[delete://reqHeaders.cookie](./delete)

