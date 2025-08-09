# file
使用本地文件响应请求，适用于：
- 搭建本地开发环境
- 调试本地前端页面
- 接口 Mock 场景

## 规则语法
``` txt
pattern file://value [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| value   | 操作内容，支持以下类型：<br/>• 目录/文件路径<br/>• 远程 URL<br/>• 内联/内嵌/Values内容 | [操作指令文档](./operation)   |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |


## 替换本地文件
``` txt
# 基础用法
www.example.com/path file:///User/xxx/test

# Windows 路径
www.example.com/path file://D:\test 

# 排除特定接口
www.example.com/path file:///User/xxx/test excludeFilter://*/path/cgi

# 根据请求内容匹配
www.example.com/path file:///User/xxx/test includeFilter://b:/"cmdname":\s*"test"/i
```
**特性说明：**
- 自动路径拼接：访问 `https://www.example.com/path/x/y/z` 会映射到 `/User/xxx/test/x/y/z`
- 禁用路径拼接：使用 `< >` 包裹路径
  ``` txt
  www.example.com/path file://</User/xxx/test>
  ```
  > 访问 `https://www.example.com/path/x/y/z`  只会自动加载 `/User/xxx/test` 对应的文件

## 快速替换
如果不方便操作本地文件，也可以用 Whistle 提供的内联/内嵌/Values功能，通过界面设置响应内容：
```` txt
# 内联值不能有空格
www.example.com/path file://({"ec":0})

# 内嵌值（可以带空格和换行符）
``` test.json
{
  "ec": 2,
  "em": "error"
}
```
www.example.com/path file://{test.json}
````
> `test.json` 如果内容比较多可以放在 Values 里面

## 替换临时文件
如果内容比较大，且又不方便操作本地文件，可以用 Whistle 提供的临时文件功能：
``` txt
www.example.com/path file://temp/blank.html
```
**操作步骤：**
1. 按住 `Command(Mac)`/`Ctrl(Win)`
2. 点击规则中的 `file://temp/blank.html`
3. 在弹出编辑器中输入响应内容

## Mock JSONP
```` txt
www.example.com/path file://`(${query.callback}({"ec":0}))` # 内联值不能有空格

# 内嵌值（可以带空格和换行符）
``` test.json
${query.callback}({
  "ec": 2,
  "em": "error"
})
```
www.example.com/path file://`{test.json}`
````

模板字符串在以下场景中无法直接生效：
- 引用本地文件路径时
- 引用远程 URL 地址时

当遇到上述限制时，您可以使用 [tpl](./tpl) 功能作为替代方案。

## 高级用法
**多目录搜索：**
``` txt
www.example.com/path file:///path1|/path2|/path3
```

**查找逻辑：**
1. 按顺序检查 /path1/x/y/z → /path2/x/y/z → /path3/x/y/z
2. 找到第一个存在的文件立即返回
3. 全部未找到返回 `404`

## 关联协议
1. 需要允许未匹配文件的请求继续正常访问用：[xfile](./xfile)
2. 需要用其它远程 URL 的内容替换用：[https](./https) 或 [http](./http) 或配 [host](./host) （不建议用：<del>`file://https://xxx`</del>）
