# wss
Converts a WebSocket request into a new wss request (the server will receive the converted WebSocket URL).
> Only supports WebSocket requests `ws[s]://domain[:port]/[path][?query]`. Transformation tunneling proxies and regular HTTP/HTTPS are not supported.

## Rule Syntax
``` txt
pattern wss://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match WebSocket request URLs | [Match Pattern Documentation](./pattern) |
| value | Target URL format: `domain[:port]/[path][?query]`<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filters Documentation](./filters) |

## WebSocket Transformation
``` txt
ws://www.example.com/path1 wss://www.test.com/path/xxx
wss://www.example.com/path2 wss://www.abc.com/path3/yyy
```
1. Automatic path concatenation:
    | Original request | Conversion result (URL received by the server) |
    | ----------------------------------------- | ----------------------------------------- |
    | `ws://www.example.com/path1` | `wss://www.test.com/path/xxx` |
    | `ws://www.example.com/path1/a/b/c?query` | `wss://www.test.com/path/xxx/a/b/c?query` |
    | `wss://www.example.com/path2` | `wss://www.abc.com/path3/yyy` |
    | `wss://www.example.com/path2/a/b/c?query` | `wss://www.abc.com/path3/yyy/a/b/c?query` |
2. Disable path concatenation: Use `< >` or `()` to wrap the path.
    ``` txt
    www.example.com/path1 wss://<www.test.com/path/xxx>
    # www.example.com/path1 wss://(www.test.com/path/xxx)
    ```
    | Original Request | Conversion Result (URL Received by the Server) |
    | ----------------------------------------- | ----------------------------------------- |
    | `[wss/ws]://www.example.com/path/x/y/z` | `wss://www.test.com/path/xxx` |

Only supports forwarding WebSocket requests; other requests match the `wss` protocol. Result:
- **Tunnel Proxy**: Ignore matches
- **Normal HTTP/HTTPS Request**: Returns `502`
