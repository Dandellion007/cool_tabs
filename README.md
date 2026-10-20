# Cool Tabs

- A small VS Code extension that adds markdown list helpers.

## Features (markdown files only)

- **Make a line a bullet item** — `Cmd+Shift+L` (mac) / `Ctrl+Shift+L`
  inserts `- ` at the start of the line. If the line is already a list item,
  nothing happens (it is idempotent, not a toggle).
- **Indent a list item** — `Tab` adds one indent level to a list line.
  Repeated presses keep adding levels. On non-list lines it behaves like a
  normal Tab.
- **Outdent a list item** — `Shift+Tab` removes one indent level.

## Install (from a built .vsix)

```bash
npm i -g @vscode/vsce
cd cool_tabs
vsce package --allow-missing-repository
```

This produces `cool-tabs-0.0.1.vsix`. In VS Code: *Extensions* → `...` →
*Install from VSIX…* → pick the file.

## Development (F5)

Open this folder in VS Code and press **F5** (Run Extension). A new
"Extension Development Host" window opens with the extension loaded — create
or open a `.md` file and try the shortcuts.

## Settings

- `coolTabs.indent` — indent unit for Tab / Shift+Tab:
  - `2sp` (default) — two spaces
  - `tab` — one tab character

## Keybinding conflicts

If `Cmd+Shift+L` is already used by another extension, rebind it in
*Keyboard Shortcuts* (`Cmd+K Cmd+S`) by searching for "Cool Tabs".
