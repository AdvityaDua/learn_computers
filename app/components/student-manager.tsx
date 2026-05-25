"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { UserPlus, Pencil, Search, X, Users, AlertCircle, Clock, Eye, Camera } from "lucide-react";
import { apiFetch, getUser, API_BASE_URL } from "../lib/api";
import { COLORS } from "../lib/constants";
import { StudentDetailPanel } from "./student-detail-panel";

type Student = {
  _id: string;
  fullName: string;
  email: string;
  phone: string | null;
  profileImage?: string | null;
  classIds: string[];
  school: { _id: string; name: string; code: string } | null;
  teacher: { _id: string; fullName: string; email: string } | null;
  points: number;
  isActive: boolean;
};

/* ── Error / Success Dialog ─────────────────────────────────────── */
function StatusDialog({ open, type, title, message, onClose }: {
  open: boolean; type: "error" | "success"; title: string; message: string; onClose: () => void;
}) {
  if (!open) return null;
  const isErr = type === "error";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1400, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400, background: "var(--surface)", border: `1px solid ${isErr ? COLORS.dangerSoft : COLORS.successSoft}`, borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: isErr ? COLORS.dangerSoft : COLORS.successSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            {isErr ? <AlertCircle size={24} color={COLORS.danger} /> : <Users size={24} color={COLORS.success} />}
          </div>
          <h3 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 800, color: "var(--foreground)" }}>{title}</h3>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.875rem", color: "var(--muted)", lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 1.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: isErr ? COLORS.danger : COLORS.success, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1.25rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer" }}>OK</button>
        </div>
      </div>
    </div>
  );
}

/* ── Student Form Dialog ────────────────────────────────────────── */
function StudentDialog({ open, editing, teacherClasses, onClose, onSuccess }: {
  open: boolean;
  editing: Student | null;
  teacherClasses: string[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", classId: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);

  useEffect(() => {
    if (open) {
      setImageFile(null);
      setImagePreview(null);
      if (editing) {
        setForm({ fullName: editing.fullName, email: editing.email, password: "", phone: editing.phone || "", classId: editing.classIds[0] || "" });
        if (editing.profileImage) setImagePreview(`${API_BASE_URL.replace('/api', '')}${editing.profileImage}`);
      } else {
        setForm({ fullName: "", email: "", password: "", phone: "", classId: teacherClasses[0] || "" });
      }
    }
  }, [open, editing, teacherClasses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        if (imageFile) {
          const fd = new FormData();
          fd.append('image', imageFile);
          fd.append('fullName', form.fullName);
          if (form.phone) fd.append('phone', form.phone);
          if (form.password) fd.append('password', form.password);
          if (form.classId) fd.append('classIds', JSON.stringify([form.classId]));
          await fetch(`${API_BASE_URL}/users/teacher/students/${editing._id}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${localStorage.getItem('teacherToken')}` },
            body: fd,
          }).then(r => { if (!r.ok) throw new Error('Upload failed'); return r.json(); });
        } else {
          const body: any = { fullName: form.fullName, phone: form.phone || undefined };
          if (form.password) body.password = form.password;
          if (form.classId) body.classIds = [form.classId];
          await apiFetch(`/users/teacher/students/${editing._id}`, { method: "PATCH", body: JSON.stringify(body) });
        }
        setDialog({ type: "success", title: "Student Updated", message: `${form.fullName}'s profile has been updated successfully.` });
      } else {
        if (!form.password) {
          setDialog({ type: "error", title: "Password Required", message: "Please set a password for the new student." });
          setSaving(false);
          return;
        }
        await apiFetch("/users/teacher/students", {
          method: "POST",
          body: JSON.stringify({ fullName: form.fullName, email: form.email, password: form.password, classId: form.classId, phone: form.phone || undefined }),
        });
        setDialog({ type: "success", title: "Student Created", message: `${form.fullName} has been added to ${form.classId}.` });
      }
    } catch (err: any) {
      setDialog({ type: "error", title: "Error", message: err.message || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.25rem", overflowY: "auto" }}>
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={() => !saving && onClose()} />
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", boxShadow: "0 28px 70px rgba(0,0,0,0.2)", overflow: "hidden", marginTop: "4rem" }}>
          {/* Header */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: "0.5rem", background: COLORS.accentSoft, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <UserPlus size={18} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--foreground)" }}>{editing ? "Edit Student" : "Add New Student"}</h2>
                <p style={{ margin: 0, fontSize: "0.6875rem", color: "var(--muted)" }}>Manage student details and class assignment</p>
              </div>
            </div>
            <button onClick={() => !saving && onClose()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4 }}><X size={18} /></button>
          </div>

          {/* Image Upload (only for editing) */}
          {editing && (
            <div style={{ padding: "1rem 1.5rem 0", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ position: "relative", width: 56, height: 56, borderRadius: 16, overflow: "hidden", background: COLORS.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${COLORS.accent}20`, cursor: "pointer", flexShrink: 0 }} onClick={() => imageInputRef.current?.click()}>
                {imagePreview ? (
                  <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1.25rem", fontWeight: 900, color: COLORS.accentText }}>{form.fullName.charAt(0).toUpperCase() || "?"}</span>
                )}
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s" }} onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                  <Camera size={18} color="#fff" />
                </div>
              </div>
              <input ref={imageInputRef} type="file" accept="image/jpeg,image/png" hidden onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Click photo to change profile image<br /><span style={{ fontSize: "0.625rem" }}>JPG or PNG, max 5MB</span></div>
            </div>
          )}
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Full Name *</label>
                  <input required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="e.g. Jane Smith" autoFocus
                    style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="student@email.com" disabled={!!editing}
                    style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: editing ? "var(--surface-soft)" : "var(--surface)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box", opacity: editing ? 0.6 : 1 }} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>
                    Password {editing ? <span style={{ fontWeight: 400, textTransform: "none" }}>(leave blank)</span> : "*"}
                  </label>
                  <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder={editing ? "New password" : "Password"} minLength={6} required={!editing}
                    style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Phone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Optional"
                    style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Assign to Class *</label>
                <select required value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }}>
                  <option value="">Select a class</option>
                  {teacherClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-soft)", padding: "0.875rem 1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button type="button" onClick={onClose} disabled={saving} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", color: "var(--foreground)" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1.25rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>{saving ? "Saving…" : editing ? "Save Changes" : "Add Student"}</button>
            </div>
          </form>
        </div>
      </div>
      <StatusDialog open={!!dialog} type={dialog?.type || "error"} title={dialog?.title || ""} message={dialog?.message || ""} onClose={() => { setDialog(null); if (dialog?.type === "success") { onSuccess(); onClose(); } }} />
    </>
  );
}

/* ── Due Badge (pending submissions) ───────────────────────────── */
function DueBadge({ studentId }: { studentId: string }) {
  const [pending, setPending] = React.useState<number | null>(null);
  React.useEffect(() => {
    apiFetch(`/progress/teacher/submissions?status=pending`)
      .then((data: any[]) => {
        const count = (data || []).filter((s: any) => s.userId === studentId).length;
        setPending(count);
      })
      .catch(() => setPending(0));
  }, [studentId]);
  if (pending === null) return <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>…</span>;
  if (pending === 0) return <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>None</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.6875rem", fontWeight: 700, color: COLORS.warning, background: COLORS.warningSoft, padding: "0.15rem 0.4rem", borderRadius: "0.25rem" }}>
      <Clock size={10} /> {pending} pending
    </span>
  );
}

/* ── Main Student Manager View ──────────────────────────────────── */
export function StudentManagerView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/users/teacher/students");
      setStudents(data || []);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    // Get teacher's own classes
    apiFetch("/users/teacher/dashboard").then((d: any) => {
      if (d?.classes) {
        setTeacherClasses(d.classes.map((c: any) => c.name));
      }
    }).catch(() => {});
  }, [fetchStudents]);

  const filtered = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem", background: "var(--surface)", padding: "1.25rem 1.5rem", borderRadius: "0.875rem", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: "0.75rem", background: COLORS.accentSoft, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em" }}>My Students</h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Manage students in your assigned classes</p>
          </div>
        </div>
        <button onClick={() => { setEditing(null); setDialogOpen(true); }} style={{ display: "flex", alignItems: "center", gap: "0.375rem", background: COLORS.accent, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer" }}>
          <UserPlus size={16} /> Add Student
        </button>
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email…"
          style={{ width: "100%", padding: "0.625rem 0.75rem 0.625rem 2.25rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--muted)", fontSize: "0.875rem" }}>Loading students…</div>
      ) : students.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem", background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "1.25rem", background: COLORS.accentSoft, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <Users size={32} />
          </div>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.25rem", color: "var(--foreground)" }}>No students yet</h3>
          <p style={{ color: "var(--muted)", margin: "0.5rem 0 1.5rem", fontSize: "0.875rem" }}>Add your first student to get started.</p>
          <button onClick={() => { setEditing(null); setDialogOpen(true); }} style={{ background: COLORS.accent, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.625rem 1.5rem", fontWeight: 700, cursor: "pointer" }}>Add First Student</button>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Students</span>
            <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: COLORS.accent, background: COLORS.accentSoft, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>{filtered.length}</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Student", "Class", "Points", "Due", "Actions"].map(h => (
                  <th key={h} style={{ padding: "0.625rem 1rem", fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: h === "Actions" ? "right" : "left", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>No match found.</td></tr>
              ) : filtered.map(s => (
                <tr key={s._id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                      <div style={{ width: 30, height: 30, borderRadius: "50%", overflow: "hidden", background: COLORS.accentSoft, color: COLORS.accentText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6875rem", fontWeight: 800, flexShrink: 0 }}>
                        {s.profileImage ? <img src={`${API_BASE_URL.replace('/api', '')}${s.profileImage}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : s.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)" }}>{s.fullName}</div>
                        <div style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                      {s.classIds && s.classIds.length > 0 ? (
                        s.classIds.map(c => (
                          <span key={c} style={{ fontSize: "0.6875rem", fontWeight: 600, color: COLORS.accent, background: COLORS.accentSoft, padding: "0.15rem 0.4rem", borderRadius: "0.25rem", display: "inline-block" }}>
                            {c}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <span style={{ fontWeight: 800, fontSize: "0.875rem", color: "var(--foreground)" }}>{s.points}</span>
                    <span style={{ fontSize: "0.6875rem", color: "var(--muted)", marginLeft: 4 }}>pts</span>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <DueBadge studentId={s._id} />
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.375rem", justifyContent: "flex-end" }}>
                      <button onClick={() => setDetailStudentId(s._id)} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.375rem", padding: "0.3rem 0.625rem", fontWeight: 600, fontSize: "0.6875rem", cursor: "pointer", color: COLORS.accent }}>
                        <Eye size={12} /> Progress
                      </button>
                      <button onClick={() => { setEditing(s); setDialogOpen(true); }} style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.375rem", padding: "0.3rem 0.625rem", fontWeight: 600, fontSize: "0.6875rem", cursor: "pointer", color: "var(--foreground)" }}>
                        <Pencil size={12} /> Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <StudentDialog
        open={dialogOpen}
        editing={editing}
        teacherClasses={teacherClasses}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchStudents}
      />

      {detailStudentId && (
        <StudentDetailPanel studentId={detailStudentId} onClose={() => setDetailStudentId(null)} />
      )}
    </div>
  );
}
