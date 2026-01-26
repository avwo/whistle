# attachment

The `attachment` protocol is used to set the `Content-Disposition` field in the response headers, instructing the browser to treat the server's response directly as an attachment for download and save the file with the name specified by `attachment`, instead of displaying it within the page.

> Similar to Koa's `attachment` method: https://koajs.com/

## Rule Syntax

`attachment` supports multiple ways to specify the download filename:

### 1. Inline Value (Direct Specification)
Write the filename directly in the rule.
```txt
pattern attachment://filename [lineProps...] [filters...]
```
**Example:**
```txt
https://example.com/report attachment://Annual-Report.pdf
```

### 2. Embedded Value (Using Code Block)
Use this method when the filename is long or needs to be reused. Reference a custom key in the rule and define its value in a subsequent code block.
````txt
pattern attachment://{custom-key} [lineProps...] [filters...]

``` custom-key
Quarterly-Data-2024Q1.csv
```
````

### 3. Referencing a Value from the Values Panel
Reference a value pre-defined in the `Values` panel.
```txt
pattern attachment://{key-of-values} [lineProps...] [filters...]
```
**Prerequisite:** A key named `key-of-values` with the target filename as its value must exist in `Values`.

### 4. File/Remote URL Loading
**Currently NOT supported** to dynamically load filename content from a local file or remote URL.

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **filename** | Yes | The filename displayed during download.<br>• Examples: `document.pdf`, `export.xlsx`.<br>• Can be specified via the three methods above (inline/embedded/Values).<br>• ⚠️ Loading from files or remote URLs is not supported. |
| **lineProps** | No | Sets additional properties for the rule.<br>• Example: `lineProps://important` can increase this rule's priority.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

## Configuration Examples

### Basic Example
Make visiting the homepage of example.com automatically download a file named `example.html`.
```txt
https://www.example.com/ attachment://example.html
```

### Using with Filters
Trigger PDF download only when the request contains a specific query parameter `download=true`.
```txt
https://api.example.com/document attachment://User-Manual.pdf includeFilter:///[?&]download=true/
```

### Using Embedded Values
Use an embedded code block for clarity when the filename is complex or needs annotation.
````txt
https://assets.example.com/data.json attachment://{my-file-name}

``` my-file-name
Config-Backup-20240514.json
```
````

## Implementing Remote Loading

The `attachment` protocol itself does not support loading values from file paths or remote URLs. If remote loading functionality is needed, consider the following two alternative approaches:

### 1. Extend Functionality via Plugins
You can develop a plugin to implement more complex filename retrieval logic, such as dynamically fetching filenames from a remote API. Please refer to the [Plugin Development Documentation](../extensions/dev) for specific methods.

### 2. Using @url to Load Complete Rules
Store the complete configuration file containing `attachment` rules on a remote server and then load the entire rule set via the [`@url`](./@) protocol.

**Example:**
1. Create a rule file `xxx.txt` on a remote server:
    ```txt
    https://api.example.com/export attachment://remote-file.csv
    https://static.example.com/docs attachment://Document.pdf
    ```
2. Reference the remote rules in the local Rules configuration:
    ```txt
    @https://remote-url/xxx.txt
    ```
   This way, the `attachment` rules in the remote file will be loaded and take effect.

## How It Works & Related Protocols

1.  **Core Principle**: The `attachment` protocol essentially sets response headers automatically.
    The example above is completely equivalent to manually setting headers using the [`resHeaders`](./resHeaders) protocol:
    ```txt
    https://www.example.com/ resHeaders://content-disposition=attachment;filename="example.html"
    ```

2.  **Advantage**: Compared to directly using `resHeaders`, the `attachment` syntax is more concise, readable, focuses on the file download scenario, and automatically handles details like filename escaping.

3.  **Note**: The actual content of the response body returned by the server remains unchanged. This rule simply instructs the browser how to handle that content by modifying the response headers.
