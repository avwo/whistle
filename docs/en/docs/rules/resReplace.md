# resReplace
Replaces the response body content using a method similar to JavaScript's `String.replace()` (only valid for requests with a response body, such as `200` and `500`). Supports multiple text formats:
- JSON (`application/json`)
- XML (`application/xml`)
- HTML (`text/html`)
- Plain text (`text/xxx`)

## Rule Syntax
``` txt
pattern resReplace://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match against the request URL | [Match Pattern Documentation](./pattern) |
| value | Replacement configuration object, supported from the following sources: <br/>• Directory/file path<br/>• Remote URL<br/>• Inline/embedded/Values content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters, supporting matching: • Request URL/Method/Header/Content • Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example

#### Inline Mode
```` txt
www.example.com/path file://(00user-11test-22user-33test) resReplace://user=abc&/\d+/g=number
````
Request `https://www.example.com/path/to`, browser receives:
``` txt
numberabc-numbertest-numberabc-numbertest
```

### Inline Mode
```` txt
``` resReplace.json
user: name
/\d+/g: num
```
# or (note the escape character)
``` resReplace.json
{
  'user': 'name',
  '/\\d+/g': 'num'
}
```
www.example.com/path file://(00user-11test-22user-33test) resReplace://{resReplace.json}
````
Request `https://www.example.com/path/to` Content received by the browser:
``` txt
numname-numtest-numname-numtest
```

#### Local/Remote Resources

```` txt
www.example.com/path1 resReplace:///User/xxx/test.json
www.example.com/path2 resReplace://https://www.xxx.com/xxx/params.json
# Editing a temporary file
www.example.com/path3 resReplace://temp/blank.json
````

## Relationship Protocol
1. Object Merge: [resMerge](./resMerge)
2. Completely replace: [resBody](./resBody)
