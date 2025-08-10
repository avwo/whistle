# resWriteRaw
Saves the complete response content (including protocol, status code, status information, response headers, and content) to a specified directory or file. This method is suitable for scenarios where response data needs to be recorded:
- Automatically generates a file path based on the request URL
- Uses a safe write policy (can be forced to overwrite using [enable://forceReqWrite](./enable))
- Only valid for requests with a response body (POST/PUT/PATCH, etc.)
- Automatically skips requests without a response body, such as GET/HEAD
- Automatically skips if saving fails

## Rule Syntax
``` txt
pattern resWriteRaw://fileOrDirPath [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| fileOrDirPath | Directory or file path to store data | |
| filters | Optional filters, supporting matching: • Request URL/Method/Headers/Content • Response Status Code/Headers | [Filters Documentation](./filters) |

## Configuration Example

#### Basic Configuration
```txt
wproxy.org/docs resWriteRaw:///User/xxx/test/
```
##### Path Resolution Rules:
1. **When accessing a specific file**

    `https://wproxy.org/docs/test.html`

    → Save to: `/User/xxx/test/test.html`

2. **When accessing a directory path**

    `https://wproxy.org/docs/`

    → Save to: `/User/xxx/test/index.html` (The target path is `/User/xxx/test/`, and a trailing `/` or `\` automatically appends `index.html`)

#### Explicit Directory Configuration
```txt
wproxy.org/docs/resWriteRaw:///User/xxx/test/
```
##### Path Resolution Differences:
1. **When Accessing a Sub-Path**

    `https://wproxy.org/docs/test.html`

    → Still Saved to: `/User/xxx/test/test.html`

2. **When Accessing a Configuration Directory**

    `https://wproxy.org/docs/`

    → Saved Directly to: `/User/xxx/test/` (as a Whole File)

> 💡 Key Differences:
> - Whether the rule path ends with `/` or `\` determines how directory requests are saved
> - Non-directory paths (without a trailing `/` or `\`) are saved directly to the specified file
> - Directory paths (with a trailing `/` or `\`) are automatically completed to `index.html`

#### Specified Files
``` txt
/^https://wproxy\.org/docs/(\?.*)?$ resWriteRaw:///User/xxx/test/index.html
```
> Limit the request URL using regular expression matching

## Associated Protocols
1. Enable force write: [enable://forceReqWrite](./enable)
2. Write only the response body: [resWrite](./resWrite)
