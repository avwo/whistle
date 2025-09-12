# enable
Enable HTTPS, hide requests, terminate requests, and other features through rules.

## Rule Syntax
``` txt
pattern enable://action1|action2|... [filters...]

# Equivalent to:
pattern enable://action1 enable://action2 ... [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| action | Specific action, see the description below | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

- `capture` or `https`: Enable HTTPS (same as the [HTTPS menu function](../gui/https.html))
- `authCapture`: Force execution of the [auth] before converting to HTTPS hook](../extensions/dev#auth) (By default, the plugin's auth hook is executed after converting the request to HTTPS)
- `abort`: Aborts the request at the request or response stage (depending on the matching stage)
- `abortReq`: Aborts the request at the request stage
- `abortRes`: Aborts the response at the response stage
- `br`: Enables BR compression of the response content
- `gzip`: Enables GZIP compression of the response content
- `deflate`: Enables Deflate compression of the response content
- `proxyHost`: Both [proxy](./proxy) and [host](./host) take effect simultaneously
- `proxyTunnel`: Used with `proxyHost`, it allows the upstream proxy to tunnel to the upstream HTTP proxy. See the example below for details.
- `proxyFirst`: Prioritizes the [proxy](./proxy) rule
- `http2`: Browser -> Whistle Proxy -> Enable HTTP2 for all servers
- `h2`: Whistle Proxy -> Enable HTTP2 for the server
- `httpH2`: Whistle Proxy -> Enable HTTP2 for HTTP requests to the server
- `safeHtml`: This is a security feature. When injecting content into an HTML page using `htmlXxx`/`jsXxx`/`cssXxx`, the response is first checked to see if the first non-whitespace character is `{` or `[` (the opening characters of a JSON object). Injection is performed only if these characters are not. This effectively prevents accidental injection into non-standard HTML responses (such as JSON endpoints).
- `strictHtml`: This is a security feature. When injecting content into an HTML page using `htmlXxx`/`jsXxx`/`cssXxx`, the response is first checked to see if the first non-whitespace character is `<`. Injection is performed only if these characters are not. This effectively prevents accidental injection into non-standard HTML responses (such as JSON interfaces).
- `clientIp`: Sets the x-forwarded-for request header for matching non-local requests, transparently transmitting the client's real IP address to the upstream service.
- `bigData`: Increases the packet capture data display limit (2MB → 16MB).
- `forceReqWrite`: When writing request data to a local file using `reqWrite` (./reqWrite) or `reqWriteRaw` (./reqWriteRaw), if the corresponding file already exists, the write operation will be skipped by default to protect the existing file. You can force an overwrite with `enable://forceReqWrite`.
- `forceResWrite`: When writing response data to a local file using `resWrite` (./resWrite) or `reqWriteRaw` (./reqWriteRaw), if the corresponding file already exists, the write operation will be skipped by default to protect the existing file. You can force an overwrite with `enable://forceResWrite`.
- `auto2http`: Enables HTTPS request reporting. Automatically convert TLS errors to HTTP requests. This feature is enabled by default if the server IP is a local IP address.
- `customParser`: Customizes the packet capture interface display. For usage, refer to the plugin: https://github.com/whistle-plugins/whistle.custom-parser
- `hide`: Hides the packet capture data on the interface.
- `inspect`: Enables viewing of Tunnel request content in the Inspectors/Frames.
- `keepCSP`: Automatically removes the `csp` response header field when injecting content via `htmlXxx`/`jsXxx`/`cssXxx`. To retain this field, use `enable://keepCSP`.
- `keepAllCSP`: Automatically removes the `csp` response header field when injecting content via `htmlXxx`/`jsXxx`/`cssXxx`/`weinre`/`log`. To retain this field, use `enable://keepCSP`.
- `keepCache`: Automatically removes the `csp` response header field when injecting content via `htmlXxx`/`jsXxx`/`cssXxx`/`weinre`/`log`. `htmlXxx`/`jsXxx`/`cssXxx`/`weinre`/`log` automatically removes cached response headers when injecting content. If you want to retain custom cache headers, use `enable://keepCache`.
- `useLocalHost`: Modifies the domain name of `log` and `weinre` request URLs to the built-in domain name.
- `useSafePort`: Modifies the port number of `log` and `weinre` request URLs to the built-in port.
- `userLogin`: Sets whether to display the login dialog box for [statusCode://401](./statusCode) (displayed by default).

## Configuration Example
``` txt
# Enable HTTPS
www.example.com enale://https

# Abort the request with a 3000ms delay
www.example.com/path reqDelay://3000 enable://abortReq

# Abort the response with a 5000ms delay
www.example.com/path resDelay://5000 enable://abortRes

# Enable GZIP for local replacement content
www.example.com/path file:///User/xxx/test enable://gzip

# Set hosts for the upstream proxy (10.10.10.20:8888)
www.example.com/path proxy://10.1.1.1:8080 10.10.10.20:8888 enable://proxyHost

# Tunnel requests through the upstream HTTP proxy (10.1.1.1:8080) to the specified HTTP proxy (10.10.10.20:8080)
www.example.com proxy://10.1.1.1:8080 10.10.10.20:8080 enable://proxyHost|proxyTunnel

# Enable HTTP2 for the entire connection from browser to Whistle proxy to server Functionality
www.example.com enable://http2

# Enable HTTP2 functionality for Whistle proxy -> server
www.example.com enable://h2

# Force HTTP requests from Whistle proxy -> server to use HTTP2 transport
www.example.com enable://httpH2

# Safe injection mode: When using the htmlXxx/jsXxx/cssXxx injection directives, inject only if the first character of the response is not `{`
www.example.com/path enable://safeHtml

# Strict HTML injection mode: When using the htmlXxx/jsXxx/cssXxx injection directives, inject only if the first character of the response is not `<`
www.example.com/path enable://strictHtml

# Automatically add the x-forwarded-for request header to convey the client's real IP address
www.example.com enable://clientIp

# Expand the packet capture data display limit (2MB → 16MB)
www.example.com/path enable://bigData

# Modify the domain name or port of the log/weinre request URL.
www.example.com/path enable://useLocalHost | useSafePort

# Force reqWrite/reqWriteRaw/resWrite/resWriteRaw to overwrite existing files.
www.example.com/path enable://forceReqWrite | forceResWrite

# Force HTTPS requests to execute the auth hook before parsing (the default is to execute the plugin's auth hook after converting them to HTTPS).
www.example.com enable://authCapture

Associated Action: [disable](./disable)
