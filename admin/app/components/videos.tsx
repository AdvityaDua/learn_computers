"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
// useRef is used by DropZone; useCallback by DropZone's handleDrop
import { AdminAuthError, fetchAdmin } from "../lib/admin-api";
import { MarkdownEditor } from "./markdown-editor";
import {
  Pencil,
  Trash2,
  ExternalLink,
  Play,
  Link2,
  HardDrive,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface VideoLesson {
  _id: string;
  title: string;
  type: string;
  thumbnailFilePath?: string;
  videoFilePath?: string;
  externalVideoUrl?: string;
  tags: string[];
  descriptionFilePath: string;
  createdAt: string;
}

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const s = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + s[i];
}

/* ─── TagInput ─────────────────────────────────────────────────────────────── */

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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", marginBottom: "0.625rem" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.2rem",
                padding: "0.2rem 0.5rem 0.2rem 0.625rem", borderRadius: 999,
                fontSize: "0.75rem", fontWeight: 600,
                background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)",
                border: "1px solid var(--admin-accent-soft-border)",
              }}
            >
              #{tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--admin-accent-text)", padding: "0 0.1rem",
                  fontSize: "1rem", lineHeight: 1, display: "flex", alignItems: "center",
                }}
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
          placeholder='e.g. "javascript" or press Enter…'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); add(); }
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

/* ─── DropZone ─────────────────────────────────────────────────────────────── */

interface DropZoneProps {
  label: string;
  sublabel?: string;
  accept: string;
  icon: React.ReactNode;
  file: File | null;
  onFile: (f: File | null) => void;
  imagePreview?: string | null;
}

function DropZone({ label, sublabel, accept, icon, file, onFile, imagePreview }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile],
  );

  return (
    <div
      className={`admin-drop-zone${drag ? " drag-over" : ""}`}
      style={{ cursor: "pointer", position: "relative", minHeight: 110, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
    >
      {imagePreview ? (
        <img
          src={imagePreview}
          alt="preview"
          style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: "0.5rem", display: "block" }}
        />
      ) : file ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "0.5rem" }}>
          {icon}
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)", textAlign: "center", wordBreak: "break-all" }}>{file.name}</p>
          <span className="admin-badge admin-badge-green">{formatBytes(file.size)}</span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "0.5rem", textAlign: "center" }}>
          {icon}
          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>{label}</p>
          {sublabel && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{sublabel}</p>}
        </div>
      )}

      {(file || imagePreview) && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onFile(null); }}
          style={{
            position: "absolute", top: 8, right: 8,
            background: "var(--admin-danger-soft)", color: "var(--admin-danger)",
            border: "1px solid var(--admin-danger)", borderRadius: "50%",
            width: 26, height: 26, display: "flex", alignItems: "center",
            justifyContent: "center", cursor: "pointer", fontSize: "1rem", fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

/* ─── Section Header ──────────────────────────────────────────────────────── */

function SectionHeader({ number, title, subtitle }: { number: number; title: string; subtitle?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
      <div style={{
        width: 28, height: 28, borderRadius: "50%", background: "var(--admin-accent)",
        color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.75rem", fontWeight: 700, flexShrink: 0,
      }}>{number}</div>
      <div>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>{title}</p>
        {subtitle && <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ─── Upload Dialog ─────────────────────────────────────────────────────────── */

function UploadVideoDialog({ open, onClose, onSuccess, editingVideo, apiBase }: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingVideo: VideoLesson | null;
  apiBase: string;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [videoMode, setVideoMode] = useState<"upload" | "url">("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);

  const reset = () => {
    setTitle(""); setDescription(""); setTags([]);
    setVideoMode("upload"); setVideoFile(null); setVideoUrl("");
    setThumbnailFile(null); setThumbnailPreview(null);
    setUploading(false); setUploadProgress(0); setError("");
  };

  const handleClose = () => { reset(); onClose(); };

  useEffect(() => {
    if (!open || !editingVideo) return;

    setTitle(editingVideo.title ?? "");
    setTags(Array.isArray(editingVideo.tags) ? editingVideo.tags : []);
    setVideoMode(editingVideo.externalVideoUrl ? "url" : "upload");
    setVideoUrl(editingVideo.externalVideoUrl ?? "");
    setVideoFile(null);
    setThumbnailFile(null);
    setThumbnailPreview(editingVideo.thumbnailFilePath ? `${apiBase}${editingVideo.thumbnailFilePath}` : null);
    setError("");

    const fetchDescription = async () => {
      if (!editingVideo.descriptionFilePath) {
        setDescription("");
        return;
      }
      setLoadingExisting(true);
      try {
        const res = await fetch(`${apiBase}${editingVideo.descriptionFilePath}`);
        if (!res.ok) throw new Error("Could not load existing description");
        const text = await res.text();
        setDescription(text);
      } catch {
        setDescription("");
      } finally {
        setLoadingExisting(false);
      }
    };

    void fetchDescription();
  }, [open, editingVideo, apiBase]);

  useEffect(() => {
    if (!open || editingVideo) return;
    reset();
  }, [open, editingVideo]);

  /* Thumbnail object-URL preview */
  useEffect(() => {
    if (!thumbnailFile) { setThumbnailPreview(null); return; }
    const url = URL.createObjectURL(thumbnailFile);
    setThumbnailPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbnailFile]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!description.trim()) { setError("Description is required."); return; }
    if (!editingVideo && videoMode === "upload" && !videoFile) { setError("Please select a video file."); return; }
    if (videoMode === "url" && !videoUrl.trim()) { setError("Please enter an external video URL."); return; }

    setError(""); setUploading(true); setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("type", "video");
      if (videoMode === "url") formData.append("externalVideoUrl", videoUrl.trim());
      if (tags.length > 0) formData.append("tags", JSON.stringify(tags));

      /* Serialize markdown description as a .md file */
      const mdBlob = new Blob([description], { type: "text/markdown" });
      formData.append("descriptionFile", new File([mdBlob], "description.md", { type: "text/markdown" }));

      if (videoFile) formData.append("videoFile", videoFile);
      if (thumbnailFile) formData.append("thumbnailFile", thumbnailFile);

      setUploadProgress(40);
      const endpoint = editingVideo ? `/lessons/${editingVideo._id}` : "/lessons";
      const method = editingVideo ? "PATCH" : "POST";
      const res = await fetchAdmin(endpoint, { method, body: formData });
      setUploadProgress(100);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Upload failed"));
      }

      onSuccess();
      handleClose();
    } catch (err: unknown) {
      if (!(err instanceof AdminAuthError)) {
        setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  };

  /* Dismiss on Escape */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !uploading) handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, uploading]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "2rem 1rem", overflowY: "auto",
      }}
    >
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        onClick={() => !uploading && handleClose()}
      />

      {/* Dialog */}
      <div
        style={{
          position: "relative", zIndex: 1, width: "100%", maxWidth: 700,
          background: "var(--surface)", borderRadius: "1.125rem",
          border: "1px solid var(--border)", boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* ── Dialog Header ── */}
        <div style={{
          padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)",
          display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0,
          background: "var(--surface)",
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: "0.625rem",
            background: "var(--admin-accent-soft)", color: "var(--admin-accent)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>
              {editingVideo ? "Edit Video Lesson" : "Upload Video Lesson"}
            </h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
              {editingVideo
                ? "Update title, markdown description, video source, and thumbnail"
                : "Fill in all the details below — everything except thumbnail and tags is required"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => !uploading && handleClose()}
            style={{
              background: "none", border: "1px solid var(--border)", cursor: "pointer",
              color: "var(--muted)", borderRadius: "0.5rem",
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transition: "background 0.15s, color 0.15s",
            }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Dialog Body ── */}
        <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.875rem" }}>

          {/* §1 Basic Info */}
          <section>
            <SectionHeader number={1} title="Basic Information" subtitle="Name your lesson and add searchable tags" />
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="admin-label">
                  Video Title <span style={{ color: "var(--admin-danger)" }}>*</span>
                </label>
                <input
                  className="admin-input"
                  placeholder="e.g. Introduction to Python Variables"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="admin-label">Tags <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>— optional, press Enter or click Add</span></label>
                <TagInput tags={tags} onChange={setTags} />
              </div>
            </div>
          </section>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* §2 Description */}
          <section>
            <SectionHeader number={2} title="Lesson Description" subtitle="Toolbar • Ctrl+B Bold • Ctrl+I Italic • Ctrl+K Link • Write/Split/Preview modes" />
            {loadingExisting && (
              <p style={{ margin: "0 0 0.65rem", fontSize: "0.75rem", color: "var(--muted)" }}>
                Loading existing description...
              </p>
            )}
            <MarkdownEditor
              value={description}
              onChange={setDescription}
              minHeight={220}
              disabled={uploading}
              placeholder={`# Lesson Title\n\nWrite your lesson **description** in Markdown.\n\n## What you'll learn\n- Topic one\n- Topic two\n\n\`inline code\` and code blocks are supported too.`}
            />
          </section>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* §3 Video Source */}
          <section>
            <SectionHeader number={3} title="Video Source" subtitle="Upload a video file or link to an external URL" />

            {/* Mode toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.625rem", marginBottom: "1rem" }}>
              {(["upload", "url"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setVideoMode(mode)}
                  style={{
                    padding: "0.625rem 1rem", borderRadius: "0.625rem", cursor: "pointer",
                    border: `2px solid ${videoMode === mode ? "var(--admin-accent)" : "var(--border)"}`,
                    background: videoMode === mode ? "var(--admin-accent-soft)" : "var(--surface)",
                    color: videoMode === mode ? "var(--admin-accent-text)" : "var(--muted)",
                    fontWeight: 600, fontSize: "0.8125rem", transition: "all 0.15s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  }}
                >
                  {mode === "upload" ? (
                    <><HardDrive size={15} /> Upload File</>
                  ) : (
                    <><Link2 size={15} /> External URL</>
                  )}
                </button>
              ))}
            </div>

            {videoMode === "upload" ? (
              <DropZone
                label="Drop video file here"
                sublabel="MP4, WebM, MOV · up to 2 GB"
                accept="video/*"
                file={videoFile}
                onFile={setVideoFile}
                icon={
                  <Play size={30} color="var(--admin-accent)" />
                }
              />
            ) : (
              <input
                className="admin-input"
                type="url"
                placeholder="https://youtube.com/watch?v=… or any public video URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            )}
          </section>

          {/* Divider */}
          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* §4 Thumbnail */}
          <section>
            <SectionHeader number={4} title="Thumbnail Image" subtitle="Shown on video cards — optional but recommended" />
            <DropZone
              label="Drop thumbnail image here"
              sublabel="PNG, JPG, WebP · recommended 16:9"
              accept="image/png,image/jpeg,image/webp"
              file={thumbnailFile}
              onFile={setThumbnailFile}
              imagePreview={thumbnailPreview}
              icon={
                <Play size={30} color="var(--admin-accent)" />
              }
            />
          </section>

          {/* Error */}
          {error && (
            <div style={{
              background: "var(--admin-danger-soft)", border: "1px solid var(--admin-danger)",
              borderRadius: "0.625rem", padding: "0.75rem 1rem",
              fontSize: "0.8125rem", color: "var(--admin-danger)",
              display: "flex", alignItems: "flex-start", gap: "0.5rem",
            }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* ── Dialog Footer ── */}
        <div style={{
          padding: "1rem 1.5rem", borderTop: "1px solid var(--border)",
          background: "var(--surface-soft)", flexShrink: 0,
        }}>
          {uploading && (
            <div style={{ marginBottom: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--muted)", marginBottom: "0.375rem" }}>
                <span style={{ fontWeight: 600, color: "var(--admin-accent)" }}>Uploading…</span>
                <span>{uploadProgress}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--border)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${uploadProgress}%`,
                  background: "var(--admin-accent)",
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              className="admin-btn admin-btn-ghost"
              type="button"
              onClick={handleClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-primary"
              type="button"
              onClick={handleSubmit}
              disabled={uploading}
              style={{ minWidth: 148, justifyContent: "center" }}
            >
              {uploading ? (
                <>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "vd-spin 1s linear infinite" }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Uploading…
                </>
              ) : (
                <>
                  <Play size={14} />
                  {editingVideo ? "Save Changes" : "Upload Lesson"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes vd-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ─── Delete Confirm Dialog ─────────────────────────────────────────────────── */

function DeleteDialog({ open, title, onClose, onConfirm, deleting }: {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !deleting) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--admin-danger-soft)", color: "var(--admin-danger)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg viewBox="0 0 24 24" width={26} height={26} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2M14 11v6M10 11v6" />
            </svg>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>
              Delete Video Lesson?
            </h3>
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.55 }}>
              <strong style={{ color: "var(--foreground)" }}>&ldquo;{title}&rdquo;</strong> will be permanently removed. This action cannot be undone.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
            <button
              className="admin-btn admin-btn-secondary"
              type="button"
              onClick={onClose}
              disabled={deleting}
              style={{ flex: 1, justifyContent: "center" }}
            >
              Cancel
            </button>
            <button
              className="admin-btn admin-btn-danger"
              type="button"
              onClick={onConfirm}
              disabled={deleting}
              style={{ flex: 1, justifyContent: "center" }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Video Card ─────────────────────────────────────────────────────────────── */

function VideoCard({ video, apiBase, onDelete, onEdit }: {
  video: VideoLesson;
  apiBase: string;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [description, setDescription] = useState("");
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const thumb = video.thumbnailFilePath ? `${apiBase}${video.thumbnailFilePath}` : null;
  const isExternal = !!video.externalVideoUrl;
  const playableUrl = video.externalVideoUrl || (video.videoFilePath ? `${apiBase}${video.videoFilePath}` : "");

  useEffect(() => {
    if (!video.descriptionFilePath) return;
    const fetchDesc = async () => {
      setLoadingDesc(true);
      try {
        const res = await fetch(`${apiBase}${video.descriptionFilePath}`);
        if (res.ok) {
          const text = await res.text();
          setDescription(text);
        }
      } catch (err) {
        console.error("Failed to fetch description:", err);
      } finally {
        setLoadingDesc(false);
      }
    };
    void fetchDesc();
  }, [video.descriptionFilePath, apiBase]);

  return (
    <div
      className="admin-card"
      style={{
        display: "flex", flexDirection: "column", overflow: "hidden",
        transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: hovered ? "0 8px 32px rgba(0,0,0,0.12)" : "var(--elevation-1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        height: "100%",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div style={{ position: "relative", height: 165, background: "var(--surface-soft)", flexShrink: 0, overflow: "hidden" }}>
        {thumb ? (
          <img src={thumb} alt={video.title} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s", transform: hovered ? "scale(1.04)" : "scale(1)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "0.5rem" }}>
            <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>No thumbnail</span>
          </div>
        )}

        {/* Play overlay */}
        <div style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.15)", opacity: hovered ? 1 : 0, transition: "opacity 0.25s",
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: "50%",
            background: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
          }}>
            <svg viewBox="0 0 24 24" width={22} height={22} fill="var(--admin-accent)" stroke="none">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
        </div>

        {/* Source badge */}
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span className={`admin-badge ${isExternal ? "admin-badge-yellow" : "admin-badge-blue"}`}>
            {isExternal ? <Link2 size={12} /> : <HardDrive size={12} />}
            {isExternal ? "External" : "Uploaded"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "1rem", flex: 1, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700, color: "var(--foreground)", lineHeight: 1.35 }}>
          {video.title}
        </h3>

        {/* Description Snippet */}
        <div style={{ position: "relative" }}>
          <div style={{ 
            fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.5,
            maxHeight: expanded ? "none" : "3em", overflow: "hidden",
            position: "relative"
          }}>
            {loadingDesc ? "Loading description..." : description ? (
              <div className="admin-prose" style={{ fontSize: "0.75rem" }}>
                <Markdown>{description}</Markdown>
              </div>
            ) : "No description available."}
            {!expanded && description.length > 80 && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1em", background: "var(--surface)" }} />
            )}
          </div>
          {description.length > 80 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: "none", border: "none", padding: "0.2rem 0",
                fontSize: "0.7rem", fontWeight: 700, color: "var(--admin-accent)",
                cursor: "pointer", display: "flex", alignItems: "center", gap: "0.2rem"
              }}
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>

        {video.tags.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
            {video.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "0.65rem", fontWeight: 600, padding: "0.15rem 0.45rem",
                  borderRadius: 999, background: "var(--admin-accent-soft)",
                  color: "var(--admin-accent-text)", border: "1px solid var(--admin-accent-soft-border)",
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <p style={{ margin: "auto 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
          {new Date(video.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>

      {/* Footer */}
      <div style={{
        padding: "0.75rem 1rem", borderTop: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", gap: "0.5rem", alignItems: "center",
        background: "var(--surface-soft)",
      }}>
        {playableUrl ? (
          <a
            href={playableUrl}
            target="_blank"
            rel="noreferrer"
            className="admin-btn admin-btn-secondary"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", gap: "0.35rem" }}
          >
            <ExternalLink size={13} />
            Open
          </a>
        ) : <span />}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            className="admin-btn admin-btn-secondary"
            type="button"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", gap: "0.35rem" }}
            onClick={onEdit}
          >
            <Pencil size={13} />
            Edit
          </button>
          <button
            className="admin-btn admin-btn-danger"
            type="button"
            style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem", gap: "0.35rem" }}
            onClick={onDelete}
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty State ────────────────────────────────────────────────────────────── */

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div style={{ padding: "5rem 2rem", textAlign: "center" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "1.25rem", margin: "0 auto 1.25rem",
        background: "var(--admin-accent-soft)", color: "var(--admin-accent)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg viewBox="0 0 24 24" width={34} height={34} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      </div>
      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)" }}>
        No video lessons yet
      </h3>
      <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: "var(--muted)", maxWidth: 380, marginLeft: "auto", marginRight: "auto" }}>
        Upload your first video lesson with description, tags, and a thumbnail to get started.
      </p>
      <button className="admin-btn admin-btn-primary" type="button" onClick={onUpload}>
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Upload First Video
      </button>
    </div>
  );
}

/* ─── Main View ──────────────────────────────────────────────────────────────── */

export function VideosView() {
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VideoLesson | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VideoLesson | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [total, setTotal] = useState(0);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

  const fetchVideos = async (nextPage = page, nextLimit = pageSize, nextSearch = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
        type: "video",
      });
      if (nextSearch.trim()) {
        params.set("search", nextSearch.trim());
      }

      const res = await fetchAdmin(`/lessons?${params.toString()}`);
      if (res.ok) {
        const payload = await res.json() as
          | VideoLesson[]
          | { items: VideoLesson[]; total: number; page: number; limit: number; totalPages: number };

        if (Array.isArray(payload)) {
          setVideos(payload.filter((l) => l.type === "video"));
          setTotal(payload.filter((l) => l.type === "video").length);
        } else {
          setVideos(payload.items ?? []);
          setTotal(payload.total ?? 0);
          if (payload.page && payload.page !== nextPage) {
            setPage(payload.page);
          }
        }
      }
    } catch (err) {
      if (!(err instanceof AdminAuthError)) console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchVideos(page, pageSize, search); }, [page, pageSize, search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetchAdmin(`/lessons/${deleteTarget._id}`, { method: "DELETE" });
      setDeleteTarget(null);
      void fetchVideos(page, pageSize, search);
    } catch (err) {
      if (!(err instanceof AdminAuthError)) console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : pageStart + videos.length - 1;

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.75rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            Video Lessons
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem", marginBottom: 0 }}>
            {loading ? "Loading…" : `${total} video lesson${total !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" type="button" onClick={() => { setEditTarget(null); setUploadOpen(true); }}>
          <Plus size={14} />
          Upload Video
        </button>
      </div>

      {/* ── Search ── */}
      {!loading && total > 0 && (
        <div style={{ position: "relative", maxWidth: 420, marginBottom: "1.5rem" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
          <input
            className="admin-input"
            placeholder="Search by title or tag…"
            value={search}
            onChange={(e) => { setPage(1); setSearch(e.target.value); }}
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ padding: "5rem 2rem", textAlign: "center", color: "var(--muted)" }}>
          <svg
            viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ animation: "vd-spin 1s linear infinite", marginBottom: "0.75rem" }}
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>Loading video lessons…</p>
        </div>
      ) : videos.length === 0 && total === 0 ? (
        <div className="admin-card">
          <EmptyState onUpload={() => { setEditTarget(null); setUploadOpen(true); }} />
        </div>
      ) : videos.length === 0 ? (
        <div className="admin-card" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--foreground)" }}>No results for &ldquo;{search}&rdquo;</p>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: "var(--muted)" }}>Try a different title or tag.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(288px, 1fr))", gap: "1.25rem" }}>
          {videos.map((v) => (
            <VideoCard
              key={v._id}
              video={v}
              apiBase={API_BASE}
              onEdit={() => setEditTarget(v)}
              onDelete={() => setDeleteTarget(v)}
            />
          ))}
        </div>
      )}

      {!loading && total > 0 && (
        <div className="admin-card" style={{ marginTop: "0.9rem", padding: "0.75rem 0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", background: "var(--surface-soft)" }}>
          <p style={{ margin: 0, fontSize: "0.77rem", color: "var(--muted)", fontWeight: 600 }}>
            Showing {pageStart} to {pageEnd} of {total}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <label className="admin-label" style={{ margin: 0 }}>Items</label>
            <select className="admin-select" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} style={{ width: 88, padding: "0.32rem 0.5rem" }}>
              {[6, 9, 12, 18, 36].map((n) => <option key={n} value={n}>{n}/page</option>)}
            </select>
            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "0.3rem 0.5rem" }}><ChevronLeft size={14} /></button>
            <span className="admin-badge admin-badge-gray">Page {currentPage} / {totalPages}</span>
            <button className="admin-btn admin-btn-secondary" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "0.3rem 0.5rem" }}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {/* ── Dialogs ── */}
      <UploadVideoDialog
        open={uploadOpen || !!editTarget}
        onClose={() => {
          setUploadOpen(false);
          setEditTarget(null);
        }}
        onSuccess={() => { void fetchVideos(page, pageSize, search); }}
        editingVideo={editTarget}
        apiBase={API_BASE}
      />
      <DeleteDialog
        open={!!deleteTarget}
        title={deleteTarget?.title ?? ""}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      <style>{`@keyframes vd-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
