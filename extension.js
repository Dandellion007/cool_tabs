const vscode = require('vscode');

// A markdown list-item line: optional leading whitespace, a bullet marker
// (-, * or +), then at least one whitespace before the content.
const LIST_LINE_RE = /^\s*[-*+]\s/;

// Capturing version used to strip the bullet marker: [leading whitespace,
// marker, whitespace after the marker, remaining content].
const BULLET_RE = /^(\s*)([-*+])(\s+)(.*)$/;

function getIndentUnit() {
  const mode = vscode.workspace
    .getConfiguration('coolTabs')
    .get('indent', '2sp');
  return mode === 'tab' ? '\t' : '  ';
}

// Line numbers covered by the current selections (deduplicated, sorted).
function affectedLines(editor) {
  const seen = new Set();
  for (const sel of editor.selections) {
    seen.add(sel.start.line);
  }
  return Array.from(seen).sort((a, b) => a - b);
}

function isListLine(doc, lineNo) {
  return LIST_LINE_RE.test(doc.lineAt(lineNo).text);
}

function applyEdits(editor, edits) {
  if (!edits.length) return;
  editor.edit((change) => {
    for (const { range, text } of edits) {
      change.replace(range, text);
    }
  });
}

// ---- Feature 1: toggle the line between a bullet item and a plain line ----
// Plain line -> inserts "- " at column 0. List item -> removes the whole
// bullet prefix (leading indentation + marker + the whitespace after it),
// leaving only the content.
function toggleBullet() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const doc = editor.document;
  const edits = [];
  for (const lineNo of affectedLines(editor)) {
    const m = doc.lineAt(lineNo).text.match(BULLET_RE);
    if (m) {
      const removeEnd = m[1].length + m[2].length + m[3].length;
      edits.push({ range: new vscode.Range(lineNo, 0, lineNo, removeEnd), text: '' });
    } else {
      edits.push({ range: new vscode.Range(lineNo, 0, lineNo, 0), text: '- ' });
    }
  }
  applyEdits(editor, edits);
}

// Standard Tab behavior, used as a fallback for non-list lines so we don't
// break normal tabbing in markdown.
function defaultTab(editor) {
  const opts = editor.options;
  const tab = opts.insertSpaces ? ' '.repeat(opts.tabSize || 4) : '\t';
  const sel = editor.selection;
  if (sel.isEmpty) {
    editor.edit((change) => change.insert(sel.active, tab));
  } else {
    const edits = affectedLines(editor).map((lineNo) => ({
      range: new vscode.Range(lineNo, 0, lineNo, 0),
      text: tab,
    }));
    applyEdits(editor, edits);
  }
}

// ---- Feature 2a: Tab -> add one indent level to list items (cumulative) ----
// Every press prepends one indent unit at column 0, so repeated presses keep
// adding levels. If any affected line is not a list item, we defer to the
// standard Tab instead.
function indentList() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const doc = editor.document;
  const lines = affectedLines(editor);
  if (!lines.length) return;
  if (!lines.every((ln) => isListLine(doc, ln))) {
    defaultTab(editor);
    return;
  }
  const unit = getIndentUnit();
  const edits = lines.map((lineNo) => ({
    range: new vscode.Range(lineNo, 0, lineNo, 0),
    text: unit,
  }));
  applyEdits(editor, edits);
}

// ---- Feature 2b: Shift+Tab -> remove one indent level ----
// Strips exactly one indent unit at column 0 from each affected line, if
// present. Safe no-op on lines without leading indent.
function outdentList() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  const doc = editor.document;
  const unit = getIndentUnit();
  const edits = [];
  for (const lineNo of affectedLines(editor)) {
    const text = doc.lineAt(lineNo).text;
    let removeLen = 0;
    if (unit === '\t') {
      if (text.startsWith('\t')) removeLen = 1;
    } else if (text.startsWith('  ')) {
      removeLen = 2;
    }
    if (removeLen > 0) {
      edits.push({
        range: new vscode.Range(lineNo, 0, lineNo, removeLen),
        text: '',
      });
    }
  }
  applyEdits(editor, edits);
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('coolTabs.toggleBullet', toggleBullet),
    vscode.commands.registerCommand('coolTabs.indentList', indentList),
    vscode.commands.registerCommand('coolTabs.outdentList', outdentList),
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
