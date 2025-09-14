# Using Plugins

## Installing Plugins

1. Click the Plugins tab in the left navigation bar.
2. Click the Install button at the top.
3. Enter the plugin name in the pop-up window (multiple plugins can be installed simultaneously):
   - Separate multiple plugins with spaces or line breaks.
   - You can specify a custom npm mirror:
   - Simply add `--registry=mirror_url` after the plugin name.
   - Or select a previously used mirror from the drop-down list.

<img width="1000" alt="install plugins" src="/img/install-plugins.png" />

> Redundant content in the text box will not affect the operation result. Whistle will automatically filter and extract only the plugin name and registry installation information. If the dialog box does not show an Install button, please reinstall the global Node.js: https://nodejs.org/

After successful installation, wait a moment for the newly installed plugin to appear in the plugin list:

<img width="1000" alt="plugins" src="/img/plugin-list.png" />

## Custom Protocols

Each plugin can register two protocol types, configured the same way as regular protocols:
``` txt
# Long Protocol
pattern whistle.plugin-name://value [inludeFilter://pattern1 ... excludeFilter://pattern2 ...]
# Short Protocol
pattern plugin-name://value [inludeFilter://pattern1 ... excludeFilter://pattern2 ...]
```

## Hooks

Whistle connects requests matching plugin rules with the corresponding plugin hooks, enabling the following functionality:
> For specific functionality of plugin protocols, refer to the help documentation for each plugin. Plugins can also choose to hide these protocols.
1. Automatically generate and issue HTTPS certificates
2. Authenticate proxy requests, requiring users to provide credentials for access
3. Real-time access to metadata such as request headers and response status codes
4. Dynamically set rules for requests
5. Forward requests to plugins, giving them full control over the request processing flow (requires matching the short protocol for this to work)

## Pipe Functionality
Some request/response content may be encrypted or Protobuf serialization prevents you from viewing the plaintext. You can view and modify the content in the following two ways:
1. **Plugin Full Control**
   - Directly forwards the request to the plugin
   - The plugin has complete control over the processing flow
   - Notes:
   - Whistle's built-in rules will be ineffective
   - The plugin must implement all processing logic on its own
   - To display decrypted content in the packet capture interface, the plugin must call the Whistle API to return the data
2. **Pipeline Streaming (Recommended)**
   - Establish a processing pipeline using the pipe protocol
   - Request/Response Flow:
   - Upon entering Whistle: Plugin decrypts
   - Upon leaving Whistle: Plugin encrypts
   - Advantages:
   - Maintains plaintext request characteristics
   - Full support for Whistle's built-in rules
   - Plaintext can be viewed directly in the packet capture interface

**Technical Notes:**
- The pipe streaming feature is optional. Please refer to the documentation for each plugin for support.
- Requests processed in Option 2 are identical to normal plaintext requests

## User Interface

#### Accessing the Plugin User Interface
In Whistle In the plugin management panel, you can access plugin functionality in any of the following ways:
1. Click the `Options` button to the right of a plugin entry
2. Click the plugin name directly in the plugin list

#### Interface Features
**Display Format:** Modal Dialog Box or Standalone Tab

**Core Capabilities:**
1. Provides visual configuration and management capabilities
2. Supports real-time interaction with the Whistle core
3. Displays plugin status, request statistics, log information, etc.

#### Technical Description
1. A plugin is essentially an HTTP server that interacts directly with Whistle
2. Each plugin implements its own user interface functionality
3. A plugin may choose not to provide a user interface (providing only backend services or command-line operations)

### Extending the Whistle Interface

Plugins can enhance the Whistle user interface in the following ways:

#### Network Extensions
1. Capture List Context Menu
    > Add custom actions to the right-click menu of a capture list item
2. Main View Tabs
    > Create a first-level function tab in the main panel on the right.
2. Inspectors Analysis Tool Extension
    > Add the following to the Inspectors panel:
    > - Second-level function tab
    > - Third-level detail view tab
3. Composer Request Builder Extension
    > Add a second-level function tab to the Composer tool area
4. Tools Toolset Extension
    > Add a second-level function tab to the Tools ribbon

#### Rules Extension
Left-side List Context Menu
> Add a function item to the right-click menu of the rule file list on the left.

#### Values Extension
Left-side List Context Menu
> Add a function item to the right-click menu of the variable file list on the left.

**Implementation Notes:**
- Each plugin can select the appropriate extension location based on its functional requirements.
- For specific extension functions and implementation methods, please refer to the development documentation of each plugin.
- Unused extension points will not affect the plugin's basic functionality.

## Plugin Built-in Rules

Plugins support extending system functionality through the following rule files:

1. **Global Rules (rules.txt)**
   - Automatically loaded when: During plugin initialization
   - Scope: Global requests
   - Priority: Lower than rules configured in the Rules interface
   - Typical use: Plugin default rule configuration
2. **Private Rules (_rules.txt)**
   - Triggering Condition: Requests matching the plugin's custom protocol
   - Effective Phase: Request processing flow
   - Execution Order: Applied after global rules
   - Typical use: Request pre-processing/rewriting
3. **Response Phase Rules (resRules.txt)**
   - Triggering Condition: Requests matching the plugin's custom protocol
   - Effective Phase: Response processing flow
   - Execution Order: Applied after global rules
   - Typical use: Response post-processing/rewriting

The plugin supports a flexible built-in rule configuration mechanism:
- **Optionality:** All built-in rules are optional
- **On-demand Configuration:** Plugins only need to declare necessary rules
- **Viewing Rules:** All rules configured in the plugin can be viewed through the Rules button in the plugin management interface
> Note: Plugins without configured rules can still function normally.

## Updating and Uninstalling Plugins

**In Whistle In the plugin management interface:** 
- **Update a plugin:** Click the `Update` button to the right of the plugin entry
- **Uninstall a plugin:** Click the `Uninstall` button to the right of the plugin entry
