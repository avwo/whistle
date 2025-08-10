# resCharset
Modify the `charset` portion of the `content-type` response header to set the encoding of the response content.
> `content-type` structure:
> ``` txt
> <media-type>; charset=<encoding>
> ```

## Rule Syntax
``` txt
pattern resCharset://encoding [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| encoding | Encoding name, such as `utf8` <br/>• Inline/Embedded/Values content<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Set response encoding and response header `content-type` Empty fields are changed to `; charset=utf8`
www.example.com/path resCharset://utf8

# Set the response encoding. The empty `content-type` response header field is changed to `text/html; charset=utf8`
www.example.com/path resType://json resCharset://utf8
```

## Associated Protocols
1. Directly modify the response header: [resHeaders://content-type=xxx](./reqHeaders)
2. Modify the response content encoding: [resType://media-type](./resCharset)
