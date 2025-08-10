# reqCharset
Modify the `charset` portion of the `content-type` request header to set the encoding of the request content.
> `content-type` structure:
> ``` txt
> <media-type>; charset=<encoding>
> ```

## Rule Syntax
``` txt
pattern reqCharset://encoding [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| encoding | Encoding name, such as `utf8` <br/>• Inline/Embedded/Values content<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
``` txt
# Set request encoding, request header `content-type` Empty fields are changed to `; charset=utf8`
www.example.com/path reqCharset://utf8

# Set the request encoding. The empty `content-type` request header field is changed to `text/html; charset=utf8`
www.example.com/path resType://json reqCharset://utf8
```

## Associated Protocols
1. Directly modify the request header: [reqHeaders://content-type=xxx](./reqHeaders)
2. Modify the request content encoding: [reqType://media-type](./reqCharset)
