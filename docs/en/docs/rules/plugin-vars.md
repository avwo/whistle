# `%` Symbol Usage

The plugin management interface allows you to intuitively configure various parameters. For example, you can enable the [whistle.autosave](https://github.com/whistle-plugins/whistle.autosave) plugin to support the following configurations:
- Enable storage of captured packet data
- Configure the directory for storing captured packet data

In addition to the management interface, you can also use the `%` symbol directly in the rule file for quick configuration.

## Global configuration (applies to all requests)
``` txt
%autosave=123
%autosave.enableAutoSave=true
%autosave.storageDir=/User/xxx/test/sessions
```

## Fine-grained configuration (for specific requests)
``` txt
www.test.com/api %autosave=abc
www.test.com/api %autosave.enableAutoSave=false [filters...]
www.test.com/api %autosave.storageDir= [filters...]
```

## Retrieving plugin variable values
In plugin hooks, you can retrieve the configured variable list using the following code:

``` js
req.originalReq.globalPluginVars; // Global variables, such as ['123', 'enableAutoSave=true', 'storageDir=/User/xxx/test/sessions']
req.originalReq.pluginVars; // Variables for fine-grained configuration, such as ['abc', 'enableAutoSave=false', 'storageDir=']
```

## Enable automatic rule prompts
If the configuration items via plugin variables are fixed, you can configure optional options in the `whistleConfig` field in the plugin's `package.json`, so that automatic prompts can be added to the rules:

#### Simple Prompt
``` json
{
  "name": "@scope/whistle.test-plugin-vars",
  ...
  "whistleConfig": {
    "pluginVars": true,
  ...
}
```
After completing the above configuration, when you type the `%` character in the Whistle Rules editor, a plugin variable in the following format will be automatically suggested:
``` txt
%test-plugin-vars=
```

#### Anonymous Key Value Hints
``` js
{
  "name": "@scope/whistle.test-plugin-vars",
  ...
  "whistleConfig": {
    "pluginVars": {
      "hintList": [
        "test1",
        "test2",
        "test3"
      ]
    }
  },
  ...
}
```

<img src="/img/plugin-vars-hint-list.png" width="260" />

Value and display content separated:

``` js
{
  "name": "@scope/whistle.test-plugin-vars",
  ...
  "whistleConfig": {
    "pluginVars": {
      "hintList": [
        {
          "text": "test1",
          "displayText": "displayText1"
        },
        {
          "text": "test2",
          "displayText": "displayText2"
        },
        {
          "text": "test3",
          "displayText": "displayText3",
          "help": "https://www.example.com/path"
        }
      ]
    }
  }
  ...
}
```
> Both `displayText` and `help` are optional. When configuring `help: Help Link`, when the hint is selected, press `F1` on the keyboard. key automatically opens the help link

<img src="/img/plugin-vars-display-list.png" width="220" />

#### Setting the Key Name
``` js
{
  "name": "@scope/whistle.test-plugin-vars",
  ...
  "whistleConfig": {
    "pluginVars": {
    "hintList": [
      {
        "text": "test1",
        "displayText": "displayText1"
      },
      {
        "text": "test2",
        "displayText": "displayText2"
      },
      {
        "text": "test3",
        "displayText": "displayText3",
        "help": "https://www.example.com/path"
      }
    ],
    "hintSuffix": [
      "=",
      ".key1=123",
      ".key2"
    ]
  }
}
...
}
```
<img src="/img/plugin-vars-key-hint.png" width="300" />

Selecting `%test-plugin-vars=` will automatically display the contents of `hintList`:

<img src="/img/plugin-vars-display-list.png" width="220" />

#### Using the backend interface

``` js
{
  "name": "@scope/whistle.test-plugin-vars",
  ...
  "whistleConfig": {
    "pluginVars": {
    "hintSuffix": [
      "=",
      ".key1=123",
      ".key2"
    ],
    "hintUrl": "/cgi-bin/plugin-vars"
  }
  }
  ...
}
```
> `hintList` and `hintUrl` They are mutually exclusive; only one can be used at a time. `hintSuffix` is optional.

<img src="/img/plugin-vars-hint-url1.png" width="360" />

<img src="/img/plugin-vars-hint-url2.png" width="360" />

For the implementation of `/cgi-bin/plugin-vars`, refer to the [Plugin Development Documentation](../extensions/dev#rules-hint)
