# attachment
Setting the `content-disposition` response header field allows the request to be directly converted to a download.
Similar to Koa's `attachment` method: https://koajs.com/

## Rule Syntax
``` txt
pattern attachment://filename [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| filename | The name of the file to be displayed after downloading, such as `test.txt` <br/>• Inline/Embedded/Values content<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
https://www.example.com/ attachment://example.html
```

Browser Access `https://www.example.com/` automatically downloads the `example.html` file.

## Associated Protocols
1. Directly modify the request header: [resHeaders://content-disposition=attachment;filename="example.html"](./resHeaders)

