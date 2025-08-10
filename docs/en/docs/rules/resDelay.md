#resDelay
Sets the delay time (in milliseconds) after the server completes processing.

## Rule Syntax
``` txt
pattern resDelay://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Time value (unit: milliseconds)<br/>⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Delay 3000 milliseconds (i.e., 3 seconds) before responding to the client after the backend returns
www.example.com/path resDelay://3000

# Delay 5000 seconds (i.e., 5 seconds) after the backend returns Abort the request after 5 seconds.
www.example.com/path2 resDelay://5000 enable://abortRes
```
