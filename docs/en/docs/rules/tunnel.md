# tunnel
Forward tunnel proxy requests to the new server.
> Only supports tunnel proxy `tunnel://domain:port`, not WebSocket requests or regular HTTP/HTTPS conversion.

## Rule Syntax
``` txt
pattern tunnel://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match WebSocket request URLs | [Match Pattern Documentation](./pattern) |
| value | Target URL format: `domain[:port]`<br/>`port` defaults to `443`<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## TUNNEL Conversion
``` txt
tunnel://www.example.com tunnel://www.test.com:5678
tunnel://www.example2.com:8080 tunnel://www.test.com
```
| Original Request | Transformation Result |
| ----------------------------- | ----------------------------------------- |
| `tunnel://www.example.com:443` | `tunnel://www.test.com:5678` |
| `tunnel://www.example2.com:8080` | `tunnel://www.test.com:443` |

TUNNEL requests do not have automatic path splicing and path splicing is disabled. Other requests matching the `tunnel` protocol result:
- **WebSocket requests**: Ignore the match
- **Normal HTTP/HTTPS requests**: Return a `502` error
