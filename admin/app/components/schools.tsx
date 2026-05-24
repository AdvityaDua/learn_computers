import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { apiFetch } from "../lib/admin-api";
import { ClassMultiSelect } from "./class-multi-select";
import { TeacherMultiSelect } from "./teacher-multi-select";
import { showAdminDialog } from "./admin-dialog";

type School = { 
  _id: string; 
  name: string; 
  code: string; 
  isActive: boolean; 
  contactEmail: string; 
  contactPhone: string;
  assignedClasses?: string[];
  teacherIds?: string[];
  maxStudents?: number;
};

function SchoolDialog({
  open,
  editing,
  onClose,
  onSuccess,
}: {
  open: boolean;
  editing: School | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({ 
    name: "", 
    code: "", 
    contactEmail: "", 
    contactPhone: "", 
    isActive: true,
    assignedClasses: [] as string[],
    teacherIds: [] as string[],
    maxStudents: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setFormData({
          name: editing.name,
          code: editing.code,
          contactEmail: editing.contactEmail,
          contactPhone: editing.contactPhone,
          isActive: editing.isActive,
          assignedClasses: editing.assignedClasses || [],
          teacherIds: editing.teacherIds || [],
          maxStudents: editing.maxStudents ?? 0,
        });
      } else {
        setFormData({ name: "", code: "", contactEmail: "", contactPhone: "", isActive: true, assignedClasses: ["Class 3"], teacherIds: [], maxStudents: 0 });
      }
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/schools/${editing._id}`, { method: "PATCH", body: JSON.stringify(formData) });
      } else {
        await apiFetch("/schools", { method: "POST", body: JSON.stringify(formData) });
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      showAdminDialog({ type: "error", title: "Save Failed", message: e.message || "Error saving school" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.25rem", overflowY: "auto" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.62)" }} onClick={() => !saving && onClose()} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 600, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", boxShadow: "0 28px 70px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: "0.625rem", background: "var(--admin-accent-soft)", color: "var(--admin-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Building2 size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>{editing ? "Edit School" : "New School"}</h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Manage school details, classes, and teachers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label className="admin-label">School Name <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required className="admin-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Springfield Elementary" autoFocus />
              </div>
              <div>
                <label className="admin-label">School Code <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required className="admin-input" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} style={{ textTransform: "uppercase" }} placeholder="e.g. SFE" />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label className="admin-label">Contact Email</label>
                <input type="email" className="admin-input" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} placeholder="admin@school.com" />
              </div>
              <div>
                <label className="admin-label">Contact Phone</label>
                <input className="admin-input" value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="+1 234 567 8900" />
              </div>
            </div>

            <div style={{ display: "grid", gap: "1.25rem" }}>
              <div>
                <label className="admin-label">Assigned Classes</label>
                <ClassMultiSelect selectedIds={formData.assignedClasses} onChange={(ids) => setFormData({ ...formData, assignedClasses: ids })} />
              </div>
              <div>
                <label className="admin-label">Assigned Teachers</label>
                <TeacherMultiSelect selectedIds={formData.teacherIds} onChange={(ids) => setFormData({ ...formData, teacherIds: ids })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label className="admin-label">Max Students <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none" }}>(0 = unlimited)</span></label>
                <input type="number" min={0} className="admin-input" value={formData.maxStudents} onChange={e => setFormData({ ...formData, maxStudents: parseInt(e.target.value) || 0 })} placeholder="0" />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: "0.375rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} style={{ transform: "scale(1.1)" }} />
                  <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Active School</label>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-soft)", padding: "0.9rem 1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="admin-btn admin-btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : (editing ? "Save Changes" : "Create School")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function SchoolsView() {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await apiFetch("/schools?limit=100");
      setSchools(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete school "${name}"? This cannot be undone.`)) return;
    await apiFetch(`/schools/${id}`, { method: "DELETE" });
    fetchSchools();
  };

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
            <Building2 size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>School Management</h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.125rem", marginBottom: 0 }}>Configure platform schools, class mapping, and faculty</p>
          </div>
        </div>
        <button className="admin-btn admin-btn-primary" style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem" }} onClick={() => { setEditingSchool(null); setDialogOpen(true); }}>
          <Plus size={18} /> Add New School
        </button>
      </div>

      {loading && schools.length === 0 ? (
        <div style={{ padding: "8rem 0", textAlign: "center" }}>
          <div className="admin-spinner" style={{ margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Loading your school network...</p>
        </div>
      ) : schools.length === 0 ? (
        <div className="admin-card" style={{ padding: "5rem 2rem", textAlign: "center", background: "var(--surface)" }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: "2rem", 
            background: "var(--admin-accent-soft)", color: "var(--admin-accent)", 
            display: "flex", alignItems: "center", justifyContent: "center", 
            margin: "0 auto 1.5rem" 
          }}>
            <Building2 size={40} />
          </div>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: "1.5rem", color: "var(--foreground)", letterSpacing: "-0.02em" }}>Build your school network</h3>
          <p style={{ margin: "0.75rem auto 2rem", color: "var(--muted)", fontSize: "0.9375rem", maxWidth: 400, lineHeight: 1.5 }}>
            You haven't added any schools yet. Create your first school to start managing classes and assigning teachers.
          </p>
          <button className="admin-btn admin-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "0.9375rem" }} onClick={() => { setEditingSchool(null); setDialogOpen(true); }}>
            Register First School
          </button>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <div className="admin-card-header" style={{ background: "var(--surface-soft)", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>All Registered Schools</span>
            <span className="admin-badge admin-badge-gray">{schools.length} Total</span>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>School Details</th>
                <th>Assigned Classes</th>
                <th>Teachers</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schools.map(s => (
                <tr key={s._id}>
                  <td>
                    <div style={{ fontWeight: 700, color: "var(--foreground)", marginBottom: "0.25rem" }}>{s.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span className="admin-badge admin-badge-gray" style={{ fontSize: "0.6rem", padding: "0.1rem 0.3rem" }}>{s.code}</span>
                      {s.contactEmail && <span>{s.contactEmail}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                      {s.assignedClasses && s.assignedClasses.length > 0 ? (
                        s.assignedClasses.map(cls => (
                          <span key={cls} className="admin-badge admin-badge-blue" style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}>{cls}</span>
                        ))
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="admin-badge admin-badge-gray">{s.teacherIds?.length || 0}</span>
                  </td>
                  <td>
                    <span className={`admin-badge ${s.isActive ? "admin-badge-green" : "admin-badge-red"}`}>
                      {s.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <button className="admin-btn admin-btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }} onClick={() => { setEditingSchool(s); setDialogOpen(true); }}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button className="admin-btn admin-btn-danger" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }} onClick={() => handleDelete(s._id, s.name)}>
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SchoolDialog
        open={dialogOpen}
        editing={editingSchool}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { fetchSchools(); }}
      />
    </div>
  );
}
