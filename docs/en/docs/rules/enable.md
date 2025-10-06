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

- `abort`: Interrupt the request during the request or response phase (based on the matching phase)
- `abortReq`: Interrupt the request during the request phase
- `abortRes`: Interrupt the request during the response phase
- `authCapture`: Force execution of the [auth hook](../extensions/dev#auth) before converting to HTTPS (default behavior is to execute the plugin's auth hook after converting to an HTTPS request)
- `auto2http`: Enable automatic fallback to HTTP requests when HTTPS requests encounter TLS errors. By default, this is automatically enabled if the serverIP is a local IP
- `bigData`: Increase the data display limit for captured packets (2M → 16M)
- `br`: Enable BR compression for response content
- `gzip`: Enable GZIP compression for response content
- `deflate`: Enable Deflate compression for response content
- `capture` or `https`: Enable HTTPS (same as the [HTTPS menu function](../gui/https.html))
- `captureIp`: For requests where the domain is an IP, HTTPS requests are not decrypted by default. Use `enable://captureIp` to enable HTTPS request parsing
- `captureStream`: Output captured request and response content in stream form to the capture interface in real time, with dynamic appending
- `clientCert`: Enable mutual authentication (mTLS) between the client and server
- `clientId`: Add the request header `x-whistle-client-id: Whistle locally generated unique ID`
- `clientIp`: Set the `x-forwarded-for` request header for matched non-local requests to forward the client's real IP address to upstream services
- `customParser`: Customize the display content of the capture interface. For usage, refer to the plugin: https://github.com/whistle-plugins/whistle.custom-parser
- `flushHeaders`: Call [response.flushHeaders](https://nodejs.org/docs/latest/api/http.html#responseflushheaders) after `response.writeHead(...)` (enabled by default)
- `forHttp`: Make the `capture` function only effective for HTTP requests
- `forHttps`: Make the `capture` function only effective for HTTPS requests
- `forceReqWrite`: When using [reqWrite](./reqWrite) or [reqWriteRaw](./reqWriteRaw) to write request data to a local file, if the corresponding file already exists, the write operation is skipped by default to protect the existing file. Use `enable://forceReqWrite` to force overwriting
- `forceResWrite`: When using [resWrite](./resWrite) or [reqWriteRaw](./reqWriteRaw) to write response data to a local file, if the corresponding file already exists, the write operation is skipped by default to protect the existing file. Use `enable://forceResWrite` to force overwriting
- `h2`: Enable HTTP2 from Whistle proxy → server
- `http2`: Enable HTTP2 for browser → Whistle proxy → server
- `httpH2`: Enable HTTP2 for HTTP requests from Whistle proxy → server
- `hide`: Hide captured packet data on the interface (excluding `captureError` and requests sent by Composer)
- `hideComposer`: Hide requests sent by Composer
- `hideCaptureError`: Hide `captureError` requests
- `showHost`: Set the server IP to the response header `x-host-ip`
- `ignoreSend`: Ignore sending data frames for WebSocket and TUNNEL requests (TUNNEL requests require `inspect` to be enabled)
- `ignoreReceive`: Ignore receiving data frames for WebSocket and TUNNEL requests (TUNNEL requests require `inspect` to be enabled)
- `pauseSend`: Pause sending data frames for WebSocket and TUNNEL requests (TUNNEL requests require `inspect` to be enabled)
- `pauseReceive`: Pause receiving data frames for WebSocket and TUNNEL requests (TUNNEL requests require `inspect` to be enabled)
- `inspect`: Enable viewing of TUNNEL request content in Inspectors / Frames
- `interceptConsole`: Intercept `console.xxx` requests and display them in the Log panel of the Whistle management interface (enabled by default)
- `internalProxy`: Use proxy protocols like `proxy` or `socks` to forward requests to other proxy servers (e.g., another Whistle instance). After enabling this, HTTPS requests decrypted by the first-layer proxy will be transmitted in plain text within the proxy chain, allowing upstream proxies to directly access plain text data
- `proxyFirst`: Prioritize using [proxy](./proxy) rules (by default, when both `host` and `proxy` match, only `host` takes effect)
- `proxyHost`: Make both [proxy](./proxy) and [host](./host) take effect simultaneously
- `proxyTunnel`: Use with `proxyHost` to allow the upstream proxy to tunnel through to an upper-layer HTTP proxy. See the example below for details
- `keepCSP`: Automatically remove the `csp` field from response headers when injecting content via `htmlXxx`/`jsXxx`/`cssXxx`. Use `enable://keepCSP` to retain these fields
- `keepAllCSP`: Automatically remove the `csp` field from response headers when injecting content via `htmlXxx`/`jsXxx`/`cssXxx`/`weinre`/`log`. Use `enable://keepAllCSP` to retain these fields
- `keepCache`: Automatically remove cache fields from response headers when injecting content via `htmlXxx`/`jsXxx`/`cssXxx`. Use `enable://keepCache` to retain the original cache headers
- `keepAllCache`: Automatically remove cache fields from response headers when injecting content via `htmlXxx`/`jsXxx`/`cssXxx`/`weinre`/`log`. Use `enable://keepAllCache` to retain the original cache headers
- `keepClientId`: Retain the original `x-whistle-client-id` request header (by default, the incoming `x-whistle-client-id` is deleted)
- `safeHtml`: A security mechanism that checks if the first non-whitespace character of the response content is `{` or `[` (indicating a JSON object) before injecting content via `htmlXxx`/`jsXxx`/`cssXxx` into an HTML page. If not, the injection proceeds. This prevents accidental injection into non-HTML responses (e.g., JSON interfaces)
- `strictHtml`: A security mechanism that checks if the first non-whitespace character of the response content is `<` before injecting content via `htmlXxx`/`jsXxx`/`cssXxx` into an HTML page. If not, the injection proceeds. This prevents accidental injection into non-HTML responses (e.g., JSON interfaces)
- `multiClient`: When Whistle acts as a public proxy with `enable://clientId` enabled, a fixed `x-whistle-client-id` header is added to all requests, preventing upstream services from distinguishing between clients. Enabling `enable://multiClient` generates and maintains a unique and consistent identifier for each client connection, ensuring upstream services can accurately identify request sources
- `requestWithMatchedRules`: Include the currently matched rules in the request headers
- `responseWithMatchedRules`: Include the currently matched rules in the response headers
- `tunnelHeadersFirst`: Controls the priority of request header merging. Plugins can pass tunnel (TUNNEL) request headers to subsequent stages via [tunnelKey](../extensions/dev). The default merging rule is: if a tunnel header and a parsed regular request header have the same key, the regular request header value is retained. Enabling `enable://tunnelHeadersFirst` changes this behavior, ensuring tunnel request headers take priority and override any conflicting regular headers
- `useLocalHost`: Modify the domain of `log` and `weinre` request URLs to use built-in domains
- `useSafePort`: Modify the port of `log` and `weinre` request URLs to use built-in ports
- `userLogin`: Set whether [statusCode://401](./statusCode) displays a login box (enabled by default)
- `weakRule`: By default, when protocols like [file](./file) are configured, [proxy](./proxy) rules automatically become invalid. Setting the `weakRule` property increases the priority of [proxy](./proxy) rules, allowing them to remain effective in such scenarios
- `socket`: After enabling HTTPS parsing (`Enable HTTPS` or `enable://https`), TUNNEL requests sent to ports `80/443` are forcibly attempted to be parsed as HTTP/HTTPS traffic. By default, if parsing fails, the connection is destroyed; requests to other ports continue as TUNNEL connections if parsing fails. Setting `enable://socket` allows requests to ports `80/443` to degrade to TUNNEL connections if parsing fails, avoiding connection destruction
- `websocket`: Used to handle non-standard WebSocket connections. Some requests use the WebSocket protocol for transmission but have non-standard Upgrade headers (e.g., `Upgrade: websocket`). By default, Whistle treats them as ordinary TCP connections without parsing the data. Enabling `enable://websocket` forces Whistle to recognize such connections as WebSocket protocols and parse the data

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
