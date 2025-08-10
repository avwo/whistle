# skip
Skip the specified `pattern` or `operation` rule and continue matching the following rules.

## Syntax Rules
``` txt
pattern skip://pattern=patternString skip://operation=operationString [filters...]
```
> Multiple `skip` options can be configured simultaneously.

| Parameter | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Regular expressions to ignore: <br/>• pattern=patternString<br/>• operation=operationString<br/> ⚠️ Loading data from files/remote URLs is not supported | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching: <br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
www.example.com/path file:///User/xxx/index1.html
www.example.com/path file:///User/xxx/index2.html

www.example.com/path2/test file:///User/xxx/test1.html
www.example.com/path2 file://</User/xxx/test2.html>

www.example.com/path skip://operation=file:///User/xxx/index1.html
www.example.com/path2/test skip://pattern=www.example.com/path2/test
```

- Accessing `https://www.example.com/path` returns the content of `/User/xxx/index2.html`
    > Without the `www.example.com/path skip://operation=file:///User/xxx/index1.html` rule, the content of `/User/xxx/index1.html` would be returned.
- Accessing `https://www.example.com/path2/test` returns the content of `/User/xxx/test2.html`
    > Without The `www.example.com/path2/test skip://pattern=www.example.com/path2/test` rule will return the content of `/User/xxx/test1.html`.

Similar protocol: [ignore](./ignore)
