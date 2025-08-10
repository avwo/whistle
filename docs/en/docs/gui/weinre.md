# Weinre Remote Debugging

Weinre (Web Inspector Remote) is a webpage remote debugging tool integrated with Whistle, allowing developers to debug webpages on mobile devices directly from their computers.

<img src="/img/weinre.png" alt="Weinre Menu" width="1000" />

## Usage
1. Configure the debugging rule. Add the following to the Whistle rule configuration:
    ``` txt
    pattern weinre://your-debug-id
    ```
2. Visit the target page
   - Open/refresh the page you want to debug on your mobile device
   - Ensure your device and debugging computer are on the same network
3. Find the Weinre option in the Whistle top menu bar
   - Hover your mouse and select the "your-debug-id" submenu you set
   - Click to open the Weinre debugging page
4. You can set separate debug-ids for different pages to enable parallel debugging:
    ``` txt
    mobile.example.com weinre://mobile-debug
    tablet.example.com weinre://tablet-debug
    ```

<img src="/img/weinre-menu.png" width="300" />
