# reqSpeed
Sets the request body transmission speed (unit: kb/s, kilobits per second).

## Rule Syntax
``` txt
pattern reqSpeed://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Transmission speed (unit: kb/s, kilobits per second)<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filters Documentation](./filters) |

## Configuration Example
``` txt
# Limit the request content transmission speed to 3kb/s
www.example.com/path reqSpeed://3
```
This rule has no effect on `CONNECT` (TUNNEL requests), `UPGRADE` (WebSocket requests), and requests with a response status code of `204` and no response body.
