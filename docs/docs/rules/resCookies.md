# resCookies
修改响应 `Cookie`。

## 规则语法
``` txt
pattern resCookies://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | Cookie 对象，支持从以下渠道获取：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容  | [操作指令文档](./operation) |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

Cookie 对象结构
``` js
{
  "key1": "value1",
  "key2": "value2",
  "keyN": {
          "value": "value1",
          "maxAge": 60,
          "httpOnly": true,
          "path": "/",
          "secure": true,
          "domain": ".example.com",
          "sameSite": 'None',
          "Partitioned": false
      }
}
```
> 默认 `path=/`

## 配置示例
#### 内联方式
```` txt
www.example.com/path resCookies://k1=v1&k2=v2
````
响应头新增两个响应 cookie：`k1: v1`/`k2: v2`

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
www.example.com/path resCookies://{cookies.json}
````
响应头新增两个响应 cookie：`key1: value1`/`key2: value2`

#### 本地/远程资源

```` txt
www.example.com/path1 resCookies:///User/xxx/test.json
www.example.com/path2 resCookies://https://www.xxx.com/xxx/params.json
# 通过编辑临时文件
www.example.com/path3 resCookies://temp/blank.json
````

## 关联协议
1. 删除响应 cookie：[delete://resCookies.xxx](./delete)
2. 删除所有响应头 cookie：[delete://resHeaders.set-cookie](./delete)


