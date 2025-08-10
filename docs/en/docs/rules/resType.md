#resType
Modify the `media-type` and `charset` components of the `content-type` response header.
> `content-type` structure:
> ``` txt
> <media-type>; charset=<encoding>
> ```

## Rule Syntax
``` txt
pattern resType://type[;charset] [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| type[;charset] | `type` Response type, `charset` encoding <br/>• Inline/embedded/Values content<br/>⚠️ Loading data from files/remote URLs is not supported | |
| filters | Optional filters, supports matching: <br/>• Request URL/method/header/content<br/>• Response status code/header | [Filter Documentation](./filters) |

`resType` is mainly used to modify the `media-type` response type. The `charset` part is optional. If the `charset` part is not set, the original `charset` part of the response header (if present) will be retained.

## Configuration Example

#### Shortcut Commands (Strings without `/`)
> Automatically convert based on [mime](https://github.com/broofa/mime).lookup(type)
``` txt
# The `content-type` response header without encoding becomes `text/html`
www.example.com/path resType://html

# The `content-type` response header with encoding becomes `application/json;charset=utf8`
www.example.com/path resType://json;charset=utf8
```

#### Full Type
``` txt
# The `content-type` response header becomes `text/plain`
www.example.com/path resType://text/plain

# The `content-type` response header becomes `text/plain;charset=utf8`
www.example.com/path resType://text/plain;charset=utf8
```

## Associated Protocols
1. Modify the response headers directly: [resHeaders://content-type=xxx](./reqHeaders)
2. Modify the response content encoding: [resCharset://encoding](./reqCharset)
