# Filters

When matching based on request or response attributes (not just the URL), you can use filters to achieve more granular rule control. The syntax is:

``` txt
pattern operator includeFilter://pattern1 ... excludeFilter://patternx ...
```
> Multiple filters are matched "or"; as long as one of the filter conditions matches, the match is true.

## Filter Types

| Filter Type | Syntax | Purpose |
| -------------- | ------------------------- | ------------------------ |
| **Include Filter** | `includeFilter://pattern` | Match only requests that match the specified conditions |
| **Exclude Filter** | `excludeFilter://pattern` | Exclude requests that match the specified conditions |

## Pattern Types

Match expressions used with `includeFilter://<pattern>` and `excludeFilter://<pattern>`.

> **General rules**
> - When no prefix is specified, the request URL is matched by default.
> - Keyword matching is case-insensitive by default.
> - Regex format is `/regexp/`; append `i` at the end to ignore case, e.g. `/regexp/i`.
> - The `probability` value for `chance` ranges from `0` to `1`.

| Syntax | Match target | Example |
| --- | --- | --- |
| `b:pattern` | Request body content: keyword (case-insensitive) or regex | `includeFilter://b:keyword`<br>`excludeFilter://b:/regexp/i` |
| `m:pattern` | HTTP method: method name (case-insensitive) or regex | `includeFilter://m:get`<br>`excludeFilter://m:/regexp/i` |
| `i:pattern` | Client or server IP: IP or regex | `includeFilter://i:192.168.1.10`<br>`excludeFilter://i:/regexp/i` |
| `chance:probability` | Random hit by probability: `Math.random() < probability` | `includeFilter://chance:0.5`<br>`excludeFilter://chance:0.3` |
| `clientIp:pattern` | Client IP: IP or regex | `includeFilter://clientIp:192.168.1.10`<br>`excludeFilter://clientIp:/regexp/i` |
| `serverIp:pattern` | Server IP: IP or regex | `includeFilter://serverIp:192.168.1.10`<br>`excludeFilter://serverIp:/regexp/i` |
| `s:pattern` | Response status code: status code or regex | `includeFilter://s:/^20/`<br>`excludeFilter://s:200` |
| `reqH.header-key:pattern` | Request header: keyword (case-insensitive) or regex | `includeFilter://reqH.content-type:json`<br>`excludeFilter://reqH.content-type:/regexp/i` |
| `resH.header-key:pattern` | Response header: keyword (case-insensitive) or regex | `includeFilter://resH.content-type:json`<br>`excludeFilter://resH.content-type:/regexp/i` |
| No-prefix `pattern` (any other `xxxxxx`) | Request URL, same as [pattern](./pattern) | `includeFilter://*/cgi-*`<br>`excludeFilter://www.test.com`<br>`includeFilter://https://www.test.com/path` |
