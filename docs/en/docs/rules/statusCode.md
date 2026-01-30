# statusCode

The `statusCode` protocol is used to immediately interrupt a request and return a specified HTTP status code, without forwarding the request to the backend server. Through the `statusCode` protocol, you can:
- **Quickly simulate specific HTTP status codes**: Test various status code responses without a real server.
- **Intercept and interrupt requests**: Directly return a status code before the request reaches the real server.
- **Test error scenarios**: Simulate server errors, redirects, authentication failures, etc.
- **Control request flow**: Decide whether to allow the request to continue based on conditions.

## Rule Syntax

The `statusCode` protocol supports multiple configuration methods:

### 1. Inline Value (Direct Specification)
Write the status code to return directly in the rule.

```txt
pattern statusCode://code [lineProps...] [filters...]
```

**Example:**
```txt
www.example.com/api/old-endpoint statusCode://410
```

### 2. Embedded Value (Using Code Block)
Use this method when you need to return different status codes based on conditions or want to reuse configurations.

````txt
pattern statusCode://{custom-key} [lineProps...] [filters...]

``` custom-key
404
```
````

### 3. Referencing a Value from the Values Panel
Reference a status code pre-defined in the `Values` panel (central configuration area).

```txt
pattern statusCode://{key-of-values} [lineProps...] [filters...]
```

**Prerequisite**: A key named `key-of-values` with a status code as its value must exist in `Values`.

### 4. File/Remote URL Loading
**Currently NOT supported** to dynamically load content from local files or remote URLs.

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **code** | Yes | HTTP response status code, such as:<br>• `200` OK<br>• `301` Permanent Redirect<br>• `302` Temporary Redirect<br>• `404` Not Found<br>• `500` Internal Server Error<br>• Supports all standard HTTP status codes. |
| **lineProps** | No | Sets additional properties for the rule.<br>• Example: `lineProps://important` can increase this rule's priority.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

## Configuration Examples

### Basic Examples
```txt
# Return 404 status code (Page Not Found)
www.example.com/deleted-page statusCode://404

# Return 500 status code (Internal Server Error)
www.example.com/api/error statusCode://500

# Return 302 Redirect
www.example.com/old-url statusCode://302
```

### Simulating Authentication Failure
```txt
# Authentication required when accessing, browser will pop up login dialog.
www.example.com/secure-area statusCode://401

# Disable the login dialog and directly return 401.
www.example.com/secure-area statusCode://401 disable://userLogin

# Or use lineProps to achieve the same effect.
www.example.com/secure-area statusCode://401 lineProps://disableUserLogin
```

### Combining with Custom Response Content
```txt
# Return 404 status code with custom response content.
www.example.com/missing-page statusCode://404 resBody://(<h1>Page Not Found</h1>)
```

### Using with Filters
```txt
# Return 405 (Method Not Allowed) only for specific request methods.
www.example.com/api/resource statusCode://405 includeFilter://m:PUT

# Return different status codes based on request path matching.
/^https?://www\.example\.com/user/\d+/profile/ statusCode://403

# Return status code based on request header conditions.
www.example.com/api statusCode://429 includeFilter://reqH:user-agent=/bot/i
```

### Using Embedded Values
````txt
``` maintenance-status
503
```

www.example.com statusCode://{maintenance-status}
````

### Environment-Specific Configuration
````txt
``` testing-403
403
```

# Return 403 only in testing environment.
test.example.com/api/admin statusCode://{testing-403}
````

## Common Status Code Scenarios

| Status Code | Scenario Description | Typical Use |
| :--- | :--- | :--- |
| **200** | Successful Response | Test normal flow. |
| **301/302** | Redirect | Test URL redirection logic. |
| **400** | Bad Request | Test client error handling. |
| **401** | Unauthorized | Test authentication flow. |
| **403** | Forbidden | Test access control. |
| **404** | Not Found | Test resource not found handling. |
| **429** | Too Many Requests | Test rate limiting logic. |
| **500** | Internal Server Error | Test server-side exception handling. |
| **503** | Service Unavailable | Test maintenance page. |

## Notes

### 1. Response Content
- By default, the response content returned by `statusCode` is empty.
- Custom response content can be set by combining with the [`resBody`](./resBody) protocol.

### 2. Authentication Popup Control
- When returning a `401` status code, the browser authentication popup is triggered by default.
- You can disable the popup in the following ways:
  - Add `disable://userLogin`.
  - Add `lineProps://disableUserLogin`.
  - Use the reverse configuration of the [`enable`](./enable) protocol.

### 3. Redirect Handling
- When returning redirect status codes such as `301`, `302`, you need to specify the redirect address with the [`location`](./resHeaders) response header:
  ```txt
  www.example.com/old statusCode://302 resHeaders://location="https://www.example.com/new"
  ```

## Advanced Usage

### Dynamic Status Codes
```txt
# Return different status codes based on time (maintenance window).
www.example.com/api statusCode://503 includeFilter://t:>=00:00&t:<=06:00
```

### Combining with Other Protocols
```txt
# Return 403 with a custom error page.
www.example.com/blocked statusCode://403 resBody://<h1>Access Denied</h1> resHeaders://content-type="text/html; charset=utf-8"

# Return 503 and set retry time.
www.example.com/down statusCode://503 resHeaders://retry-after="3600"
```

### Testing Client Fault Tolerance
```txt
# Randomly return different error status codes to test client fault tolerance.
www.example.com/api/unstable statusCode://500 includeFilter://chance:0.5
www.example.com/api/unstable statusCode://429 includeFilter://chance:0.3
www.example.com/api/unstable statusCode://200 includeFilter://chance:0.2
```

## Difference from replaceStatus
- **`statusCode`**: Takes effect during the request stage, **does not forward to the backend server**.
- **`replaceStatus`**: Takes effect during the response stage, **first requests the backend server**, then replaces the returned status code.

## Troubleshooting

### Q: Status code rule is not taking effect.
**A:** Check:
1. Whether the rule pattern correctly matches the request URL.
2. Whether there are other higher-priority rules overriding it.
3. Whether the filter conditions are met.

### Q: Browser pops up authentication window.
**A:** For 401 status code:
1. Check if `disable://userLogin` or `lineProps://disableUserLogin` is added.
2. Confirm if the rule order is correct.

### Q: Client displays a blank page.
**A:** Check:
1. Whether custom response content is set.
2. Whether the `Content-Type` response header is correct.
3. Whether the response content encoding matches.

### Q: Redirect is not taking effect.
**A:** Check:
1. Whether the `Location` response header is set.
2. Whether the redirect address format is correct.
3. Whether the browser follows the redirect rules.

## Related Protocols

1. **Replace response status code**: [replaceStatus](./replaceStatus)
   - The request first reaches the server, then replaces the returned status code.
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
