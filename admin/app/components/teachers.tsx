import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap, Search } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../lib/admin-api";
import { ClassMultiSelect } from "./class-multi-select";
import { showAdminDialog } from "./admin-dialog";

type School = { _id: string; name: string };
type Teacher = { _id: string; fullName: string; email: string; schoolId?: School; classIds: string[]; profileImage?: string; canEditCourses?: boolean };
type ClassDoc = { _id: string; name: string };

function TeacherDialog({
  open,
  editing,
  onClose,
  onSuccess,
  schools,
  classes,
}: {
  open: boolean;
  editing: Teacher | null;
  onClose: () => void;
  onSuccess: () => void;
  schools: School[];
  classes: ClassDoc[];
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "", // Only used for creation
    schoolId: "",
    classIds: [] as string[],
    canEditCourses: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (editing) {
        setFormData({
          fullName: editing.fullName,
          email: editing.email,
          password: "",
          schoolId: editing.schoolId?._id || "",
          classIds: editing.classIds || [],
          canEditCourses: editing.canEditCourses ?? false,
        });
      } else {
        setFormData({ fullName: "", email: "", password: "", schoolId: "", classIds: [], canEditCourses: false });
      }
      setError("");
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      if (editing) {
        // Update existing teacher (two separate calls: one for basic info/school, one for classes to reuse existing endpoints)
        await apiFetch(`/users/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            // Only update password if provided
            ...(formData.password ? { password: formData.password } : {}),
          }),
        });
        
        // Update school assignment
        await apiFetch(`/users/${editing._id}/school`, {
          method: "PATCH",
          body: JSON.stringify({ schoolId: formData.schoolId || null }),
        });

        // Update class assignments
        await apiFetch(`/users/${editing._id}/classes`, {
          method: "PATCH",
          body: JSON.stringify({ classIds: formData.classIds }),
        });

        // Update course-edit permission
        await apiFetch(`/users/${editing._id}/course-permission`, {
          method: "PATCH",
          body: JSON.stringify({ canEditCourses: formData.canEditCourses }),
        });
      } else {
        // Create new teacher
        if (!formData.password) {
          setError("Password is required for new teachers.");
          setSaving(false);
          return;
        }

        const newUser = await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password,
            role: "instructor",
            schoolId: formData.schoolId || undefined,
            classIds: formData.classIds.length > 0 ? formData.classIds : undefined,
          }),
        });

        if (formData.canEditCourses && newUser?._id) {
          await apiFetch(`/users/${newUser._id}/course-permission`, {
            method: "PATCH",
            body: JSON.stringify({ canEditCourses: true }),
          });
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.25rem", overflowY: "auto" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.62)", backdropFilter: "blur(4px)" }} onClick={() => !saving && onClose()} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 600, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", boxShadow: "0 28px 70px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: "0.625rem", background: "var(--admin-accent-soft)", color: "var(--admin-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <GraduationCap size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>{editing ? "Edit Teacher" : "New Teacher"}</h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Manage teacher details, school assignment, and classes</p>
          </div>
        </div>

        {error && (
          <div style={{ background: "var(--admin-danger-soft)", color: "var(--admin-danger)", padding: "0.75rem 1.5rem", fontSize: "0.875rem", borderBottom: "1px solid var(--admin-danger-soft)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label className="admin-label">Full Name <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required className="admin-input" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="e.g. John Doe" autoFocus />
              </div>
              <div>
                <label className="admin-label">Email <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required type="email" className="admin-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@school.edu" />
              </div>
            </div>

            <div>
              <label className="admin-label">Password {editing && <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none" }}>(leave blank to keep current)</span>} {!editing && <span style={{ color: "var(--admin-danger)" }}>*</span>}</label>
              <input 
                type="password" 
                className="admin-input" 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                placeholder={editing ? "Enter new password" : "Enter password"}
                minLength={6}
                required={!editing}
              />
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem", display: "grid", gap: "1.25rem" }}>
              <div>
                <label className="admin-label">Assigned School <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <select
                  required
                  className="admin-select"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                >
                  <option value="">Select a School</option>
                  {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="admin-label">Assigned Classes</label>
                <ClassMultiSelect selectedIds={formData.classIds} onChange={(ids) => setFormData({ ...formData, classIds: ids })} />
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", cursor: "pointer", padding: "0.75rem", borderRadius: "0.625rem", background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
                <input
                  type="checkbox"
                  checked={formData.canEditCourses}
                  onChange={(e) => setFormData({ ...formData, canEditCourses: e.target.checked })}
                  style={{ marginTop: "0.15rem", width: 16, height: 16, flexShrink: 0, accentColor: "var(--admin-accent)" }}
                />
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>Can edit courses</span>
                  <span style={{ display: "block", fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.125rem" }}>
                    Lets this teacher edit chapters and lessons in the Teacher Portal, limited to the classes assigned above.
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-soft)", padding: "0.9rem 1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="admin-btn admin-btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : (editing ? "Save Changes" : "Create Teacher")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function TeachersView() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tchRes, schRes, clsRes] = await Promise.all([
        apiFetch("/users/teachers"),
        apiFetch("/schools?limit=100"),
        apiFetch("/classes?limit=100")
      ]);
      setTeachers(tchRes || []);
      setSchools(schRes.items || []);
      setClasses(clsRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete teacher "${name}"? This action cannot be undone.`)) return;
    try {
      await apiFetch(`/users/${id}`, { method: "DELETE" });
      fetchData();
    } catch (e: any) {
      showAdminDialog({ type: "error", title: "Delete Failed", message: e.message || "Error deleting teacher" });
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.fullName.toLowerCase().includes(search.toLowerCase()) || 
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "2rem", 
        flexWrap: "wrap", 
        gap: "1.5rem",
        background: "var(--surface)",
        padding: "1.5rem",
        borderRadius: "1rem",
        border: "1px solid var(--border)",
        boxShadow: "var(--elevation-1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ 
            width: 48, height: 48, borderRadius: "0.875rem", 
            background: "var(--admin-accent-soft)", color: "var(--admin-accent)", 
            display: "flex", alignItems: "center", justifyContent: "center" 
          }}>
            <GraduationCap size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>Teacher Management</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.125rem", marginBottom: 0 }}>Manage instructor accounts and class assignments</p>
          </div>
        </div>
        <button className="admin-btn admin-btn-primary" style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem" }} onClick={() => { setEditingTeacher(null); setDialogOpen(true); }}>
          <Plus size={18} /> Add New Teacher
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
        <input 
          className="admin-input" 
          placeholder="Search teachers by name or email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)} 
          style={{ paddingLeft: "2.25rem" }} 
        />
      </div>

      {loading && teachers.length === 0 ? (
         <div style={{ padding: "8rem 0", textAlign: "center" }}>
           <div className="admin-spinner" style={{ margin: "0 auto 1rem" }} />
           <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Loading teachers...</p>
         </div>
      ) : teachers.length === 0 && !search ? (
        <div className="admin-card" style={{ padding: "5rem 2rem", textAlign: "center", background: "var(--surface)" }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: "2rem", 
            background: "var(--admin-accent-soft)", color: "var(--admin-accent)", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            margin: "0 auto 1.5rem" 
          }}>
            <GraduationCap size={40} />
          </div>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.5rem", color: "var(--foreground)", letterSpacing: "-0.02em" }}>No teachers found</h3>
          <p style={{ margin: "0.75rem auto 2rem", color: "var(--muted)", fontSize: "0.9375rem", maxWidth: 400, lineHeight: 1.5 }}>
            You haven't added any teachers yet. Create a teacher account to let them access the Teacher Portal.
          </p>
          <button className="admin-btn admin-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.9375rem" }} onClick={() => { setEditingTeacher(null); setDialogOpen(true); }}>
            Add First Teacher
          </button>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div className="admin-card-header" style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>All Registered Teachers</span>
            <span className="admin-badge admin-badge-gray">{filteredTeachers.length} Total</span>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Teacher Details</th>
                <th>Assigned School</th>
                <th>Assigned Classes</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "var(--muted)" }}>
                    No teachers match your search.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map(t => (
                  <tr key={t._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        {t.profileImage ? (
                          <img 
                            src={t.profileImage.startsWith("http") ? t.profileImage : `${API_BASE_URL}${t.profileImage.startsWith("/") ? "" : "/"}${t.profileImage}`} 
                            alt={t.fullName}
                            style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }}
                          />
                        ) : (
                          <div style={{ 
                            width: 32, height: 32, borderRadius: "50%", 
                            background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.75rem", fontWeight: 800
                          }}>
                            {t.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 700, color: "var(--foreground)", marginBottom: "0.125rem" }}>{t.fullName}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{t.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {t.schoolId ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                          <span className="admin-badge admin-badge-gray" style={{ fontSize: "0.6rem" }}>{t.schoolId.name}</span>
                        </div>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.75rem", fontStyle: "italic" }}>Not assigned</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem", marginBottom: t.canEditCourses ? "0.3rem" : 0 }}>
                        {t.classIds && t.classIds.length > 0 ? (
                          t.classIds.map(c => (
                            <span key={c} className="admin-badge admin-badge-blue" style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}>
                              {c}
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>—</span>
                        )}
                      </div>
                      {t.canEditCourses ? (
                        <span className="admin-badge admin-badge-green" style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}>Can edit courses</span>
                      ) : null}
                    </td>
                    <td>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                        <button className="admin-btn admin-btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }} onClick={() => { setEditingTeacher(t); setDialogOpen(true); }}>
                          <Pencil size={13} /> Edit
                        </button>
                        <button className="admin-btn admin-btn-danger" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }} onClick={() => handleDelete(t._id, t.fullName)}>
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <TeacherDialog
        open={dialogOpen}
        editing={editingTeacher}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { fetchData(); }}
        schools={schools}
        classes={classes}
      />
    </div>
  );
}

