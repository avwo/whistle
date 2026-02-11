# Log Rule

Automatically injects JavaScript code into pages to capture JavaScript exceptions and `console.xxx` logs, displaying them in real-time on the Whistle management interface.

## Overview
- **Exception Monitoring**: Automatically captures JavaScript execution errors and unhandled Promise rejections in pages.
- **Log Collection**: Intercepts and collects all console outputs such as `console.log()`, `console.warn()`, and `console.error()`.
- **Visual Log Viewing**: View, filter, and search logs by group in real-time within the Whistle management interface.
- **Log Preprocessing**: Supports filtering or formatting log content through custom scripts.

## Rule Syntax
```
pattern log://id [filters...]
```

### Parameter Description
| Parameter | Required | Description                                                                 | Details                                                                 |
|-----------|----------|-----------------------------------------------------------------------------|-------------------------------------------------------------------------|
| pattern   | Yes      | Expression matching request URLs to specify pages to monitor                 | [Pattern Matching Syntax](./pattern)                                    |
| id        | Yes      | Log group identifier (plain string) to distinguish and filter logs from different sources in the Whistle interface | Logs within the same group are displayed together, supporting quick view switching by ID |
| filters   | No       | Filter conditions to further match specific characteristics of requests or responses | [Filter Syntax](./filters) <br> Supports filtering by URL, method, request headers, response status codes, etc. |

## Usage

### Basic Usage
Capture logs from all pages under a specified domain:
```
www.example.com log://myapp
```

### Multi-Domain Group Monitoring
Set different log groups for different domains or paths for categorized viewing:
```
ke.qq.com log://ke
news.qq.com log://news
api.example.com log://api
```

## Advanced Configuration: Log Preprocessing

Inject custom scripts via the `jsPrepend` rule to preprocess logs before they are sent to Whistle, such as sensitive information masking, format conversion, or conditional filtering.

### Configuration Example
```
www.example.com log:// jsPrepend://{handleLog.js}
```

### Preprocessing Script Example
```javascript
// handleLog.js
// Custom processing function executed before logs are sent to Whistle
window.onBeforeWhistleLogSend = function(result, level) {
  // result: Array of raw messages to be output
  // level: Log level ('log', 'warn', 'error', 'info', 'debug')
  
  result.forEach(function(msg, i) {
    // Example 1: Hide sensitive keywords
    if (typeof msg === 'string' && msg.includes('password')) {
      result[i] = '[SENSITIVE DATA HIDDEN]';
    }
    
    // Example 2: Convert specific content to structured objects
    if (msg === 'abc') {
      result[i] = {
        name: 'avenwu',
        level: level,
        timestamp: new Date().toISOString()
      };
    }
    
    // Example 3: Filter out certain types of logs
    if (msg === 'ignore-this-message') {
      // Returning an empty array will prevent this log from being sent
      result.splice(i, 1);
    }
  });
};
```

## Interface Operation Guide

### Viewing Logs
1. Open the Whistle management interface (default: `http://127.0.0.1:8899`)
2. Switch to the **Network / Tools / Console** tab
3. Select the corresponding log group ID in the top-left corner
4. View page output logs and error information in real-time

### Log Filtering
- Use the top filter bar to quickly filter by log level (Log/Warn/Error)
- Supports keyword search to quickly locate specific logs
