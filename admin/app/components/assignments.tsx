"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminAuthError, fetchAdmin, getAdminToken } from "../lib/admin-api";
import { MarkdownEditor, renderMarkdown } from "./markdown-editor";
import { DatePicker } from "./date-picker";
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ══════════════════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════════════════ */

interface Assignment {
  _id: string;
  title: string;
  tags: string[];
  points?: number;
  dueDate?: string;
  descriptionFilePath: string;
  attachmentFilePath?: string;
  createdAt: string;
  requiresSubmission?: boolean;
  acceptedFileTypes?: string[];
}

/* ══════════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════════ */

const API_BASE = () =>
  (typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_URL) ||
  "http://localhost:3000";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function dueBadge(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / 86400000;
  const label = fmtDate(iso);
  if (diff < 0) return { label, cls: "admin-badge-red" };
  if (diff < 3) return { label, cls: "admin-badge-yellow" };
  return { label, cls: "admin-badge-green" };
}

/* ══════════════════════════════════════════════════════════════════════════════
   TAG INPUT
══════════════════════════════════════════════════════════════════════════════ */

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };
  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.5rem" }}>
          {tags.map((t) => (
            <span
              key={t}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.2rem",
                padding: "0.2rem 0.5rem 0.2rem 0.625rem", borderRadius: 999,
                fontSize: "0.75rem", fontWeight: 600,
                background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)",
                border: "1px solid var(--admin-accent-soft-border)",
              }}
            >
              #{t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: "0 0.1rem", fontSize: "1rem", lineHeight: 1, display: "flex", alignItems: "center" }}
              >×</button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          className="admin-input"
          placeholder='e.g. "week-1" then press Enter'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          style={{ flex: 1 }}
        />
        <button className="admin-btn admin-btn-secondary" type="button" onClick={add}>Add</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SECTION HEADER
══════════════════════════════════════════════════════════════════════════════ */

function SectionHeader({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", background: "var(--admin-accent)",
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
      }}>{n}</div>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>{title}</p>
        {sub && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CREATE / EDIT DIALOG
══════════════════════════════════════════════════════════════════════════════ */

interface DialogProps {
  open: boolean;
  editing: Assignment | null;
  onClose: () => void;
  onSuccess: () => void;
}

function AssignmentDialog({ open, editing, onClose, onSuccess }: DialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [points, setPoints] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [attachFile, setAttachFile] = useState<File | null>(null);
  const [requiresSubmission, setRequiresSubmission] = useState(false);
  const [acceptedFileTypes, setAcceptedFileTypes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const attachRef = useRef<HTMLInputElement>(null);

  /* Pre-fill form when editing */
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription(""); // description is a file path — load raw content below
      setTags(editing.tags ?? []);
      setPoints(editing.points != null ? String(editing.points) : "");
      setDueDate(editing.dueDate ? editing.dueDate.slice(0, 10) : "");
      setRequiresSubmission(editing.requiresSubmission ?? false);
      setAcceptedFileTypes(editing.acceptedFileTypes ?? []);
      setRequiresSubmission(editing.requiresSubmission ?? false);
      setAcceptedFileTypes(editing.acceptedFileTypes ?? []);
      /* Fetch the .md file content to show in editor */
      fetch(`${API_BASE()}${editing.descriptionFilePath}`)
        .then((r) => r.text())
        .then(setDescription)
        .catch(() => setDescription(""));
    } else {
      setTitle(""); setDescription(""); setTags([]);
      setPoints(""); setDueDate(""); setAttachFile(null); setError("");
      setRequiresSubmission(false); setAcceptedFileTypes([]);
    }
  }, [open, editing]);

  const reset = () => {
    setTitle(""); setDescription(""); setTags([]); setPoints("");
    setDueDate(""); setAttachFile(null); setSaving(false); setError("");
    setRequiresSubmission(false); setAcceptedFileTypes([]);
  };

  const handleClose = () => { reset(); onClose(); };

  /* Inline image upload — called by MarkdownEditor toolbar */
  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const token = getAdminToken();
    const form = new FormData();
    form.append("imageFile", file);
    const res = await fetch(`${API_BASE()}/assignments/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token ?? ""}` },
      body: form,
    });
    if (!res.ok) throw new Error("Image upload failed");
    const data = await res.json() as { url: string };
    return `${API_BASE()}${data.url}`;
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    if (requiresSubmission && acceptedFileTypes.length === 0) { setError("Select at least one accepted file type for submission."); return; }
    setError(""); setSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (dueDate) formData.append("dueDate", new Date(dueDate).toISOString());
      if (tags.length > 0) formData.append("tags", JSON.stringify(tags));
      if (points.trim()) formData.append("points", points.trim());
      formData.append("requiresSubmission", requiresSubmission ? "true" : "false");
      formData.append("acceptedFileTypes", JSON.stringify(acceptedFileTypes));
      formData.append("requiresSubmission", requiresSubmission ? "true" : "false");
      formData.append("acceptedFileTypes", JSON.stringify(acceptedFileTypes));

      const mdBlob = new Blob([description], { type: "text/markdown" });
      formData.append("descriptionFile", new File([mdBlob], "description.md", { type: "text/markdown" }));
      if (attachFile) formData.append("attachmentFile", attachFile);

      const res = editing
        ? await fetchAdmin(`/assignments/${editing._id}`, { method: "PATCH", body: formData })
        : await fetchAdmin("/assignments", { method: "POST", body: formData });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string | string[] };
        throw new Error(Array.isArray(d.message) ? d.message.join(", ") : (d.message ?? "Failed"));
      }

      onSuccess();
      handleClose();
    } catch (err: unknown) {
      if (!(err instanceof AdminAuthError)) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saving) handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving]);

  if (!open) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", alignItems: "flex-start", justifyContent: "center",
      padding: "1.5rem 1rem", overflowY: "auto",
    }}>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={() => !saving && handleClose()}
      />

      {/* Panel */}
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 820,
        background: "var(--surface)", borderRadius: "1.125rem",
        border: "1px solid var(--border)", boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "0.625rem",
            background: "var(--admin-accent-soft)", color: "var(--admin-accent)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>
              {editing ? "Edit Assignment" : "New Assignment"}
            </h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
              Write the assignment in Markdown — inline images, links, code blocks all supported
            </p>
          </div>
          <button
            type="button" onClick={() => !saving && handleClose()}
            style={{
              background: "none", border: "1px solid var(--border)", cursor: "pointer",
              color: "var(--muted)", borderRadius: "0.5rem",
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          {/* §1 Details */}
          <section>
            <SectionHeader n={1} title="Assignment Details" sub="Title, due date, points and tags" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {/* Title spans full width */}
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="admin-label">Title <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input
                  className="admin-input"
                  placeholder="e.g. Build a Calculator in Python"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div>
                <label className="admin-label">Due Date <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— optional</span></label>
                <DatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Select due date"
                />
              </div>

              <div>
                <label className="admin-label">Points <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— optional</span></label>
                <input
                  className="admin-input"
                  type="number"
                  min={0}
                  placeholder="e.g. 100"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="admin-label">Tags <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— press Enter or click Add</span></label>
                <TagInput tags={tags} onChange={setTags} />
              </div>
            </div>
          </section>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* §2 Content */}
          <section>
            <SectionHeader
              n={2}
              title="Assignment Content"
              sub="Full Markdown editor — click the image icon in toolbar to embed images inline"
            />
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              minHeight={280}
              disabled={saving}
              onImageUpload={handleImageUpload}
              placeholder={`# Assignment Title\n\nDescribe what students need to do.\n\n## Requirements\n- Requirement one\n- Requirement two\n\n## Example\n\`\`\`python\nprint("Hello, world!")\n\`\`\`\n\n> **Note:** Submit your solution as a .zip file.\n\n![diagram](upload an image via the toolbar button above)`}
            />
          </section>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* §3 Attachment */}
          <section>
            <SectionHeader n={3} title="Attachment" sub="Optional — PDF, zip, or any additional file for students" />
            <div
              style={{
                border: "2px dashed var(--border)", borderRadius: "0.75rem", padding: "1.25rem 1rem",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
                background: "var(--surface-soft)", cursor: "pointer",
                transition: "border-color 0.15s, background 0.15s",
              }}
              onClick={() => attachRef.current?.click()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                <div style={{
                  width: 38, height: 38, borderRadius: "0.5rem",
                  background: attachFile ? "var(--admin-accent-soft)" : "var(--border)",
                  color: attachFile ? "var(--admin-accent)" : "var(--muted)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                  </svg>
                </div>
                <div>
                  {attachFile ? (
                    <>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>{attachFile.name}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{(attachFile.size / 1024).toFixed(1)} KB</p>
                    </>
                  ) : editing?.attachmentFilePath ? (
                    <>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--foreground)" }}>Attachment already uploaded</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Click to replace</p>
                    </>
                  ) : (
                    <>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--foreground)" }}>Click to attach a file</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>PDF, ZIP, DOCX, any format — up to 50 MB</p>
                    </>
                  )}
                </div>
              </div>
              {attachFile && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAttachFile(null); }}
                  style={{
                    background: "var(--admin-danger-soft)", color: "var(--admin-danger)",
                    border: "1px solid var(--admin-danger)", borderRadius: "0.4rem",
                    padding: "0.25rem 0.625rem", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
                    flexShrink: 0,
                  }}
                >Remove</button>
              )}
              <input
                ref={attachRef}
                type="file"
                style={{ display: "none" }}
                onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </section>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* §4 Submission Settings */}
          <section>
            <SectionHeader n={4} title="Submission Settings" sub="Require students to upload a file to complete this assignment" />

            {/* Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--surface-soft)", marginBottom: "0.875rem" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>Requires File Submission</p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>Student must upload a file before this assignment counts toward progress</p>
              </div>
              <button
                type="button"
                onClick={() => { setRequiresSubmission((v) => !v); if (!requiresSubmission) setAcceptedFileTypes([]); }}
                style={{
                  flexShrink: 0,
                  width: 44, height: 24, borderRadius: 999,
                  background: requiresSubmission ? "var(--admin-accent)" : "var(--border)",
                  border: "none", cursor: "pointer", position: "relative",
                  transition: "background 0.2s",
                }}
                aria-checked={requiresSubmission}
                role="switch"
              >
                <span style={{
                  position: "absolute", top: 3, left: requiresSubmission ? 22 : 3,
                  width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
            </div>

            {/* Accepted file types — only shown when requiresSubmission */}
            {requiresSubmission && (
              <div>
                <label className="admin-label" style={{ marginBottom: "0.5rem", display: "block" }}>Accepted File Types <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— check all that apply, or "Any"</span></label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {(["pdf", "image", "document", "zip", "code", "any"] as const).map((ft) => {
                    const labels: Record<string, string> = {
                      pdf: "PDF (.pdf)",
                      image: "Image (.jpg .png .webp)",
                      document: "Document (.doc .docx)",
                      zip: "Archive (.zip .tar .rar)",
                      code: "Code (.py .js .ts .java…)",
                      any: "Any file type",
                    };
                    const isChecked = acceptedFileTypes.includes(ft);
                    return (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => {
                          if (ft === "any") {
                            setAcceptedFileTypes(isChecked ? [] : ["any"]);
                          } else {
                            const next = isChecked
                              ? acceptedFileTypes.filter((x) => x !== ft)
                              : [...acceptedFileTypes.filter((x) => x !== "any"), ft];
                            setAcceptedFileTypes(next);
                          }
                        }}
                        style={{
                          padding: "0.35rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8125rem", fontWeight: 600,
                          cursor: "pointer", border: `1.5px solid ${isChecked ? "var(--admin-accent)" : "var(--border)"}`,
                          background: isChecked ? "var(--admin-accent-soft)" : "var(--surface)",
                          color: isChecked ? "var(--admin-accent-text)" : "var(--foreground)",
                          transition: "all 0.15s",
                        }}
                      >{labels[ft]}</button>
                    );
                  })}
                </div>
                {acceptedFileTypes.length === 0 && (
                  <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--admin-danger)" }}>Select at least one accepted file type</p>
                )}
              </div>
            )}
          </section>

          {/* Error */}
          {error && (
            <div style={{
              background: "var(--admin-danger-soft)", border: "1px solid var(--admin-danger)",
              borderRadius: "0.625rem", padding: "0.75rem 1rem",
              fontSize: "0.8125rem", color: "var(--admin-danger)",
              display: "flex", alignItems: "flex-start", gap: "0.5rem",
            }}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          padding: "1rem 1.5rem", borderTop: "1px solid var(--border)",
          background: "var(--surface-soft)", flexShrink: 0,
          display: "flex", gap: "0.75rem", justifyContent: "flex-end",
        }}>
          <button className="admin-btn admin-btn-ghost" type="button" onClick={handleClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="admin-btn admin-btn-primary"
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            style={{ minWidth: 160, justifyContent: "center" }}
          >
            {saving ? (
              <>
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "asgn-spin 1s linear infinite" }}>
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                {editing ? "Save Changes" : "Create Assignment"}
              </>
            )}
          </button>
        </div>
      </div>
      <style>{`@keyframes asgn-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   DELETE CONFIRM DIALOG
══════════════════════════════════════════════════════════════════════════════ */

function DeleteDialog({ open, title, onClose, onConfirm, deleting }: {
  open: boolean; title: string; onClose: () => void; onConfirm: () => void; deleting: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && !deleting) onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, deleting, onClose]);

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} onClick={() => !deleting && onClose()} />
      <div style={{
        position: "relative", zIndex: 1, background: "var(--surface)",
        borderRadius: "1rem", border: "1px solid var(--border)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.22)", width: "100%", maxWidth: 420, padding: "2rem",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1.125rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--admin-danger-soft)", color: "var(--admin-danger)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2M14 11v6M10 11v6" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>Delete Assignment?</h3>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.55 }}>
              <strong style={{ color: "var(--foreground)" }}>&ldquo;{title}&rdquo;</strong> will be permanently removed.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
            <button className="admin-btn admin-btn-secondary" type="button" onClick={onClose} disabled={deleting} style={{ flex: 1, justifyContent: "center" }}>Cancel</button>
            <button className="admin-btn admin-btn-danger" type="button" onClick={onConfirm} disabled={deleting} style={{ flex: 1, justifyContent: "center" }}>{deleting ? "Deleting…" : "Delete"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
  PREVIEW DIALOG — shows a rendered assignment in a modal
══════════════════════════════════════════════════════════════════════════════ */

function PreviewDialog({ open, assignment, onClose, onEdit }: {
  open: boolean;
  assignment: Assignment | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open || !assignment) return;
    setContent("");
    fetch(`${API_BASE()}${assignment.descriptionFilePath}`)
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setContent("*Failed to load content.*"));
  }, [open, assignment]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open || !assignment) return null;
  const badge = dueBadge(assignment.dueDate);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1050, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.5rem 1rem", overflowY: "auto" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{
        position: "relative", zIndex: 1, width: "100%", maxWidth: 780,
        background: "var(--surface)", borderRadius: "1.125rem",
        border: "1px solid var(--border)", boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "flex-start", gap: "1rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "var(--foreground)" }}>{assignment.title}</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.625rem", alignItems: "center" }}>
              {assignment.points != null && (
                <span className="admin-badge admin-badge-blue">{assignment.points} pts</span>
              )}
              {badge && <span className={`admin-badge ${badge.cls}`}>Due {badge.label}</span>}
              {(assignment.tags ?? []).map((t) => (
                <span key={t} className="admin-badge admin-badge-gray">#{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
            <button className="admin-btn admin-btn-secondary" type="button" onClick={onEdit}>Edit</button>
            <button
              type="button" onClick={onClose}
              style={{ background: "none", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted)", borderRadius: "0.5rem", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Rendered content */}
        <div style={{ padding: "1.75rem 1.75rem", overflowY: "auto", maxHeight: "70vh" }}>
          {content ? (
            <div
              className="mde-preview"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
            />
          ) : (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>Loading…</p>
          )}
        </div>

        {/* Attachment */}
        {assignment.attachmentFilePath && (
          <div style={{ padding: "1rem 1.75rem", borderTop: "1px solid var(--border)", background: "var(--surface-soft)" }}>
            <a
              href={`${API_BASE()}${assignment.attachmentFilePath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary"
              style={{ textDecoration: "none" }}
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
              Download Attachment
            </a>
          </div>
        )}

        <style>{`
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
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN VIEW
══════════════════════════════════════════════════════════════════════════════ */

export function AssignmentsView() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Assignment | null>(null);
  const [previewing, setPreviewing] = useState<Assignment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [total, setTotal] = useState(0);

  const fetchAll = async (nextPage = page, nextLimit = pageSize, nextSearch = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });
      if (nextSearch.trim()) {
        params.set("search", nextSearch.trim());
      }

      const res = await fetchAdmin(`/assignments?${params.toString()}`);
      if (res.ok) {
        const payload = await res.json() as
          | Assignment[]
          | { items: Assignment[]; total: number; page: number; limit: number; totalPages: number };

        if (Array.isArray(payload)) {
          setAssignments(payload);
          setTotal(payload.length);
        } else {
          setAssignments(payload.items ?? []);
          setTotal(payload.total ?? 0);
          if (payload.page && payload.page !== nextPage) {
            setPage(payload.page);
          }
        }
      }
    } catch (e) {
      if (!(e instanceof AdminAuthError)) console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchAll(page, pageSize, search); }, [page, pageSize, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetchAdmin(`/assignments/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      void fetchAll(page, pageSize, search);
    } catch (e) {
      if (!(e instanceof AdminAuthError)) console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : pageStart + assignments.length - 1;

  const openEdit = (a: Assignment) => {
    setEditing(a);
    setPreviewing(null);
    setDialogOpen(true);
  };

  const overdue = assignments.filter((a) => a.dueDate && new Date(a.dueDate) < new Date()).length;

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* ── Page header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Assignments</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem", marginBottom: 0 }}>
            {loading ? "Loading…" : `${total} assignment${total !== 1 ? "s" : ""}${overdue ? ` · ${overdue} overdue on this page` : ""}`}
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" type="button" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus size={14} />
          New Assignment
        </button>
      </div>

      {/* ── Search ── */}
      {!loading && total > 0 && (
        <div style={{ position: "relative", maxWidth: 420, marginBottom: "1.25rem" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
          <input
            className="admin-input"
            placeholder="Search by title or tag…"
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ padding: "5rem 2rem", textAlign: "center", color: "var(--muted)" }}>
          <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: "asgn-spin 1s linear infinite", marginBottom: "0.75rem" }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>Loading assignments…</p>
        </div>
      ) : total === 0 ? (
        /* Empty state */
        <div className="admin-card" style={{ padding: "5rem 2rem", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, borderRadius: "1.25rem", margin: "0 auto 1.25rem", background: "var(--admin-accent-soft)", color: "var(--admin-accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg viewBox="0 0 24 24" width={34} height={34} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 700 }}>No assignments yet</h3>
          <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--muted)", maxWidth: 360, marginInline: "auto" }}>
            Create your first assignment with a full Markdown editor, inline images, and links.
          </p>
          <button className="admin-btn admin-btn-primary" type="button" onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Create Assignment
          </button>
        </div>
      ) : assignments.length === 0 ? (
        <div className="admin-card" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>No results for &ldquo;{search}&rdquo;</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--muted)" }}>Try a different title or tag.</p>
        </div>
      ) : (
        /* ── Table ── */
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <table className="admin-table" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "16%" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Title</th>
                <th>Tags</th>
                <th>Points</th>
                <th>Due Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((a) => {
                const badge = dueBadge(a.dueDate);
                return (
                  <tr key={a._id}>
                    {/* Title */}
                    <td>
                      <button
                        type="button"
                        onClick={() => setPreviewing(a)}
                        style={{
                          background: "none", border: "none", cursor: "pointer", textAlign: "left",
                          padding: 0, color: "var(--foreground)", fontWeight: 600,
                          fontSize: "0.875rem", width: "100%",
                        }}
                      >
                        <span style={{
                          display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          textDecoration: "underline", textDecorationColor: "var(--border)",
                          textUnderlineOffset: 2,
                        }}>
                          {a.title}
                        </span>
                        <span style={{ display: "block", fontSize: "0.7rem", color: "var(--muted)", fontWeight: 400, marginTop: "0.1rem" }}>
                          Created {fmtDate(a.createdAt)}
                        </span>
                      </button>
                    </td>

                    {/* Tags */}
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {(a.tags ?? []).slice(0, 3).map((t) => (
                          <span key={t} className="admin-badge admin-badge-gray">#{t}</span>
                        ))}
                        {(a.tags ?? []).length > 3 && (
                          <span className="admin-badge admin-badge-gray">+{a.tags.length - 3}</span>
                        )}
                        {(!a.tags || a.tags.length === 0) && <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>—</span>}
                      </div>
                    </td>

                    {/* Points */}
                    <td>
                      {a.points != null
                        ? <span className="admin-badge admin-badge-blue">{a.points} pts</span>
                        : <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>—</span>
                      }
                    </td>

                    {/* Due date */}
                    <td>
                      {badge
                        ? <span className={`admin-badge ${badge.cls}`}>{badge.label}</span>
                        : <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>No due date</span>
                      }
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                        <button
                          className="admin-btn admin-btn-ghost"
                          type="button"
                          title="Preview"
                          onClick={() => setPreviewing(a)}
                          style={{ padding: "0.35rem 0.5rem" }}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="admin-btn admin-btn-secondary"
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(a)}
                          style={{ padding: "0.35rem 0.5rem" }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          className="admin-btn admin-btn-danger"
                          type="button"
                          title="Delete"
                          onClick={() => setDeleteTarget(a)}
                          style={{ padding: "0.35rem 0.5rem" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", background: "var(--surface-soft)" }}>
            <p style={{ margin: 0, fontSize: "0.77rem", color: "var(--muted)", fontWeight: 600 }}>
              Showing {pageStart} to {pageEnd} of {total}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <label className="admin-label" style={{ margin: 0 }}>Items</label>
              <select className="admin-select" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} style={{ width: 88, padding: "0.32rem 0.5rem" }}>
                {[5, 8, 10, 20, 50].map((n) => <option key={n} value={n}>{n}/page</option>)}
              </select>
              <button className="admin-btn admin-btn-secondary" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "0.3rem 0.5rem" }}>
                <ChevronLeft size={14} />
              </button>
              <span className="admin-badge admin-badge-gray">Page {currentPage} / {totalPages}</span>
              <button className="admin-btn admin-btn-secondary" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "0.3rem 0.5rem" }}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <AssignmentDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { void fetchAll(page, pageSize, search); }}
      />
      <PreviewDialog
        open={!!previewing}
        assignment={previewing}
        onClose={() => setPreviewing(null)}
        onEdit={() => { if (previewing) openEdit(previewing); }}
      />
      <DeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.title ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      <style>{`@keyframes asgn-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
