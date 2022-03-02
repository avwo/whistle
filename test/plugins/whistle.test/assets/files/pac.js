function FindProxyForURL(url, host) {
    // our local URLs from the domains below example.com don't need a proxy:
    if (shExpMatch(host, "*.example.com"))
    {
        return "DIRECT";
    }

    // URLs within this network are accessed through
    // port 8080 on fastproxy.example.com:
    if (isInNet(host, "10.0.0.0", "255.255.248.0"))
    {
        return "PROXY fastproxy.example.com:8080";
    }

    // All other requests go through port 8080 of proxy.example.com.
    // should that fail to respond, go directly to the WWW:
    return "PROXY 127.0.0.1:8080; DIRECT";
}