"use client";

import React, { useEffect, useState } from "react";
import { fetchAdmin, AdminAuthError } from "../lib/admin-api";
import {
  Plus, Pencil, Trash2, X, Save, BookMarked, ChevronRight,
} from "lucide-react";
import { SubjectIcon, SUBJECT_ICON_LIST } from "./subject-icon";
import { useAdminData } from "../contexts/admin-data-context";

type Subject = {
  _id: string;
  name: string;
  description: string;
  classId: string;
  color: string;
  icon: string;
  isActive: boolean;
};

const SUBJECT_COLORS = [
  { label: "Crimson",  value: "#cb444a" },
  { label: "Blue",     value: "#0ea5e9" },
  { label: "Green",    value: "#10b981" },
  { label: "Amber",    value: "#f59e0b" },
  { label: "Purple",   value: "#8b5cf6" },
  { label: "Pink",     value: "#ec4899" },
  { label: "Cyan",     value: "#06b6d4" },
  { label: "Orange",   value: "#f97316" },
];

const EMPTY_FORM = {
  name: "",
  description: "",
  classId: "",
  color: "#cb444a",
  icon: "BookOpen",
};

export function SubjectsView({ onNavigateToChapters }: { onNavigateToChapters?: () => void }) {
  const { classes, allSubjects, refreshSubjects } = useAdminData();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [showDialog, setShowDialog] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Auto-select first class once classes are available
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0]._id);
    }
  }, [classes, selectedClassId]);

  const openCreate = () => {
    setEditingSubject(null);
    setForm({ ...EMPTY_FORM, classId: selectedClassId ?? "" });
    setShowDialog(true);
  };

  const openEdit = (s: Subject) => {
    setEditingSubject(s);
    setForm({
      name: s.name,
      description: s.description,
      classId: s.classId,
      color: s.color,
      icon: s.icon,
    });
    setShowDialog(true);
  };

  const saveSubject = async () => {
    if (!form.name.trim() || !form.classId) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description,
        classId: form.classId,
        color: form.color,
        icon: form.icon,
      };
      const res = editingSubject
        ? await fetchAdmin(`/subjects/${editingSubject._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetchAdmin("/subjects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (res.ok) {
        await refreshSubjects();
        setShowDialog(false);
      } else {
        const d = await res.json().catch(() => ({})) as { message?: string | string[] };
        const msg = Array.isArray(d.message) ? d.message.join(", ") : d.message || "Save failed.";
        setError(msg);
      }
    } catch (err) {
      if (!(err instanceof AdminAuthError)) setError("Could not save subject.");
    } finally {
      setSaving(false);
    }
  };

  const removeSubject = async (id: string) => {
    if (!window.confirm("Delete this subject? Chapters linked to it will lose their subject association.")) return;
    try {
      const res = await fetchAdmin(`/subjects/${id}`, { method: "DELETE" });
      if (res.ok) await refreshSubjects();
    } catch (err) {
      if (!(err instanceof AdminAuthError)) setError("Could not delete subject.");
    }
  };

  const selectedClass = classes.find((c) => c._id === selectedClassId);
  const displayedSubjects: Subject[] = selectedClassId
    ? allSubjects.filter((s) => s.classId === selectedClassId) as Subject[]
    : allSubjects as Subject[];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1.5rem 0" }}>
      {/* ── Page header ──────────────────────────────────── */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        gap: "1.5rem", marginBottom: "1.75rem", padding: "1.5rem",
        background: "var(--surface)", borderRadius: "1rem", border: "1px solid var(--border)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{
            width: 52, height: 52, borderRadius: "1rem",
            background: "var(--admin-accent)",
            display: "grid", placeItems: "center", color: "#fff",
            boxShadow: "0 4px 12px var(--admin-accent-ring)",
          }}>
            <BookMarked size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.02em" }}>
              Subjects
            </h1>
            <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>
              Organise your curriculum by class and subject area.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {onNavigateToChapters && (
            <button
              className="admin-btn admin-btn-secondary"
              onClick={onNavigateToChapters}
              style={{ gap: "0.45rem" }}
            >
              <ChevronRight size={15} /> Curriculum Builder
            </button>
          )}
          <button
            className="admin-btn admin-btn-primary"
            onClick={openCreate}
            style={{ padding: "0.6rem 1.25rem", fontSize: "0.875rem" }}
          >
            <Plus size={18} /> New Subject
          </button>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{
          marginBottom: "1rem", padding: "0.75rem 1rem",
          borderColor: "var(--admin-danger)", color: "var(--admin-danger)",
          display: "flex", alignItems: "center", gap: "0.5rem",
        }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button
            className="admin-btn admin-btn-ghost"
            style={{ padding: "0.15rem 0.5rem", fontSize: "0.75rem" }}
            onClick={() => setError("")}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* ── Class tabs ───────────────────────────────────── */}
      {classes.length > 0 && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          {classes.map((cls) => {
            const isActive = cls._id === selectedClassId;
            return (
              <button
                key={cls._id}
                onClick={() => setSelectedClassId(cls._id)}
                style={{
                  padding: "0.5rem 1rem", borderRadius: "0.625rem",
                  border: isActive ? "1.5px solid var(--admin-accent)" : "1.5px solid var(--border)",
                  background: isActive ? "var(--admin-accent-soft)" : "var(--surface)",
                  color: isActive ? "var(--admin-accent-text)" : "var(--foreground)",
                  fontWeight: isActive ? 700 : 500, fontSize: "0.875rem",
                  cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
                  boxShadow: isActive ? "0 2px 8px var(--admin-accent-ring)" : "none",
                }}
              >
                {cls.name}{cls.grade ? ` · ${cls.grade}` : ""}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Subject grid ─────────────────────────────────── */}
      {displayedSubjects.length === 0 ? (
        <div className="admin-card" style={{
          padding: "3.5rem 2rem", textAlign: "center",
          border: "2px dashed var(--border)",
        }}>
          <BookMarked size={40} style={{ color: "var(--muted)", marginBottom: "1rem" }} />
          <p style={{ margin: 0, fontWeight: 700, color: "var(--foreground)", fontSize: "1rem" }}>
            No subjects yet{selectedClass ? ` for ${selectedClass.name}` : ""}
          </p>
          <p style={{ margin: "0.5rem 0 1.5rem", color: "var(--muted)", fontSize: "0.875rem" }}>
            Create subjects to organise chapters under each class.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={openCreate}>
            <Plus size={16} /> Add First Subject
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
          {displayedSubjects.map((subject) => (
            <div
              key={subject._id}
              className="admin-card"
              style={{
                padding: "1.25rem 1.5rem",
                borderLeft: `4px solid ${subject.color}`,
                display: "flex", justifyContent: "space-between", alignItems: "center",
                gap: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "0.875rem", flexShrink: 0,
                  background: `${subject.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <SubjectIcon name={subject.icon} size={22} color={subject.color} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{
                    margin: 0, fontSize: "1rem", fontWeight: 800,
                    color: "var(--foreground)", whiteSpace: "nowrap",
                    overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    {subject.name}
                  </h3>
                  {subject.description && (
                    <p style={{
                      margin: "0.2rem 0 0", fontSize: "0.8rem",
                      color: "var(--muted)", fontWeight: 500,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {subject.description}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                <button
                  className="admin-btn admin-btn-secondary"
                  style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
                  onClick={() => openEdit(subject)}
                >
                  <Pencil size={13} /> Edit
                </button>
                <button
                  className="admin-btn admin-btn-danger"
                  style={{ padding: "0.4rem 0.75rem", fontSize: "0.75rem" }}
                  onClick={() => void removeSubject(subject._id)}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Dialog ─────────────────────────── */}
      {showDialog && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "grid", placeItems: "center", padding: "1rem" }}>
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.58)" }}
            onClick={() => setShowDialog(false)}
          />
          <div className="admin-card" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 540, padding: "1.5rem" }}>
            <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 800 }}>
              {editingSubject ? "Edit Subject" : "Create Subject"}
            </h3>

            <div style={{ display: "grid", gap: "1.1rem" }}>
              {/* Class */}
              <div>
                <label className="admin-label">Class</label>
                <select
                  className="admin-select"
                  value={form.classId}
                  onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
                >
                  <option value="">— Select a class —</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}{c.grade ? ` (${c.grade})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="admin-label">Subject Name</label>
                <input
                  className="admin-input"
                  placeholder="e.g. Mathematics"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label className="admin-label">Description (optional)</label>
                <input
                  className="admin-input"
                  placeholder="Brief description of this subject"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="admin-label">Icon</label>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(44px, 1fr))",
                  gap: "0.4rem",
                }}>
                  {SUBJECT_ICON_LIST.map(({ name, label }) => {
                    const isSelected = form.icon === name;
                    return (
                      <button
                        key={name}
                        title={label}
                        onClick={() => setForm((f) => ({ ...f, icon: name }))}
                        style={{
                          width: 44, height: 44, borderRadius: "0.5rem",
                          border: isSelected ? `2px solid ${form.color}` : "1.5px solid var(--border)",
                          background: isSelected ? `${form.color}18` : "var(--surface-soft)",
                          cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                          color: isSelected ? form.color : "var(--muted)",
                        }}
                      >
                        <SubjectIcon name={name} size={18} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="admin-label">Color</label>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  {SUBJECT_COLORS.map(({ label, value }) => (
                    <button
                      key={value}
                      title={label}
                      onClick={() => setForm((f) => ({ ...f, color: value }))}
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: value, border: "none",
                        cursor: "pointer",
                        outline: form.color === value ? `3px solid ${value}` : "none",
                        outlineOffset: 2,
                        transform: form.color === value ? "scale(1.15)" : "scale(1)",
                        transition: "all 0.15s",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Live preview */}
              <div style={{
                display: "flex", alignItems: "center", gap: "0.875rem",
                padding: "0.875rem 1rem",
                background: "var(--surface-soft)", borderRadius: "0.75rem",
                border: `1.5px solid ${form.color}30`,
                borderLeft: `4px solid ${form.color}`,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "0.75rem",
                  background: `${form.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <SubjectIcon name={form.icon} size={20} color={form.color} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>
                    {form.name || "Subject name"}
                  </p>
                  <p style={{ margin: "0.1rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
                    {form.description || "No description"}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.25rem" }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setShowDialog(false)}>
                  <X size={14} /> Cancel
                </button>
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={() => void saveSubject()}
                  disabled={saving || !form.name.trim() || !form.classId}
                >
                  {editingSubject ? <Save size={14} /> : <Plus size={14} />}
                  {saving ? "Saving…" : editingSubject ? "Save Changes" : "Create Subject"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
