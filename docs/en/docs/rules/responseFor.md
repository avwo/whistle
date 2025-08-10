# responseFor
Customize the `ServerIP` displayed on the Whistle Network dashboard by setting the `x-whistle-response-for` response header field.
> Equivalent to: [resHeaders://x-whistle-response-for=xxx](./resHeaders)

# Rule Syntax
``` txt
pattern responseFor://ip [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| ip | Custom client IP<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
www.example.com/path responseFor://1.1.1.1,2.2.2.2
```
<img src="/img/response-for.png" width="800" />

## Related Protocols
1. Custom Response Headers: [resHeaders://x-whistle-response-for=xxx](./resHeaders)
