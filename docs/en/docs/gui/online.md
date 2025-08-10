# Online Dialog Box

The Online dialog box provides a real-time dashboard of the Whistle proxy service, helping you fully understand the health of the proxy service.

<img src="/img/online.png" alt="Online Dialog Box" width="1000" />

## Service Status Overview

| Metrics | Description |
| -------------- | --------------------------------------------------- |
| **Uptime** | Duration of the Whistle service (format: days:hours:minutes:seconds) |
| **Memory Usage** | Current process memory usage (including detailed heap and external memory data) |
| **CPU Usage** | Process CPU usage percentage (refreshed in real time) |

## Traffic Statistics

| Metrics | Description |
| -------------- | ------------------------------------------- |
| **Total Requests** | Cumulative number of requests processed by the proxy service |
| **Real-time Throughput** | Current number of requests processed per second (QPS) |

## Options

| Options | Description | Technical Details |
| ---- | ---- | -------- |
| **Disable dark mode** | Disable the dark theme and use a light interface Dark mode is enabled by default.
|**IPv6-only network** | Forces IPv6 addresses to be returned (AAAA record). Requires network support for IPv6; does not fall back to IPv4 if failed.
|**Verbatim network** | Strictly returns IP addresses in the order configured by DNS. Check: Maintain original DNS response order, check: Smart sorting (IPv4 first).
|**IPv4-first network** | Prefers returning IPv4 addresses (A record). Compatibility-first mode, with IPv6 as a fallback.
