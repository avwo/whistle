# referer
Modify the `referer` field in the request header. Some servers validate the `referer` field in the request header. This protocol can be used to bypass this detection or test backend functionality.

## Rule Syntax
``` txt
pattern referer://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Full URL link<br/>• Inline/Embedded/Values content<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
www.example.com/path referer://https://www.test.com/x/y/z?xxx
```

## Associated Protocols
1. Equivalent to: [reqHeaders://referer=https://xxx](./reqHeaders)
