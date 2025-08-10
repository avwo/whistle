# https
Convert the following three requests to HTTPS requests (the server will receive the converted HTTPS URL):
1. **Tunnel proxy:** `tunnel://domain:port`
    > Example: `tunnel://www.test.com:443`
2. **WebSocket:** `ws[s]://domain[:port]/[path/to[?query]]`
    > Example: `wss://www.test.com/path?a=1&b=2`
3. **Normal HTTP/HTTPS:** `http[s]://domain[:port]/[path/to[?query]]`
    > Example: `https://www.test.com/path?a=1&b=2`

## Rule Syntax
``` txt
pattern https://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Target URL format: `domain[:port]/[path][?query]`<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## HTTP/HTTPS Conversion
``` txt
http://www.example.com/path1 https://www.test.com/path/xxx
https://www.example.com/path2 https://www.abc.com/path3/yyy
```
1. Automatic Path Concatenation:
    | Original Request | Conversion Result (URL Received by the Server) |
    | ----------------------------------------- | ----------------------------------------- |
    | `http://www.example.com/path1` | `https://www.test.com/path/xxx` |
    | `http://www.example.com/path1/a/b/c?query` | `https://www.test.com/path/xxx/a/b/c?query` |
    | `https://www.example.com/path2` | `https://www.abc.com/path3/yyy` |
    | `https://www.example.com/path2/a/b/c?query` | `https://www.abc.com/path3/yyy/a/b/c?query` |
2. Disable path concatenation: Use `< >` or `()` to wrap the path.
    ``` txt
    www.example.com/path1 https://<www.test.com/path/xxx>
    # www.example.com/path1 https://(www.test.com/path/xxx)
    ```
    | Original request | Conversion result (URL received by the server) |
    | ----------------------------------------- | ----------------------------------------- |
    | `[http/https/wss/ws]://www.example.com/path/x/y/z` | `https://www.test.com/path/xxx` |

## WebSocket Conversion
``` txt
ws://www.example.com/path1 https://www.test.com/path/xxx
wss://www.example.com/path2 https://www.abc.com/path3/yyy
```
The WebSocket request is replaced with the specified ws request:
| Original Request | Conversion Result (URL Received by the Server) |
| ----------------------------------------- | ----------------------------------------- |
| `ws://www.example.com/path1` | `wss://www.test.com/path/xxx` |
| `wss://www.example.com/path2/a/b/c?query` | `wss://www.abc.com/path3/yyy/a/b/c?query`|

Also supports **automatic path concatenation** and **disabling path concatenation**.

## TUNNEL Conversion
``` txt
tunnel://www.example.com:443 https://www.test.com:123
tunnel://www.example2.com:443 https://www.test2.com/path
```
| Original Request | Conversion Result (URL Received by the Server) |
| ----------------------------------------- | ----------------------------------------- |
| `tunnel://www.example.com:443` | `tunnel://www.test.com:123` |
| `tunnel://www.example2.com:443` | `tunnel://www.test2.com:443`|

⚠️ Automatically ignores the path of the matching URL. The default port for HTTPS is `443`.
