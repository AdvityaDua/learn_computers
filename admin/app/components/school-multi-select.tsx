import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/admin-api";

export function SchoolMultiSelect({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [schools, setSchools] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    apiFetch("/schools?limit=100")
      .then((res) => {
        const items = res.items || [];
        setSchools(items);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((s) => s !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {schools.map((s) => {
        const isSelected = selectedIds.includes(s._id);
        return (
          <button
            key={s._id}
            type="button"
            onClick={() => handleToggle(s._id)}
            style={{
              padding: "0.375rem 0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              border: isSelected ? "1px solid var(--admin-accent)" : "1px solid var(--border)",
              background: isSelected ? "var(--admin-accent-soft)" : "var(--surface)",
              color: isSelected ? "var(--admin-accent)" : "var(--foreground)",
            }}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}
