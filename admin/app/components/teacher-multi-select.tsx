import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/admin-api";

export function TeacherMultiSelect({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [teachers, setTeachers] = useState<{ _id: string; fullName: string; email: string }[]>([]);

  useEffect(() => {
    apiFetch("/users/teachers")
      .then((res) => {
        // Assume res is an array of teachers or { items: ... }
        setTeachers(Array.isArray(res) ? res : (res.items || []));
      })
      .catch(console.error);
  }, []);

  const toggleTeacher = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((tid) => tid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", padding: "0.5rem", border: "1px solid var(--border)", borderRadius: "0.5rem", background: "var(--surface-soft)", maxHeight: 150, overflowY: "auto" }}>
      {teachers.length === 0 ? (
        <span style={{ fontSize: "0.8125rem", color: "var(--muted)" }}>No teachers available.</span>
      ) : (
        teachers.map((t) => (
          <label key={t._id} style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8125rem", cursor: "pointer", background: "var(--surface)", padding: "0.2rem 0.5rem", borderRadius: "0.25rem", border: "1px solid var(--border)" }}>
            <input type="checkbox" checked={selectedIds.includes(t._id)} onChange={() => toggleTeacher(t._id)} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600 }}>{t.fullName}</span>
              <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{t.email}</span>
            </div>
          </label>
        ))
      )}
    </div>
  );
}
