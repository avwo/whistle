# delete
Used to delete the request URL, request/response headers, and request/response content.

## Rule Syntax
``` txt
pattern delete://prop1|prop2|... [filters...]

# Equivalent to:
pattern delete://prop1 delete://prop2 ... [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | `urlParams`: Delete all request parameters. <br/>`urlParams.xxx`: Delete `xxx` parameters from the URL. <br/>`reqHeaders.xxx`: Delete `xxx` fields from the request header. <br/>`resHeaders.xxx`: Delete `xxx` fields from the response header. <br/>`reqBody`: Delete all request content. <br/>`resBody`: Delete all response content. <br/>`reqBody.xxx.yyy`: Deletes `xxx.yyy` fields in the request body that are of form or JSON type. `resBody.xxx.yyy`: Deletes `xxx.yyy` fields in the response body that are of JSONP or JSON type. `reqType`: Deletes the type in the `content-type` request header, excluding any charset. `resType`: Deletes the type in the `content-type` response header, excluding any charset. `reqCharset`: Deletes any charset in the `content-type` request header. `resCharset`: Deletes any charset in the `content-type` response header. `reqCookies.xxx`: Deletes cookies named `xxx` in the request header. `resCookies.xxx`: Deletes cookies named `xxx` in the response header. | |
| filters | Optional filters, supports matching: <br/>• Request URL/Method/Headers/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example
``` txt
https://www.example.com/path delete://reqCookies.token|resCookies.token

https://raw.githubusercontent.com/avwo/whistle/refs/heads/master/package.json delete://resBody.name resType://json
```
The above cookie deletion operation only affects cookies during the request/response process and does not modify cookies stored locally in the browser. To modify browser-persistent cookies, you can use the following methods:
- Deleting cookies by injecting JavaScript using [jsPrepend](./jsPrepend)
- Setting cookie expiration times using [resCookies](./resCookies)
