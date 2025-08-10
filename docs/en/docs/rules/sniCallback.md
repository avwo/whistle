# sniCallback
Dynamically customize the TLS certificate used in HTTPS requests through a plugin mechanism.

## Rule Syntax
``` txt
pattern sniCallback://plugin-name(sniValue) [filters...]
```
> `(sniValue)` is optional and can be obtained via `req.originalReq.sniValue` in the plugin hook.

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| plugin-name(sniValue) | Plugin name + optional parameters | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filters Documentation](./filters) |

## Configuration Example
``` txt
wwww.example.com sniCallback://test
wwww.example.com sniCallback://test-sni(abc)
```

Access SNI information in the plugin through the following properties:
``` js
exports.auth = (req) => {
  const { sniValue, servername } = req.originalReq; // Get configuration parameters and servername

  return {
    cert: /* Certificate content */,
    key: /* Private key content */
  }
};
```

For specific usage, refer to [Plugin Development Documentation](../extensions/dev.md#snicallback)
