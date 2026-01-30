# file

The `file` protocol is used to map requests to the local file system, returning the content of local files as responses to the client. It is suitable for the following scenarios:

- **Setting up a local development environment**: Quickly set up a local development server.
- **Debugging local front-end pages**: Directly debug local HTML, CSS, and JavaScript files.
- **API Mocking scenarios**: Use local JSON files to simulate API responses.
- **Static resource serving**: Use a local directory as a static resource server.

## Rule Syntax

The `file` protocol supports multiple ways to specify local file content:

### 1. Inline Value (Direct Specification)
Write the content to be returned directly in the rule, suitable for short text content. Note: `value` cannot contain spaces or line breaks.

```txt
pattern file://(value) [lineProps...] [filters...]
```

**Example:**
```txt
www.example.com/api/data file://({"status":"ok"})
```

**Note: Inline values must be wrapped in parentheses `()`; otherwise, they will be interpreted as local file paths, which may lead to 404 errors:**
```txt
# Correct: Returns the string "success"
pattern file://(success)

# Incorrect: Will be treated as a path, potentially causing 404
pattern file://success
```

> **Key points about the inline value syntax of the file protocol**:
> - Must use `()` to wrap the content.
> - Content cannot contain spaces or line breaks.
> - Can be a string, JSON, HTML fragment, etc.
> - Without `()`, Whistle will interpret it as a file path or `{key}` and attempt to load the corresponding file or key value.

### 2. Embedded Value (Using Code Block)
This method is recommended when dealing with complex content containing spaces, line breaks, or when you want to reuse a configuration.

````txt
pattern file://{custom-key.json} [lineProps...] [filters...]

``` custom-key.json
{
  "status": "success",
  "data": {
    "message": "Hello from local file"
  }
}
```
````

**Best Practice**: It is recommended to add a response type suffix (e.g., `.json`, `.html`, `.css`) to the `key`. Whistle will automatically set the correct `Content-Type` based on the suffix.

### 3. Referencing a Value from the Values Panel
When the content is large, you can store it in the `Values` configuration area.

```txt
pattern file://{key-of-values.html} [lineProps...] [filters...]
```

**Prerequisite**: A key named `key-of-values.html` with the content to be returned as its value must exist in `Values`.

**Capacity Recommendations**:
- Content less than 2KB: Recommended to use inline or embedded methods.
- Content between 2KB and 200KB: Recommended to store in `Values`.
- Content larger than 200KB: Recommended to use local files.

### 4. Loading from a Temporary File
Use Whistle's temporary file feature when content needs frequent editing.

```txt
pattern file://temp.html
```

**Steps:**
1. In the Rules editor, hold down `Command` (Mac) / `Ctrl` (Windows).
2. Click with the mouse on `file://temp.html`.
3. Enter the response content in the pop-up editing dialog.
4. Click `Save` to save.

After saving, the rule will automatically change to a format similar to this:
```txt
https://example.com/report file://temp/11adb9c9e1142df67b30d7646ec59bcd34c855d9011d1a2405c7fc2dfc94568d.html
```

To edit again, click the temporary file link in the same way.

### 5. Loading from a File Path or Remote URL
Load the response content from the local file system or a remote URL.

```txt
# Load from a local file
pattern file:///User/xxx/test.html

# Load from a remote URL
pattern file://https://example.com/template.html
```

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **value** | Yes | The file content or path to return, supporting multiple formats:<br>• Local file or directory path<br>• Remote URL<br>• Inline, embedded, Values references |
| **lineProps** | No | Sets additional properties for the rule.<br>**Examples**:<br>• `lineProps://important`: Increase rule priority.<br>• `lineProps://weakRule`: When both [file](./file) and [proxy](./proxy) rules are configured, the [proxy](./proxy) rule will be disabled by default. This property can increase the priority of the [proxy](./proxy) rule.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

## Configuration Examples

### 1. Basic File Path Mapping
```txt
# Map a domain to a local directory
www.example.com/path file:///Users/username/projects/my-site

# Windows system path
www.example.com/path file://D:\projects\my-site
```

**Feature Description**:
- **Automatic path concatenation**: Accessing `https://www.example.com/path/x/y/z` will map to `/Users/username/projects/my-site/x/y/z`.
- **Disable path concatenation**: Use `< >` to wrap the path to disable automatic concatenation.
    ```txt
    www.example.com/path file://</Users/username/projects/my-site/index.html>
    ```
    > Accessing `https://www.example.com/path/x/y/z` will only return the file `/Users/username/projects/my-site/index.html`.

### 2. JSONP Interface Mocking
````txt
# Inline method
www.example.com/jsonp file://`(${query.callback}({"status":"ok"}))`

# Embedded method
``` jsonp-response
${query.callback}({
  "status": "error",
  "message": "Invalid parameter"
})
```
www.example.com/jsonp file://`{jsonp-response}`
````

> **Template String Limitations**: Template strings cannot take effect directly in the following scenarios:
> - When referencing local file paths.
> - When referencing remote URLs.
> 
> When encountering these limitations, you can use the [tpl](./tpl) protocol as an alternative.

### 3. Using with Filters
```txt
# Exclude specific interfaces
www.example.com/api/path file:///Users/username/mock-data excludeFilter://*/api/auth

# Match based on request body content
www.example.com/api/search file:///Users/username/search-results.json includeFilter://b:/"type":\s*"advanced"/i

# Only match POST requests
www.example.com/api/submit file:///Users/username/success.json includeFilter://m:POST
```

### 4. Multi-directory Search
```txt
# Multiple files or directories separated by `|`
www.example.com/static/path file:///path/to/project1|/path/to/project2|/path/to/project3
```

**Search Logic**:
1. Check each directory in order:
   - `/path/to/project1/static/file.js`
   - `/path/to/project2/static/file.js`
   - `/path/to/project3/static/file.js`
2. Return the first existing file found.
3. If none are found, return `404 Not Found`.

## Advanced Usage

### Dynamic Path Handling
```txt
# Use regex capture groups
/^https?://www\.example\.com/user/(\d+)/profile file:///Users/username/mock/profiles/user-$1.json

# If not limited to numbers, you can use wildcards
^www.example.com/user/*/profile file:///Users/username/mock/profiles/user-$1.json
```

### Environment-Specific Configuration
````txt
``` dev-config
{
  "apiBase": "http://localhost:3000",
  "debugMode": true
}
```

``` prod-config
{
  "apiBase": "https://api.example.com",
  "debugMode": false
}
```

# Determine if it's a development environment via cookie: env=dev
www.example.com/config file://{dev-config} includeFilter://reqH:cookie=/env=dev/
www.example.com/config file://{prod-config} # Default production environment
````

### Combining with Other Protocols
```txt
# First use file to provide static files, then set response headers
www.example.com file:///Users/username/static-files cache://3600

# For non-existent files, use xfile to allow the request to continue
www.example.com xfile:///Users/username/static-files
```

## Differences from resBody

The main distinctions between the `file` protocol and the [`resBody`](./resBody) protocol lie in the request processing flow and response mechanism:

**`file` Protocol:**
- **Request Flow**: Requests matching the `file` protocol are **not sent to the backend server**.
- **Response Mechanism**: Directly returns the content of the specified file with a 200 status code.
- **Network Overhead**: Zero network latency; entirely processed locally.

**Diagram:**
```
Client Request → Whistle (matches file rule) → Reads Local File → Returns Response (200)
                        ↓
                  (Not sent to server)
```

**`resBody` Protocol:**
- **Request Flow**: The request **is first sent to the backend server** to obtain the original response.
- **Response Mechanism**: After receiving the server's response, **replaces** the original response body with the specified content.
- **Network Overhead**: Includes a complete request-response network round trip.

**Diagram:**
```
Client Request → Whistle → Sends to Server → Receives Original Response → Replaces Response Body → Returns Modified Response
```

## Related Protocols

1. **Allow unmatched files to continue access**: [xfile](./xfile)
   - When a local file does not exist, allow the request to continue to the original server.
   - Suitable for development scenarios with static resource servers.

2. **Replace with remote URL content**: [https](./https) or [http](./http)
   - Use content from a remote server as the response.
   - Note: It is not recommended to use the form `file://https://xxx`.

3. **Domain resolution redirection**: [host](./host)
   - Modify domain name resolution to direct requests to a specified IP.

4. **Template rendering**: [tpl](./tpl)
   - Supports more complex template rendering and dynamic content generation.

## Notes

### Path Handling
1. **Relative paths**: Except for rules inside plugins, it is not recommended to use relative paths. Relative paths are relative to the directory where the Whistle configuration file is located.
2. **Absolute paths**: System absolute paths are supported.
3. **User directory**: `~` is supported to represent the user's home directory.
4. **Windows paths**: Mixing `/` and `\` as path separators is supported.

### File Encoding
1. **Text files**: UTF-8 encoding is used by default.
2. **Encoding issues**: If you encounter garbled characters, check the actual encoding format of the file.

## Troubleshooting

### Q: File Not Found (404)
**A:** Check:
1. Whether the file path is correct.
2. Whether the file exists and has read permissions.
3. Whether `< >` was used to disable path concatenation.

### Q: Garbled Characters
**A:** Check:
1. The actual encoding format of the file.
2. Whether the `Content-Type` response header is correct.
3. Whether the file content contains illegal characters.

### Q: Rule Not Taking Effect
**A:** Check:
1. Whether the rule pattern matches correctly.
2. Whether other rules are overriding it.
3. Whether the filter conditions are met.

### Q: Template Strings Not Taking Effect
**A:** Check:
1. Whether template strings are used in file path or remote URL scenarios.
2. If so, use the [tpl](./tpl) protocol instead.

## Further Reading

- [Matching Pattern Documentation](./pattern): Learn more about URL matching rules.
- [Operation Commands Documentation](./operation): Learn about multiple ways to load content.
- [Additional Configuration](./lineProps): Learn more about special features.
- [Filters](./filters): Learn more about filter functionalities.
