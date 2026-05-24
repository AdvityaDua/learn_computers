import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/admin-api";

export function ClassMultiSelect({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [classes, setClasses] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    apiFetch("/classes?limit=100")
      .then((res) => {
        const items = res.items || [];
        // Ensure "Class 3" is always there as an option, even if not explicitly in DB
        if (!items.find((c: any) => c.name === "Class 3")) {
          items.unshift({ _id: "class-3-default", name: "Class 3" });
        }
        setClasses(items);
      })
      .catch(console.error);
  }, []);

  const toggleClass = (name: string) => {
    if (selectedIds.includes(name)) {
      onChange(selectedIds.filter((id) => id !== name));
    } else {
      onChange([...selectedIds, name]);
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {classes.map((c) => {
        const isSelected = selectedIds.includes(c.name);
        return (
          <button
            key={c._id}
            type="button"
            onClick={() => toggleClass(c.name)}
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
            {c.name} {c.name === "Class 3" && <span style={{ opacity: 0.6, fontSize: "0.7rem", marginLeft: "0.25rem" }}>(Default)</span>}
          </button>
        );
      })}
    </div>
  );
}
