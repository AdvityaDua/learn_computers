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

interface Activity {
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
            <span key={t} className="admin-badge admin-badge-blue" style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              #{t}
              <button
                type="button"
                onClick={() => onChange(tags.filter((x) => x !== t))}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0, lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          className="admin-input"
          placeholder='e.g. "hands-on"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          style={{ flex: 1 }}
        />
        <button className="admin-btn admin-btn-secondary" type="button" onClick={add}>
          Add
        </button>
      </div>
    </div>
  );
}

interface DialogProps {
  open: boolean;
  editing: Activity | null;
  onClose: () => void;
  onSuccess: () => void;
}

function ActivityDialog({ open, editing, onClose, onSuccess }: DialogProps) {
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

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setDescription("");
      setTags(editing.tags ?? []);
      setPoints(editing.points != null ? String(editing.points) : "");
      setDueDate(editing.dueDate ? editing.dueDate.slice(0, 10) : "");
      setRequiresSubmission(editing.requiresSubmission ?? false);
      setAcceptedFileTypes(editing.acceptedFileTypes ?? []);
      fetch(`${API_BASE()}${editing.descriptionFilePath}`)
        .then((r) => r.text())
        .then(setDescription)
        .catch(() => setDescription(""));
    } else {
      setTitle("");
      setDescription("");
      setTags([]);
      setPoints("");
      setDueDate("");
      setAttachFile(null);
      setError("");
      setRequiresSubmission(false);
      setAcceptedFileTypes([]);
    }
  }, [open, editing]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setTags([]);
    setPoints("");
    setDueDate("");
    setAttachFile(null);
    setSaving(false);
    setError("");
    setRequiresSubmission(false);
    setAcceptedFileTypes([]);
  };

  const close = () => {
    if (saving) return;
    reset();
    onClose();
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const token = getAdminToken();
    const form = new FormData();
    form.append("imageFile", file);
    const res = await fetch(`${API_BASE()}/activities/images`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token ?? ""}` },
      body: form,
    });
    if (!res.ok) throw new Error("Image upload failed");
    const data = await res.json() as { url: string };
    return `${API_BASE()}${data.url}`;
  }, []);

  const submit = async () => {
    if (!title.trim()) return setError("Title is required.");
    if (!description.trim()) return setError("Description is required.");
    if (requiresSubmission && acceptedFileTypes.length === 0) return setError("Select at least one accepted file type for submission.");

    setSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (dueDate) formData.append("dueDate", new Date(dueDate).toISOString());
      if (tags.length > 0) formData.append("tags", JSON.stringify(tags));
      if (points.trim()) formData.append("points", points.trim());
      formData.append("requiresSubmission", requiresSubmission ? "true" : "false");
      formData.append("acceptedFileTypes", JSON.stringify(acceptedFileTypes));

      const mdBlob = new Blob([description], { type: "text/markdown" });
      formData.append("descriptionFile", new File([mdBlob], "description.md", { type: "text/markdown" }));
      if (attachFile) formData.append("attachmentFile", attachFile);

      const res = editing
        ? await fetchAdmin(`/activities/${editing._id}`, { method: "PATCH", body: formData })
        : await fetchAdmin("/activities", { method: "POST", body: formData });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string | string[] };
        throw new Error(Array.isArray(d.message) ? d.message.join(", ") : (d.message ?? "Failed"));
      }

      onSuccess();
      close();
    } catch (err: unknown) {
      if (!(err instanceof AdminAuthError)) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.25rem", overflowY: "auto" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={close} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 860, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", boxShadow: "0 28px 70px rgba(0,0,0,0.22)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", padding: "1rem 1.25rem" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{editing ? "Edit Class Activity" : "Create Class Activity"}</h2>
            <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.75rem" }}>Markdown, inline images, links, and optional attachment</p>
          </div>
          <button className="admin-btn admin-btn-ghost" type="button" onClick={close}>Close</button>
        </div>

        <div style={{ padding: "1.25rem", display: "grid", gap: "1rem" }}>
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr" }}>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="admin-label">Title</label>
              <input className="admin-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Activity title" autoFocus />
            </div>
            <div>
              <label className="admin-label">Due Date (optional)</label>
              <DatePicker value={dueDate} onChange={setDueDate} placeholder="Select date" />
            </div>
            <div>
              <label className="admin-label">Points (optional)</label>
              <input className="admin-input" type="number" min={0} value={points} onChange={(e) => setPoints(e.target.value)} placeholder="e.g. 10" />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="admin-label">Tags</label>
              <TagInput tags={tags} onChange={setTags} />
            </div>
          </div>

          <div>
            <label className="admin-label">Activity Content</label>
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              minHeight={280}
              disabled={saving}
              onImageUpload={handleImageUpload}
              placeholder="# Activity\n\nDescribe steps students should follow.\n\n- Add goals\n- Add materials\n- Add submission instructions"
            />
          </div>

          <div>
            <label className="admin-label">Attachment (optional)</label>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <button className="admin-btn admin-btn-secondary" type="button" onClick={() => attachRef.current?.click()}>Choose File</button>
              <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{attachFile ? attachFile.name : (editing?.attachmentFilePath ? "Existing attachment present" : "No file selected")}</span>
              {attachFile && <button className="admin-btn admin-btn-danger" type="button" onClick={() => setAttachFile(null)}>Remove</button>}
              <input ref={attachRef} type="file" style={{ display: "none" }} onChange={(e) => setAttachFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          {/* ── Submission Settings ── */}
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.25rem" }}>
            <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.9375rem" }}>Submission Settings</p>

            {/* Toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.875rem 1rem", borderRadius: "0.75rem", border: "1px solid var(--border)", background: "var(--surface-soft)", marginBottom: "0.875rem" }}>
              <div>
                <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem" }}>Requires File Submission</p>
                <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>Student must upload a file before this activity counts toward progress</p>
              </div>
              <button
                type="button"
                onClick={() => { setRequiresSubmission((v) => !v); if (!requiresSubmission) setAcceptedFileTypes([]); }}
                style={{ flexShrink: 0, width: 44, height: 24, borderRadius: 999, background: requiresSubmission ? "var(--admin-accent)" : "var(--border)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}
                aria-checked={requiresSubmission} role="switch"
              >
                <span style={{ position: "absolute", top: 3, left: requiresSubmission ? 22 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </button>
            </div>

            {requiresSubmission && (
              <div>
                <label className="admin-label" style={{ marginBottom: "0.5rem", display: "block" }}>Accepted File Types</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {(["pdf", "image", "document", "zip", "code", "any"] as const).map((ft) => {
                    const labels: Record<string, string> = { pdf: "PDF (.pdf)", image: "Image (.jpg .png .webp)", document: "Document (.doc .docx)", zip: "Archive (.zip .tar .rar)", code: "Code (.py .js .ts…)", any: "Any file type" };
                    const isChecked = acceptedFileTypes.includes(ft);
                    return (
                      <button key={ft} type="button"
                        onClick={() => { if (ft === "any") { setAcceptedFileTypes(isChecked ? [] : ["any"]); } else { setAcceptedFileTypes(isChecked ? acceptedFileTypes.filter((x) => x !== ft) : [...acceptedFileTypes.filter((x) => x !== "any"), ft]); } }}
                        style={{ padding: "0.35rem 0.75rem", borderRadius: "0.5rem", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", border: `1.5px solid ${isChecked ? "var(--admin-accent)" : "var(--border)"}`, background: isChecked ? "var(--admin-accent-soft)" : "var(--surface)", color: isChecked ? "var(--admin-accent-text)" : "var(--foreground)", transition: "all 0.15s" }}
                      >{labels[ft]}</button>
                    );
                  })}
                </div>
                {acceptedFileTypes.length === 0 && <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--admin-danger)" }}>Select at least one accepted file type</p>}
              </div>
            )}
          </div>

          {error && <div style={{ color: "var(--admin-danger)", fontSize: "0.82rem", fontWeight: 600 }}>{error}</div>}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", borderTop: "1px solid var(--border)", padding: "0.9rem 1.25rem", background: "var(--surface-soft)" }}>
          <button className="admin-btn admin-btn-ghost" type="button" onClick={close} disabled={saving}>Cancel</button>
          <button className="admin-btn admin-btn-primary" type="button" onClick={submit} disabled={saving}>{saving ? "Saving..." : (editing ? "Save Changes" : "Create Activity")}</button>
        </div>
      </div>
    </div>
  );
}

function DeleteDialog({ open, title, deleting, onClose, onConfirm }: {
  open: boolean;
  title: string;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "grid", placeItems: "center", padding: "1rem" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", padding: "1.25rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Delete Activity?</h3>
        <p style={{ color: "var(--muted)", margin: "0.5rem 0 1rem", fontSize: "0.85rem" }}>&ldquo;{title}&rdquo; will be permanently removed.</p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button className="admin-btn admin-btn-secondary" type="button" onClick={onClose} disabled={deleting}>Cancel</button>
          <button className="admin-btn admin-btn-danger" type="button" onClick={onConfirm} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</button>
        </div>
      </div>
    </div>
  );
}

function PreviewDialog({ open, item, onClose, onEdit }: {
  open: boolean;
  item: Activity | null;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [content, setContent] = useState("");

  useEffect(() => {
    if (!open || !item) return;
    setContent("");
    fetch(`${API_BASE()}${item.descriptionFilePath}`)
      .then((r) => r.text())
      .then(setContent)
      .catch(() => setContent("*Failed to load content.*"));
  }, [open, item]);

  if (!open || !item) return null;
  const badge = dueBadge(item.dueDate);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1250, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.25rem", overflowY: "auto" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 820, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800 }}>{item.title}</h3>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
              {item.points != null && <span className="admin-badge admin-badge-blue">{item.points} pts</span>}
              {badge && <span className={`admin-badge ${badge.cls}`}>Due {badge.label}</span>}
              {(item.tags ?? []).map((t) => <span key={t} className="admin-badge admin-badge-gray">#{t}</span>)}
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-secondary" type="button" onClick={onEdit}>Edit</button>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={onClose}>Close</button>
          </div>
        </div>
        <div style={{ padding: "1.4rem", maxHeight: "70vh", overflowY: "auto" }}>
          <div className="mde-preview" dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
        </div>
      </div>
    </div>
  );
}

export function ActivitiesView() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Activity | null>(null);
  const [previewing, setPreviewing] = useState<Activity | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Activity | null>(null);
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

      const res = await fetchAdmin(`/activities?${params.toString()}`);
      if (res.ok) {
        const payload = await res.json() as
          | Activity[]
          | { items: Activity[]; total: number; page: number; limit: number; totalPages: number };

        if (Array.isArray(payload)) {
          setItems(payload);
          setTotal(payload.length);
        } else {
          setItems(payload.items ?? []);
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

  useEffect(() => {
    void fetchAll(page, pageSize, search);
  }, [page, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : pageStart + items.length - 1;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetchAdmin(`/activities/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await fetchAll(page, pageSize, search);
    } catch (e) {
      if (!(e instanceof AdminAuthError)) console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800 }}>Class Activities</h1>
          <p style={{ margin: "0.3rem 0 0", color: "var(--muted)", fontSize: "0.85rem" }}>{loading ? "Loading..." : `${total} activities`}</p>
        </div>
        <button className="admin-btn admin-btn-primary" type="button" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus size={14} /> New Activity
        </button>
      </div>

      {!loading && total > 0 && (
        <div style={{ position: "relative", maxWidth: 420, marginBottom: "1rem" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
          <input className="admin-input" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} placeholder="Search activities by title or tag" style={{ paddingLeft: "2.25rem" }} />
        </div>
      )}

      {loading ? (
        <div className="admin-card" style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading activities...</div>
      ) : items.length === 0 ? (
        <div className="admin-card" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>{total === 0 ? "No activities yet" : "No results found"}</p>
          <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.84rem" }}>{total === 0 ? "Create the first class activity." : "Try another search keyword."}</p>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <table className="admin-table">
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
              {items.map((a) => {
                const badge = dueBadge(a.dueDate);
                return (
                  <tr key={a._id}>
                    <td>
                      <button
                        type="button"
                        onClick={() => setPreviewing(a)}
                        style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, fontWeight: 700, color: "var(--foreground)" }}
                      >
                        {a.title}
                        <span style={{ display: "block", color: "var(--muted)", fontWeight: 500, fontSize: "0.72rem", marginTop: "0.1rem" }}>Created {fmtDate(a.createdAt)}</span>
                      </button>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {(a.tags ?? []).slice(0, 3).map((t) => <span key={t} className="admin-badge admin-badge-gray">#{t}</span>)}
                        {(a.tags ?? []).length === 0 && <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>-</span>}
                      </div>
                    </td>
                    <td>{a.points != null ? <span className="admin-badge admin-badge-blue">{a.points} pts</span> : <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>-</span>}</td>
                    <td>{badge ? <span className={`admin-badge ${badge.cls}`}>{badge.label}</span> : <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>No due date</span>}</td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                        <button className="admin-btn admin-btn-ghost" type="button" onClick={() => setPreviewing(a)} title="Preview" style={{ padding: "0.35rem 0.5rem" }}><Eye size={13} /></button>
                        <button className="admin-btn admin-btn-secondary" type="button" onClick={() => { setEditing(a); setDialogOpen(true); }} style={{ padding: "0.35rem 0.5rem" }} title="Edit"><Pencil size={13} /></button>
                        <button className="admin-btn admin-btn-danger" type="button" onClick={() => setDeleteTarget(a)} style={{ padding: "0.35rem 0.5rem" }} title="Delete"><Trash2 size={13} /></button>
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
              <button className="admin-btn admin-btn-secondary" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "0.3rem 0.5rem" }}><ChevronLeft size={14} /></button>
              <span className="admin-badge admin-badge-gray">Page {currentPage} / {totalPages}</span>
              <button className="admin-btn admin-btn-secondary" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "0.3rem 0.5rem" }}><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}

      <ActivityDialog open={dialogOpen} editing={editing} onClose={() => setDialogOpen(false)} onSuccess={() => { void fetchAll(page, pageSize, search); }} />
      <PreviewDialog open={!!previewing} item={previewing} onClose={() => setPreviewing(null)} onEdit={() => { if (previewing) { setEditing(previewing); setPreviewing(null); setDialogOpen(true); } }} />
      <DeleteDialog open={!!deleteTarget} title={deleteTarget?.title ?? ""} deleting={deleting} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </div>
  );
}
