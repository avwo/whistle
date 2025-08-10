# Getting Started

After installation is complete
- **Client Version**: Launch the desktop application directly
- **Command Line Version**: Visit http://local.whistlejs.com in your browser

You will now be able to access the user interface:

<img width="1000" alt="network" src="/img/whistle.png" />

Key User Interface Features:
- **Network**: Real-time packet capture analysis and request replay/editing
- **Rules**: Rule configuration interface for modifying requests and responses
- **Values**: Action content configuration interface (supports calling rule variables)
- **Plugins**: Plugin management interface

## User Interface Examples

1. Replaying a Request
    > Click a request and click the `Replay` button at the top, or right-click the request list and select Actions -> Replay

<img width="720" alt="replay request" src="/img/replay-req.png" />
2. Editing or Constructing a Request
    > Click a request and click the `Edit` button at the top button, or right-click the request list and select Actions -> Edit Request.

<img width="1000" alt="edit request" src="/img/edit-req.png" />

For full functionality, see: [Interface Features](./gui/network)

## Rule Configuration Example

<img width="1000" alt="set rules" src="/img/rules.png" />

Whistle modifies requests and responses through simple rule configuration. The basic syntax is as follows:

``` txt
pattern operation [includeFilter://pattern1 ... excludeFilter://patternN ...]
```

**Rules consist of three core components:**
1. **Match Pattern** (`pattern`): An expression that matches the request URL. Multiple formats are supported:
      - Domain Match: `www.test.com` (matches all requests to that domain, including the port)
      - Path Match: `www.test.com/path`
      - Regular expression: `/^https?://test\.com//i`
      - Wildcards: `*.test.com`, `**.test.com/path`
        > Whistle supports three URL types:
        > 1. **Tunnel proxy**: `tunnel://domain[:port]`
        > 2. **WebSocket**: `ws[s]://domain[:port]/path/to`
        > 3. **Normal HTTP/HTTPS**: `http[s]://domain[:port]/path/to`
2. **Operation instruction** (`operation`), format: `protocol://value`
      - `protocol`: Operation type, e.g.:
      - `reqHeaders`: Modify request headers
      - `resHeaders`: Modify response headers
      - `value`: Operation content, supports multiple data sources:
      - Inline value: `reqHeaders://x-proxy-by=whistle` (directly add request headers)
      - Local file: `file://path/to/file`
      - Remote resource: `https://example.com/data.json`
      - Default variable: `{key}` (read from embedded values or Values in Rules)
        > `protocol://` in **operation** can be omitted in the following two scenarios:
        > - `ip` or `ip:port`: Equivalent to `host://ip` or `host://ip:port`
        > - `D:\path\to`, `/path/to`, or `{key}`: Equivalent to `file://D:\path\to`, `file:///path/to`, or `file://{key}`
3. **Filter Conditions (Optional)** (`includeFilter/excludeFilter`)
      - Logical relationship: Multiple conditions are matched in an "or" fashion; a filter is considered valid if any one of the conditions matches.
      - Match scope:
      - Request: URL, method (GET/POST, etc.), header fields, content, client IP
      - Response: Status code, header fields, content, server IP

#### Example 1: Modify DNS (Set Hosts)

1. Domain Matching
    ``` txt
    www.test.com 127.0.0.1
    # Supports with port
    www.test.com 127.0.0.1:8080
    # CNAME function (port optional)
    www.test.com host://www.example.com:8181
    ```
2. Path Matching
    ``` txt
    www.test.com/path/to 127.0.0.1:8080
    # Supports with protocol
    https://www.test.com/path/to 127.0.0.1:8080
    # Applies only to tunnel proxy requests
    tunnel://* 127.0.0.1:8080
    ```
3. Wildcard Matching
    ``` txt
    # Domain wildcard, matching all subdomains of test.com
    **.test.com 127.0.0.1:8080
    # Supports domain wildcards with protocols
    https://**.test.com 127.0.0.1:8080
    # Path wildcard (* is a valid path character, so add a leading ^ to indicate to Whistle that it is a wildcard)
    ^**.test.com/*/path/to 127.0.0.1:8080
    # Supports path wildcards with protocols
    ^https://**.test.com/*/path/to 127.0.0.1:8080
    ```
    > `*`, `**`, and `***` have different matching scopes. See the documentation: [pattern](./rules/pattern)
4. Regular Expression Matching
    ``` txt
    # `/` in a rule regular expression Escape or not
    /^https?://\w+\.test\.com/ 127.0.0.1:8080
    ```
    > `/regexp/x` is equivalent to `new RegExp(regexp, x)`
5. Filter Matching
    ``` txt
    # Request URL matches `pattern` and the request header `cookie` contains `env=test`
    pattern 127.0.0.1:8080 includeFilter://reqH.cookie=/env=test/
    # Only applies to requests initiated from iPhones
    https://www.test.com/path/to 127.0.0.1:8080 includeFilter://reqH.user-agent=/iPhone/i
    ```

##### Example 2: Modifying Form Data

``` txt
# Modify the value of the `test` field in the form
pattern reqMerge://test=123
# Delete the `abc` field in the form.
pattern delete://reqBody.abc
```

##### Example 3: Setting a Cross-Origin Response Header

``` txt
# Set a cross-origin response header with Access-Control-Allow-Origin: * and exclude OPTION requests.
pattern resCors://* excludeFilter://m:option
# Cross-origin request headers other than `*`
pattern resCors://enable
```

## Advanced Rule Configuration

1. Combined Configuration
    ``` txt
    pattern operation1 operation2 ... [includeFilter://pattern1 ... excludeFilter://patternN ...]
    ```
2. Reversing Positions (`pattern1` and `operation` must not both be URLs or domain names)
    > This means they must not both be URLs or domain names like `https://test.com/path`, `//test.com/path`, `test.com/path`, or `test.com`.
    ``` txt
    operation pattern1 pattern2 ... [includeFilter://pattern1 ... excludeFilter://patternN ...]
    ```
3. Line Break Configuration
    ``` txt
    line`
    operation
    pattern1
    pattern2
    ...
    [includeFilter://pattern1
    ...
    excludeFilter://patternN
    ...]
    `
    ```
    > Whistle will automatically replace line breaks within code blocks with spaces.

For complete functionality, see: [Rule Configuration](./rules/pattern)
