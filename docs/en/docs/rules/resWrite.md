# resWrite
Saves the response body to a specified directory or file. Suitable for scenarios where response data needs to be recorded:
- Automatically generates a file path based on the request URL
- Uses a safe write policy (can be forced to overwrite using [enable://forceReqWrite](./enable))
- Valid only for requests with a response body (POST/PUT/PATCH, etc.)
- Automatically skips requests without a response body, such as GET/HEAD
- Automatically skips if saving fails

## Rule Syntax
``` txt
pattern resWrite://fileOrDirPath [filters...]
```

| Parameters | Description | Detailed Documentation |
| ------- | ------------------------------------------------------------ | ------------------------- |
| pattern | Expression to match the request URL | [Match Pattern Documentation](./pattern) |
| fileOrDirPath | Directory or file path to store data | |
| filters | Optional filters, supporting matching:<br/>• Request URL/Method/Header/Content<br/>• Response Status Code/Headers | [Filter Documentation](./filters) |

## Configuration Example

#### Basic Configuration
```txt
wproxy.org/docs resWrite:///User/xxx/test
```
##### Path Resolution Rules:
1. **When Accessing a Specific File**

    `https://wproxy.org/docs/test.html`

    → Save to: `/User/xxx/test/test.html`

1. **When Accessing a Directory Path**

    `https://wproxy.org/docs/`

    → Automatically Recognizes as a Directory (Based on the Trailing `/` or `\`)
    
    → Saves to: `/User/xxx/test/index.html`

#### Explicit Directory Configuration
```txt
wproxy.org/docs/ resWrite:///User/xxx/test
```
##### Differences in Path Resolution:
1. **When accessing a sub-directory**

    `https://wproxy.org/docs/test.html`

    → Still saved to: `/User/xxx/test/test.html`

1. **When accessing a configuration directory**

    `https://wproxy.org/docs/`

    → Saved directly to: `/User/xxx/test` (as a whole file)

> 💡 Key Differences:
> - Whether the rule path ends with `/` or `\` determines how directory requests are saved.
> - Non-directory paths (without a trailing `/` or `\`) are automatically completed to `index.html`
> - Directory paths (with a trailing `/` or `\`) are saved directly to the specified file.

#### Specifying a File
``` txt
/^https://wproxy\.org/docs/(\?.*)?$ resWrite:///User/xxx/test/index.html
```
> Limiting the request URL using regular expression matching

## Associated Protocols
1. Enable forced writes: [enable://forceReqWrite](./enable)
2. Write all response content: [resWriteRaw](./resWriteRaw)
