# Rules Interface

The Rules interface is the core configuration area of Whistle, used to manage all proxy rules and their grouping.

<img src="/img/rules.png" alt="Rules Interface" width="1000" />

## Basic Interface Functions

| Controls | Functions |
| ------------ | ---------------------------------------------- |
| **ON** | Turns rules on or off. Red: On, Gray: Off |
| **Import** | Imports rules |
| **Export** | Exports rules |
| **Save** | Saves and activates rules |
| **Create** | Creates a new rule/group |
| **Delete** | Deletes a rule/group |
| **Rename** | Renames a rule/group |
| **Settings** | Sets the editing style |
| **Right-Click Menu** | In addition to the above menu functions, plugins are also supported for extended menu functions |

## Advanced Editing Functions

**Temporary File Editing**

``` txt
... protocol://temp/blank.js
```
- `protocol`: [Action protocol](../rules/protocols)
- `temp/blank.js`: A blank temporary file

**Workflow:**
1. Enter the path to the protocol action content (e.g., `file://temp/blank.js`)
2. Ctrl+click (Win) / Cmd+click (Mac) the path
3. Modify the content in the pop-up editor
4. Automatically associate the file with the rule after saving

<img src="/img//temp.png" width="600" />

## Bottom Search Box
| Prefix | Filter Target | Example |
| -------------- | ----------------------------------- | ---------------------------------- |
| `No Prefix` | Rule Name and Content | `test` `/test\d/i` |
| `k:pattern` | Rule Name | `k:test` `k:/test\d/i` |
| `v:pattern` | Rule Content | `v:test` `v:/test\d/i` |
