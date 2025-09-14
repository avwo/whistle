# delete
Used to delete the request URL, request/response headers, and request/response content.

## Rule Syntax
``` txt
pattern delete://prop1|prop2|... [filters...]

# Equivalent to:
pattern delete://prop1 delete://prop2 ... [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | `pathname`: Delete the request path (excluding request parameters)<br/>`pathname.index`: `index` is the path segment index `..., -1, 0, 1, ...` or the keyword `last` (see below for details)<br/>`urlParams`: Delete all request parameters<br/>`urlParams.xxx`: Delete the `xxx` parameter of the URL<br/>`reqHeaders.xxx`: Delete the `xxx` field of the request header<br/>`resHeaders.xxx`: Delete the `xxx` field of the response header<br/>`reqBody`: Delete all request content<br/>`resBody`: Delete all response content<br/>`reqBody.xxx.yyy`: Delete the `xxx.yyy` field of the request content whose type is form or JSON<br/>`resBody.xxx.yyy`: Delete the `xxx.yyy` field of the response content whose response type is JSONP or JSON<br/>`reqType`: Delete the type in the request header `content-type`, excluding the possible charset<br/>`resType`: Delete the type in the response header `content-type`, excluding the possible charset<br/>`reqCharset`: Delete the possible charset in the request header `content-type`<br/>`resCharset`: Delete the possible charset in the response header `content-type`<br/>`reqCookies.xxx`: Delete the request header named Cookies named `xxx`<br/>`resCookies.xxx`: Deletes the cookie named `xxx` in the response header. | |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filters Documentation](./filters) |

## Configuration Example
``` txt
https://www.example.com/path delete://reqCookies.token|resCookies.token

https://raw.githubusercontent.com/avwo/whistle/refs/heads/master/package.json delete://resBody.name resType://json
```
The above cookie deletion operation only affects cookies in the request/response process and does not modify cookies stored locally in the browser. To modify browser persistent cookies, you can do so in the following ways:
- Deleting them by injecting JavaScript using [jsPrepend](./jsPrepend)
- Setting cookie expiration times using [resCookies](./resCookies)

## Deleting Paths
> Supported versions: v2.9.102 and above

### Rule Syntax
```
# Basic Format
Target Domain delete://pathname.index

# Example
www.example.com/api/path/to delete://pathname.0 delete://pathname.1 delete://pathname.-1
```

### Rule Description
This rule deletes specific segments of the request URL's path. Whistle extracts the request path excluding query parameters, delimits it by `/`, and then deletes it.

**Example Parsing:**
- Request URL: `https://www.example.com/api/path/to/xxx?query`
- Extracted Path: `api/path/to/xxx`
- Split Array: `['api', 'path', 'to', 'xxx']`
- Apply Rules:
    - `delete://pathname.0` → Delete 'api'
    - `delete://pathname.1` → Delete 'path'
    - `delete://pathname.-1` → Delete 'xxx'
- Final Path: `/to`
- Complete Result: `https://www.example.com/to?query`

### Indexing Rules
- **Positive Index**: Starting at 0, indicating order from front to back
- **Negative Index**: Starting at -1, indicating order from back to front (-1 = last segment, -2 = second to last segment, and so on)
- **Special Value**: Use `last` removes the last segment of a path but preserves the trailing slash.
- **Border case**: Out-of-range indices are ignored.

### Important Note
When a path ends with `/`, the split array will contain an empty string item at the end:
- Path: `/api/path/to/xxx/`
- Split result: `['api', 'path', 'to', 'xxx', '']`

### Usage Tips
- Use `pathname.-1` to remove the last segment without preserving the trailing slash.
- Use `pathname.last` to remove the last segment but preserve the trailing slash.

**Comparison example:**
```
www.example.com/api/path/to delete://pathname.0 delete://pathname.1 delete://pathname.last
```
- Request: `https://www.example.com/api/path/to/xxx?query`
- Result: `https://www.example.com/to/?query` (preserves the trailing slash)
