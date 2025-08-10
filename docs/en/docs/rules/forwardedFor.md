# forwardedFor
Modify the `x-forwarded-for` request header field to customize the client IP address.

## Rule Syntax
``` txt
pattern forwardedFor://ip [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| ip | Custom client IP<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Setting a fixed IP address
www.example.com/path forwardedFor://1.1.1.1

# Using the real client IP address (transparent mode)
www.example.com forwardedFor://`${clientIp}`
```

## Associated Protocols
1. Directly modify the request header: [reqHeaders://x-forwarded-for=value](./reqHeaders) (the `value` in this method is not limited to the IP address)
2. Enable automatic `x-forwarded-for`: [enable://clientIp](./enable)
