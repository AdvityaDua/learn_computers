"use client";

import React, {
  KeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/* ══════════════════════════════════════════════════════════════════════════════
   MARKDOWN RENDERER
   ══════════════════════════════════════════════════════════════════════════ */

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineRender(raw: string): string {
  return escHtml(raw)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/`([^`]+)`/g, '<code class="mde-icode">$1</code>')
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a class="mde-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

function inlineRenderWithImages(raw: string): string {
  /* images must be processed before links since syntax overlaps */
  return escHtml(raw)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    .replace(/`([^`]+)`/g, '<code class="mde-icode">$1</code>')
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img class="mde-img" src="$2" alt="$1" loading="lazy">',
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a class="mde-link" href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
    );
}

export function renderMarkdown(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    /* ── fenced code block ── */
    if (/^```/.test(line)) {
      const lang = escHtml(line.slice(3).trim());
      const code: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      out.push(
        `<pre class="mde-pre"><code${lang ? ` class="mde-lang" data-lang="${lang}"` : ""}>${escHtml(code.join("\n"))}</code></pre>`,
      );
      i++;
      continue;
    }

    /* ── horizontal rule ── */
    if (/^(---+|\*\*\*+|___+)\s*$/.test(line)) {
      out.push('<hr class="mde-hr">');
      i++;
      continue;
    }

    /* ── headings ── */
    const hm = line.match(/^(#{1,6})\s+(.+)$/);
    if (hm) {
      const lvl = hm[1].length;
      out.push(`<h${lvl} class="mde-h mde-h${lvl}">${inlineRender(hm[2])}</h${lvl}>`);
      i++;
      continue;
    }

    /* ── blockquote ── */
    if (line.startsWith("> ") || line === ">") {
      const bqLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
        bqLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      out.push(`<blockquote class="mde-bq">${inlineRenderWithImages(bqLines.join(" "))}</blockquote>`);
      continue;
    }

    /* ── unordered list ── */
    if (/^[-*+] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(`<li class="mde-li">${inlineRenderWithImages(lines[i].replace(/^[-*+] /, ""))}</li>`);
        i++;
      }
      out.push(`<ul class="mde-ul">${items.join("")}</ul>`);
      continue;
    }

    /* ── ordered list ── */
    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(`<li class="mde-li">${inlineRenderWithImages(lines[i].replace(/^\d+\. /, ""))}</li>`);
        i++;
      }
      out.push(`<ol class="mde-ol">${items.join("")}</ol>`);
      continue;
    }

    /* ── blank line ── */
    if (line.trim() === "") {
      out.push('<div class="mde-spacer"></div>');
      i++;
      continue;
    }

    /* ── paragraph ── */
    out.push(`<p class="mde-p">${inlineRenderWithImages(line)}</p>`);
    i++;
  }

  return out.join("\n");
}

/* ══════════════════════════════════════════════════════════════════════════════
   TEXT MANIPULATION HELPERS
   ══════════════════════════════════════════════════════════════════════════ */

interface InsertResult {
  value: string;
  selStart: number;
  selEnd: number;
}

function wrap(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder = "text",
): InsertResult {
  const selected = value.slice(start, end);

  /* If the selection is already wrapped, unwrap it */
  if (
    value.slice(start - before.length, start) === before &&
    value.slice(end, end + after.length) === after
  ) {
    const newVal =
      value.slice(0, start - before.length) +
      selected +
      value.slice(end + after.length);
    return {
      value: newVal,
      selStart: start - before.length,
      selEnd: end - before.length,
    };
  }

  const inner = selected || placeholder;
  const newVal = value.slice(0, start) + before + inner + after + value.slice(end);
  return {
    value: newVal,
    selStart: start + before.length,
    selEnd: start + before.length + inner.length,
  };
}

function prependLines(
  value: string,
  start: number,
  end: number,
  prefix: string,
): InsertResult {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const lineEnd = value.indexOf("\n", end);
  const endIdx = lineEnd === -1 ? value.length : lineEnd;

  const block = value.slice(lineStart, endIdx);
  const alreadyPrefixed = block
    .split("\n")
    .every((l) => l.startsWith(prefix));

  const newBlock = alreadyPrefixed
    ? block
      .split("\n")
      .map((l) => l.slice(prefix.length))
      .join("\n")
    : block
      .split("\n")
      .map((l) => prefix + l)
      .join("\n");

  const delta = newBlock.length - block.length;
  const newVal = value.slice(0, lineStart) + newBlock + value.slice(endIdx);
  return {
    value: newVal,
    selStart: start + (alreadyPrefixed ? -prefix.length : prefix.length),
    selEnd: end + delta,
  };
}

function insertAtLineStart(
  value: string,
  start: number,
  end: number,
  text: string,
): InsertResult {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const newVal = value.slice(0, lineStart) + text + value.slice(lineStart);
  const delta = text.length;
  return { value: newVal, selStart: start + delta, selEnd: end + delta };
}

function insertBlock(
  value: string,
  start: number,
  _end: number,
  block: string,
  cursorOffset: number,
): InsertResult {
  const before = value.slice(0, start);
  const after = value.slice(start);
  const sep = before.length && !before.endsWith("\n") ? "\n" : "";
  const newVal = before + sep + block + after;
  const pos = before.length + sep.length + cursorOffset;
  return { value: newVal, selStart: pos, selEnd: pos };
}

/* ══════════════════════════════════════════════════════════════════════════════
   TOOLBAR BUTTON TYPES
   ══════════════════════════════════════════════════════════════════════════ */

type ActionFn = (
  value: string,
  selStart: number,
  selEnd: number,
) => InsertResult;

interface ToolbarItem {
  id: string;
  label: string;
  title: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: ActionFn;
  separator?: boolean;
}

const TOOLBAR_GROUPS: ToolbarItem[][] = [
  /* Headings */
  [
    {
      id: "h1", label: "H1", title: "Heading 1",
      icon: <span style={{ fontFamily: "serif", fontWeight: 900, fontSize: "0.875rem" }}>H<sub>1</sub></span>,
      action: (v, s, e) => insertAtLineStart(v, s, e, "# "),
    },
    {
      id: "h2", label: "H2", title: "Heading 2",
      icon: <span style={{ fontFamily: "serif", fontWeight: 900, fontSize: "0.875rem" }}>H<sub>2</sub></span>,
      action: (v, s, e) => insertAtLineStart(v, s, e, "## "),
    },
    {
      id: "h3", label: "H3", title: "Heading 3",
      icon: <span style={{ fontFamily: "serif", fontWeight: 900, fontSize: "0.875rem" }}>H<sub>3</sub></span>,
      action: (v, s, e) => insertAtLineStart(v, s, e, "### "),
    },
  ],
  /* Inline */
  [
    {
      id: "bold", label: "B", title: "Bold (Ctrl+B)",
      icon: <strong style={{ fontSize: "0.9375rem", fontFamily: "serif" }}>B</strong>,
      action: (v, s, e) => wrap(v, s, e, "**", "**", "bold text"),
    },
    {
      id: "italic", label: "I", title: "Italic (Ctrl+I)",
      icon: <em style={{ fontSize: "0.9375rem", fontFamily: "serif", fontStyle: "italic" }}>I</em>,
      action: (v, s, e) => wrap(v, s, e, "*", "*", "italic text"),
    },
    {
      id: "strike", label: "S", title: "Strikethrough",
      icon: <del style={{ fontSize: "0.8125rem", fontFamily: "serif" }}>S</del>,
      action: (v, s, e) => wrap(v, s, e, "~~", "~~", "text"),
    },
  ],
  /* Code */
  [
    {
      id: "inlinecode", label: "`code`", title: "Inline Code (Ctrl+`)",
      icon: (
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      ),
      action: (v, s, e) => wrap(v, s, e, "`", "`", "code"),
    },
    {
      id: "codeblock", label: "```", title: "Code Block",
      icon: (
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M8 10l-3 2 3 2M16 10l3 2-3 2M11 16l2-8" />
        </svg>
      ),
      action: (v, s, e) => {
        const sel = v.slice(s, e);
        const block = "```\n" + (sel || "// code here") + "\n```\n";
        const newVal = v.slice(0, s) + block + v.slice(e);
        return { value: newVal, selStart: s + 4, selEnd: s + 4 + (sel || "// code here").length };
      },
    },
  ],
  /* Lists */
  [
    {
      id: "ul", label: "Bullet list", title: "Bullet List",
      icon: (
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" />
          <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      ),
      action: (v, s, e) => prependLines(v, s, e, "- "),
    },
    {
      id: "ol", label: "Numbered list", title: "Numbered List",
      icon: (
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
          <path d="M4 6h1v4" /><path d="M4 10h2" />
          <path d="M4 15h1.5a.5.5 0 0 1 0 1H4.5a.5.5 0 0 0 0 1H6" />
        </svg>
      ),
      action: (v, s, e) => prependLines(v, s, e, "1. "),
    },
  ],
  /* Block elements */
  [
    {
      id: "blockquote", label: "Quote", title: "Blockquote",
      icon: (
        <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
          <path d="M14.017 21v-7.391c0-5.704 3.748-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-10zm-14 0v-7.391c0-5.704 3.748-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h3.983v10H.017z" />
        </svg>
      ),
      action: (v, s, e) => prependLines(v, s, e, "> "),
    },
    {
      id: "hr", label: "Divider", title: "Horizontal Rule",
      icon: (
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      action: (v, s, e) => insertBlock(v, s, e, "\n---\n\n", 5),
    },
    {
      id: "link", label: "Link", title: "Link (Ctrl+K)",
      icon: (
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      ),
      action: (v, s, e) => {
        const sel = v.slice(s, e) || "link text";
        const inserted = `[${sel}](url)`;
        const newVal = v.slice(0, s) + inserted + v.slice(e);
        /* select just "url" */
        const urlStart = s + sel.length + 3;
        return { value: newVal, selStart: urlStart, selEnd: urlStart + 3 };
      },
    },
  ],
];

/* flat map for keyboard shortcut lookup */
const SHORTCUT_MAP: Record<string, ActionFn> = {};
for (const group of TOOLBAR_GROUPS) {
  for (const item of group) {
    if (item.shortcut) SHORTCUT_MAP[item.shortcut] = item.action;
  }
}

/* ══════════════════════════════════════════════════════════════════════════════
   TOOLBAR COMPONENT
   ══════════════════════════════════════════════════════════════════════════ */

function Toolbar({
  onAction,
  disabled,
}: {
  onAction: (fn: ActionFn) => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "0.25rem",
        padding: "0.4rem 0.625rem",
        background: "var(--surface-soft)",
        borderBottom: "1px solid var(--border)",
        userSelect: "none",
      }}
    >
      {TOOLBAR_GROUPS.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 && (
            <div
              style={{
                width: 1, height: 22, background: "var(--border)",
                margin: "0 0.1rem", flexShrink: 0,
              }}
            />
          )}
          {group.map((item) => (
            <button
              key={item.id}
              type="button"
              title={item.title}
              disabled={disabled}
              onMouseDown={(e) => {
                e.preventDefault(); /* don't steal textarea focus */
                onAction(item.action);
              }}

              style={{
                background: "none", border: "1px solid transparent", cursor: disabled ? "not-allowed" : "pointer",
                borderRadius: "0.35rem", padding: "0.25rem 0.45rem",
                color: disabled ? "var(--border)" : "var(--muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                minWidth: 28, height: 26, transition: "background 0.12s, color 0.12s, border-color 0.12s",
                fontSize: "0.75rem",
              }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
                  (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "none";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--muted)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
              }}
            >
              {item.icon}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PREVIEW PANEL
   ══════════════════════════════════════════════════════════════════════════ */

function Preview({ html, empty }: { html: string; empty: boolean }) {
  return (
    <div
      style={{
        flex: 1, overflowY: "auto", padding: "1rem 1.25rem",
        background: "var(--surface)", minHeight: 0,
      }}
    >
      {empty ? (
        <p style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.875rem", margin: 0 }}>
          Nothing to preview — start writing in the editor.
        </p>
      ) : (
        <div
          className="mde-preview"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   STATUS BAR
   ══════════════════════════════════════════════════════════════════════════ */

function StatusBar({ value }: { value: string }) {
  const lines = value.split("\n").length;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  const chars = value.length;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "1rem",
        padding: "0.3rem 0.75rem",
        background: "var(--surface-soft)", borderTop: "1px solid var(--border)",
        fontSize: "0.7rem", color: "var(--muted)",
        userSelect: "none", flexShrink: 0,
      }}
    >
      <span>{lines} line{lines !== 1 ? "s" : ""}</span>
      <span>{words} word{words !== 1 ? "s" : ""}</span>
      <span>{chars} char{chars !== 1 ? "s" : ""}</span>
      <span style={{ marginLeft: "auto" }}>Markdown</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN EDITOR
   ══════════════════════════════════════════════════════════════════════════ */

export type EditorMode = "write" | "split" | "preview";

export interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  /** Controlled external mode (optional) */
  mode?: EditorMode;
  onModeChange?: (m: EditorMode) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  /**
   * If provided, the toolbar shows an "Insert Image" button.
   * The callback receives a File and must return the public URL string.
   */
  onImageUpload?: (file: File) => Promise<string>;
  maxHeight?: number | string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content in Markdown…",
  minHeight = 260,
  mode: externalMode,
  onModeChange,
  disabled,
  autoFocus,
  onImageUpload,
  maxHeight,
}: MarkdownEditorProps) {
  const [internalMode, setInternalMode] = useState<EditorMode>("write");
  const mode = externalMode ?? internalMode;

  const [imageUploading, setImageUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const setMode = (m: EditorMode) => {
    setInternalMode(m);
    onModeChange?.(m);
  };

  const taRef = useRef<HTMLTextAreaElement>(null);
  const previewHtml = renderMarkdown(value);

  /* ── Apply action from toolbar or keyboard shortcut ── */
  const applyAction = useCallback(
    (fn: ActionFn) => {
      const ta = taRef.current;
      if (!ta) return;

      const { selectionStart: s, selectionEnd: e } = ta;
      const result = fn(value, s, e);
      onChange(result.value);

      /* Restore selection after React re-renders the textarea */
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(result.selStart, result.selEnd);
      });
    },
    [value, onChange],
  );

  /* ── Keyboard shortcuts & Tab handling ── */
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const mod = e.ctrlKey || e.metaKey;

    /* Tab → indent 2 spaces */
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const s = ta.selectionStart;
      const e2 = ta.selectionEnd;

      if (e.shiftKey) {
        /* unindent */
        const lineStart = value.lastIndexOf("\n", s - 1) + 1;
        if (value.slice(lineStart, lineStart + 2) === "  ") {
          const newVal = value.slice(0, lineStart) + value.slice(lineStart + 2);
          onChange(newVal);
          requestAnimationFrame(() => {
            ta.setSelectionRange(Math.max(lineStart, s - 2), Math.max(lineStart, e2 - 2));
          });
        }
      } else {
        const newVal = value.slice(0, s) + "  " + value.slice(e2);
        onChange(newVal);
        requestAnimationFrame(() => { ta.setSelectionRange(s + 2, s + 2); });
      }
      return;
    }

    if (mod && e.key === "b") { e.preventDefault(); applyAction((v, s, e) => wrap(v, s, e, "**", "**", "bold text")); return; }
    if (mod && e.key === "i") { e.preventDefault(); applyAction((v, s, e) => wrap(v, s, e, "*", "*", "italic text")); return; }
    if (mod && e.key === "k") { e.preventDefault(); applyAction(TOOLBAR_GROUPS[4][2].action); return; }
    if (mod && e.key === "`") { e.preventDefault(); applyAction((v, s, e) => wrap(v, s, e, "`", "`", "code")); return; }
  };

  /* ── auto-grow textarea height ── */
  /* ── image upload handler ── */
  const handleImageFile = useCallback(
    async (file: File) => {
      if (!onImageUpload) return;
      setImageUploading(true);
      try {
        const url = await onImageUpload(file);
        const ta = taRef.current;
        const s = ta ? ta.selectionStart : value.length;
        const e = ta ? ta.selectionEnd : value.length;
        const snippet = `![${file.name.replace(/\.[^.]+$/, "")}](${url})`;
        const newVal = value.slice(0, s) + snippet + value.slice(e);
        onChange(newVal);
        requestAnimationFrame(() => {
          ta?.focus();
          ta?.setSelectionRange(s + snippet.length, s + snippet.length);
        });
      } finally {
        setImageUploading(false);
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    },
    [onImageUpload, value, onChange],
  );

  const tryHandleImageFile = useCallback(
    (file?: File) => {
      if (!file || !onImageUpload) return;
      if (!file.type.startsWith("image/")) return;
      void handleImageFile(file);
    },
    [onImageUpload, handleImageFile],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!onImageUpload) return;
      const file = Array.from(e.clipboardData.items)
        .find((item) => item.kind === "file" && item.type.startsWith("image/"))
        ?.getAsFile();
      if (!file) return;
      e.preventDefault();
      tryHandleImageFile(file);
    },
    [onImageUpload, tryHandleImageFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLTextAreaElement>) => {
      if (!onImageUpload) return;
      const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
      if (!file) return;
      e.preventDefault();
      tryHandleImageFile(file);
    },
    [onImageUpload, tryHandleImageFile],
  );

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const nextH = Math.max(minHeight, ta.scrollHeight);
    if (maxHeight && typeof maxHeight === "number" && nextH > maxHeight) {
      ta.style.height = maxHeight + "px";
    } else {
      ta.style.height = nextH + "px";
    }
  }, [value, minHeight, maxHeight]);

  /* ── container style helpers ── */
  const containerStyle: React.CSSProperties = {
    border: "1px solid var(--border)",
    borderRadius: "0.625rem",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    background: "var(--surface)",
    transition: "border-color 0.15s, box-shadow 0.15s",
    maxHeight: maxHeight || "none",
  };

  const editorPaneStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0,
  };

  return (
    <div style={containerStyle} className="mde-container">

      {/* ─── Top bar: toolbar + mode switcher ─── */}
      <div style={{ display: "flex", alignItems: "stretch", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>

        {/* Toolbar (hidden in preview-only mode) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {mode !== "preview" && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <Toolbar onAction={applyAction} disabled={disabled || imageUploading} />
              {onImageUpload && (
                <>
                  <div style={{ width: 1, height: 22, background: "var(--border)", margin: "0 0.25rem", flexShrink: 0 }} />
                  <button
                    type="button"
                    title="Insert Image (uploads and embeds)"
                    disabled={disabled || imageUploading}
                    onMouseDown={(e) => { e.preventDefault(); imageInputRef.current?.click(); }}
                    style={{
                      background: "none", border: "1px solid transparent",
                      cursor: disabled || imageUploading ? "not-allowed" : "pointer",
                      borderRadius: "0.35rem", padding: "0.25rem 0.45rem",
                      color: imageUploading ? "var(--admin-accent)" : "var(--muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      minWidth: 28, height: 26, transition: "background 0.12s, color 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled && !imageUploading) {
                        (e.currentTarget as HTMLButtonElement).style.background = "var(--surface)";
                        (e.currentTarget as HTMLButtonElement).style.color = "var(--foreground)";
                        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "none";
                      (e.currentTarget as HTMLButtonElement).style.color = imageUploading ? "var(--admin-accent)" : "var(--muted)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                    }}
                  >
                    {imageUploading ? (
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.2" style={{ animation: "mde-spin 1s linear infinite" }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleImageFile(f);
                    }}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* Mode switcher */}
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          padding: "0.35rem 0.5rem",
          background: "var(--surface-soft)",
          borderLeft: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          {(["write", "split", "preview"] as EditorMode[]).map((m) => {
            const labels: Record<EditorMode, React.ReactNode> = {
              write: (
                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              ),
              split: (
                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <rect x="2" y="3" width="20" height="18" rx="2" />
                  <line x1="12" y1="3" x2="12" y2="21" />
                </svg>
              ),
              preview: (
                <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ),
            };

            return (
              <button
                key={m}
                type="button"
                title={m.charAt(0).toUpperCase() + m.slice(1)}
                onClick={() => setMode(m)}
                style={{
                  background: mode === m ? "var(--surface)" : "none",
                  border: mode === m ? "1px solid var(--border)" : "1px solid transparent",
                  borderRadius: "0.3rem",
                  padding: "0.2rem 0.35rem",
                  cursor: "pointer",
                  color: mode === m ? "var(--admin-accent-text)" : "var(--muted)",
                  display: "flex", alignItems: "center",
                  transition: "all 0.12s",
                  boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {labels[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Editor / Preview area ─── */}
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight,
          maxHeight: maxHeight ? (typeof maxHeight === 'number' ? maxHeight - 80 : maxHeight) : "none",
          overflow: "hidden",
        }}
      >
        {/* ── Write pane ── */}
        {(mode === "write" || mode === "split") && (
          <div style={{ ...editorPaneStyle, borderRight: mode === "split" ? "1px solid var(--border)" : "none" }}>
            <textarea
              ref={taRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={(e) => {
                if (onImageUpload) e.preventDefault();
              }}
              placeholder={placeholder}
              disabled={disabled}
              autoFocus={autoFocus}
              spellCheck
              style={{
                flex: 1,
                width: "100%",
                padding: "1rem 1.125rem",
                border: "none",
                outline: "none",
                resize: "none",
                background: "var(--surface)",
                color: "var(--foreground)",
                fontFamily: "var(--font-geist-mono, 'Courier New', 'Fira Mono', monospace)",
                fontSize: "0.8125rem",
                lineHeight: 1.75,
                minHeight,
                overflowY: "auto",
                caretColor: "var(--admin-accent)",
                boxSizing: "border-box",
              }}
            />
          </div>
        )}

        {/* ── Preview pane ── */}
        {(mode === "preview" || mode === "split") && (
          <div style={{ ...editorPaneStyle, overflow: "auto", minHeight }}>
            <Preview html={previewHtml} empty={!value.trim()} />
          </div>
        )}
      </div>

      {/* ─── Status bar ─── */}
      <StatusBar value={value} />

      {/* ─── Global styles for preview ─── */}
      <style>{`
        .mde-container:focus-within {
          border-color: var(--admin-accent) !important;
          box-shadow: 0 0 0 3px var(--admin-accent-ring) !important;
        }

        /* Preview typography */
        .mde-preview { font-size: 0.875rem; line-height: 1.8; color: var(--foreground); }
        .mde-preview .mde-h  { line-height: 1.3; color: var(--foreground); margin: 0; }
        .mde-preview .mde-h1 { font-size: 1.5rem; font-weight: 800; padding-bottom: .4rem; border-bottom: 2px solid var(--border); margin-bottom: .75rem; margin-top: 1.25rem; }
        .mde-preview .mde-h2 { font-size: 1.2rem; font-weight: 700; padding-bottom: .25rem; border-bottom: 1px solid var(--border); margin-bottom: .625rem; margin-top: 1rem; }
        .mde-preview .mde-h3 { font-size: 1rem; font-weight: 700; margin-bottom: .5rem; margin-top: .875rem; }
        .mde-preview .mde-h4 { font-size: .9375rem; font-weight: 700; margin-bottom: .375rem; margin-top: .75rem; }
        .mde-preview .mde-p  { margin: .5em 0; }
        .mde-preview .mde-ul, .mde-preview .mde-ol { margin: .5em 0 .5em 1.5rem; padding: 0; }
        .mde-preview .mde-li { margin: .25em 0; }
        .mde-preview .mde-ul .mde-li { list-style: disc; }
        .mde-preview .mde-ol .mde-li { list-style: decimal; }
        .mde-preview .mde-bq {
          margin: .75em 0; padding: .5em 1em;
          border-left: 3px solid var(--admin-accent);
          background: var(--admin-accent-soft); border-radius: 0 .5em .5em 0;
          color: var(--admin-accent-text); font-style: italic;
        }
        .mde-preview .mde-pre {
          margin: .75em 0; padding: 1em 1.125em;
          background: var(--surface-soft); border: 1px solid var(--border);
          border-radius: .625em; overflow-x: auto; position: relative;
        }
        .mde-preview .mde-pre code {
          font-family: var(--font-geist-mono, 'Courier New', monospace);
          font-size: .8125rem; line-height: 1.65; color: var(--foreground);
          white-space: pre;
        }
        .mde-preview .mde-pre .mde-lang::before {
          content: attr(data-lang);
          position: absolute; top: .45em; right: .75em;
          font-size: .65rem; font-weight: 700; letter-spacing: .06em;
          text-transform: uppercase; color: var(--muted); font-family: sans-serif;
        }
        .mde-preview .mde-img {
          max-width: min(100%, 860px);
          width: auto;
          height: auto;
          border-radius: .6rem;
          margin: .65em 0;
          display: block;
          border: 1px solid var(--border);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }
        @keyframes mde-spin { to { transform: rotate(360deg); } }
        .mde-preview .mde-icode {
          font-family: var(--font-geist-mono, monospace);
          font-size: .8125em; padding: .15em .4em;
          background: var(--surface-soft); border: 1px solid var(--border);
          border-radius: .3em; color: var(--admin-accent-text);
        }
        .mde-preview .mde-link {
          color: var(--admin-accent); text-decoration: underline;
          text-underline-offset: 2px;
        }
        .mde-preview .mde-hr {
          border: none; border-top: 2px solid var(--border);
          margin: 1.25em 0;
        }
        .mde-preview .mde-spacer { height: .5em; }
      `}</style>
    </div>
  );
}
