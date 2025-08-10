# excludeFilter
Based on matching [pattern](./pattern), further filter requests that meet the specified conditions (requests that meet any of the conditions will be retained).

## Syntax Rules
``` txt
pattern operation excludeFilter://p1 excludeFilter://p2 ...
```
> Requests must match `pattern` and not any of `p1`, `p2`, ... for this to take effect.

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| operation | Operation Instructions | [Operation Instructions Documentation](./operation) |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filters Documentation](./filters) |

## Configuration Example
``` txt
# Not effective for GET or POST requests only
www.example.com/api/data proxy://127.0.0.1:8080 excludeFilter://m:GET excludeFilter://m:post
```

Can be used with [includeFilter](./includeFilter). For detailed usage, see [Filter Documentation](./filters).
