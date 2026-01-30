# tlsOptions

The `tlsOptions` protocol is used to configure security parameters for HTTPS/TLS connections, including encryption cipher suites, client certificates, etc., to establish encrypted communication channels and server authentication.

> **Version Requirement**: Only the latest version of Whistle (≥ v2.9.101) supports this feature.

With the `tlsOptions` protocol, you can:
- Customize TLS encryption cipher suites
- Configure client certificates required for mutual authentication (mTLS)
- Set other security parameters for TLS connections
- Control TLS versions and connection options

**Rule Merging Mechanism**: `tlsOptions` supports setting any number of configuration rules. Whistle automatically merges these rules in top-to-bottom order, allowing you to flexibly combine different TLS configurations.

## Rule Syntax

`tlsOptions` supports multiple ways to configure security parameters for HTTPS/TLS connections:

### 1. Inline Value (Direct Specification)
Write the operation directly in the rule.
```txt
# Set client certificate
pattern tlsOptions://key=/path/to/client.key&cert=/path/to/client.crt

# Customize cipher suite
pattern tlsOptions://ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384 [lineProps...] [filters...]

# Or use the ciphers parameter
pattern tlsOptions://ciphers=ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384 [lineProps...] [filters...]
```

### 2. Embedded Value (Using Code Block)
Use this method when the configuration is complex or needs to be reused.
````txt
pattern tlsOptions://{custom-key} [lineProps...] [filters...]

``` custom-key
{
  passphrase: "123456",
  pfx: "-----BEGIN PKCS7-----\n..."
}
```
````

### 3. Referencing a Value from the Values Panel
Reference a configuration pre-defined in the `Values` panel (central configuration area).
```txt
pattern tlsOptions://{key-of-values} [lineProps...] [filters...]
```
**Prerequisite:** A key named `key-of-values` with a TLS configuration object as its value must exist in `Values`.

### 4. Loading from a Temporary File
Use Whistle's temporary file feature when content needs frequent editing.

```txt
pattern tlsOptions://temp.json
```

**Steps:**
1. In the Rules editor, hold down `Command` (Mac) / `Ctrl` (Windows)
2. Click with the mouse on `tlsOptions://temp.json`
3. Enter the response content in the pop-up editing dialog
4. Click `Save` to save

After saving, the rule will automatically change to a format similar to this:
```txt
https://example.com/report tlsOptions://temp/11adb9c9e1142df67b30d7646ec59bcd34c855d9011d1a2405c7fc2dfc94568d.json
```

To edit again, click the temporary file link in the same way.

### 5. Loading from a File or Remote URL
Load a JSON or YAML file containing TLS configuration from a local file or remote URL.
```txt
# Load from a local file
pattern tlsOptions:///User/xxx/tlsOptions.json

# Load from a remote URL (supports http and https)
pattern tlsOptions://https://config.example.com/tlsOptions.json
```

**File Format Requirements:**
The file content should be in JSON or YAML format:
```json
{
  "ciphers": "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256",
  "minVersion": "TLSv1.2",
  "maxVersion": "TLSv1.3",
  "secureProtocol": "TLSv1_2_method"
}
```
or
```yaml
ciphers: ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256
minVersion: TLSv1.2
maxVersion: TLSv1.3
secureProtocol: TLSv1_2_method
```

---

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **value** | Yes | TLS configuration data, supporting multiple formats:<br>• Cipher suite names (separated by `:`)<br>• `tls.connect(options)` parameter object<br>• Supports references from local files, remote URLs, inline, embedded, and Values |
| **lineProps** | No | Sets additional properties for the rule.<br>• Example: `lineProps://important` can increase this rule's priority.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

---

## Configuration Object Reference

Complete TLS connection configuration object, supporting all parameters of Node.js [`tls.connect()`](https://nodejs.org/docs/latest/api/tls.html#tlscreatesecurecontextoptions):

```js
{
  // Encryption cipher suites
  ciphers: "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256",
  
  // TLS protocol version control
  minVersion: "TLSv1.2",
  maxVersion: "TLSv1.3",
  secureProtocol: "TLSv1_2_method",
  
  // Certificate-related configurations
  ca: "-----BEGIN CERTIFICATE-----\n...",  // CA certificate
  cert: "-----BEGIN CERTIFICATE-----\n...", // Client certificate
  key: "-----BEGIN PRIVATE KEY-----\n...",  // Private key
  pfx: "-----BEGIN PKCS7-----\n...",       // PFX/P12 format certificate
  passphrase: "cert-password",             // Certificate password
  
  // Other security options
  honorCipherOrder: true,     // Prioritize the server's cipher suite order
  requestCert: true,          // Request client certificate (mutual authentication)
  rejectUnauthorized: true,   // Reject unauthorized certificates
  
  // Advanced options
  ecdhCurve: "auto",         // ECDH curve
  dhparam: "-----BEGIN DH PARAMETERS-----\n...",
  secureOptions: 0,          // SSL option flags
  sessionTimeout: 300,       // Session timeout (seconds)
  sessionIdContext: "whistle"
}
```

---

## Configuration Examples

### 1. Custom Cipher Suite
Restrict TLS encryption algorithms for specific domains:
```txt
www.example.com/path tlsOptions://ECDHE-ECDSA-AES256-GCM-SHA384:DH-RSA-AES256-GCM-SHA384
```

> **Use Case**: Solve compatibility issues with specific servers. Reference: [GitHub Issue #963](https://github.com/avwo/whistle/issues/963)

### 2. Configuring Client Certificate (Mutual Authentication mTLS)

**cert format certificate:**
```txt
www.exaple.com/path tlsOptions://key=/User/xxx/test.key&cert=/User/xxx/test.crt
```

**pem format certificate:**
```txt
www.exaple.com/path tlsOptions://key=E:\test.key&cert=E:\test.pem
```

**pfx format certificate:**
```txt
www.exaple.com/path tlsOptions://passphrase=123456&pfx=/User/xxx/test.pfx
```

**p12 format certificate:**
```txt
www.exaple.com/path tlsOptions://passphrase=123456&pfx=E:/test.p12
```

> **Windows Paths**: Supports mixing `/` and `\` as path separators.

### 3. Embedding Certificate Content
Embed certificate content directly into the configuration:
````txt
``` test.json
{
  key: '----xxx----- ... ----xxx-----',
  cert: '----yyy----- ... ----yyy-----'
}
```

www.exaple.com/path tlsOptions://{test.json}
````

### 4. Loading Configuration from Local or Remote Files
**Load from local file:**
```txt
www.example.com/path1 tlsOptions:///User/xxx/test.json
```

**Load from remote URL:**
```txt
www.example.com/path2 tlsOptions://https://www.xxx.com/xxx/params.json
```

**Use temporary file for editing:**
```txt
www.example.com/path3 tlsOptions://temp/blank.json
```

### 5. Rule Merging Example
Utilize rule merging feature to gradually refine configuration:
```txt
# First layer: Set basic TLS version for the entire domain
*.example.com tlsOptions://minVersion=TLSv1.2

# Second layer: Add client certificate for API subdomain
api.example.com tlsOptions://key=/certs/client.key&cert=/certs/client.crt

# Third layer: Further restrict cipher suite for specific paths
api.example.com/secure  tlsOptions://ciphers=ECDHE-RSA-AES256-GCM-SHA384
```

---

## Notes

1. **Version Compatibility**: Ensure the Whistle version used is ≥ v2.9.101.
2. **Certificate Format**: Different certificate formats require corresponding parameters:
   - PEM format: Use `key` and `cert` parameters.
   - PFX/P12 format: Use `pfx` and `passphrase` parameters.
3. **Path Handling**:
   - Relative paths are relative to the Whistle configuration file directory.
   - Windows paths can mix `/` and `\`.
4. **Security Warnings**:
   - Use `rejectUnauthorized: false` with caution, only in development environments.
   - Safeguard client private keys to avoid leaks.
5. **Performance Impact**: Complex encryption algorithms may affect connection performance.
6. **Debugging Recommendations**: When encountering connection issues, test with simple configurations first, then gradually add complex options.

---

## Troubleshooting

### Q: Certificate loading fails.
**A:** Check:
1. Whether the certificate file path is correct.
2. Whether the certificate format matches the parameter type.
3. Whether the PFX certificate password is correct.

### Q: Connection is rejected.
**A:** Check:
1. Whether the TLS version is supported by the server.
2. Whether the cipher suite is supported by the server.
3. Whether the client certificate is valid and trusted by the server.

### Q: Configuration does not take effect.
**A:** Check:
1. Whether the rule pattern correctly matches the target URL.
2. Whether the Whistle version meets requirements.
3. Whether the configuration syntax is correct, especially JSON format.
4. Whether conflicting rules exist (rules are merged in top-to-bottom order).

### Q: Rule merging doesn't work as expected.
**A:** Check:
1. Whether the order of rules is correct (merged from top to bottom).
2. Whether configurations in different rules conflict.
3. Whether more specific patterns override general configurations.
