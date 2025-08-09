# reqReplace
使用类似 JavaScript `String.replace()` 的方法替换请求体内容（仅对包含内容体的请求有效，如 `POST`、`PUT` 等），支持多种文本格式：
- 表单数据 (`application/x-www-form-urlencoded`)
- JSON (`application/json`)
- XML (`application/xml`)
- HTML (`text/html`)
- 纯文本 (`text/xxx`)

## 规则语法
``` txt
pattern reqReplace://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 替换配置对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容  | [操作指令文档](./operation) |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例

#### 内联方式
```` txt
www.example.com/path reqBody://(00user-11test-22user-33test) reqReplace://user=abc&/\d+/g=number reqType://txt method://post
````
请求 `https://www.example.com/path/to` 后台收到的请求内容为：
``` txt
numberabc-numbertest-numberabc-numbertest
```

### 内嵌模式
```` txt
``` reqReplace.json
user: name
/\d+/g: num
```
# 或（注意转义符）
``` reqReplace.json
{
  'user': 'name',
  '/\\d+/g': 'num'
}
```
www.example.com/path reqBody://(00user-11test-22user-33test) reqReplace://{reqReplace.json} reqType://txt method://post
````
请求 `https://www.example.com/path/to` 后台收到的请求内容为：
``` txt
numname-numtest-numname-numtest
```

#### 本地/远程资源

```` txt
www.example.com/path1 reqReplace:///User/xxx/test.json
www.example.com/path2 reqReplace://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 reqReplace://temp/blank.json
````

## 关联协议
1. 对象合并：[reqMerge](./reqMerge)
2. 完全替换：[reqBody](./reqBody)



