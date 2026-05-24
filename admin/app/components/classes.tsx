import React, { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Library } from "lucide-react";
import { apiFetch } from "../lib/admin-api";
import { showAdminDialog } from "./admin-dialog";

type Class = { _id: string; name: string; grade: number; isActive: boolean };

function ClassDialog({
  open,
  editing,
  onClose,
  onSuccess,
}: {
  open: boolean;
  editing: Class | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({ name: "", grade: 3, isActive: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setFormData({ name: editing.name, grade: editing.grade, isActive: editing.isActive });
      } else {
        setFormData({ name: "", grade: 3, isActive: true });
      }
    }
  }, [open, editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...formData, grade: Number(formData.grade) };
      if (editing) {
        await apiFetch(`/classes/${editing._id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await apiFetch("/classes", { method: "POST", body: JSON.stringify(payload) });
      }
      onSuccess();
      onClose();
    } catch (e: any) {
      showAdminDialog({ type: "error", title: "Save Failed", message: e.message || "Error saving class" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.25rem", overflowY: "auto" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.62)" }} onClick={() => !saving && onClose()} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 500, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", boxShadow: "0 28px 70px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0 }}>
          <div style={{ width: 40, height: 40, borderRadius: "0.625rem", background: "var(--admin-accent-soft)", color: "var(--admin-accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Library size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>{editing ? "Edit Class" : "New Class"}</h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Manage class details and grades.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label className="admin-label">Class Name <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required className="admin-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Class 3" autoFocus />
              </div>
              <div>
                <label className="admin-label">Numeric Grade <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required type="number" min="1" max="12" className="admin-input" value={formData.grade} onChange={e => setFormData({ ...formData, grade: Number(e.target.value) })} />
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
              <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} style={{ transform: "scale(1.1)" }} />
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Active Class</label>
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-soft)", padding: "0.9rem 1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-ghost" type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button className="admin-btn admin-btn-primary" type="submit" disabled={saving}>{saving ? "Saving..." : (editing ? "Save Changes" : "Create Class")}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ClassesView() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const clsRes = await apiFetch("/classes");
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
    if (!confirm(`Delete class "${name}"? This cannot be undone.`)) return;
    await apiFetch(`/classes/${id}`, { method: "DELETE" });
    fetchData();
  };

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Class Management</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.25rem", marginBottom: 0 }}>Manage global classes in the platform.</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => { setEditingClass(null); setDialogOpen(true); }}>
          <Plus size={14} /> Add Class
        </button>
      </div>

      {loading && classes.length === 0 ? (
        <div style={{ padding: "4rem", textAlign: "center", color: "var(--muted)" }}>Loading classes...</div>
      ) : classes.length === 0 ? (
        <div className="admin-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "1.25rem", background: "var(--admin-accent-soft)", color: "var(--admin-accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <Library size={32} />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "1.125rem", color: "var(--foreground)" }}>No classes yet</p>
          <p style={{ margin: "0.5rem 0 1.5rem", color: "var(--muted)", fontSize: "0.875rem", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
            Create global classes that can be mapped to individual schools.
          </p>
          <button className="admin-btn admin-btn-primary" onClick={() => { setEditingClass(null); setDialogOpen(true); }}>
            Create First Class
          </button>
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Grade</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c._id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td><span className="admin-badge admin-badge-blue">Grade {c.grade}</span></td>
                  <td>
                    <span className={`admin-badge ${c.isActive ? "admin-badge-green" : "admin-badge-red"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <button className="admin-btn admin-btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }} onClick={() => { setEditingClass(c); setDialogOpen(true); }}>
                        <Pencil size={13} /> Edit
                      </button>
                      <button className="admin-btn admin-btn-danger" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }} onClick={() => handleDelete(c._id, c.name)}>
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

      <ClassDialog
        open={dialogOpen}
        editing={editingClass}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { fetchData(); }}
      />
    </div>
  );
}
