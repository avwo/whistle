`pattern` is the first part of Whistle rules, used to match request URLs. It supports various matching methods including domains, paths, wildcards, and regular expressions.

Through `pattern`, you can:
- Precisely match specific domains or paths
- Use wildcards to match a group of related requests
- Use regular expressions to implement complex matching logic
- Support three different types of URL matching

## Request URL Types

Whistle supports three types of request URLs:

| Type | Format | Examples |
| :--- | :--- | :--- |
| **Tunnel Proxy** | `tunnel://domain[:port]` | `tunnel://www.test.com:443` |
| **WebSocket** | `ws[s]://domain[:port]/[path/to[?query]]` | `wss://www.test.com/path?a=1&b=2`<br>`ws://www.example.com:8080/path` |
| **Regular HTTP/HTTPS** | `http[s]://domain[:port]/[path/to][?query]` | `https://www.test.com/path`<br>`http://www.example.com/path?a=1&b=2` |

## Domain Matching

### Domain Structure
```txt
[[schema]://]domain[:port]
```

**Parameter Description**:
- `domain`: Domain name or IP address, supports wildcards
- `port`: Port number (optional), supports wildcards
- `schema`: Protocol type (optional, such as `http`, `https`, `ws`, `wss`, `tunnel`), supports wildcards
- `//`: Represents using the current request's protocol (automatically adapts to HTTP/HTTPS)

### Matching Formats

| Type | Format | Examples |
| :--- | :--- | :--- |
| **Normal Domain** (supports wildcards) | `domain`<br>`IP`<br>`//domain`<br>`//IP` | `www.example.com`<br>`1.2.3.4`<br>`*.example.com`<br>`//www.example.com`<br>`//1.2.3.4` |
| **Domain with Port** (port supports wildcards) | `domain:port`<br>`//domain:port` | `www.example.com:8080`<br>`//www.ex*le.com:8*` |
| **Domain with Protocol** (protocol supports wildcards) | `schema://domain[:port]` | `tunnel://www.*amp*.com`<br>`ws*://**.example.com:443`<br>`http*://www.example.com:8*8` |

### Wildcard Explanation for Domains

#### Domain Wildcards
- `*`: Equivalent to regex `/[^/?.]*/` (i.e., 0 or any number of non-`.` characters in the domain)
- `**`: Equivalent to regex `/[^/?]*/` (i.e., 0 or any number of characters in the domain)
- `***` (and above): Not recommended

**Examples**:
- `www.example*.com`: Can match `www.example.com`, `www.examplexxx.com:8080`, etc., but cannot match `www.example.x.com`
- `*.example.com`: Can match `www.example.com`, `www.example.com:8080`, but cannot match `x.www.example.com`
- `**.example.com`: Can match `x.y.z.www.example.com`, `x.y.www.example.com:8080`, etc., but cannot match `example.com`

#### Port Wildcards
- `*` (and above): Equivalent to regex `/\d*/` (i.e., 0 or any number of digits)

**Examples**:
- `http://www.example.com:8*8`: Matches `http://www.example.com:88`, `http://www.example.com:8888`, etc., but cannot match `http://www.example.com:8080`

#### Protocol Wildcards
- `*` (and above): Equivalent to regex `/[a-z]*/` (i.e., 0 or any number of characters in the protocol)

**Examples**:
- `http*://www.example.com`: Matches `http://www.example.com` and `https://www.example.com:8080`

## Path Matching

URL Path Structure:
```txt
[[schema:]//]domain[:port]/path?query
```

**Example**: `https://www.example.com/data/test/result?q=123`

### Matching Formats

#### 1. Path Without Protocol (can match any protocol)
- `www.example.com[:port]/[path/to[?query]]`
- `//www.example.com[:port]/[path/to[?query]]`

#### 2. Path With Protocol (matches requests with specified protocol)
- `ws[s]://www.example.com[:port]/[path/to[?query]]`
- `http[s]://www.example.com[:port]/[path/to[?query]]`

> **Note**: TUNNEL requests do not have paths.

#### 3. With Wildcards
- `ws*://*.example.com/path/to`
- `http*[s]*://www.example*.com:8*/path/to`

## Detailed Explanation of Matching Mechanisms

#### Basic Path Matching  
Matches specified hosts and paths along with all their subpaths, supporting multiple protocols:

**Supported Protocols**:  
- `http://` / `https://` (HTTP/HTTPS)  
- `tunnel://` (Tunnel Proxy)  
- `ws://` / `wss://` (WebSocket connections)  

**Path Matching Rules**:  
Matches `www.example.com/path` and all its subpaths:  
- ✅ `www.example.com/path`  
- ✅ `www.example.com/path/`  
- ✅ `www.example.com/path/subfolder`  
- ✅ `www.example.com/path/file.html`  
- ✅ `www.example.com/path/subfolder/file?query=1`  
- ❌ `www.example.com/path-other` (does not start with `/path`)  
- ❌ `www.example.com/path123` (not an exact prefix of `/path`)  

#### Wildcard Matching Example  
Rule:  
```txt
www.example*.com/path/to www.test.com/test
```

**Matching Scenarios**:  
- `https://www.example123.com/path/to?query=abc`  
  → mapped to `https://www.test.com/test?query=abc`  
- `https://www.example123.com/path/to/subpage`  
  → mapped to `https://www.test.com/test/subpage`  
- `wss://www.example456.com/path/to/api`  
  → mapped to `wss://www.test.com/test/api`  

**Non-matching Scenarios**:  
- `https://www.example123.com/path/to123` (path does not end with `/to`)  
- `https://example123.com/path/to` (missing www prefix)  
- `https://www.example123.com/path` (incomplete path)  

#### **Exact Matching with Query Parameters**  

Rule:  
```txt
www.demo*.com/path/to?name= www.test.com/test
```

**Rule Explanation**:  
- Path must exactly match `/path/to`  
- Must include the `name=` query parameter (case-sensitive)  
- After matching, the `name=` parameter is removed while other parameters are retained  

**Matching Scenarios**:  
- `https://www.demo.com/path/to?name=john&age=20`  
  → mapped to `https://www.test.com/test?age=20`  
- `https://www.demo.com/path/to?name=&sort=asc`  
  → mapped to `https://www.test.com/test?sort=asc`  

**Non-matching Scenarios**:  
- `https://www.demo.com/path/to/extra?name=john` (path not exact)  
- `https://www.demo.com/path/to?Name=john` (parameter name case mismatch)  
- `https://www.demo.com/path/to?user=john` (missing name parameter)

## Path Wildcard Matching

Since `*` is a valid URL path character, when it needs to be used as a wildcard, add `^` before the expression to explicitly declare:

```txt
^[[schema:]//]domain[:port]/pa**th?qu*ery
```

**Example**: `^http*://**.example.com/data/*/result?q=*23`

Whistle internally converts wildcard paths into corresponding regular expressions with the following conversion rules:

### 1. Protocol, Domain, Port Wildcard Rules
Same as domain matching above.

### 2. Path Part Wildcard Rules

| Wildcard | Regex Equivalent | Matching Scope | Example |
| :--- | :--- | :--- | :--- |
| `*` | `/[^?/]*/` | Single-level path (excluding `/` and `?`) | `^.../*/*.js` → `.../a/b.js` |
| `**` | `/[^?]*/` | Multi-level path (excluding `?`) | `^.../**file` → `.../a/b/c/test-file` |
| `***` | `/.*/` | Any character (including `/` and `?`) | `^.../data/***file` → `.../a/b/c?test=file` |

### 3. Query Parameter Wildcard Rules

| Wildcard | Regex Equivalent | Matching Scope | Example |
| :--- | :--- | :--- | :--- |
| `*` | `/[^&]*/` | Single parameter value (excluding `&`) | `^...?q=*123` → `...?q=abc123` |
| `**` | `/.*/` | Any character (including `&`) | `^...?q=**123` → `...?q=abc&test=123` |

> **Memory Tip**: Mainly remember the matching scope of the three wildcards `*`, `**`, `***`.

## Regular Expression Matching

In addition to simple matching rules, Whistle provides complete regular expression support, with syntax fully compatible with JavaScript regular expressions:

```txt
/pattern/[flags]
```

**Parameter Description**:
- `pattern`: Regular expression body
- `flags`: Matching mode modifiers (optional), supports:
  - `i`: Case-insensitive, e.g., `/abc/i` matches "AbC"
  - `u`: Enable Unicode support, e.g., `/\p{Emoji}/u` matches "😀"

**Examples**:
```txt
/\.test\./          # Matches ".test."
/key=value/i        # Case-insensitive match for "key=value"
/\/statics\//ui     # Unicode mode match for "/statics/"
```

## Submatch Value Passing

In Whistle rule configuration, you can reference submatch content from wildcard or regular expression matches through `$0`, `$1` to `$9`, and pass them to operation values:

```txt
pattern protocol://$0_$1_$2_..._$1
```

**Parameter Description**:
- **$0**: Complete match result
- **$1 - $9**: Content of corresponding capture groups

### Wildcard Matching Value Passing
```txt
^http://*.example.com/v0/users/** file:///User/xxx/$1/$2
```

**Matching Example**:
- Request URL: `http://www.example.com/v2/users/alice/test.html?q=1`
- Value Passing Result:
  - `$1` = `www`
  - `$2` = `users/alice`
- Final Replacement: Local file `/User/xxx/www/alice/test.html` content

### Regular Expression Matching Value Passing
```txt
/regexp\/(user|admin)\/(\d+)/ reqHeaders://X-Type=$1&X-ID=$2
```

**Matching Example**:
- Request URL: `.../regexp/admin/123`
- Value Passing Result:
  - `$1` = `admin`
  - `$2` = `123`
- Final Effect: Add request headers `X-Type: admin` and `X-ID: 123`

## Special Notes

Domain matching and path matching automatically concatenate paths when mapping to local file/directory paths or new remote URLs, i.e.:

```txt
https://*.example.com/path/to https://www.test.com/test

www.example.com file:///Usr/test
```

**Examples**:
- Accessing `https://abc.example.com/path/to/x/y/z?query` will automatically be replaced with new URL: `https://www.test.com/test/x/y/z?query`
- Accessing `https://wwww.example.com/path/to/index.html?query` will automatically be replaced with local file: `https://www.test.com/path/to/index.html` (automatically removes `query`)

## Configuration Examples

### Basic Matching
```txt
# Exact domain matching
api.example.com proxy://127.0.0.1:3000

# Port-specific matching
www.example.com:8080 file:///local/dev

# Path matching
www.example.com/api/users file://{user-data}
```

### Wildcard Matching
```txt
# Match all subdomains
**.example.com proxy://127.0.0.1:8080

# Match subdomains with specific prefix
dev-**.example.com file:///(dev-mock)

# Match all HTTP/HTTPS requests
http*://www.example.com  cache://3600
```

### Regular Expression Matching
```txt
# Match user pages with numeric IDs
/^https?://www\.example\.com/user/(\d+)/ file://(user-$1)

# Case-insensitive match for specific path
/\/api\/v1\/data/i resBody://({"version":"v1"})

# Match static resource files
/\.(jpg|png|gif|css|js)$/i cache://86400
```

### Complex Matching
```txt
# Combine wildcards and paths
^https://**.example.com/api/*/v*/users reqHeaders://x-api-version=$3

# Multi-condition matching
www.example.com/api file://({"status":"ok"}) includeFilter://m:GET
www.example.com/api file://({"status":"created"}) includeFilter://m:POST
```

## Troubleshooting

### Q: Rules Not Matching Requests
**A:** Check:
1. Whether the URL format is correct
2. Whether it contains the correct protocol and port
3. Whether wildcards or regular expressions are correct
4. Whether there are higher-priority rules overriding

### Q: Regular Expressions Not Working
**A:** Check:
1. Whether the regular expression syntax is correct
2. Whether special characters need to be escaped
3. Whether matching mode flags are set correctly

### Q: Submatch Value Passing Error
**A:** Check:
1. Whether capture group numbers are correct
2. Whether wildcard matching correctly captures expected content
3. Whether regular expression capture groups work as expected

## Extended Reading

- [Rule Syntax Documentation](./rule): Understand the complete rule syntax structure
- [Operation Instructions Documentation](./operation): Learn how to configure operation instructions
- [Filters Documentation](./filters): Understand how to precisely control rule activation conditions
