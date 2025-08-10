# Protocol Inheritance
[http](./http)/[https](./https)/[ws](./ws)/[wss](./wss)/[tunnel](./tunnel) all restrict the target URL's protocol. Whistle also supports automatic completion based on the request URL's protocol.
## Rule Syntax
``` txt
pattern //value [filters...]
# or
pattern value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Target URL format: `domain[:port]/[path][?query]`<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## HTTP/HTTPS Conversion
``` txt
http://www.example.com/path1 www.test.com/path/xxx
https://www.example.com/path2 www.abc.com/path3/yyy
```
1. Automatic path concatenation:
    | Original request | Conversion result (URL received by the server) |
    | ----------------------------------------- | ----------------------------------------- |
    | `http://www.example.com/path1` | `http://www.test.com/path/xxx` |
    | `http://www.example.com/path1/a/b/c?query` | `http://www.test.com/path/xxx/a/b/c?query` |
    | `https://www.example.com/path2` | `https://www.abc.com/path3/yyy` |
    | `https://www.example.com/path2/a/b/c?query` | `https://www.abc.com/path3/yyy/a/b/c?query` |
2. Disable path concatenation: Use `< >` or `()` to wrap the path.
    ``` txt
    www.example.com/path1 //<www.test.com/path/xxx>
    # www.example.com/path1 //(www.test.com/path/xxx)
    ```
    | Original Request | Conversion Result (URL Received by the Server) |
    | ----------------------------------------- | ----------------------------------------- |
    | `[http/https/wss/ws]://www.example.com/path/x/y/z` | `[http/https/wss/ws]://www.test.com/path/xxx` |

## WebSocket Conversion
``` txt
ws://www.example.com/path1 www.test.com/path/xxx
wss://www.example.com/path2 www.abc.com/path3/yyy
```
The WebSocket request is replaced with the specified ws request:
| Original Request | Conversion Result (URL Received by the Server) |
| ----------------------------------------- | ----------------------------------------- |
| `ws://www.example.com/path1` | `ws://www.test.com/path/xxx` |
| `wss://www.example.com/path2/a/b/c?query` | `wss://www.abc.com/path3/yyy/a/b/c?query`|

Also supports **automatic path concatenation** and **disabling path concatenation**.

## TUNNEL Conversion
``` txt
tunnel://www.example.com:443 //www.test.com:123
tunnel://www.example2.com:443 www.test2.com/path
```
| Original Request | Conversion Result (URL Received by the Server) |
| ----------------------------------------- | ----------------------------------------- |
| `tunnel://www.example.com:443` | `tunnel://www.test.com:123` |
| `tunnel://www.example2.com:443` | `tunnel://www.test2.com:443`|
