# replaceStatus

The `replaceStatus` protocol is used to replace HTTP status codes. It changes the original status code to a specified HTTP status code after the request response is completed. Through the `replaceStatus` protocol, you can:
- **Modify the status code of server responses**: Replace status codes based on real server responses.
- **Test handling logic for different status codes**: Test various status code scenarios without modifying backend code.
- **Error scenario simulation**: Convert normal responses to error status codes to test client fault tolerance.
- **Redirect testing**: Modify redirect status codes or targets.

## Rule Syntax

The `replaceStatus` protocol supports multiple configuration methods:

### 1. Inline Value (Direct Specification)
Write the status code to replace directly in the rule.

```txt
pattern replaceStatus://code [lineProps...] [filters...]
```

**Example:**
```txt
www.example.com/api/old replaceStatus://301
```

### 2. Embedded Value (Using Code Block)
Use this method when you need to return different status codes based on conditions or want to reuse configurations.

````txt
pattern replaceStatus://{custom-key} [lineProps...] [filters...]

``` custom-key
404
```
````

### 3. Referencing a Value from the Values Panel
Reference a status code pre-defined in the `Values` panel (central configuration area).

```txt
pattern replaceStatus://{key-of-values} [lineProps...] [filters...]
```

**Prerequisite**: A key named `key-of-values` with a status code as its value must exist in `Values`.

### 4. File/Remote URL Loading
**Currently NOT supported** to dynamically load content from local files or remote URLs.

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **code** | Yes | The HTTP response status code to replace, such as:<br>• `200` OK<br>• `301` Permanent Redirect<br>• `302` Temporary Redirect<br>• `404` Not Found<br>• `500` Internal Server Error<br>• Supports all standard HTTP status codes. |
| **lineProps** | No | Sets additional properties for the rule.<br>• Example: `lineProps://important` can increase this rule's priority.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

## Configuration Examples

### Basic Examples
```txt
# Replace any response with 404 status code.
www.example.com replaceStatus://404

# Replace server errors with normal status codes.
www.example.com/api replaceStatus://200 includeFilter://s:500

# Modify redirect status codes.
www.example.com/redirect replaceStatus://307
```

### Simulating Authentication Failure
```txt
# Replace normal responses with 401 status code, triggering browser authentication popup.
www.example.com/secure-page replaceStatus://401

# Disable the login dialog and directly return 401.
www.example.com/secure-page replaceStatus://401 disable://userLogin

# Or use lineProps to achieve the same effect.
www.example.com/secure-page replaceStatus://401 lineProps://disableUserLogin
```

### Conditional Replacement
```txt
# Replace only when the original status code is 200 with 500.
www.example.com/api replaceStatus://500 includeFilter://s:200

# Replace response status codes only for specific paths.
www.example.com/api/admin replaceStatus://403
```

### Combining with Other Protocols
````txt
# Replace status code and modify response content.
www.example.com/api/error replaceStatus://500 resBody://{errMsg}

``` errMsg
{"message":"Custom error message"}
```

# Replace with 301 redirect and set new Location header.
www.example.com/old-url replaceStatus://301 resHeaders://location=https://www.example.com/new-url
````

### Using Embedded Values
````txt
``` maintenance-status
503
```

# Replace all website responses with maintenance status.
www.example.com replaceStatus://{maintenance-status}
````

### Environment-Specific Configuration
```txt
# Simulate errors only in testing environment.
test.example.com/api replaceStatus://500

# Development environment remains unchanged.
# dev.example.com/api (no replaceStatus set)
```

## Common Use Cases

### 1. Error Handling Testing
```txt
# Test client handling of server errors.
www.example.com/api replaceStatus://500 includeFilter://chance:0.1
```

### 2. Redirect Behavior Testing
```txt
# Test permanent redirect caching.
www.example.com/old-page replaceStatus://301

# Test temporary redirect.
www.example.com/temp-redirect replaceStatus://302
```

### 3. Authentication and Authorization Testing
```txt
# Test unauthenticated access.
www.example.com/protected replaceStatus://401

# Test insufficient permissions.
www.example.com/admin replaceStatus://403
```

### 4. Rate Limiting Testing
```txt
# Test too many requests scenarios.
www.example.com/api/rate-limited replaceStatus://429 resHeaders://retry-after=60
```

### 5. Maintenance Mode Testing
```txt
# Test maintenance page.
www.example.com replaceStatus://503 resBody://(<h1>System Under Maintenance...</h1>)
```

## Differences from statusCode

The main distinction between the `replaceStatus` protocol and the [`statusCode`](./statusCode) protocol lies in the processing timing:
- **`replaceStatus`**: **First requests the backend server**, then replaces the status code after receiving the response.
- **`statusCode`**: **Does not request the backend server**, immediately returns the specified status code.

## Notes

### 1. Difference from statusCode
- **Processing timing**: `replaceStatus` takes effect during the response stage, `statusCode` takes effect during the request stage.
- **Server access**: `replaceStatus` accesses the server, `statusCode` does not.
- **Use cases**: Use `replaceStatus` when real server data is needed, use `statusCode` for complete simulation.

### 2. Response Content Retention
- By default, response content remains unchanged when replacing status codes.
- Response content can be modified by combining with the [`resBody`](./resBody) protocol.

### 3. Authentication Popup Control
- When replacing with `401` status code, the browser authentication popup is triggered by default.
- You can disable the popup in the following ways:
  - Add `disable://userLogin`.
  - Add `lineProps://disableUserLogin`.
  - Use the reverse configuration of the [`enable`](./enable) protocol.

### 4. Redirect Handling
- When replacing with redirect status codes (301, 302, etc.), you usually need to modify the `Location` response header accordingly.
- Otherwise, the client may not handle the redirect correctly.

### 5. Status Code Compatibility
- Ensure the replaced status code is compatible with the response content.
- For example, an HTML page should not be replaced with a 204 (No Content) status code.

## Advanced Usage

### Status Code Conversion Mapping
```txt
# Unify all redirects as 302.
www.example.com replaceStatus://302 includeFilter://s:301
```

### Probabilistic Replacement
```txt
# Replace responses with errors 10% of the time.
www.example.com/api replaceStatus://500 includeFilter://chance:0.1
```

### Combining Multiple Rules
```txt
# Perform different replacements for different original status codes.
www.example.com/api replaceStatus://200 includeFilter://s:404
www.example.com/api replaceStatus://400 includeFilter://s:403
```

## Troubleshooting

### Q: Status code replacement is not taking effect.
**A:** Check:
1. Whether the rule pattern correctly matches the request URL.
2. Whether there are other higher-priority rules overriding it.
3. Whether the filter conditions are met (especially filtering on the original status code).

### Q: Response content does not match the status code.
**A:** Check:
1. Whether the response content is also modified.
2. Whether the response headers are compatible with the new status code.
3. Whether the client can correctly handle that status code.

### Q: Browser pops up authentication window.
**A:** For 401 status code:
1. Check if `disable://userLogin` or `lineProps://disableUserLogin` is added.
2. Confirm if the rule order is correct.

### Q: Redirect loop.
**A:** Check:
1. Whether the correct `Location` header is set.
2. Whether the redirect target is correct.
3. Whether multiple redirect rules conflict.

## Related Protocols

1. **Directly return status code**: [statusCode](./statusCode)
   - Does not request the server, directly returns the specified status code.
2. **Disable authentication popup**: [disable](./disable) or [lineProps](./lineProps)
   - Disable the browser login popup triggered by 401 status code.
3. **Set response content**: [resBody](./resBody)
   - Add custom content for status code responses.
4. **Set response headers**: [resHeaders](./resHeaders)
   - Set necessary response headers for scenarios like redirects.

## Further Reading

- [HTTP Status Codes MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status): Learn the meaning of all HTTP status codes.
- [Matching Pattern Documentation](./pattern): Learn more about URL matching rules.
- [Filters Documentation](./filters): Learn more about filter functionalities.
