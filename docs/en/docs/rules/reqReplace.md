# reqReplace
Replaces the request body content using a method similar to JavaScript's `String.replace()` (only valid for requests with a body, such as `POST` and `PUT`). Supports multiple text formats:
- Form data (`application/x-www-form-urlencoded`)
- JSON (`application/json`)
- XML (`application/xml`)
- HTML (`text/html`)
- Plain text (`text/xxx`)

## Rule Syntax
``` txt
pattern reqReplace://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Replacement configuration object, supported from the following sources:<br/>• Directory/file path<br/>• Remote URL<br/>• Inline/embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example

#### Inline Mode
```` txt
www.example.com/path reqBody://(00user-11test-22user-33test) reqReplace://user=abc&/\d+/g=number reqType://txt method://post
````
Request `https://www.example.com/path/to`. The backend receives the following request:
``` txt
numberabc-numbertest-numberabc-numbertest
```

### Inline Mode
```` txt
``` reqReplace.json
user: name
/\d+/g: num
```
# or (note the escape characters)
``` reqReplace.json
{
  'user': 'name',
  '/\\d+/g': 'num'
}
```
www.example.com/path reqBody://(00user-11test-22user-33test) reqReplace://{reqReplace.json} reqType://txt method://post
````
Request `https://www.example.com/path/to` The request content received by the backend is:
``` txt
numname-numtest-numname-numtest
```

#### Local/Remote Resources

```` txt
www.example.com/path1 reqReplace:///User/xxx/test.json
www.example.com/path2 reqReplace://https://www.xxx.com/xxx/params.json
# Editing a temporary file
www.example.com/path3 reqReplace://temp/blank.json
````

## Association Protocol
1. Object Merge: [reqMerge](./reqMerge)
2. Complete Replacement: [reqBody](./reqBody)
