# headerReplace
Replaces the specified request/response header by matching a keyword or regular expression.

## Rule Syntax
``` txt
pattern headerReplace://value [filters...]
```
> `header-name` is case-insensitive

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Three cases: <br/>• `req.header-name:p1=v1&p2=v2`<br/>• `res.header-name:p1=v1&p2=v2`<br/>• `trailer.trailer-name:p1=v1&p2=v2` | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching: <br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Change the first `html` keyword in the `accept` request header field to `abc`
www.example.com/path headerReplace://req.accept:html=abc

# Change all `ml` keywords in the `accept` request header field to `abc`
www.example.com/path2 headerReplace://req.accept:/ml/g=abc

# Modify the response header
www.example.com/path3 headerReplace://res.Content-Type:html=plain
```

`headerReplace` is used to replace partial request/response header content. To modify request/response field content, you can also use:
- Set request headers: [reqHeaders](./reqHeaders)
- Set response headers: [resHeaders](./resHeaders)
