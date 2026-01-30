# cssAppend

The `cssAppend` protocol is used to insert specified content at the end of an existing CSS-type response body.

> **Effective Condition**: Only takes effect on responses with a `content-type` header containing `html` or `css`, and a status code that includes a response body (e.g., `200`/`500`, etc.).
> 
> ⚠️ Note: Requests without a response body, such as `204`, `304`, are not affected.
> 
> HTML pages will automatically be wrapped in `<style>...</style>`.

With the `cssAppend` protocol, you can:
- Append new style rules to the end of existing CSS files.
- Dynamically add CSS override rules.
- Inject custom styles for specific pages.
- Extend styling functionality without modifying the source files.

## Rule Syntax

`cssAppend` supports multiple ways to specify the content to be appended:

### 1. Inline Value (Direct Specification)
Write the CSS content to be appended directly in the rule.
```txt
# No spaces or line breaks are allowed inside the parentheses of `value`.
pattern cssAppend://(value) [lineProps...] [filters...]
```

**Example:**
```txt
www.example.com/index.html cssAppend://(.custom-btn{background:red;})
```

### 2. Embedded Value (Using Code Block)
Use this method when the CSS content to be appended contains spaces, line breaks, or needs to be reused.
````txt
pattern cssAppend://{custom-key} [lineProps...] [filters...]

``` custom-key
.dark-mode {
  background: #333;
  color: #fff;
}
```
````

### 3. Referencing a Value from the Values Panel
Reference CSS content pre-defined in the `Values` panel (central configuration area).
```txt
pattern cssAppend://{key-of-values} [lineProps...] [filters...]
```
**Prerequisite:** A key named `key-of-values` with CSS content as its value must exist in `Values`.

### 4. Loading from a Temporary File
Use Whistle's temporary file feature when content needs frequent editing.

```txt
pattern cssAppend://temp.css
```

**Steps:**
1. In the Rules editor, hold down `Command` (Mac) / `Ctrl` (Windows)
2. Click with the mouse on `cssAppend://temp.css`
3. Enter the response content in the pop-up editing dialog
4. Click `Save` to save

After saving, the rule will automatically change to a format similar to this:
```txt
https://example.com/test.css cssAppend://temp/11adb9c9e1142df67b30d7646ec59bcd34c855d9011d1a2405c7fc2dfc94568d.css
```

To edit again, click the temporary file link in the same way.

### 5. Loading from a File or Remote URL
Load the CSS content to be appended from a local file or remote URL.
```txt
# Load from a local file
pattern cssAppend:///User/xxx/custom.css

# Load from a remote URL (supports http and https)
pattern cssAppend://https://cdn.example.com/styles/override.css
```

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **value** | Yes | The CSS content to be appended, supporting multiple formats:<br>• Plain CSS code text<br>• Supports references from local files, remote URLs, inline, embedded, and Values |
| **lineProps** | No | Sets additional properties for the rule.<br>• Example: `lineProps://important` can increase this rule's priority.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

**Special Notes:**
- Only takes effect on requests where the `content-type` response header contains `css`.
- Does not take effect on status codes without a response body, such as `204`, `304`.
- Appended content is directly concatenated to the end of the original CSS file.

## Configuration Examples

#### Scenario 1: Adding Responsive Breakpoints
```` txt
www.example.com/responsive.css cssAppend://{test.css}

``` test.css
@media (max-width: 768px) {
  .sidebar { display: none; }
  .main-content { width: 100%; }
}
```

````

#### Scenario 2: Overriding Third-party Library Styles
```` txt
cdn.example.com/bootstrap.min.css cssAppend://{test2.css}

``` test2.css
/* Override Bootstrap default styles */
.btn-primary { background-color: #007bff !important; }
.container { max-width: 1400px; }
```
````

#### Scenario 3: Adding Print Styles
````txt
www.example.com/print.css cssAppend://{test3.css}

``` test3.css
@media print {
  .no-print { display: none; }
  a::after { content: " (" attr(href) ")"; }
}
```
````

## Related Protocols

1. **Inject Content Before the Response Body**: [reqAppend](./reqAppend)
   - Inserts content before the body of all types of responses.

2. **Inject Content Before CSS Response Body**: [cssPrepend](./cssPrepend)
   - Inserts content before the CSS response body (opposite of `cssAppend`).

3. **Replace CSS Response Content**: [cssBody](./cssBody)
   - Completely replaces the CSS response content (rather than appending).

4. **Other Content Type Operations**:
   - [jsAppend](./jsAppend): Appends content after JavaScript response bodies.
   - [htmlAppend](./htmlAppend): Appends content after HTML response bodies.
