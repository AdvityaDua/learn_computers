"use client";

import React, { useRef, useState } from "react";

type FileType = "video" | "pdf" | "image" | "other";

interface Upload {
  id: string;
  name: string;
  type: FileType;
  size: string;
  uploaded: string;
  url?: string;
}

const INITIAL: Upload[] = [
  { id: "v1", name: "Intro to Hardware.mp4", type: "video", size: "128 MB", uploaded: "2026-05-01" },
  { id: "v2", name: "How Internet Works.mp4", type: "video", size: "210 MB", uploaded: "2026-05-02" },
  { id: "v3", name: "OS Basics.mp4", type: "video", size: "95 MB", uploaded: "2026-05-03" },
  { id: "p1", name: "Chapter 1 Notes.pdf", type: "pdf", size: "2.4 MB", uploaded: "2026-05-01" },
  { id: "p2", name: "Quiz Answer Sheet.pdf", type: "pdf", size: "0.8 MB", uploaded: "2026-05-03" },
  { id: "i1", name: "Hardware Diagram.png", type: "image", size: "1.2 MB", uploaded: "2026-05-02" },
];

const FILE_ICONS: Record<FileType, React.ReactNode> = {
  video: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 10l4.553-2.369A1 1 0 0 1 21 8.535v6.93a1 1 0 0 1-1.447.904L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
    </svg>
  ),
  pdf: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  image: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  other: (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
};

const FILE_COLORS: Record<FileType, string> = {
  video: "var(--admin-accent)",
  pdf: "var(--admin-danger)",
  image: "var(--admin-success)",
  other: "var(--admin-warning)",
};

const BADGE_CLASS: Record<FileType, string> = {
  video: "admin-badge-blue",
  pdf: "admin-badge-red",
  image: "admin-badge-green",
  other: "admin-badge-yellow",
};

function detectType(filename: string): FileType {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  if (["mp4", "mov", "webm", "avi"].includes(ext)) return "video";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  return "other";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function UploadsView() {
  const [uploads, setUploads] = useState<Upload[]>(INITIAL);
  const [filterType, setFilterType] = useState<FileType | "all">("all");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const newUploads: Upload[] = Array.from(files).map((f) => ({
      id: Date.now().toString() + Math.random(),
      name: f.name,
      type: detectType(f.name),
      size: formatBytes(f.size),
      uploaded: new Date().toISOString().slice(0, 10),
      url: URL.createObjectURL(f),
    }));
    setUploads((prev) => [...newUploads, ...prev]);
  };

  const deleteUpload = (id: string) => setUploads((prev) => prev.filter((u) => u.id !== id));

  const filtered = uploads.filter((u) => {
    const matchType = filterType === "all" || u.type === filterType;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const TABS: { id: FileType | "all"; label: string }[] = [
    { id: "all", label: `All (${uploads.length})` },
    { id: "video", label: `Videos (${uploads.filter((u) => u.type === "video").length})` },
    { id: "pdf", label: `PDFs (${uploads.filter((u) => u.type === "pdf").length})` },
    { id: "image", label: `Images (${uploads.filter((u) => u.type === "image").length})` },
  ];

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)" }}>File Uploads</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.2rem" }}>
            Manage videos, PDFs and images used across lessons.
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => fileRef.current?.click()}>
          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          Upload Files
        </button>
        <input ref={fileRef} type="file" multiple className="hidden" style={{ display: "none" }}
          accept="video/*,image/*,.pdf" onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Drop zone */}
      <div
        className={`admin-drop-zone ${dragging ? "drag-over" : ""}`}
        style={{ marginBottom: "1.25rem" }}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          style={{ color: dragging ? "var(--admin-accent)" : "var(--muted)", margin: "0 auto 0.625rem" }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p style={{ fontSize: "0.875rem", fontWeight: 600, color: dragging ? "var(--admin-accent-text)" : "var(--foreground)" }}>
          Drop files here or click to browse
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
          Supports MP4, PDF, PNG, JPG and more
        </p>
      </div>

      {/* Tabs + Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", marginBottom: "0.875rem", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map((t) => (
            <button key={t.id} className={`admin-tab ${filterType === t.id ? "active" : ""}`}
              onClick={() => setFilterType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ position: "relative", minWidth: 200 }}>
          <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ position: "absolute", left: "0.625rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className="admin-input" placeholder="Search files…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "2rem", paddingTop: "0.375rem", paddingBottom: "0.375rem" }} />
        </div>
      </div>

      {/* Files list */}
      <div className="admin-card" style={{ overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem", color: "var(--muted)", fontSize: "0.8125rem" }}>
            No files found.
          </div>
        ) : (
          <div>
            {filtered.map((file, i) => (
              <div key={file.id} style={{
                display: "flex", alignItems: "center", gap: "0.875rem",
                padding: "0.75rem 1.25rem",
                borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "0.5rem", flexShrink: 0,
                  background: "var(--surface-soft)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: FILE_COLORS[file.type],
                }}>
                  {FILE_ICONS[file.type]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                    {file.size} · {new Date(file.uploaded).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`admin-badge ${BADGE_CLASS[file.type]}`}>{file.type}</span>
                <button className="admin-btn admin-btn-ghost" style={{ padding: "0.25rem", color: "var(--admin-danger)" }}
                  onClick={() => deleteUpload(file.id)} aria-label="Delete file">
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
