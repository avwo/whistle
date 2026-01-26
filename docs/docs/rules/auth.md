# auth

`auth` 协议用于快速修改请求头的 `Authorization` 字段，为匹配的请求自动添加 HTTP 基本认证（Basic Authentication）所需的凭证信息。

## 规则语法

`auth` 支持多种方式设置请求鉴权头：

### 1. 内联值（直接指定）
直接在规则中写明用户名和密码。
```txt
pattern auth://username:password [lineProps...] [filters...]
# 或
pattern auth://username=test&password=123 [lineProps...] [filters...]
```
**示例：**
```txt
https://example.com/api1/ auth://admin:secret
https://example.com/api2/ auth://username=admin&password=secret
```

### 2. 内嵌值（使用代码块）
当凭证信息较复杂或需要复用时可使用此方式。在规则中引用一个自定义键，并在随后的代码块中定义其值。
````txt
pattern auth://{custom-key} [lineProps...] [filters...]

``` custom-key
username: admin
password: my secret password
```
````

### 3. 引用 Values 中的值
引用在界面 `Values` 中预先定义好的值。
```txt
pattern auth://{key-of-values} [lineProps...] [filters...]
```
**前提：** 在 `Values` 中存在一个名为 `key-of-values` 的键，其值为包含用户名和密码的对象。

### 4. 从临时文件中加载
当需要频繁编辑内容时，可以使用 Whistle 提供的临时文件功能。

```txt
pattern auth://temp.json
```

**操作步骤**：
1. 在 Rules 编辑器中，按住 `Command`（Mac）/ `Ctrl`（Windows）
2. 鼠标点击 `auth://temp.json`
3. 在弹出的编辑对话框中输入响应内容
4. 点击 `Save` 保存

保存后规则会自动变为类似以下格式：
```txt
https://example.com/report auth://temp/11adb9c9e1142df67b30d7646ec59bcd34c855d9011d1a2405c7fc2dfc94568d.json
```

需要再次编辑时，用同样的方式点击该临时文件链接即可。

### 5. 从文件或远程 URL 加载
从本地文件或远程 URL 加载包含鉴权信息的 JSON 或简单 YAML 文件。
```txt
# 从本地文件加载
pattern auth:///User/xxx/auth.json

# 从远程 URL 加载（支持 http 和 https）
pattern auth://https://config.example.com/auth.json
```

**文件格式要求：**
文件内容应为 JSON 或简单 YAML 格式，包含 `username` 和 `password` 字段：
```json
{
  "username": "admin",
  "password": "secret"
}
```
或
```yaml
username: admin
password: secret
```

## 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **value** | 是 | 鉴权凭证信息，支持多种格式：<br>• **直接格式**：`username:password` 或 `username=test&password=123`<br>• **对象格式**：包含 `username` 和 `password` 字段的对象<br>• 支持从本地文件或远程 URL 加载<br>• 支持内联、内嵌、Values、本地文件路径、远程 URL 引用 |
| **lineProps** | 否 | 为规则设置附加属性。<br>• 例如：`lineProps://important` 可提升此规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |

## 配置示例

### 基础示例
为 example.com 的 API 接口添加基本认证：
```txt
https://api.example.com/ auth://admin:secret
```

### 使用内嵌值
当密码包含特殊字符或空格时，使用内嵌方式更安全：
````txt
https://internal.example.com/ auth://{prod-credentials}

``` prod-credentials
username: service-account
password: P@ssw0rd!2024
```
````

### 从文件加载
从本地配置文件加载鉴权信息：
```txt
https://example.com/api/ auth:///Users/john/config/auth.json
```

### 配合过滤器使用
仅对 POST 请求添加鉴权：
```txt
https://example.com/api/ auth://admin:secret includeFilter://m:POST
```

### 引用 Values 中的配置
假设在 Values 中已有 `api-auth` 配置：
```txt
https://example.com/api/ auth://{api-auth}
```

## 工作原理与关联协议

1. **核心原理**：`auth` 协议会自动计算用户名和密码的 Base64 编码，并设置 `Authorization` 请求头。

   上面的示例等价于使用 [`reqHeaders`](./reqHeaders) 协议手动设置：
   ```` txt
   https://example.com/api/ reqHeaders://{auth.txt} # 内容有空格，不能内联

   ``` auth.txt
   authorization: Basic YWRtaW46c2VjcmV0
   ```
   ````
   其中 `YWRtaW46c2VjcmV0` 是 `admin:secret` 的 Base64 编码。

2. **优势**：相比于直接使用 `reqHeaders`，`auth` 语法更简洁直观，无需手动计算 Base64 编码值。

## 注意事项
- `auth` 协议仅支持 HTTP 基本认证（Basic Authentication）
- 对于更复杂的认证方式（如 Bearer Token、OAuth 等），请使用 [`reqHeaders`](./reqHeaders) 协议直接设置相应的 `Authorization` 头
- 从远程 URL 加载时，请确保目标 URL 安全可靠
