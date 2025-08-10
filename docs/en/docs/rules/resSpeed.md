# resSpeed
Sets the response body transmission speed (unit: kb/s, kilobits per second).

## Rule Syntax
``` txt
pattern resSpeed://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Transmission speed (unit: kb/s, kilobits per second)<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Limit the response content transmission speed to 3kb/s
www.example.com/path resSpeed://3
```
This rule is ineffective for requests without a request body, such as those with methods like `GET`, `HEAD`, `CONNECT` (TUNNEL request), and `UPGRADE` (WebSocket request).
