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
> Default `path=/`

## Configuration Example
#### Inline Mode
```` txt
www.example.com/path resCookies://k1=v1&k2=v2
````
Add two response cookies to the response header: `k1: v1`/`k2: v2`

### Inline Mode
```` txt
``` cookies.json
key1: value1
key2: value2
```
# Or
``` cookies.json
{
key1: 'value1',
key2: 'value2'
}
```
www.example.com/path resCookies://{cookies.json}
````
Add two response cookies to the response header: `key1: value1` / `key2: value2`

#### Local/Remote Resources

```` txt
www.example.com/path1 resCookies:///User/xxx/test.json
www.example.com/path2 resCookies://https://www.xxx.com/xxx/params.json
# Editing a temporary file
www.example.com/path3 resCookies://temp/blank.json
````

## Associated Protocols
1. Delete the response cookie: [delete://resCookies.xxx](./delete)
2. Delete all response header cookies: [delete://resHeaders.set-cookie](./delete)
