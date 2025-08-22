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

| Syntax | Purpose | Example |
| ------------------- | --------------------- | ----------------------------- |
| `b:pattern` | Match request body content | `includeFilter://b:keyword` `excludeFilter://b:/regexp/[i]` |
| `m:pattern` | Match HTTP method | `includeFilter://m:keyword` `excludeFilter://m:/regexp/[i]` |
| `i:pattern` | Match client or server IP | `includeFilter://i:keyword` `excludeFilter://i:/regexp/[i]` |
| `chance:probability`| `Math.random() < probability` | `includeFilter://chance:0.5` `excludeFilter://chance:0.3` |
| `clientIp:pattern` | Match only client IP | `includeFilter://clientIp:/regexp/[i]` `excludeFilter://clientIp:keyword` |
| `serverIp:pattern` | Match only server IP | `includeFilter://serverIp:/regexp/[i]` `excludeFilter://serverIp:keyword` |
| `s:pattern` | Match response status code | `includeFilter://s:/^20/` `excludeFilter://s:30` |
| `h:name=pattern` | Match request/response headers | `includeFilter://h:content-type=json` `excludeFilter://h:content-type=/regexp/i` |
| `reqH:name=pattern` | Match request headers only | `includeFilter://reqH:content-type=json` `excludeFilter://reqH:content-type=/regexp/i` |
| `resH:name=pattern` | Match response headers only | `includeFilter://resH:content-type=json` `excludeFilter://resH:content-type=/regexp/i` |
| Other `xxxxxx` | Match request URLs (same as [pattern](./pattern)) | `includeFilter://*/cgi-*` `excludeFilter://www.test.com` `includeFilter://https://www.test.com/path` |
