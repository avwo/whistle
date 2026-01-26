# attachment
`attachment` 协议用于设置响应头中的 `Content-Disposition` 字段，使浏览器将服务器的响应直接视为附件下载，并将文件保存为 `attachment` 设定的名称，而不是在页面内展示。
> 类似 Koa 的 `attachment` 方法：https://koajs.com/

## 规则语法

`attachment` 支持多种方式来指定下载文件名：

### 1. 内联值（直接指定）
直接在规则中写明文件名。
```txt
pattern attachment://filename [lineProps...] [filters...]
```
**示例：**
```txt
https://example.com/report attachment://年度报告.pdf
```

### 2. 内嵌值（使用代码块）
当文件名较长或需要复用时可使用此方式。在规则中引用一个自定义键，并在随后的代码块中定义其值。
````txt
pattern attachment://{custom-key} [lineProps...] [filters...]

``` custom-key
季度数据-2024Q1.csv
```
````

### 3. 引用 Values 中的值
引用在界面 `Values` 中预先定义好的值。
```txt
pattern attachment://{key-of-values} [lineProps...] [filters...]
```
**前提：** 在 `Values` 中存在一个名为 `key-of-values` 的键，其值为目标文件名。

### 4. 文件/远程 URL 加载
**当前不支持** 从本地文件或远程 URL 动态加载文件名内容。

## 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **filename** | 是 | 下载时显示的文件名。<br>• 例如：`document.pdf`, `export.xlsx`。<br>• 支持通过上述三种方式（内联/内嵌/Values）指定。<br>• ⚠️ 不支持从文件或远程 URL 加载。 |
| **lineProps** | 否 | 为规则设置附加属性。<br>• 例如：`lineProps://important` 可提升此规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |


## 配置示例

### 基础示例
让访问 example.com 首页时自动下载一个名为 `example.html` 的文件。
```txt
https://www.example.com/ attachment://example.html
```

### 配合过滤器使用
仅当请求包含特定查询参数 `download=true` 时，才触发 PDF 文件下载。
```txt
https://api.example.com/document attachment://用户手册.pdf includeFilter:///[?&]download=true/
```

### 使用内嵌值
当文件名比较复杂或需要注释时，使用内嵌代码块更清晰。
````txt
https://assets.example.com/data.json attachment://{my-file-name}

``` my-file-name
配置备份-20240514.json
```
````

## 实现远程加载

`attachment` 协议本身不支持从文件路径或远程 URL 加载值。如果需要实现远程加载功能，有以下两种替代方案：

### 1. 通过插件扩展功能
你可以开发插件来实现更复杂的文件名获取逻辑，比如从远程API动态获取文件名。具体开发方法请参考：[插件开发文档](../extensions/dev)

### 2. 使用 @url 加载完整规则
将包含 `attachment` 规则的完整配置文件存储在远程服务器上，然后通过 [`@url`](./@) 协议加载整个规则集。

**示例：**
1. 在远程服务器创建规则文件 `xxx.txt`：
    ```txt
    https://api.example.com/export attachment://remote-file.csv
    https://static.example.com/docs attachment://文档.pdf
    ```
2. 在本地 Rules 配置中引用远程规则：
    ```txt
    @https://remote-url/xxx.txt
    ```

这样，远程文件中的 `attachment` 规则就会被加载生效。

## 工作原理与关联协议

1.  **核心原理**：`attachment` 协议本质上是自动设置响应头。
    上面的示例完全等价于使用 [`resHeaders`](./resHeaders) 协议手动设置：
    ```txt
    https://www.example.com/ resHeaders://content-disposition=attachment;filename="example.html"
    ```

2.  **优势**：相比于直接使用 `resHeaders`，`attachment` 语法更简洁、易读，专注于文件下载场景，自动处理文件名转义等细节。

3.  **注意**：服务器本身返回的响应体内容不会改变。此规则只是通过修改响应头，指示浏览器如何处理这些内容。
