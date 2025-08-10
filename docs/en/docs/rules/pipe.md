# pipe
Transfers HTTP/HTTPS/WebSocket/TUNNEL request/response data streams to the plugin for processing.

## Rule Syntax
``` txt
pattern pipe://plugin-name(pipeValue) [filters...]
```
> `(pipeValue)` is optional and can be obtained via `req.originalReq.pipeValue` in the plugin hook.

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression that matches the request URL | [Matching Pattern Documentation](./pattern) |
| plugin-name(pipeValue) | Plugin name + optional parameters | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filters Documentation](./filters) |

## Configuration Example
``` txt
tunnel://wwww.example.com pipe://test
tunnel://test-tunnel.example.com pipe://test-pipe-tunnel(abc)

wss://test-ws.example.com/path pipe://test-pipe-ws

https://www.example.com/path pipe://test-pipe-http(123)

```

For specific usage, refer to [Plugin Development Documentation](../extensions/dev.md#pipe)
