# redirect
将匹配的请求立即重定向（302 Found）到指定URL，不请求到后台服务器。

## 规则语法
``` txt
pattern redirect://targetUrl [filters...]
```
| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| targetUrl   | 重定向后的 URL，可以是相对路径 |    |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例
#### 基础配置
``` txt
www.example.com/path redirect://https://www.qq.com

www.example.com/path2 redirect://../abc/123
```
- 访问 `https://www.example.com/path/to` 重定向到 `https://www.qq.com`（不自动拼接路径）
- 访问 `https://www.example.com/path2/to` 重定向到 `https://www.example.com/abc/123`

#### 实现路径拼接
``` txt
# 通配符
^www.example.com/path/*** redirect://`https://www.example.com/$1`
```
- 访问 `https://www.example.com/path/to?query` 重定向到 `https://www.example.com/to?query`

#### `301` 跳转
``` txt
www.example.com/path/test redirect://https://www.qq.com replaceStatus://301
```

## 关联协议
1. 无法通过 `302` 修改地址的页面可用：[locationHref](./locationHref)
