# auth

The `auth` protocol is used to quickly modify the `Authorization` header of a request, automatically adding the credentials required for HTTP Basic Authentication to matching requests.

## Rule Syntax

`auth` supports multiple ways to set the request authentication header:

### 1. Inline Value (Direct Specification)
Write the username and password directly in the rule.
```txt
pattern auth://username:password [lineProps...] [filters...]
# or
pattern auth://username=test&password=123 [lineProps...] [filters...]
```
**Example:**
```txt
https://example.com/api1/ auth://admin:secret
https://example.com/api2/ auth://username=admin&password=secret
```

### 2. Embedded Value (Using Code Block)
Use this method when the credentials are complex or need to be reused. Reference a custom key in the rule and define its value in a subsequent code block.
````txt
pattern auth://{custom-key} [lineProps...] [filters...]

``` custom-key
username: admin
password: my secret password
```
````

### 3. Referencing a Value from the Values Panel
Reference a value pre-defined in the `Values` panel.
```txt
pattern auth://{key-of-values} [lineProps...] [filters...]
```
**Prerequisite:** A key named `key-of-values` with an object containing `username` and `password` as its value must exist in `Values`.

### 4. Loading from a Temporary File
Use Whistle's temporary file feature when content needs frequent editing.

```txt
pattern auth://temp.json
```

**Steps:**
1. In the Rules editor, hold down `Command` (Mac) / `Ctrl` (Windows)
2. Click with the mouse on `auth://temp.json`
3. Enter the response content in the pop-up editing dialog
4. Click `Save` to save

After saving, the rule will automatically change to a format similar to this:
```txt
https://example.com/report auth://temp/11adb9c9e1142df67b30d7646ec59bcd34c855d9011d1a2405c7fc2dfc94568d.json
```

To edit again, click the temporary file link in the same way.

### 5. Loading from a File or Remote URL
Load a JSON or simple YAML file containing authentication information from a local file or remote URL.
```txt
# Load from a local file
pattern auth:///User/xxx/auth.json

# Load from a remote URL (supports http and https)
pattern auth://https://config.example.com/auth.json
```

**File Format Requirements:**
The file content should be in JSON or simple YAML format, containing `username` and `password` fields:
```json
{
  "username": "admin",
  "password": "secret"
}
```
or
```yaml
username: admin
password: secret
```

## Parameter Details

| Parameter | Required | Description & Examples |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression used to match the request URL.<br>• Supports domains, paths, wildcards, regular expressions.<br>• See [Matching Pattern Documentation](./pattern) for details. |
| **value** | Yes | Authentication credentials, supporting multiple formats:<br>• **Direct format**: `username:password` or `username=test&password=123`<br>• **Object format**: An object containing `username` and `password` fields<br>• Supports loading from local files or remote URLs<br>• Supports inline, embedded, Values, local file path, remote URL references |
| **lineProps** | No | Sets additional properties for the rule.<br>• Example: `lineProps://important` can increase this rule's priority.<br>• See [lineProps Documentation](./lineProps) for details. |
| **filters** | No | Optional filter conditions for precise control over when the rule takes effect.<br>• Can match request URL, method, headers, body content.<br>• Can match response status code, headers.<br>• See [Filters Documentation](./filters) for details. |

## Configuration Examples

### Basic Example
Add Basic Authentication to the API endpoints of example.com:
```txt
https://api.example.com/ auth://admin:secret
```

### Using Embedded Values
Use the embedded method for more security when passwords contain special characters or spaces:
````txt
https://internal.example.com/ auth://{prod-credentials}

``` prod-credentials
username: service-account
password: P@ssw0rd!2024
```
````

### Loading from a File
Load authentication information from a local configuration file:
```txt
https://example.com/api/ auth:///Users/john/config/auth.json
```

### Using with Filters
Add authentication only for POST requests:
```txt
https://example.com/api/ auth://admin:secret includeFilter://m:POST
```

### Referencing Configuration from Values
Assuming the `api-auth` configuration already exists in Values:
```txt
https://example.com/api/ auth://{api-auth}
```

## How It Works & Related Protocols

1. **Core Principle**: The `auth` protocol automatically calculates the Base64 encoding of the username and password and sets the `Authorization` request header.

   The example above is equivalent to manually setting it using the [`reqHeaders`](./reqHeaders) protocol:
   ```` txt
   https://example.com/api/ reqHeaders://{auth.txt} # Content has spaces, cannot be inline

   ``` auth.txt
   authorization: Basic YWRtaW46c2VjcmV0
   ```
   ````
   Where `YWRtaW46c2VjcmV0` is the Base64 encoding of `admin:secret`.

2. **Advantage**: Compared to directly using `reqHeaders`, the `auth` syntax is more concise and intuitive, requiring no manual calculation of the Base64 encoded value.

## Notes
- The `auth` protocol only supports HTTP Basic Authentication
- For more complex authentication methods (such as Bearer Token, OAuth, etc.), please use the [`reqHeaders`](./reqHeaders) protocol to directly set the corresponding `Authorization` header
- When loading from a remote URL, ensure the target URL is secure and reliable
