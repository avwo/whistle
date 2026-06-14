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

## Associated Protocols {#related}

1. Inject content before the response content (`Prepend To Body`): [resPrepend](./resPrepend)  
2. Inject HTML content before the response content (`Prepend HTML To Body`, response type must be `text/html`): [htmlPrepend](./htmlPrepend)  
3. Inject CSS content before the response content (`Prepend CSS To Body`, response type must be `text/html` or `text/css`): [cssPrepend](./cssPrepend)  
4. Inject JS content before the response content (`Prepend JS To Body`, response type must be `text/html`, `text/css`, or `application/javascript`): [jsPrepend](./jsPrepend)  
5. Replace the response content (`Replace Body`): [resBody](./resBody)  
6. Replace the response content with HTML content (`Replace Body`, response type must be `text/html`): [htmlBody](./htmlBody)  
7. Replace the response content with CSS content (`Replace Body`, response type must be `text/html` or `text/css`): [cssBody](./cssBody)  
8. Replace the response content with JS content (`Replace Body`, response type must be `text/html`, `text/css`, or `application/javascript`): [jsBody](./jsBody)  
9. Append content after the response content (`Append To Body`): [resAppend](./resAppend)  
10. Append HTML content after the response content (`Append HTML To Body`, response type must be `text/html`): [htmlAppend](./htmlAppend)  
11. Append CSS content after the response content (`Append CSS To Body`, response type must be `text/html` or `text/css`): [cssAppend](./cssAppend)  
12. Append JS content after the response content (`Append JS To Body`, response type must be `text/html`, `text/css`, or `application/javascript`): [jsAppend](./jsAppend)  
13. Replace the response content using keywords or regular expressions (`Modify Body Text`): [resReplace](./resReplace)  
14. Override JSON/Form objects in the response content (`Modify Form/JSON`): [resMerge](./resMerge)  
15. Delete a property from a JSON/Form object in the response content (`Delete Form/JSON`): [delete://resBody.xxx](./delete)
