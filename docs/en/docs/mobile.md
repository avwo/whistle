# Mobile Packet Capture
Mobile packet capture debugging requires the following configuration:
1. Install the root certificate (required for HTTPS packet capture)
2. Set up the system proxy

## Install the root certificate (required for HTTPS packet capture)

#### Downloading the root certificate:

1. Click the HTTPS button at the top of the Whistle interface. The HTTPS Settings dialog box will pop up.

    <img width="320" alt="HTTPS Settings" src="/img/https-settings.png" />
2. Use your phone's camera to scan the QR code in the dialog box → Click the link that pops up. (If the download fails, try another QR code until the scan succeeds.)

    <img width="320" alt="Scan qrcode" src="/img/https-qrcode.png" />

    > If the native Android browser fails to download, try using Chrome to download the certificate: http://[Computer IP]:[Whistle port]/cgi-bin/rootca, or download the certificate from a PC and transfer it to your phone.
    > 
    > If all QR codes fail to download:
    > - Check that your device and Whistle host are on the same local area network.
    > - Verify that your firewall isn't blocking the proxy port.
3. After the download is successful, record the IP and port number of the QR code address for use in setting up the system proxy. Then, install and trust the root certificate as follows.

#### Installing the Root Trust Certificate:

**iOS**

1. Install the profile
   - Go to: Settings → General → VPN & Device Management
   - Find the "Downloaded Profile" and install it.
2. Enable Full Trust (this step is essential).
   - Go to: Settings → General → About → Certificate Trust Settings
   - Enable Full Trust for the Whistle root certificate.

   <img width="320" alt="Certificate Trust Settings" src="/img/https-trust.png" />

**Android**

1. Go to: Settings → Security → Encryption & Credentials → Install Certificates → CA Certificates
2. Select the downloaded certificate file.
3. Enter your lock screen passcode to confirm.
4. Name the certificate (e.g., "Whistle").

> **Version Differences:**
>
> Android 12+: Requires "More Security Settings"
>
> Huawei EMUI: Requires "Clean Mode" to be disabled first
>
> Other brands: The path may vary slightly
>

## Set up the system proxy
1. Access Wi-Fi settings
   - Go to: Settings → Wi-Fi
   - Tap the icon next to the currently connected network (Android may require long-pressing the Wi-Fi name).
2. Configure a manual proxy
   - Select "Manual" for the proxy type.
   - Server: Enter the IP address from which the certificate QR code was successfully downloaded.
   - Port: Enter the port from which the certificate QR code was successfully downloaded (Whistle defaults to port 8899).
   - Save settings

  <img width="320" alt="Set Proxy" src="/img/proxy-settings.jpg" />

## Successful root certificate installation and proxy setup indicator

1. Accessing the web works fine on my phone.
2. Whistle can capture HTTPS requests.
3. No security warnings appear.

## FAQ

1. Certificate is untrusted.
   - Check that "Full Trust" is set up (iOS).
   - Confirm that the certificate is installed in the correct location (Android).
2. Proxy is not working.
   - Check the "Online" dialog box in the upper right corner of the Whistle interface to see if the IP and port have changed.
   - If you're not sure which IP address is available, try each one.
3. Packet capture fails for a specific app.
   - Check that the app uses a custom certificate.
   - Try adding network configuration to the AndroidManifest.xml file. For details, see: [https://developer.android.com/training/articles/security-config#base-config](https://developer.android.com/training/articles/security-config#base-config)
