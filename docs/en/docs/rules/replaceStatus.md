# replaceStatus
Replaces the HTTP status code. After the request is responded to, the original status code is replaced with the specified HTTP status code.

## Rule Syntax
``` txt
pattern replaceStatus://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Response status code, such as `200`/`302`/`404`, etc. | |
| filters | Optional filters, supporting matching: <br/>• Request URL/Method/Headers/Content <br/>• Response status code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Visit `https://www.example.com/path/to` and the browser will prompt you to enter your username and password.
www.example.com/path replaceStatus://401

# You can disable the login pop-up using disable / lineProps
www.example.com/path replaceStatus://401 disable://userLogin
```

## Related Protocols
1. Set the status code for a direct response: [statusCode](./statusCode)
2. Disable the login dialog: [enable](./enable) or [lineProps](./lineProps)
