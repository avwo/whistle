# redirect
Immediately redirect matching requests (302 Found) to the specified URL without requesting the backend server.

## Rule Syntax
``` txt
pattern redirect://targetUrl [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| targetUrl | The URL to redirect to, which can be a relative path | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
#### Basic Configuration
``` txt
www.example.com/path redirect://https://www.qq.com

www.example.com/path2 redirect://../abc/123
```
- Visit `https://www.example.com/path/to` and redirect to `https://www.qq.com` (no automatic path concatenation)
- Visit `https://www.example.com/path2/to` redirects to `https://www.example.com/abc/123`

#### Implementing path concatenation
``` txt
# Wildcard
^www.example.com/path/*** redirect://`https://www.example.com/$1`
```
- Visit `https://www.example.com/path/to?query` redirects to `https://www.example.com/to?query`

## Associated Protocols
1. Pages whose addresses cannot be modified via `302` can use: [locationHref](./locationHref)
