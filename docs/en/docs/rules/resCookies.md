#resCookies
Modify response `Cookies`.

## Rule Syntax
``` txt
pattern resCookies://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match request URLs | [Match Pattern Documentation](./pattern) |
| value | Cookie object, supported from the following channels:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supported for matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

Cookie Object Structure
``` js
{
  "key1": "value1",
  "key2": "value2",
  "keyN": {
          "value": "value1",
          "maxAge": 60,
          "httpOnly": true,
          "path": "/",
          "secure": true,
          "domain": ".example.com",
          "sameSite": 'None',
          "Partitioned": false
      }
}
```
## Configuration Example

#### Inline Mode

```` txt
www.example.com/path resCookies://k1=v1&k2=v2;path=/&k3=v3;path=/;secure;samesite=none
```` 

Adds two cookies to the response header: `k1=v1`/`k2=v2; path=/`/`k3=v3; path=/; secure; samesite=none`

### Embedded Mode

```` txt
``` cookies.json
key1: value1
key2: value2
```
# Or
``` cookies.json
{
  key1: 'value1',
  key2: {
    value: 'value2',
    path: '/',
    secure: true,
    domain: 'example.com'
  }
}
``` 
www.example.com/path resCookies://{cookies.json}

````

Add two response cookies to the response header: `key1=value1`/`key2=value2; path=/; secure; domain=example.com`

#### Local/Remote Resources

```` txt
www.example.com/path1 resCookies:///User/xxx/test.json
www.example.com/path2 resCookies://https://www.xxx.com/xxx/params.json

# By editing the temporary file
www.example.com/path3 resCookies://temp/blank.json

````

## Global Replacement

To add `SameSite=Nonoe; Secure` to all (or some) response cookies, you can use [headerReplace](./headerReplace)

> Assuming each response cookie has `path=/;`

```` txt
``` test.json
resH.set-cookie:path=/;: SameSite=None; Secure;
``` 
www.example.com/path headerReplace://{test.json} resCookies://test=123;path=/;

````

## Association Protocol

1. Delete response cookie: [delete://resCookies.xxx](./delete)
2. Delete all response header cookies: [delete://resHeaders.set-cookie](./delete)
3. Replace response header cookies: [headerReplace://resH.set-cookie:pattern=replacement](./headerReplace)

