# Plugins Screen

The Plugins screen is Whistle's plugin management hub, supporting the full lifecycle of plugins, including installation, configuration, updates, and uninstallation.

<img src="/img/plugins.png" alt="Plugins Interface" width="1000" />

## Basic Interface Functions

| Controls | Functions |
| ------------ | ---- |
| **ON** | Turn all plugins on or off. Red: On, Gray: Off |
| **Install** | Install a plugin. See below for details. |
| **Checkbox** | Whether to enable this plugin |
| **Plugin Name** | Click to open the plugin management interface |
| **Version Number** | Click to open the plugin help documentation |
| **Option** | Click to open the plugin management interface |
| **Rules** | Open the plugin's static rules (rules.txt, reqRules.txt, and resRules.txt files) |
| **Update** | Update a plugin |
| **Uninstall** | Uninstall a plugin |
| **Help** | Click to open the plugin help documentation |
| **Sync** | Synchronize the plugin's Rules and Values |

## Installation Process
1. Click the `Install` button at the top
2. Enter the plugin name (e.g., `whistle.inspect`)
3. Select `npm registry` (default `--registry=https://registry.npmjs.org`)
4. Click `Install` to begin installation

<img width="1000" alt="install plugins" src="/img/install-plugins.png" />

