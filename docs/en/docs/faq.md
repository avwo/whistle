# FAQ

Please file an [issue](https://github.com/avwo/whistle/issues/new) if you encounter any issues or suggestions.

## Q: Why does `captureError` appear in the packet capture list? {#capture-error}
1. The client making the request does not have the root certificate installed. To install it, refer to the following:
   - PC: [Install the root certificate](./)
   - Mobile: [Install the root certificate](./mobile)
2. SSL pinning issue
   - HTTPS requests to the domain are not decrypted: `domain-name disable://capture` or only for requests from a specific client: `domain-name disable://capture includeFilter://reqH.user-agent=/xiaomi/i`
   - Run the client on a system or emulator that can circumvent SSL pinning
   - Find other workarounds: https://blog.csdn.net/chiehfeng/article/details/134033846
3. The system-trusted root certificate is not available to Firefox by default; you need to configure a certificate for Firefox separately.
    > **Solution 1: Install a certificate separately for Firefox**
    >
    > In Firefox settings:
    > - Go to Options > Privacy & Security > Certificates
    > - Click "View Certificate" → "Certificate Authority"
    > - Import the downloaded .cer file
    > - Check all "Trust this CA" options
    >
    > **Solution 2: Force Firefox to use the system certificate (Recommended)**
    >
    > - Search for preferences: security.enterprise_roots.enabled
    > - Change the value to true
    > - Restart the browser for the changes to take effect

## Q: How do I configure HTTPS requests with mutual authentication (mTLS)?

Client certificate settings reference: [@clientCert://](./rules/@)

## Q: How do I view Whistle runtime logs?
1. View the error log in Network > Tools > Server.
2. The log file for exceptions that caused the process to crash is: `~/.WhistleAppData/whistle.log`

## Q: How do I start multiple Whistle instances simultaneously?
Running multiple instances requires the following:
- Use a separate directory for each instance
- Configure different listening ports
``` sh
w2 start
2 start -p 8100 -S storageName2
```

## Q: How can I access Whistle directly without going through a proxy and preventing it from being treated as an internal request?
By default, Whistle treats all requests sent to the proxy port (e.g., 127.0.0.1:8899) as internal management requests. You can use the `/-/` path prefix to bypass internal request detection. For example:
1. `http://127.0.0.1:8899/-/xxx`: Whistle automatically converts the request to a normal request `http://127.0.0.1:8899/xxx`
2. Configure a rule to forward the request to the target URL:

``` txt
http://127.0.0.1:8899/xxx https://www.test.com/xxx
```

## Q: How do Rules support multiple selections?

Open the Settings dialog box in the Rules interface and check `Use multiple rules`.

## Q: How do I match rules based on request content?

Use filters:
- [includeFilter](./rules/includeFilter)
- [excludeFilter](./rules/excludeFilter)

## Q: Why can't I open HTTPS pages on iOS even after installing the root certificate?

Check whether "Full Trust" is set: Settings → General → About This Device → Certificate Trust Settings

## Q: Why can't I open HTTPS pages on Android even after installing the root certificate?
1. SSL Pinning Issue
   - Do not decrypt HTTPS requests for this domain: `domain disable://capture` or only for requests from a specific client: `domain disable://capture includeFilter://reqH.user-agent=/xiaomi/i`
   - Run the client on a system or emulator that can circumvent SSL Pinning
   - Find other circumvention measures: https://blog.csdn.net/chiehfeng/article/details/134033846
2. If this is your company's app, refer to the [Android Development Documentation](https://developer.android.com/training/articles/security-config#base-config) to enable trust for user-defined root certificates.

## Q: How do I set a username and password for requests forwarded by Whistle? 1. Whistle internal request authentication: `w2 start -n username -w password` or develop your own plugin (./extensions/dev) to prevent unauthorized access to rules and configurations.
2. Proxy request permission control: Requires the plugin [whistle.proxyauth](https://github.com/whistle-plugins/whistle.proxyauth) or develop your own plugin (./extensions/dev).

## Q: How do I add a custom certificate? {#custom-certs}

Go to the certificate management page
1. Click HTTPS > View Custom Certs > Upload in the top menu bar
2. Upload the certificate file
   - Certificate file: Must use the `.crt` suffix
   - Private key file: Must use the `.key` suffix
   > File name requirements:
   >
   > Standard domain name certificate
   >
   > `example.com.crt` ↔ `example.com.key`
   >
   > Root certificate (must be named precisely)
   >
   > `root.crt` ↔ `root.key`

## Q: Version update issue {#update}
> For the client version, simply download and install the latest version: https://github.com/avwo/whistle-client

**Command line version update:**
``` sh
npm i -g whistle && w2 restart
```
> If you encounter slow installation or installation failures, try changing the mirror: `npm i -g whistle --registry=https://registry.npmmirror.com && w2 restart`
>
> If you encounter permission issues, add `sudo`:
>
> ``` sh
> sudo npm i -g whistle
> w2 restart
> ```

After restarting, the Whistle version displayed in the command line may not match the currently installed version. This may be due to a Node.js version update that changed your PATH.

**Solution:**
1. Verify the version:
  ``` sh
  w2 -V
  ```
2. Find the command path (common to all systems)
  ``` sh
  which w2 # Linux/Mac
  where w2 # Windows
  ```
3. Clear conflicts
  ``` sh
  # Delete the old version (based on the path found in the previous step)

  rm -f /usr/local/bin/w2 # Example path

  # Windows example (requires administrator privileges)
  del "C:\Program Files\nodejs\w2.cmd"
  ```
4. Resume the operation and, after completion, execute `w2 -V` to check if the version is updated:
   - If the output version still has issues, repeat the above steps.
   - If the `w2` command cannot be found, manually configure the PATH.


## Q: How to filter out frequent polling requests in the packet capture interface?

Frequent polling requests (such as heartbeat detection or status reporting) can flood the screen and interfere with the analysis of primary requests. You can quickly hide them by following these steps:

Locate any polling request in the packet list, then right-click and select the appropriate filtering rule from the context menu:
- `Settings / Exclude All Matching Hosts`: Hides all requests from the corresponding domain (effective only for the current browser session).
- `Settings / Exclude All Matching URLs`: Hides all requests matching the current URL (excluding query parameters, and effective only for the current browser session).

## Q: How do I modify Whistle documentation?

Whistle documentation source file address: https://github.com/avwo/whistle/tree/master/docs

Start the documentation server locally:
``` sh
npm run docs:dev
```
## Q: How can I report an issue?

New issue: https://github.com/avwo/whistle/issues
