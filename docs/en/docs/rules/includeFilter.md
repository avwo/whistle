# includeFilter
Based on matching [pattern](./pattern), further filter requests that meet the specified conditions (requests that meet any of the conditions will be retained).

## Syntax Rules
``` txt
pattern operation includeFilter://p1 includeFilter://p2 ...
```
> Requests must match `pattern` and one of `p1`, `p2`, ... for this to work.

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| operation | Operation Instructions | [Operation Instructions Documentation](./operation) |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Only valid for GET or POST requests
www.example.com/api/data proxy://127.0.0.1:8080 includeFilter://m:GET includeFilter://m:POST
```

Can be used with [excludeFilter](./excludeFilter). For detailed usage, see [Filter documentation](./filters).
