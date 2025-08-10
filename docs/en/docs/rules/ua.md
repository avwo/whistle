# ua
A shortcut protocol for modifying the `User-Agent` field in the request header. This can be used to simulate access from various machines.

## Rule Syntax
``` txt
pattern ua://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Custom request `User-Agent` string<br/>• Inline/Embedded/Values content<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
```` txt
# Change the original user-agent to `Whistle/2.9.100`
www.example.com/path ua://Whistle/2.9.100

# Spaces UA
``` ua.txt
Test Whistle/2.9.100
```
www.example.com/path ua://{ua.txt}

# Using reqHeaders
``` ua.json
user-agent: Test Whistle/2.9.100
```
www.example.com/path reqHeaders://{ua.json}
````

## Associated Protocols
1. Directly modify the request header: [reqHeaders://User-Agent=value](./reqHeaders)
