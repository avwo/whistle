# reqType
Modify the `media-type` and `charset` parts of the `content-type` request header.
> `content-type` structure:
> ``` txt
> <media-type>; charset=<encoding>
> ```

## Rule Syntax
``` txt
pattern reqType://type[;charset] [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| type[;charset] | `type` request type, `charset` encoding <br/>• Inline/embedded/Values content<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supports matching: <br/>• Request URL/method/header/content<br/>• Response status code/header | [Filter Documentation](./filters) |

`reqType` is mainly used to modify the request type The `media-type` part, the `charset` part is optional. If the `charset` part is not set, the original `charset` part of the request (if present) will be retained.

## Configuration Example

#### Shortcut Commands (Strings without `/`)
- `urlencoded`: `application/x-www-form-urlencoded`
- `form`: `application/x-www-form-urlencoded`
- `json`: `application/json`
- `xml`: `application/xml`
- `text`: `text/plain`
- `upload`: `multipart/form-data`
- `multipart`: `multipart/form-data`
- Other: [mime](https://github.com/broofa/mime).lookup(type)

``` txt
# Without encoding, the `content-type` request header becomes `application/x-www-form-urlencoded`
www.example.com/path reqType://form

# With encoding, the `content-type` request header becomes `application/json;charset=utf8`
www.example.com/path reqType://json;charset=utf8
```
#### Complete Type
``` txt
# Change the `content-type` in the request header to `text/plain`
www.example.com/path reqType://text/plain

# Change the `content-type` in the request header to `text/plain;charset=utf8`
www.example.com/path reqType://text/plain;charset=utf8
```

## Associated Protocols
1. Directly modify the request header: [reqHeaders://content-type=xxx](./reqHeaders)
2. Modify the request content encoding: [reqCharset://encoding](./reqCharset)
