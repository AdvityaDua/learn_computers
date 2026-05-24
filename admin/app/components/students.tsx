"use client";

import React, { useEffect, useState } from "react";
import { fetchAdmin, apiFetch, API_BASE_URL } from "../lib/admin-api";
import { showAdminDialog } from "./admin-dialog";

interface Teacher { _id: string; fullName: string; email: string; classIds: string[] }
interface ClassDoc { _id: string; name: string }

interface Student {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt?: string;
  profileImage?: string;
  classIds?: string[];
  teacherId?: { _id: string; fullName: string; email: string } | string;
  schoolId?: { _id: string; name: string } | string;
}

interface School { _id: string; name: string; }

interface UserProgress {
  completionPercentage: number;
  completedLessons: { lessonId: string; chapterTitle: string; lessonTitle: string; completedAt: string }[];
  quizAttempts: { quizId: string; title: string; score: number; totalQuestions: number; completedAt: string }[];
  submissions: { taskType: string; taskId: string; title: string; originalName: string; submittedAt: string }[];
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 70 ? "var(--admin-success)" : value >= 40 ? "var(--admin-warning)" : "var(--admin-danger)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
      <div style={{ flex: 1, height: 5, background: "var(--surface-soft)", borderRadius: 999, border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 999, transition: "width 0.8s ease" }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 700, color, minWidth: "2.5rem", textAlign: "right" }}>{value}%</span>
    </div>
  );
}

function Avatar({ name, image }: { name: string; image?: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  if (image) {
    const src = image.startsWith("http") ? image : `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
    return <img src={src} alt={name} style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
      background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "0.7rem", fontWeight: 800,
    }}>
      {initials}
    </div>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Progress Detail Modal ────────────────────────────────────────────────────

function ProgressModal({ student, onClose }: { student: Student; onClose: () => void }) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"lessons" | "quizzes" | "submissions">("lessons");

  useEffect(() => {
    fetchAdmin(`/progress/admin/users/${student._id}`)
      .then((r) => r.json())
      .then(setProgress)
      .catch(() => setProgress(null))
      .finally(() => setLoading(false));
  }, [student._id]);

  const pct = progress?.completionPercentage ?? 0;
  const statusColor = pct >= 70 ? "var(--admin-success)" : pct >= 40 ? "var(--admin-warning)" : "var(--admin-danger)";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "min(560px, 100vw)", height: "100vh", background: "var(--surface)", borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column", overflowY: "auto",
        animation: "slideInRight 0.3s cubic-bezier(.22,1,.36,1) both",
      }}>
        {/* Header */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
          <Avatar name={student.fullName || student.email} image={student.profileImage} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--foreground)" }}>{student.fullName || "—"}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{student.email}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: "0.375rem", borderRadius: "0.5rem", background: "var(--surface-soft)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted)", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Overall progress */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--muted)" }}>Overall Progress</span>
            <span style={{ fontSize: "1.5rem", fontWeight: 900, color: statusColor }}>{pct}%</span>
          </div>
          <ProgressBar value={pct} />
          {progress && (
            <div style={{ marginTop: "0.875rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <div style={{ background: "var(--surface-soft)", borderRadius: "0.75rem", padding: "0.75rem 1rem", flex: 1, minWidth: 100, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "1.375rem", fontWeight: 900, color: "var(--foreground)" }}>{progress.completedLessons.length}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>Lessons Completed</div>
              </div>
              <div style={{ background: "var(--surface-soft)", borderRadius: "0.75rem", padding: "0.75rem 1rem", flex: 1, minWidth: 100, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "1.375rem", fontWeight: 900, color: "var(--foreground)" }}>{progress.quizAttempts.length}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>Quizzes Attempted</div>
              </div>
              <div style={{ background: "var(--surface-soft)", borderRadius: "0.75rem", padding: "0.75rem 1rem", flex: 1, minWidth: 100, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "1.375rem", fontWeight: 900, color: "var(--foreground)" }}>{progress.submissions.length}</div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>Tasks Submitted</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ padding: "0 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.25rem" }}>
          {(["lessons", "quizzes", "submissions"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              style={{
                padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 700, border: "none",
                background: "none", cursor: "pointer", color: tab === t ? "var(--admin-accent)" : "var(--muted)",
                borderBottom: tab === t ? "2px solid var(--admin-accent)" : "2px solid transparent",
                textTransform: "capitalize", transition: "color 0.15s",
              }}
            >
              {t === "lessons" ? "Lessons" : t === "quizzes" ? "Quizzes" : "Submissions"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: "1.25rem 1.5rem", flex: 1 }}>
          {loading && <div style={{ textAlign: "center", color: "var(--muted)", padding: "2rem", fontSize: "0.875rem" }}>Loading progress…</div>}
          {!loading && !progress && <div style={{ color: "var(--admin-danger)", fontSize: "0.875rem" }}>Could not load progress data.</div>}

          {!loading && progress && tab === "lessons" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {progress.completedLessons.length === 0 && <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No lessons completed yet.</div>}
              {progress.completedLessons.map((l) => (
                <div key={l.lessonId} style={{ background: "var(--surface-soft)", borderRadius: "0.75rem", padding: "0.75rem 1rem", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>{l.lessonTitle}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>{l.chapterTitle}</div>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", flexShrink: 0, textAlign: "right" }}>
                    <span className="admin-badge admin-badge-green">✓ Done</span>
                    <div style={{ marginTop: 4 }}>{fmtDate(l.completedAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && progress && tab === "quizzes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {progress.quizAttempts.length === 0 && <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No quizzes attempted yet.</div>}
              {progress.quizAttempts.map((q) => {
                const scorePct = q.totalQuestions > 0 ? Math.round((q.score / q.totalQuestions) * 100) : 0;
                return (
                  <div key={q.quizId} style={{ background: "var(--surface-soft)", borderRadius: "0.75rem", padding: "0.75rem 1rem", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>{q.title}</div>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{fmtDate(q.completedAt)}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <div style={{ flex: 1, height: 4, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${scorePct}%`, background: scorePct >= 70 ? "var(--admin-success)" : scorePct >= 40 ? "var(--admin-warning)" : "var(--admin-danger)", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: "0.8125rem", fontWeight: 800, minWidth: "3.5rem", textAlign: "right" }}>{q.score}/{q.totalQuestions} ({scorePct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && progress && tab === "submissions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {progress.submissions.length === 0 && <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No tasks submitted yet.</div>}
              {progress.submissions.map((s) => {
                const status = (s as any).reviewStatus || "pending";
                const statusColors: Record<string, { label: string; color: string; bg: string }> = {
                  approved: { label: "Approved", color: "#10B981", bg: "#ECFDF5" },
                  pending: { label: "Pending Review", color: "#F59E0B", bg: "#FFFBEB" },
                  rejected: { label: "Rejected", color: "#EF4444", bg: "#FEF2F2" },
                  resubmit_requested: { label: "Resubmit Requested", color: "var(--admin-accent)", bg: "var(--admin-accent-soft)" },
                };
                const st = statusColors[status] || statusColors.pending;
                const pts = (s as any).pointsAwarded ?? 0;
                const feedback = (s as any).reviewFeedback ?? "";
                return (
                  <div key={s.taskId} style={{ background: "var(--surface-soft)", borderRadius: "0.75rem", padding: "0.75rem 1rem", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>{s.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span className={`admin-badge ${s.taskType === "assignment" ? "admin-badge-blue" : "admin-badge-gray"}`}>{s.taskType}</span>
                          <span>{s.originalName}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, textAlign: "right" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem", fontSize: "0.6875rem", fontWeight: 700, color: st.color, background: st.bg, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                          {st.label}
                        </span>
                        <div style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 4 }}>{fmtDate(s.submittedAt)}</div>
                        {status === "approved" && pts > 0 && (
                          <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#10B981", marginTop: 2 }}>+{pts} pts</div>
                        )}
                      </div>
                    </div>
                    {feedback && (
                      <div style={{ marginTop: "0.5rem", padding: "0.5rem 0.75rem", background: "var(--surface)", borderRadius: "0.5rem", border: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>
                        &ldquo;{feedback}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main View ─────────────────────────────────────────────────────────────────

export function StudentsView() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [progressCache, setProgressCache] = useState<Record<string, number>>({});
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", teacherId: "", classId: "", schoolId: "" });

  const [filterSchool, setFilterSchool] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    fetchAdmin("/users?role=student")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data.filter((u: Student) => u.role === "student") : [];
        setStudents(list);
        list.forEach((s: Student) => {
          fetchAdmin(`/progress/admin/users/${s._id}`)
            .then((r) => r.json())
            .then((p) => {
              if (typeof p?.completionPercentage === "number") {
                setProgressCache((prev) => ({ ...prev, [s._id]: p.completionPercentage }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => setError("Could not load students. Make sure you are logged in as admin."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    apiFetch("/users/teachers").then(setTeachers).catch(() => {});
    apiFetch("/classes?limit=100").then((d: any) => setClasses(d?.items || [])).catch(() => {});
    apiFetch("/schools?limit=100").then((d: any) => setSchools(d?.items || [])).catch(() => {});
  }, []);

  const openEdit = (s: Student) => {
    const tid = typeof s.teacherId === "object" && s.teacherId ? s.teacherId._id : (s.teacherId as string || "");
    const sid = typeof s.schoolId === "object" && s.schoolId ? s.schoolId._id : (s.schoolId as string || "");
    setEditingStudent(s);
    setFormData({ fullName: s.fullName, email: s.email, password: "", teacherId: tid, classId: s.classIds?.[0] || "", schoolId: sid });
    setShowForm(true);
  };

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await apiFetch(`/users/admin/students/${editingStudent._id}`, {
          method: "PATCH",
          body: JSON.stringify({
            fullName: formData.fullName,
            ...(formData.password ? { password: formData.password } : {}),
            classIds: formData.classId ? [formData.classId] : undefined,
            teacherId: formData.teacherId || undefined,
            schoolId: formData.schoolId || undefined,
          }),
        });
      } else {
        if (!formData.teacherId) { showAdminDialog({ type: "error", title: "Teacher Required", message: "Every student must be assigned to a teacher." }); return; }
        if (!formData.classId) { showAdminDialog({ type: "error", title: "Class Required", message: "Every student must be assigned to a class." }); return; }
        if (!formData.schoolId) { showAdminDialog({ type: "error", title: "School Required", message: "Every student must be assigned to a school." }); return; }
        await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify({ fullName: formData.fullName, email: formData.email, password: formData.password, role: "student", teacherId: formData.teacherId, classIds: [formData.classId], schoolId: formData.schoolId }),
        });
      }
      setShowForm(false);
      setEditingStudent(null);
      setFormData({ fullName: "", email: "", password: "", teacherId: "", classId: "", schoolId: "" });
      fetchUsers();
    } catch (err: any) {
      showAdminDialog({ type: "error", title: editingStudent ? "Update Failed" : "Creation Failed", message: err.message || "Error" });
    }
  };

  const handleDelete = async (s: Student) => {
    if (!confirm(`Are you sure you want to delete ${s.fullName}? This action cannot be undone.`)) return;
    try {
      await apiFetch(`/users/${s._id}`, { method: "DELETE" });
      fetchUsers();
    } catch (err: any) {
      showAdminDialog({ type: "error", title: "Delete Failed", message: err.message || "Failed to delete student." });
    }
  };

  const getTeacherName = (s: Student) => {
    if (typeof s.teacherId === "object" && s.teacherId) return s.teacherId.fullName;
    if (typeof s.teacherId === "string" && s.teacherId) { const t = teachers.find(t => t._id === s.teacherId); return t?.fullName || "—"; }
    return "—";
  };

  const filtered = students.filter(
    (s) => {
      if (search && !s.fullName?.toLowerCase().includes(search.toLowerCase()) && !s.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSchool) {
        const sid = typeof s.schoolId === "object" ? s.schoolId?._id : s.schoolId;
        if (sid !== filterSchool) return false;
      }
      if (filterClass) {
        if (!s.classIds?.includes(filterClass)) return false;
      }
      if (filterTeacher) {
        const tid = typeof s.teacherId === "object" ? s.teacherId?._id : s.teacherId;
        if (tid !== filterTeacher) return false;
      }
      return true;
    }
  );

  return (
    <div style={{ maxWidth: 960 }}>
      {/* Progress detail slide-over */}
      {selectedStudent && <ProgressModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />}

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Students</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.2rem", margin: 0 }}>
            {loading ? "Loading…" : `${students.length} registered students`}
          </p>
        </div>
        {!showForm && (
          <button className="admin-btn admin-btn-primary" onClick={() => { setEditingStudent(null); setFormData({ fullName: "", email: "", password: "", teacherId: "", classId: "", schoolId: "" }); setShowForm(true); }}>+ Add Student</button>
        )}
      </div>

      {showForm && (
        <div className="admin-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>{editingStudent ? "Edit Student" : "Create New Student"}</h3>
          <form onSubmit={handleCreateOrEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="admin-label">Full Name <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required className="admin-input" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Email <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required={!editingStudent} type="email" className="admin-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} disabled={!!editingStudent} style={{ opacity: editingStudent ? 0.6 : 1 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="admin-label">Password {editingStudent ? <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none" }}>(leave blank to keep)</span> : <span style={{ color: "var(--admin-danger)" }}>*</span>}</label>
                <input type="password" minLength={6} className="admin-input" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required={!editingStudent} />
              </div>
              <div>
                <label className="admin-label">Assign Teacher <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <select required={!editingStudent} className="admin-select" value={formData.teacherId} onChange={e => setFormData({ ...formData, teacherId: e.target.value })}>
                  <option value="">Select a teacher</option>
                  {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName} ({t.email})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="admin-label">Assign Class <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <select required={!editingStudent} className="admin-select" value={formData.classId} onChange={e => setFormData({ ...formData, classId: e.target.value })}>
                  <option value="">Select a class</option>
                  {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
                {editingStudent && <p style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: "0.25rem" }}>⚡ Changing the class will auto-reassign the teacher to the one associated with the new class.</p>}
              </div>
              <div>
                <label className="admin-label">Assign School <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <select required className="admin-select" value={formData.schoolId} onChange={e => setFormData({ ...formData, schoolId: e.target.value })}>
                  <option value="">Select a school</option>
                  {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button type="submit" className="admin-btn admin-btn-primary">{editingStudent ? "Save Changes" : "Create Student"}</button>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowForm(false); setEditingStudent(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 300px" }}>
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input className="admin-input" placeholder="Search by name or email…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "2.25rem" }} />
        </div>
        <select className="admin-select" style={{ flex: "0 0 200px" }} value={filterSchool} onChange={e => setFilterSchool(e.target.value)}>
          <option value="">All Schools</option>
          {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select className="admin-select" style={{ flex: "0 0 160px" }} value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <select className="admin-select" style={{ flex: "0 0 200px" }} value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
          <option value="">All Teachers</option>
          {teachers.map(t => <option key={t._id} value={t._id}>{t.fullName}</option>)}
        </select>
      </div>

      {error && (
        <div style={{ background: "var(--admin-danger-soft)", border: "1px solid var(--admin-danger)", borderRadius: "0.5rem", padding: "0.875rem 1rem", marginBottom: "1rem", fontSize: "0.8125rem", color: "var(--admin-danger)" }}>
          {error}
        </div>
      )}

      <div className="admin-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--muted)", fontSize: "0.875rem" }}>Loading students…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr><th>Student</th><th>Teacher</th><th>Class</th><th style={{ minWidth: 140 }}>Progress</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const pct = progressCache[s._id] ?? 0;
                  return (
                    <tr key={s._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                          <Avatar name={s.fullName || s.email} image={s.profileImage} />
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{s.fullName || "—"}</div>
                            <div style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--foreground)" }}>{getTeacherName(s)}</span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem" }}>
                          {(s.classIds || []).length > 0 ? s.classIds!.map(c => (
                            <span key={c} className="admin-badge admin-badge-blue" style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem" }}>{c}</span>
                          )) : <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>—</span>}
                        </div>
                      </td>
                      <td><ProgressBar value={pct} /></td>
                      <td>
                        <span className={`admin-badge ${pct >= 70 ? "admin-badge-green" : pct >= 40 ? "admin-badge-yellow" : "admin-badge-red"}`}>
                          {pct >= 70 ? "On Track" : pct >= 40 ? "In Progress" : "Needs Help"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.375rem" }}>
                          <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }} onClick={() => openEdit(s)}>Edit</button>
                          <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }} onClick={() => setSelectedStudent(s)}>Progress</button>
                          <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem", color: "var(--admin-danger)", borderColor: "var(--admin-danger-soft)" }} onClick={() => handleDelete(s)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--muted)", padding: "2.5rem" }}>
                    {error ? "Error loading data" : search ? "No students match your search." : "No students yet."}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
