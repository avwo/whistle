# reqWrite
将请求内容体保存到指定目录或文件中，适用于需要记录请求数据的场景：
- 自动根据请求URL生成文件路径
- 采用安全写入策略（可以采用 [enable://forceReqWrite](./enable) 强制覆盖）
- 仅对包含内容体的请求有效（POST/PUT/PATCH等）
- GET/HEAD 等无内容体请求会自动跳过
- 保存失败时自动跳过

## 规则语法
``` txt
pattern reqWrite://fileOrDirPath [filters...]
```

| 参数    | 描述                                                         | 详细文档                  |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | 匹配请求 URL 的表达式                                        | [匹配模式文档](./pattern) |
| fileOrDirPath   | 存储数据的目录或文件路径 | |
| filters | 可选过滤器，支持匹配：<br/>• 请求URL/方法/头部/内容<br/>• 响应状态码/头部 | [过滤器文档](./filters) |

## 配置示例

#### 基础配置
```txt
wproxy.org/docs reqWrite:///User/xxx/test/
```
##### 路径解析规则：
1. **当访问具体文件时**  
   `https://wproxy.org/docs/test.html`  
   → 保存到：`/User/xxx/test/test.html`

2. **当访问目录路径时**  
   `https://wproxy.org/docs/`  
   → 保存到：`/User/xxx/test/index.html`（目标路径为 `/User/xxx/test/`，结尾为 `/` 或 `\` 自动追加 `index.html`）

#### 目录显式配置
```txt
wproxy.org/docs/ reqWrite:///User/xxx/test/
```
##### 路径解析差异：
1. **访问子路径时**  
   `https://wproxy.org/docs/test.html`  
   → 仍保存到：`/User/xxx/test/test.html`

2. **访问配置目录时**  
   `https://wproxy.org/docs/`  
   → 直接保存到：`/User/xxx/test/`（作为整体文件）

> 💡 关键区别：  
> - 规则路径是否以 `/` 或 `\`结尾，决定了目录请求的保存方式  
> - 非目录路径（无结尾 `/` 或 `\`）会直接保存为指定文件
> - 目录路径（有结尾 `/` 或 `\`）会自动补全 `index.html`

#### 指定文件
``` txt
/^https://wproxy\.org/docs/(\?.*)?$ reqWrite:///User/xxx/test/index.html
```
> 通过正则匹配限定请求 URL

## 关联协议
1. 启用强制写入：[enable://forceReqWrite](./enable)
2. 写入请求都所有内容：[reqWriteRaw](./reqWriteRaw)
