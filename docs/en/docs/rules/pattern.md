## pattern

`pattern` is the expression used in Whistle rules to match request URLs. It supports multiple matching methods, including URL fragment/domain, wildcards, and regular expressions.

## Request URL Types

Whistle supports three types of request URLs:

| Type | Format | Example |
| :--- | :--- | :--- |
| **Tunnel proxy** | `tunnel://domain:port` | `tunnel://www.test.com:443` |
| **WebSocket** | `ws[s]://domain[:port]/[path/to[?query]]` | `wss://www.test.com/path?a=1&b=2`<br>`ws://www.example.com:8080/path` |
| **HTTP/HTTPS** | `http[s]://domain[:port]/[path/to][?query]` | `https://www.test.com/path`<br>`http://www.example.com/path?a=1&b=2` |

> The hash part of a URL (i.e., `#` and everything after it) is not sent to the server. Hashes only work on the client side (e.g., browsers) and cannot be directly obtained by the server.

## URL Fragment {#url}

The URL fragment is used to match request URLs with flexible patterns. The matching rules are categorized as follows.

### 1. Domain Matching

- **Plain domain**: `example.com`  
  Matches all requests under this domain, regardless of port and protocol (http/https).  
  ✅ `https://example.com/path/to?query`  
  ✅ `https://example.com:9090/path/to?query`

- **Domain with port**: `example.com:8080`  
  Matches only requests for the specified port (8080).  
  ✅ `https://example.com:8080/path/to?query`  
  ❌ `https://example.com:9090/path/to?query`
  ❌ `https://example.com/path/to?query`

### 2. Protocol Matching

- **With protocol**: `https://example.com/path/to`  
  Matches only requests using the same protocol.

- **Without protocol**: `example.com/path/to` or `//example.com/path/to`  
  Matches any protocol (http, https, etc.). Path matching follows the same rules as with protocol (see below).

### 3. Path & Query Parameter Matching

#### 3.1 Without Query Parameters

Pattern: `https://example.com/path/to`  
Rule: **Path prefix matching** (using `/` as boundary).  
- ✅ `https://example.com/path/to`  
- ✅ `https://example.com/path/to/xxx?query`  
- ❌ `https://example.com/path/toxxx` (missing `/` boundary after `to`)

#### 3.2 With Query Parameters

Pattern: `https://example.com/path/to?xxx`  
Rule: **Exact path** and query string **prefix** matching.  
- ✅ `https://example.com/path/to?xxx`  
- ✅ `https://example.com/path/to?xxxyyy&zzzzz`  
- ❌ `https://example.com/path/to/yyy?xxx` (path differs)

### 4. Exact Matching

Use the `$` prefix for stricter matching.

- `$https://example.com/path/to`  
  Matches **exact path** (with `/` boundary), any query parameters.  
  ✅ `https://example.com/path/to`  
  ✅ `https://example.com/path/to?query`  
  ❌ `https://example.com/path/to/xxx`

- `$https://example.com/path/to?query`  
  Matches **exact path and exact query string**.  
  ✅ `https://example.com/path/to?query`  
  ❌ `https://example.com/path/to?query=1`  
  ❌ `https://example.com/path/to`

- Exact match without protocol: `$example.com/path/to` (same behavior, any protocol)

### 5. Domain Wildcard {#domain-wildcard}

Use `*` or `**` in the `domain:port` part for fuzzy matching.

- `*` : Matches zero or more non-`.` characters (equivalent to regex `/[^/?.]*/`).  
  Example: `https://*.example.com/path/to`  
  ✅ `https://www.example.com/path/to`  
  ✅ `https://abc.example.com/path/to/xxx?query`
  ❌ `https://a.b.example.com/path/to`

- `**` : Matches zero or more arbitrary characters except `/` and `?` (equivalent to regex `/[^/?]*/`).  
  Example: `https://**.example.com:8*/path/to`  
  ✅ `https://foo-bar.example.com:8080/path/to`
  ✅ `https://a.b.example.com:8888/path/to`

- `***` and more: not recommended.

> Note: `*` is also a legal character in URL paths. If you need to use wildcards in the path part, see [Wildcard Matching](#wildcard).

### Summary

| Pattern | Protocol | Port | Path Matching | Query Matching |
|---------|----------|------|---------------|----------------|
| `example.com` | Any | Any | - | - |
| `example.com:8080` | Any | 8080 | - | - |
| `https://example.com/path/to` | https | Any | Prefix (`/` boundary) | Any |
| `https://example.com/path/to?xxx` | https | Any | Exact | Prefix |
| `$https://example.com/path/to` | https | Any | Exact | Any |
| `$https://example.com/path/to?xxx` | https | Any | Exact | Exact |
| `example.com/path/to` <br/> or `//example.com/path/to` | Any | Any | Prefix (`/` boundary) | Any |

## Wildcard Matching {#wildcard}

In [URL Fragment Matching](#url), because `*` is a legal character in URL paths, wildcards cannot be used directly in the path or query part.  
If you need to use wildcards in the **path** or **query parameters**, prefix the URL with `^`. Then `*`, `**`, `***` are interpreted as wildcards.

### 1. Domain Wildcard

The syntax is exactly the same as the [Domain Wildcard in URL Fragment](#domain-wildcard):

- `*`: Matches zero or more non-`.` characters (regex `/[^/?.]*/`)
- `**`: Matches zero or more arbitrary characters except `/` and `?` (regex `/[^/?]*/`)

**Example**: `^wss://*.example.com/path/to`

✅ Matches:
- `wss://a.example.com/path/to`
- `wss://b.example.com/path/to/xxx?query`

❌ Does not match:
- `wss://a.example.com/path/toxxx` (missing `/` boundary)
- `wss://a.b.example.com/path/to` (`*` does not match dot)

### 2. Path Wildcard

Applies to the **path part** of the URL (after domain, before `?`). Three levels are supported:

| Wildcard | Matching Rule (regex) | Description |
|----------|----------------------|-------------|
| `*`      | `/[^?/]*/`            | Matches any characters within the current path segment (excluding `/` and `?`) |
| `**`     | `/[^?]*/`             | Matches any characters (excluding `?`), can span multiple path segments |
| `***`    | `/.*/`                | Matches all remaining characters (including `/` and `?`), typically used at the end of the path |

**Example 1: `*`**  
Pattern: `^https://example.com/path/to/a*b`  
✅ Matches: `https://example.com/path/to/axxxb/...?query`  
❌ Does not match: `https://example.com/path/to/a/b` (`*` cannot match `/`)

**Example 2: `**`**  
Pattern: `^https://example.com/path/to/a**b`  
✅ Matches:
- `https://example.com/path/to/axxxb/...?query`
- `https://example.com/path/to/a/b`  
❌ Does not match: `https://example.com/path/to/a/xxxx?query=b` (after `?` is not part of path)

**Example 3: `***`**  
Pattern: `^https://www.example*.com:8*/path/to/a***b`  
✅ Matches:
- `https://example.com/path/to/axxxb/...?query`
- `https://example.com/path/to/a/b`
- `https://example.com/path/to/a/xxxx?query=b` (`***` matches `?` and beyond)

> `***` consumes all remaining characters including `?`. It is recommended only at the end of the path.

### 3. Query Parameter Wildcard

Applies to the **query string** (after `?`). Two levels are supported:

| Wildcard | Matching Rule (regex) | Description |
|----------|----------------------|-------------|
| `*`      | `/[^&]*/`             | Matches any characters within a single parameter value (excluding `&`) |
| `**`     | `/.*/`                | Matches all remaining characters (including `&`), i.e., from current position to end |

**Example 1: `*`**  
Pattern: `^https://example.com/path/to?query=a*b`  
✅ Matches: `https://example.com/path/to?query=ab&q2=xxx`  
❌ Does not match: `https://example.com/path/to?query=a&q2=b` (no extra characters before `b`)

**Example 2: `**`**  
Pattern: `^https://example.com/path/to?query=a**b`  
✅ Matches:
- `https://example.com/path/to?query=axxxb&q2=xxx`
- `https://example.com/path/to?query=a&q2=b` (`**` matches `&q2=`)

### 4. Exact Match Without Protocol

Write the domain and path directly after `^`, any protocol is allowed.

**Example**: `^example*.com/path*/to`  
Same effect as with protocol, but matches any protocol (http, https, wss, etc.).

### 5. Exact Matching (Boundary Control)

Use `$` at the end of the pattern to indicate that matching must end there (no extra characters afterwards).

**Example**: `^https://*.example.com/path/*/to$`  
✅ Matches: `https://a.example.com/path/xxx/to`  
❌ Does not match: `https://b.example.com/path/xxx/to?query` (`$` disallows `?query`)

> Without `$`, the pattern allows additional `/`, `?`, etc., after the path.

### Usage Summary

| Scenario | Prefix | Wildcard Type | Supported Wildcards | Example |
|----------|--------|---------------|---------------------|---------|
| Normal URL match (no wildcards) | None | — | — | `https://example.com/path` |
| Path/query with wildcards | `^` | domain, path, query | `*` `**` `***` | `^https://*.example.com/path/*?a**b` |
| Exact match (trailing boundary) | `^` + `$` | same as above | same as above | `^https://example.com/path/*/to$` |

> **Note**: Once you use `^`, the `*` in the URL is no longer a literal character but a wildcard. To match a literal `*`, do not use `^`.

## Regex Matching {#regexp}

In addition to the URL fragment and wildcard matching described above, Whistle provides full regular expression support.  
The regex syntax is fully compatible with JavaScript regular expressions:

```txt
/pattern/[i]
```

### Parameters

- **`pattern`**: The regular expression body
- **`i`** (optional): Case-insensitive matching

### Examples

```txt
/\.test\./              # Matches ".test."
/key=value/i            # Case-insensitive match for "key=value" or "KEY=VALUE"
```

## Sub-match Value Passing

In Whistle rules, you can reference sub-match contents captured by wildcards or regular expressions using `$0`, `$1` … `$9`, and pass them to target operation values.

```txt
pattern protocol://$0_$1_$2_..._$9
```

**Capture variable description**:

| Variable | Meaning |
|----------|---------|
| `$0` | The entire matched content |
| `$1` ~ `$9` | Content captured by the 1st to 9th capturing group |

### Wildcard Matching Value Passing

Wildcard patterns prefixed with `^` (using `*`, `**`, etc.) automatically capture matched segments in order, assigning them to `$1`, `$2`, and so on.

**Example**:
```txt
^http://*.example.com/v0/users/** file:///User/xxx/$1/$2
```

- Request URL: `http://www.example.com/v2/users/alice/test.html?q=1`
- Matching process:
  - `$1` = `www` (matches the first `*`)
  - `$2` = `users/alice` (matches the path segment captured by `**`)
- Result: Returns content of local file `/User/xxx/www/alice/test.html`

> Wildcard capture rules:
> - `*` captures a single path segment (no `/`)
> - `**` captures the remaining path (may contain `/`)
> - They correspond to `$1`, `$2`, … from left to right.

### Regex Matching Value Passing

When using a regex pattern `/pattern/flags`, the content inside capturing groups `( )` is assigned to `$1`, `$2`, … in order.

**Example**:
```txt
/regexp\/(user|admin)\/(\d+)/ reqHeaders://X-Type=$1&X-ID=$2
```

- Request URL: `.../regexp/admin/123`
- Capture results:
  - `$1` = `admin`
  - `$2` = `123`
- Result: Adds request headers `X-Type: admin` and `X-ID: 123`

---

## Path Auto-splicing Rule

When using **domain matching** or **path matching** to map to a local file/directory or remote URL, Whistle automatically appends the remaining path from the original request.

**Rule**:
```txt
https://*.example.com/path/to https://www.test.com/test
www.example.com file:///Usr/test
```

**Effect**:

| Request URL | Mapped Target |
|-------------|----------------|
| `https://abc.example.com/path/to/x/y/z?query` | `https://www.test.com/test/x/y/z?query` |
| `https://www.example.com/path/to/index.html?query` | Local file `/Usr/test/path/to/index.html` (query removed) |

> Note: Query parameters `?query` are automatically ignored when mapping to local files (file system paths do not support them), but are retained when mapping to a remote URL.

---

## Configuration Examples

### Basic Matching

```txt
# Exact domain match
api.example.com proxy://127.0.0.1:3000

# Domain match with specific port
www.example.com:8080 file:///local/dev

# Path match (map to local JSON data)
www.example.com/api/users file://{user-data}
```

### Wildcard Matching

```txt
# Match all subdomains
**.example.com proxy://127.0.0.1:8080

# Match subdomains with a specific prefix
dev-**.example.com file:///(dev-mock)
```

### Regex Matching

```txt
# Match user pages with numeric ID
/^https?://www\.example\.com/user/(\d+)/ file://(user-$1)

# Case-insensitive match for a specific path
/\/api\/v1\/data/i resBody://({"version":"v1"})

# Match static assets and set cache
/\.(jpg|png|gif|css|js)$/i cache://86400
```

### Complex Matching

```txt
# Wildcard + path capture value passing
^https://**.example.com/api/*/v*/users reqHeaders://x-api-version=$3

# Handle by request method
www.example.com/api file://({"status":"ok"}) includeFilter://m:GET
www.example.com/api file://({"status":"created"}) includeFilter://m:POST
```

---

## Troubleshooting

### Q: The rule does not match the request

**Possible causes and solutions**:

1. **Incorrect URL format**  
   → Ensure the protocol (http/https/ws/wss) in the rule matches the request, or use a protocol-less pattern (`example.com/path`).

2. **Port mismatch**  
   → If the request uses a non-standard port, specify the port explicitly in the rule (e.g., `example.com:8080`).

3. **Wildcard or regex error**  
   → Use [Whistle online debugging tools](https://github.com/avwo/whistle) or local logs to verify matching.

4. **Rule priority issues**  
   → Place more specific rules earlier, or use `$` exact matching to increase priority.

### Q: Regex does not work

**Checklist**:

- [ ] Does the regex start and end with `/`, e.g., `/pattern/`?
- [ ] Are special characters escaped (e.g., `.` -> `\.`, `/` -> `\/`)?
- [ ] Are flags (e.g., `i`) correctly added?
- [ ] Does the regex match the full URL? Test in console with `new RegExp('pattern', 'flags').test(url)`.

### Q: Sub-match value passing is incorrect

**Common issues**:

1. **Wrong capture group number**  
   → `$1` corresponds to the first `( )`, `$2` to the second, and so on. Pay attention to nested capture groups.

2. **Wildcard capture does not behave as expected**  
   → `*` does not match dot (`.`) or slash (`/`); `**` matches any character except `?`.  
   → Example: `*.example.com` cannot match `a.b.example.com`; use `**.example.com` instead.

3. **Regex capture groups not working as expected**  
   → Use `(?:)` for non-capturing groups to avoid interfering with numbering.  
   → Test with online regex tools (e.g., regex101.com) to verify captured content.

### Q: Wrong path when mapping to local file

- When using the `file://` protocol, ensure the path is absolute (e.g., `file:///User/xxx`).
- Path splicing follows the auto-splicing rule: the remaining path of the request is appended to the target path.
- Query parameters are automatically ignored and do not affect file reading.

---

## Further Reading

- [Rule Syntax Documentation](./rule): Learn the complete rule syntax structure
- [Operation Directive Documentation](./operation): Learn how to configure operation directives
- [Filter Documentation](./filters): Understand how to precisely control rule activation conditions
