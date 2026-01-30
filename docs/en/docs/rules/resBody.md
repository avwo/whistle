# resBody

The `resBody` protocol is used to replace the response body of a specified request. It only takes effect on status codes that include a response body (such as `200`, `500`, etc.).

> **Effective Condition**: Only takes effect on status codes with a response body.
> 
> ⚠️ Note: Requests without a response body, such as `204`, `304`, are not affected.

## Rule Syntax

`resBody` supports multiple ways to specify the response content to replace:

### 1. Inline Value (Direct Specification)
Write the content to replace directly in the rule, suitable for short text content.

```txt
pattern resBody://(value) [lineProps...] [filters...]
```

**Example:**
```txt
www.example.com/api/data resBody://({"status":"modified"})
```

### 2. Embedded Value (Using Code Block)
This method is recommended when dealing with complex content containing spaces, line breaks, or when you want to reuse a configuration.

````txt
pattern resBody://{custom-key.json} [lineProps...] [filters...]

``` custom-key.json
{
  "status": "success",
  "data": {
    "message": "This response was modified by resBody"
  }
}
```
````

### 3. Referencing a Value from the Values Panel
When the content is large, you can store it in the `Values` configuration area.

```txt
pattern resBody://{key-of-values.html} [lineProps...] [filters...]
```

**Prerequisite**: A key named `key-of-values.html` with the content to replace as its value must exist in `Values`.

### 4. Loading from a File Path or Remote URL
Load the response content to replace from a local file or remote URL.

```txt
# Load from a local file
pattern resBody:///User/xxx/test.txt

# Load from a remote URL
pattern resBody://https://www.example.com/override-content.txt
```

### 5. Loading from a Temporary File
Use Whistle's temporary file feature when content needs frequent editing.

```txt
pattern resBody://temp/blank.txt
```

**Steps:**
1. In the Rules editor, hold down `Command` (Mac) / `Ctrl` (Windows).
2. Click with the mouse on `resBody://temp/blank.txt`.
3. Enter the replacement content in the pop-up editing dialog.
4. Click `Save` to save.

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **value** | Yes | The response content to replace, supporting multiple formats:<br>• Local file path<br>• Remote URL<br>• Inline, embedded, Values references |
| **lineProps** | No | Sets additional properties for the rule.<br>• Example: `lineProps://important` can increase this rule's priority.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

## Configuration Examples

### Basic Examples
```txt
# Replace API response content
www.example.com/api/data resBody://({"status":"custom","data":"modifiedContent"})
```

### Using Embedded Values
````txt
``` error-response
{
  "error": {
    "code": 1001,
    "message": "Custom error message for testing"
  }
}
```

www.example.com/api resBody://{error-response} includeFilter://s:500
````

### Loading from a File
```txt
# Load replacement content from a local file
www.example.com/api/config resBody:///Users/username/mock/config.json

# Load replacement content from a remote URL
www.example.com/api/data resBody://https://raw.githubusercontent.com/user/repo/main/mock-data.json
```

### Using Temporary Files
```txt
www.example.com/api/user resBody://temp/blank.json
```
> In the Rules editor, hold down `Command` (Mac) / `Ctrl` (Windows) and click on `resBody://temp/blank.json` with the mouse to edit.

### Using with Filters
```txt
# Replace only responses with a specific status code
www.example.com/api resBody://({"error":"ServiceUnavailable"}) includeFilter://s:503

# Determine replacement content based on request method
www.example.com/api/users resBody://({"method":"GEToverride"}) includeFilter://m:GET
www.example.com/api/users resBody://({"method":"POSToverride"}) includeFilter://m:POST
```

## Advanced Usage

### Dynamic Content Replacement
Use regular expressions for dynamic content construction:
```txt
# Replace the timestamp in the original response with the current time
www.example.com/api/time resBody://`({"timestamp":${now}})`
```

### Environment-Specific Replacement
```txt
# Development environment: Use mock data
dev-api.example.com resBody://{"env":"development","data":"mock"}
```

### Error Scenario Testing
```txt
# Simulate various error responses
www.example.com/api resBody://{"error":"RateLimitExceeded"} includeFilter://s:429
www.example.com/api resBody://{"error":"InternalServerError"} includeFilter://s:500
www.example.com/api resBody://{"error":"ServiceUnavailable"} includeFilter://s:503
```

## Differences from the file Protocol

The main distinction between the `resBody` protocol and the [`file`](./file) protocol lies in the request processing flow:

### Processing Flow Comparison
- **`resBody` protocol**: The request **is first sent to the backend server** to obtain the original response, then **replaces** the original response body with the specified content.
- **`file` protocol**: The request **is not sent to the backend server**; it directly returns the specified file content.

### Use Case Comparison
- **`resBody`**: Suitable for modifying the return content of real APIs while maintaining the complete request-response flow.
- **`file`**: Suitable for complete local simulation, independent of real backend services.

## Notes

### Response Type Preservation
- `resBody` replaces the response body content and does not automatically modify the `Content-Type` response header.
- If you need to modify the response type, use it in conjunction with the [`resType`](./resType) protocol.

## Common Questions

### Q: The resBody rule is not taking effect.
**A:** Check:
1. Whether the response status code has a response body (excluding 204, 304, etc.).
2. Whether the rule pattern correctly matches the request URL.
3. Whether the filter conditions are met.
4. Whether a higher-priority rule is overriding it.

### Q: Can I replace only specific types of responses?
**A:** Yes, use filters:
```txt
# Replace only JSON responses
pattern resBody://content includeFilter://resH:content-type=json

# Replace only responses from specific paths
pattern resBody://content includeFilter://*/api/v1/
```

## Related Protocols

1. **Inject content before the response body**: [resPrepend](./resPrepend)
   - Inserts content before the original response body.
2. **Append content after the response body**: [resAppend](./resAppend)
   - Appends content after the original response body.
3. **Replace request content**: [reqBody](./reqBody)
   - Replaces the request body content sent to the server.
4. **Directly return local file content**: [file](./file)
   - Does not request the server; directly returns local file content.
5. **Modify response headers**: [resHeaders](./resHeaders)
   - Modifies response header information, such as `Content-Type`.

## Further Reading

- [Matching Pattern Documentation](./pattern): Learn more about URL matching rules.
- [Operation Commands Documentation](./operation): Learn about multiple ways to load content.
- [Filters Documentation](./filters): Learn more about filter functionalities.
