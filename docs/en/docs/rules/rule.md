# Rule Syntax

Whistle modifies requests and responses through concise rule configurations, with each rule following the same basic syntax structure.

## Syntax Structure

```txt
pattern operation [lineProps...] [filters...]
```

Each rule consists of the following four components:

| Component | Required | Description |
| :--- | :--- | :--- |
| **pattern** | Yes | Expression for matching request URLs. Detailed documentation: [pattern](./pattern) |
| **operation** | Yes | Operation command, formatted as `protocol://value`. Detailed documentation: [operation](./operation) |
| **lineProps** | No | Additional configurations that apply only to the current rule. Detailed documentation: [lineProps](./lineProps) |
| **filters** | No | Filter conditions for precise control over when the rule takes effect. Detailed documentation: [filters](./filters) |

## Advanced Rule Configuration

### 1. Combined Configuration
A single rule can contain multiple operation commands, enabling complex functional combinations.

**Syntax**:
```txt
pattern operation1 operation2 ... [includeFilter://pattern1 ... excludeFilter://patternN ...]
```

**Example**:
```txt
www.example.com/* file:///static-files cache://3600 resCors://*
```

**Explanation**:
- Multiple operation commands are executed in order.
- Supports combining any number of operation commands.
- Filter conditions apply to the entire rule.

### 2. Position Swapping
When `operation` and the first `pattern` are not both in URL or domain format, their positions can be swapped.

**Syntax**:
```txt
operation pattern1 pattern2 ... [includeFilter://pattern1 ... excludeFilter://patternN ...]
```

**Example**:
```txt
# Standard writing
www.example.com proxy://127.0.0.1:8080

# Position-swapped writing
proxy://127.0.0.1:8080 www.example.com api.example.com
```

> **Limitations**: `operation` and the first `pattern` cannot simultaneously be in the following formats:
> - `https://test.com/path`
> - `//test.com/path`
> - `test.com/path`
> - `test.com`

**Applicable Scenarios**:
- More concise when applying the same operation to multiple domains.
- Batch configuration of proxy, redirect, and other rules.

### 3. Multi-line Configuration
Use code blocks to achieve multi-line configurations, improving readability of complex rules.

**Syntax**:
````txt
line`
operation
pattern1
pattern2
...
[includeFilter://pattern1
...
excludeFilter://patternN 
...]
`
````

**Example**:
````txt
line`
proxy://127.0.0.1:8080
www.example.com
api.example.com
static.example.com
includeFilter://m:GET
excludeFilter:///admin/
`
````

**Features**:
- Whistle automatically replaces line breaks within the code block with spaces.
- Maintains clean code formatting for easy reading and maintenance.
- Suitable for scenarios involving multiple matching patterns and complex filter conditions.

**Equivalent Conversion**:
The above multi-line configuration is equivalent to:
```txt
proxy://127.0.0.1:8080 www.example.com api.example.com static.example.com includeFilter://m:GET excludeFilter:///admin/
```

## Notes

### 1. Rule Priority
- Rules are executed in top-to-bottom order.
- Later rules may override the effects of earlier rules.
- Use `lineProps://important` to increase the priority of important rules.

### 2. Debugging Tips
1. **Step-by-step verification**: Start with simple rules and gradually add complex conditions.
2. **Log viewing**: Use the Overview panel in the Whistle Network interface to check rule matching.
3. **Browser debugging**: Use browser developer tools to inspect actual effects.
4. **Temporary disabling**: Use `#` to comment out rules temporarily for testing.
