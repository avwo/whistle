# resBody
Replaces the response body of the specified request (only valid for status codes with a response body, such as `200`/`500`).
> ⚠️ Note: 204, 304, and other requests without a response body are not affected.

## Rule Syntax
``` txt
pattern resBody://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. Supports the following types: <br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching: <br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path resBody://(Hello)
```
Requesting `https://www.example.com/path/to` will result in the response content becoming `Hello`.

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path resBody://{body.txt}
````
Requesting `https://www.example.com/path/to` will result in the response content becoming `Hello world.`.

#### Local/Remote Resources

```` txt
www.example.com/path1 resBody:///User/xxx/test.txt
www.example.com/path2 resBody://https://www.xxx.com/xxx/params.txt
# Editing a Temporary File
www.example.com/path3 resBody://temp/blank.txt
````

## Associated Protocols
1. Prepend the response: [resPrepend](./resPrepend)
2. Append the response: [resAppend](./resAppend)
3. Replace the request body: [reqBody](./reqBody)
