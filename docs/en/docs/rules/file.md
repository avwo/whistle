# file
Use a local file to respond to requests. Suitable for:
- Setting up a local development environment
- Debugging local front-end pages
- Interface mock scenarios

## Rule Syntax
``` txt
pattern file://value [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| value | Operation content. Supports the following types:<br/>• Directory/File Path<br/>• Remote URL<br/>• Inline/Embedded/Values Content | [Operation Instruction Documentation](./operation) |
| filters | Optional filters. Supports matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Header | [Filter Documentation](./filters) |

## Replace a Local File
``` txt
# Basic Usage
www.example.com/path file:///User/xxx/test

# Windows path
www.example.com/path file://D:\test

# Exclude specific interfaces
www.example.com/path file:///User/xxx/test excludeFilter://*/path/cgi

# Match based on request content
www.example.com/path file:///User/xxx/test includeFilter://b:/"cmdname":\s*"test"/i
```
**Feature Description:**
- Automatic path concatenation: Accessing `https://www.example.com/path/x/y/z` will map to `/User/xxx/test/x/y/z`
- Disable path concatenation: Use `< >` to wrap the path
  ``` txt
  www.example.com/path file://</User/xxx/test>
  ```
  > Accessing `https://www.example.com/path/x/y/z` will only automatically load the file corresponding to `/User/xxx/test`

## Quick Replacement
If working with local files is inconvenient, you can also use Whistle's Inline/Embedded/Values functionality to set the response content through the interface:
```` txt
# Inline values cannot contain spaces
www.example.com/path file://({"ec":0})

# Embedded values (spaces and line breaks are allowed)
``` test.json
{
  "ec": 2,
  "em": "error"
}
```
www.example.com/path file://{test.json}
````
> `test.json` If the content is large, place it in Values.

## Replacing a Temporary File
If the content is large and working with local files is inconvenient, you can use Whistle's temporary file functionality:
``` txt
www.example.com/path file://temp/blank.html
```
**Steps:**
1. Hold down `Command (Mac)`/`Ctrl (Win)`
2. Click in the rule `file://temp/blank.html`
3. Enter the response content in the pop-up editor.

## Mock JSONP
```` txt
www.example.com/path file://`(${query.callback}({"ec":0}))` # Inline values cannot contain spaces

# Inline values (spaces and newlines are allowed)
``` test.json
${query.callback}({
"ec": 2,
"em": "error"
})
```
www.example.com/path file://`{test.json}`
````

Template strings do not work directly in the following scenarios:
- When referencing a local file path
- When referencing a remote URL

When encountering the above limitations, you can use the [tpl](./tpl) function as an alternative.

## Advanced Usage
**Multi-Directory Search:**
``` txt
www.example.com/path file:///path1|/path2|/path3
```

**Search Logic:**
1. Check in order: /path1/x/y/z → /path2/x/y/z → /path3/x/y/z
2. Return immediately if the first existing file is found
3. Return `404` if all files are not found

## Associated Protocols
1. To allow requests for unmatched files to continue normally, use: [xfile](./xfile)
2. To replace the remote URL with another one, use: [https](./https) or [http](./http) or [host](./host) (<del>`file://https://xxx`</del> is not recommended)
