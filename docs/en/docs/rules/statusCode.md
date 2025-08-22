# statusCode
Immediately terminates the request and returns the specified HTTP status code without forwarding the request to the backend server.

## Rule Syntax
``` txt
pattern statusCode://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Response status code, such as `200`/`302`/`404`, etc. | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Headers/Content<br/>• Response status code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Visit `https://www.example.com/path/to` and the browser prompts for username and password.
www.example.com/path statusCode://401

# You can disable the login pop-up using disable / lineProps
www.example.com/path statusCode://401 disable://userLogin
```
> Set the `statusCode` request. The response content is empty. You can customize the response content using [resBody](./resBody)

## Notes

`statusCode://value` only takes effect during the request phase. Matching requests will not be forwarded to the backend server. To replace the `statusCode` in the backend response, use the [replaceStatus](./replaceStatus) protocol.

## Related Protocols
1. Replace the response status code: [replaceStatus](./replaceStatus)
2. Disable the login dialog: [enable](./enable) or [lineProps](./lineProps)
3. Set the response content: [resBody](./resBody)
