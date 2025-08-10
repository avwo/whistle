# reqDelay

Set the request delay time (in milliseconds).

## Rule Syntax
``` txt
pattern reqDelay://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Time value (in milliseconds)<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Delay 3000 milliseconds (i.e., 3 seconds) for requests
www.example.com/path reqDelay://3000

# Abort after 5000 seconds (i.e., 5 seconds) Request
www.example.com/path2 reqDelay://5000 enable://abort
```
