import React from "react";
import { useAdminData } from "../contexts/admin-data-context";

export function ClassMultiSelect({
  selectedIds,
  onChange,
}: {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { classes } = useAdminData();

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
              fontFamily: "inherit",
            }}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
