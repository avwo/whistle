# locationHref
For scenarios where server-side redirection (`302`/`301`) is unavailable, client-side redirection can be achieved by returning the JavaScript code `window.location.href = targetUrl` in the HTML page. Especially suitable for:
- App pages loaded from local HTML files
- Single-Page Applications (SPAs)
- Hybrid Apps developed with special frameworks

## Rule Syntax
``` txt
pattern locationHref://targetUrl [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| targetUrl | The redirected URL, which can be a relative path | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
#### Basic Configuration
``` txt
www.example.com/path locationHref://https://www.qq.com

www.example.com/path2 locationHref://../abc/123
```
- Visiting `https://www.example.com/path/to` redirects to `https://www.qq.com` (no automatic path concatenation)
- Visiting `https://www.example.com/path2/to` redirects to `https://www.example.com/abc/123`

#### Implementing Path Concatenation
``` txt
# Wildcard
^www.example.com/path/*** locationHref://`https://www.example.com/$1`
```
- Visiting `https://www.example.com/path/to?query` redirects to `https://www.example.com/to?query`

## Related Protocols
1. Pages whose addresses cannot be modified via `302` can use: [locationHref](./locationHref)
