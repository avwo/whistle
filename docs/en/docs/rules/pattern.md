# pattern

An expression that matches the request URL. Supports domain name, path, wildcard, and regular expression matching.

## Request URL

There are three types of request URLs:

1. **Tunnel proxy:** `tunnel://domain:port`
    > Example: `tunnel://www.test.com:443`
2. **WebSocket:** `ws[s]://domain[:port]/[path/to[?query]]`
    > Example: `wss://www.test.com/path?a=1&b=2`
3. **Normal HTTP/HTTPS:** `http[s]://domain[:port]/[path/to[?query]]`
    > Example: `https://www.test.com/path?a=1&b=2`

## Domain name matching
1. Normal domain name:
   - `www.example.com`,
   - `1.2.3.4`
   - `//www.example.com`,
   - `//1.2.3.4`
   > IP addresses can also be used as domain names
2. Domain names with ports:
   - `www.example.com:8080`
   - `//www.example.com:8080`
3. Domain names with protocols:
   - `tunnel://www.example.com[:port]`
   - `ws[s]://www.example.com[:port]`
   - `http[s]://www.example.com[:port]`

## Path Matching
1. Path without a protocol:
   - `www.example.com[:port]/[path/to[?query]]`
   - `//www.example.com[:port]/[path/to[?query]]`
2. Path with a protocol:
   - `ws[s]://www.example.com[:port]/[path/to[?query]]`
   - `http[s]://www.example.com[:port]/[path/to[?query]]`
   > TUNNEL request without a path

## Wildcard Matching

### Domain Wildcard Rules

1. **Basic Wildcard**: `*.example.com[:port][/path][?query]`
    > `*` matches any non-delimiter character (regular pattern: `/[^./?]*/`)
    >
    > Examples: `api.example.com`, `shop.example.com:8080`
2. **Multi-Level Wildcard**: `**.example.com[:port][/path][?query]`
    > `**` matches any multi-level subdomain (regular pattern: `/[^/?]*/`)
    >
    > Examples: `a.b.example.com`, `x.y.z.example.com/path`
3. **Mixed wildcards**: `test.abc**.com[:port][/path][?query]`
    > `**` fixed prefix + multi-level wildcard (regular pattern: `/[^/?]*/`)
    >
    > Examples: `test.abc123.com`, `test.abc123.x.com`, `test.abc.a.b.com`
4. **Protocol wildcard**: `http*://test.abc**.com[:port][/path][?query]`
    > `*` in the protocol matches any letter or colon (regular pattern: `/[a-z:]*/`)
    >
    > Examples: `https://...`, `http://...`
5. **Special rule**: `***.example.com[:port][/path][?query]`
    > This is equivalent to matching: the root domain (example.com) + multiple subdomains (**.example.com)
    >
    > Examples: example.com, a.example.com, a.b.example.com/path?q=1

Except for the special rules above (`***.`), three or more consecutive asterisks (e.g., `***`、`****`) in the protocol or domain name are equivalent to two asterisks (`**`).

### Path Wildcards
Since * is a valid URL path character, when using it as a wildcard, explicitly declare it by preceding the expression with ^ :

``` txt
^[[schema:]//]domain[:port]/pa**th?qu*ery
```
> Example: ^http*://**.example.com/data/*/result?q=*23

Wildcards for protocols and domain names function the same as for domain name wildcards above. Wildcards for pure paths and request parameters are as follows:

##### Path Wildcards

| Wildcards | Regular Expression Equivalence | Match Range | Example Match |
| ------ | ---------- | --------------------------- | ----------------------------------- |
| `*` | `/[^?/]*/` | Single-level path (excluding `/` and `?`) | `^.../*/*.js` -> `.../a/b.js` |
| `**` | `/[^?]*/` | Multi-level path (excluding `?`) | `^.../**file` -> `.../a/b/c/test-file` |
| `***` | `/.*/` | Any character (including `/` and `?`) | `^.../data/***file` -> `.../a/b/c?test=file` |

##### Wildcards in Request Parameters

| Wildcards | Regular Expression Equivalence | Match Range | Example Match |
| ------ | --------- | -------------------- | ------------------- |
| `*` | `/[^&]*/` | Single parameter value (excluding `&`) | `^...?q=*123` -> `...?q=abc123` |
| `**` | `/.*/` | Any character (including `&`) | `^...?q=**123` -> `...?q=abc&test=123` |

## Regular Expression Matching
In addition to simple matching rules, Whistle provides full regular expression support, with syntax fully compatible with JavaScript regular expressions:
``` txt
/pattern/[flags]
```

- pattern: Regular expression body
- flags: Matching pattern modifiers (optional) Supported:
  - `i` Ignore case `/abc/i` Matches "AbC"
  - `u` Enable Unicode support `/\p{Emoji}/u` Matches "😀"

Example:
``` txt
/\.test\./ # Matches ".test."
/key=value/i # Matches "key=value" ignoring case
/\/statics\//ui # Matches "/statics/" using the Unicode pattern
```

## Submatch Passing Values

In Whistle rule configuration, you can use $0, $1, through $9 to reference submatches of wildcard or regular expression matches and pass them into the action value:

``` txt
pattern protocol://$0_$1_$2_..._$1
```

- **$0**: Complete match result
- **$1 - $9**: Content of the corresponding capture group

#### Wildcard Match Passing Values
``` txt
^http://*.example.com/v0/users/** file:///User/xxx/$1/$2
```

- **Match**: `http://www.example.com/v2/users/alice/test.html?q=1`
- **Value**:
  - `$1` = `www`
  - `$2` = `users/alice`
- Result: Replaces the contents of the local file `/User/xxx/www/alice/test.html`

#### Regular Expression Matching and Value Passing
``` txt
/regexp\/(user|admin)\/(\d+)/ reqHeaders://X-Type=$1&X-ID=$2
```
- **Match**: `.../regexp/admin/123`
- **Value**:
  - `$1` = `admin`
  - `$2` = `123`
- **Result**: Adds the request headers `X-Type: admin` and `X-ID: 123`
