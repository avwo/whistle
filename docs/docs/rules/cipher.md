# tlsOptions

`tlsOptions` 协议用于配置 HTTPS/TLS 连接的安全参数，包括加密算法套件、客户端证书等，用于建立加密通信通道和服务器身份验证。

> **版本要求**：仅 Whistle 最新版本（≥ v2.9.101）支持此功能

通过 `tlsOptions` 协议，你可以：
- 自定义 TLS 加密算法套件
- 配置双向认证（mTLS）所需的客户端证书
- 设置 TLS 连接的其他安全参数
- 控制 TLS 版本和连接选项

**规则合并机制**：`tlsOptions` 支持设置任意多个配置规则，Whistle 会根据从上到下的顺序自动合并这些规则，允许你灵活组合不同的 TLS 配置。

## 规则语法

`tlsOptions` 支持多种方式配置 HTTPS/TLS 连接的安全参数：

### 1. 内联值（直接指定）
直接在规则中写明操作。
```txt
# 设置客户端证书
pattern tlsOptions://key=/path/to/client.key&cert=/path/to/client.crt

# 自定义加密套件
pattern tlsOptions://ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384 [lineProps...] [filters...]

# 或使用 ciphers 参数
pattern tlsOptions://ciphers=ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384 [lineProps...] [filters...]
```

### 2. 内嵌值（使用代码块）
当配置较复杂或需要复用时可使用此方式。
````txt
pattern tlsOptions://{custom-key} [lineProps...] [filters...]

``` custom-key
{
  passphrase: "123456",
  pfx: "-----BEGIN PKCS7-----\n..."
}
```
````

### 3. 引用 Values 中的值
引用在界面 `Values`（中央配置区）中预先定义好的配置。
```txt
pattern tlsOptions://{key-of-values} [lineProps...] [filters...]
```
**前提：** 在 `Values` 中存在一个名为 `key-of-values` 的键，其值为 TLS 配置对象。

### 4. 从临时文件中加载
当需要频繁编辑内容时，可以使用 Whistle 提供的临时文件功能。

```txt
pattern tlsOptions://temp.json
```

**操作步骤**：
1. 在 Rules 编辑器中，按住 `Command`（Mac）/ `Ctrl`（Windows）
2. 鼠标点击 `tlsOptions://temp.json`
3. 在弹出的编辑对话框中输入响应内容
4. 点击 `Save` 保存

保存后规则会自动变为类似以下格式：
```txt
https://example.com/report tlsOptions://temp/11adb9c9e1142df67b30d7646ec59bcd34c855d9011d1a2405c7fc2dfc94568d.json
```

需要再次编辑时，用同样的方式点击该临时文件链接即可。

### 5. 从文件或远程 URL 加载
从本地文件或远程 URL 加载包含 TLS 配置的 JSON 或 YAML 文件。
```txt
# 从本地文件加载
pattern tlsOptions:///User/xxx/tlsOptions.json

# 从远程 URL 加载（支持 http 和 https）
pattern tlsOptions://https://config.example.com/tlsOptions.json
```

**文件格式要求：**
文件内容应为 JSON 或 YAML 格式：
```json
{
  "ciphers": "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256",
  "minVersion": "TLSv1.2",
  "maxVersion": "TLSv1.3",
  "secureProtocol": "TLSv1_2_method"
}
```
或
```yaml
ciphers: ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256
minVersion: TLSv1.2
maxVersion: TLSv1.3
secureProtocol: TLSv1_2_method
```

---

## 参数详解

| 参数 | 是否必填 | 描述与示例 |
| :--- | :--- | :--- |
| **pattern** | 是 | 用于匹配请求 URL 的表达式。<br>• 支持域名、路径、通配符、正则表达式。<br>• 详见 [匹配模式文档](./pattern)。 |
| **value** | 是 | TLS 配置数据，支持多种格式：<br>• 加密算法套件名称（用 `:` 分隔）<br>• `tls.connect(options)` 参数对象<br>• 支持从本地文件、远程 URL、内联、内嵌、Values 引用 |
| **lineProps** | 否 | 为规则设置附加属性。<br>• 例如：`lineProps://important` 可提升此规则的优先级。<br>• 详见 [lineProps 文档](./lineProps)。 |
| **filters** | 否 | 可选的过滤条件，用于精确控制规则生效的场景。<br>• 可匹配请求的 URL、方法、头部、体内容。<br>• 可匹配响应的状态码、头部。<br>• 详见 [过滤器文档](./filters)。 |

---

## 配置对象参考

完整的 TLS 连接配置对象，支持 Node.js [`tls.connect()`](https://nodejs.org/docs/latest/api/tls.html#tlscreatesecurecontextoptions) 的所有参数：

```js
{
  // 加密算法套件
  ciphers: "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256",
  
  // TLS 协议版本控制
  minVersion: "TLSv1.2",
  maxVersion: "TLSv1.3",
  secureProtocol: "TLSv1_2_method",
  
  // 证书相关配置
  ca: "-----BEGIN CERTIFICATE-----\n...",  // CA 证书
  cert: "-----BEGIN CERTIFICATE-----\n...", // 客户端证书
  key: "-----BEGIN PRIVATE KEY-----\n...",  // 私钥
  pfx: "-----BEGIN PKCS7-----\n...",       // PFX/P12 格式证书
  passphrase: "cert-password",             // 证书密码
  
  // 其他安全选项
  honorCipherOrder: true,     // 优先使用服务器端的加密套件顺序
  requestCert: true,          // 请求客户端证书（双向认证）
  rejectUnauthorized: true,   // 拒绝未授权的证书
  
  // 高级选项
  ecdhCurve: "auto",         // ECDH 曲线
  dhparam: "-----BEGIN DH PARAMETERS-----\n...",
  secureOptions: 0,          // SSL 选项标志
  sessionTimeout: 300,       // 会话超时时间（秒）
  sessionIdContext: "whistle"
}
```

---

## 配置示例

### 1. 自定义加密套件
限制特定域名的 TLS 加密算法：
```txt
www.example.com/path tlsOptions://ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384
```

> **使用场景**：解决特定服务器的兼容性问题。参考：[GitHub Issue #963](https://github.com/avwo/whistle/issues/963)

### 2. 配置客户端证书（双向认证 mTLS）

**cert 格式证书：**
```txt
www.exaple.com/path tlsOptions://key=/User/xxx/test.key&cert=/User/xxx/test.crt
```

**pem 格式证书：**
```txt
www.exaple.com/path tlsOptions://key=E:\test.key&cert=E:\test.pem
```

**pfx 格式证书：**
```txt
www.exaple.com/path tlsOptions://passphrase=123456&pfx=/User/xxx/test.pfx
```

**p12 格式证书：**
```txt
www.exaple.com/path tlsOptions://passphrase=123456&pfx=E:/test.p12
```

> **Windows 路径**：支持混用 `/` 和 `\` 作为路径分隔符

### 3. 内嵌证书内容
直接将证书内容嵌入配置中：
````txt
``` test.json
{
  key: '----xxx----- ... ----xxx-----',
  cert: '----yyy----- ... ----yyy-----'
}
```

www.exaple.com/path tlsOptions://{test.json}
````

### 4. 从本地或远程文件加载配置
**从本地文件加载：**
```txt
www.example.com/path1 tlsOptions:///User/xxx/test.json
```

**从远程 URL 加载：**
```txt
www.example.com/path2 tlsOptions://https://www.xxx.com/xxx/params.json
```

**使用临时文件编辑：**
```txt
www.example.com/path3 tlsOptions://temp/blank.json
```

### 5. 规则合并示例
利用规则合并特性，逐步细化配置：
```txt
# 第一层：为整个域名设置基础TLS版本
*.example.com tlsOptions://minVersion=TLSv1.2

# 第二层：为API子域添加客户端证书
api.example.com tlsOptions://key=/certs/client.key&cert=/certs/client.crt

# 第三层：为特定路径进一步限制加密套件
api.example.com/secure tlsOptions://ciphers=ECDHE-RSA-AES256-GCM-SHA384
```

---

## 注意事项

1. **版本兼容性**：确保使用的 Whistle 版本 ≥ v2.9.101
2. **证书格式**：不同格式的证书需要使用对应的参数：
   - PEM 格式：使用 `key` 和 `cert` 参数
   - PFX/P12 格式：使用 `pfx` 和 `passphrase` 参数
3. **路径处理**：
   - 相对路径相对于 Whistle 配置文件目录
   - Windows 路径可以混用 `/` 和 `\`
4. **安全警告**：
   - 谨慎使用 `rejectUnauthorized: false`，仅限开发环境
   - 妥善保管客户端私钥，避免泄露
5. **性能影响**：复杂的加密算法可能影响连接性能
6. **调试建议**：遇到连接问题时，可先用简单的配置测试，逐步添加复杂选项

---

## 故障排除

### Q: 证书加载失败
**A:** 检查：
1. 证书文件路径是否正确
2. 证书格式是否匹配参数类型
3. PFX 证书密码是否正确

### Q: 连接被拒绝
**A:** 检查：
1. TLS 版本是否被服务器支持
2. 加密算法套件是否被服务器支持
3. 客户端证书是否有效且被服务器信任

### Q: 配置未生效
**A:** 检查：
1. 规则 pattern 是否正确匹配目标 URL
2. Whistle 版本是否满足要求
3. 配置语法是否正确，特别是 JSON 格式
4. 是否存在冲突的规则（规则按从上到下顺序合并）

### Q: 规则合并不符合预期
**A:** 检查：
1. 规则的顺序是否正确（从上到下合并）
2. 不同规则中的配置是否冲突
3. 使用更具体的 pattern 是否覆盖了通用配置
