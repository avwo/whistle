# method
Modify the request method.

## Rule Syntax
``` txt
pattern method://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Request method name such as `get`/`post`/`head` (case-insensitive) | |
| filters | Optional filters, supporting matching: <br/>• Request URL/Method/Header/Content <br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Visit `https://www.example.com/path/to` and see the request method as `POST` on the Whistle packet capture interface.
www.example.com/path method://post

# Modify a method with a filter
www.example.com/path2 method://patch includeFilter://reqH.content-type=multipart/form-data
```
