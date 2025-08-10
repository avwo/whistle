# cache
Set cache headers for the response.

## Rule Syntax
``` txt
pattern cache://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Number of seconds to cache, `no`, `no-cache`, `no-store`<br/>• Inline/embedded/Values content<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

Affected Response Headers: `cache-control`/`expires`/`pragma`

## Configuration Example
``` txt
# Set response headers to not cache
www.example.com/path cache://no

# Set a 60-second cache response header.
www.example.com/path cache://60
```

## Related Protocols
1. Disable caching: Remove cache-related fields from request headers and set the response header to no cache. For more information, see [disable://cache](./disable).
