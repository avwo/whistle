# Rule Syntax

Whistle modifies requests and responses through simple rule configurations. The basic syntax structure is as follows:

``` txt
pattern operation [includeFilter://pattern1 ... excludeFilter://patternN ...]
```

## Rule Composition

Each rule consists of three core components:

1. **Match Pattern** (`pattern`): An expression to match request URLs, supporting various formats:
   - Domain matching: `www.test.com` (matches all requests to this domain, including ports)
   - Path matching: `www.test.com/path`
   - Regular expression: `/^https?://test\.com//i`
   - Wildcards: `*.test.com`, `**.test.com/path`

    > Whistle supports three URL types:
    > 1. **Tunnel Proxy:** `tunnel://domain[:port]`
    > 2. **WebSocket:** `ws[s]://domain[:port]/path/to`
    > 3. **Regular HTTP/HTTPS:** `http[s]://domain[:port]/path/to`

2. **Operation** (`operation`), formatted as: `protocol://value`
   - `protocol`: Operation type, such as:
     - `reqHeaders`: Modify request headers
     - `resHeaders`: Modify response headers
   - `value`: Operation content, supporting multiple data sources:
     - Inline value: `reqHeaders://x-proxy-by=whistle` (directly adds a request header)
     - Local file: `file://path/to/file`
     - Remote resource: `https://example.com/data.json`
     - Preset variable: `{key}` (read from embedded values in Rules or Values)

    > The `protocol://` in **operation** can be omitted in the following two scenarios:
    > - `ip` or `ip:port`: Equivalent to `host://ip` or `host://ip:port`
    > - `D:\path\to`, `/path/to`, or `{key}`: Equivalent to `file://D:\path\to`, `file:///path/to`, or `file://{key}`

3. **Filter Conditions (Optional)** (`includeFilter/excludeFilter`)
   - Logical relationship: Multiple conditions use "OR" matching; matching any one condition makes it effective
   - Matching scope:
     - Request: URL, method (GET/POST, etc.), header fields, content, client IP
     - Response: Status code, header fields, content, server IP

## Learn More
1. Match Pattern (expressions for matching request URLs) details: [Pattern](./pattern)
2. Operation details: [Operation](./operation)
3. Filter details: [Filters](./filters)
