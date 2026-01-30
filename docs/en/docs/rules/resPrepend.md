# resPrepend

The `resPrepend` protocol is used to insert specified content at the beginning of an existing response body. It only takes effect on status codes that include a response body (such as `200`, `500`, etc.). Through the `resPrepend` protocol, you can:
- Add custom content at the beginning of a response.
- Insert debugging information or timestamps.
- Add references to scripts, stylesheets, or other resources.
- Inject environment markers or version information.
- Keep the original response content intact, adding extra content only at the beginning.

> **Effective Condition**: Only takes effect on status codes with a response body.
> 
> ⚠️ Note: Requests without a response body, such as `204`, `304`, are not affected.

## Rule Syntax

`resPrepend` supports multiple ways to specify the content to be inserted:

### 1. Inline Value (Direct Specification)
Write the content to insert directly in the rule, suitable for short text (cannot contain spaces or line breaks).

```txt
pattern resPrepend://(value) [lineProps...] [filters...]
```

**Example:**
```txt
www.example.com/page resPrepend://(<!--Page Start-->)
```

### 2. Embedded Value (Using Code Block)
This method is recommended when dealing with complex content containing spaces, line breaks, or when you want to reuse a configuration.

````txt
pattern resPrepend://{custom-key} [lineProps...] [filters...]

``` custom-key
<!-- Debug Info -->
<script>
  console.log('Page Load Time:', new Date().toISOString());
</script>
```
````

### 3. Referencing a Value from the Values Panel
When the content is large, you can store it in the `Values` configuration area.

```txt
pattern resPrepend://{key-of-values} [lineProps...] [filters...]
```

**Prerequisite**: A key named `key-of-values` with the content to insert as its value must exist in `Values`.

### 4. Loading from a File Path or Remote URL
Load the response content to insert from a local file or remote URL.

```txt
# Load from a local file
pattern resPrepend:///User/xxx/header.html

# Load from a remote URL
pattern resPrepend://https://cdn.example.com/analytics-script.js
```

### 5. Loading from a Temporary File
Use Whistle's temporary file feature when content needs frequent editing.

```txt
pattern resPrepend://temp/blank.txt
```

**Steps:**
1. In the Rules editor, hold down `Command` (Mac) / `Ctrl` (Windows).
2. Click with the mouse on `resPrepend://temp/blank.txt`.
3. Enter the content to insert in the pop-up editing dialog.
4. Click `Save` to save.

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **value** | Yes | The response content to insert, supporting multiple formats:<br>• Local file path<br>• Remote URL<br>• Inline, embedded, Values references |
| **lineProps** | No | Sets additional properties for the rule.<br>• Example: `lineProps://important` can increase this rule's priority.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

## Configuration Examples

### Basic Examples
```txt
# Add a comment at the beginning of an HTML page
www.example.com/index.html resPrepend://(<!--Page Start Time:-->)

# Add a timestamp before a JSON response
api.example.com/data.json resPrepend://({"timestamp":"2024-01-01T00:00:00Z"})
```

### Example Scenario Analysis

#### Scenario 1: Inserting Debug Information
````txt
``` debug-header
<!-- 
  Debug Info:
  - URL: ${url}
  - Time: ${now}
  - User Agent: ${reqHeaders.user-agent}
-->
```

www.example.com resPrepend://`{debug-header}`
````

#### Scenario 2: Adding Page Header Content
```` txt
# Add a common header
^www.example.com/*.html resPrepend://{custom-html}

``` custom-html
<div class="site-header">Website Header</div>
```
````

#### Scenario 3: Injecting Analytics Script
```` txt
# Add Google Analytics script
www.example.com resPrepend://{google-analytics}
``` google-analytics
<script async src="https://www.googletagmanager.com/gtag/js?id=UA-XXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'UA-XXXXX');
</script>
```
````

### Using with Other Protocols
```txt
# First add header content, then add footer content
www.example.com/page resPrepend://(<header>) resAppend://(</footer>)

# Use with the file protocol
www.example.com/path resPrepend://(Hello) file://(-test-)
```
**Response Result:**
```
Hello-test-
```

### Using Embedded Values
````txt
``` body.txt
Hello world.
```

www.example.com/path resPrepend://{body.txt} file://(-test-)
````
**Response Result:**
```
Hello world.-test-
```

### Loading from a File or Remote URL
```txt
# Load from a local file
www.example.com/path1 resPrepend:///User/xxx/test.txt

# Load from a remote URL
www.example.com/path2 resPrepend://https://www.xxx.com/xxx/params.txt

# Use a temporary file
www.example.com/path3 resPrepend://temp/blank.txt
```

### Using with Filters
```` txt
# Add debug info only for development environment
www.example.com resPrepend://(<!--Development Environment-->) includeFilter://reqH:host=/dev\./

# Add header only for HTML pages
www.example.com resPrepend://{header} resType://html

``` header
<div class="header" />
```

# Determine whether to add content based on response status code
www.example.com/api resPrepend://({"debug":true}) includeFilter://s:200
````

## Advanced Usage

### Dynamic Content Insertion
Use template strings to implement dynamic content:
```` txt
# Insert current timestamp
www.example.com/api resPrepend://`({"timestamp":"${now}"})`

# Insert request information
www.example.com/debug resPrepend://`{req-info}`

``` req-info
<!-- Request Method: ${method}, Path: ${path} -->
```
````

### Combining Multiple Insertions
```` txt
# Insert multiple content fragments
www.example.com/page resPrepend://{header1} resPrepend://{header2}

``` header1
<div />
```
``` header2
<div id="header2" />
```
# Final result: <div id="header2" /><div id="header1" />[Original Content]
````

### Conditional Insertion
`````txt
# Insert content only under specific conditions
www.example.com/admin resPrepend://{log.js} includeFilter://reqH:cookie=/admin=true/

```` log.js
<script>console.log('Admin Page')</script>
````
`````

## Common Questions

### Q: The resPrepend rule is not taking effect.
**A:** Check:
1. Whether the response status code has a response body (excluding 204, 304, etc.).
2. Whether the rule pattern correctly matches the request URL.
3. Whether the filter conditions are met.
4. Whether other rules are interfering.

### Q: How to ensure content is inserted at a specific position?
**A:**
- `resPrepend` always inserts content at the very beginning of the response.
- If you need to insert at other positions, consider using `resReplace` with regular expression replacement.

### Q: Can I delete parts of the original response?
**A:** No. `resPrepend` only adds content; it does not delete or modify the original content. If you need to delete content, use the `resBody` protocol.

## Differences from resBody

The main distinction between the `resPrepend` protocol and the [`resBody`](./resBody) protocol lies in the processing method:
- **`resPrepend`**: Inserts specified content **before** the original response content, preserving the original.
- **`resBody`**: **Replaces** the entire response content, without preserving the original.

## Related Protocols

1. **Replace response content**: [resBody](./resBody)
   - Completely replaces the response content, without preserving the original.
2. **Append content after the response body**: [resAppend](./resAppend)
   - Adds content at the end of the response.
3. **Replace request content**: [reqBody](./reqBody)
   - Replaces the request body content sent to the server.
4. **Insert content before the request body**: [reqPrepend](./reqPrepend)
   - Inserts content before the request body.
5. **Append content after the request body**: [reqAppend](./reqAppend)
   - Adds content at the end of the request body.

## Further Reading

- [Matching Pattern Documentation](./pattern): Learn more about URL matching rules.
- [Operation Commands Documentation](./operation): Learn about multiple ways to load content.
- [Filters Documentation](./filters): Learn more about filter functionalities.
