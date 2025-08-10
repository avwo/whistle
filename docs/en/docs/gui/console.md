# Console Interface

The Console interface is a visual display platform for [log rules](../rules/log), specifically used for monitoring and analyzing:
- Page JavaScript errors
- Console output such as `console.log` and `console.warn`

<img src="/img/console.png" alt="Console Interface" width="360" />

| Function Area | Function Description |
| -------------------- | ------------------------------------------------------------ |
| **All logs** | Displays all log categories (corresponding to the id in `log://id`). Click a category to quickly filter logs for a specific page. |
| **All levels** | Filter by log level (Debug/Log/Info/Warn/Error/Fatal) |
| **Expand JSON Root** | Automatically expand the first level of the JSON data structure |
| **ecord** | Start/stop/pause logging |
| **Import** | Import historical log files (.json/.txt) |
| **Export** | Export the current log |
| **Clear** | Clear the current log |
