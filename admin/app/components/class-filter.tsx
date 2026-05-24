import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/admin-api";

export function ClassFilter({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    apiFetch("/classes").then(res => setClasses(res.items || [])).catch(console.error);
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase' }}>
        Filter Class:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="admin-select"
        style={{ width: '140px', padding: '0.35rem 0.5rem', height: '32px' }}
      >
        <option value="">All Classes</option>
        <option value="Class 3">Class 3 (Default)</option>
        {classes.map(c => c.name !== "Class 3" && <option key={c._id} value={c.name}>{c.name}</option>)}
      </select>
    </div>
  );
}
