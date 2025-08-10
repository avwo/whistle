# reqBody
Replaces the content body of the specified request (only valid for requests with a content body, such as `POST` and `PUT`).
> ⚠️ Note: GET, HEAD, and other requests without a content body are not affected.

## Rule Syntax
``` txt
pattern reqBody://value [filters...]
```
| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | An expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Text or binary content. The following types are supported: <br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching: <br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filters Documentation](./filters) |

## Configuration Example
#### Inline Method
``` txt
www.example.com/path reqBody://(Hello) method://post
```
Requesting `https://www.example.com/path/to` will result in the request body becoming `Hello`.

#### Inline/Values Method
```` txt
``` body.txt
Hello world.
```
www.example.com/path reqBody://{body.txt} method://post
````
Requesting `https://www.example.com/path/to` will result in the request body becoming `Hello world.`.

#### Local/Remote Resources

```` txt
www.example.com/path1 reqBody:///User/xxx/test.txt
www.example.com/path2 reqBody://https://www.xxx.com/xxx/params.txt
# Editing a Temporary File
www.example.com/path3 reqBody://temp/blank.txt
````

## Associated Protocols
1. Inject content before the request: [reqPrepend](./reqPrepend)
2. Append content after the request: [reqAppend](./reqAppend)
3. Replace the response content: [reqBody](./reqBody)
