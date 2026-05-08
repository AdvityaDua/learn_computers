"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function DatePicker({ value, onChange, placeholder = "Select date" }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value ? new Date(value) : new Date());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) window.addEventListener("mousedown", handleOutside);
    return () => window.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const startDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleSelect = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    // Format as YYYY-MM-DD (local)
    const formatted = d.toISOString().split("T")[0];
    onChange(formatted);
    setOpen(false);
  };

  const isToday = (day: number) => {
    const now = new Date();
    return now.getDate() === day && now.getMonth() === viewDate.getMonth() && now.getFullYear() === viewDate.getFullYear();
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const sel = new Date(value);
    return sel.getDate() === day && sel.getMonth() === viewDate.getMonth() && sel.getFullYear() === viewDate.getFullYear();
  };

  const monthName = viewDate.toLocaleString("default", { month: "long" });
  const year = viewDate.getFullYear();

  const days = [];
  const startDay = startDayOfMonth(year, viewDate.getMonth());
  const totalDays = daysInMonth(year, viewDate.getMonth());

  // Padding for start of month
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const formattedDisplay = value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <div 
        className="admin-input"
        style={{ 
          display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer",
          paddingRight: "0.5rem"
        }}
        onClick={() => setOpen(!open)}
      >
        <CalendarIcon size={16} color="var(--muted)" />
        <span style={{ flex: 1, color: value ? "var(--foreground)" : "var(--muted)" }}>
          {formattedDisplay || placeholder}
        </span>
        {value && (
          <button 
            onClick={(e) => { e.stopPropagation(); onChange(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0.25rem" }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 0.5rem)", left: 0, zIndex: 100,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "1rem", boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
          width: 280, padding: "1rem", userSelect: "none"
        }}>
          {/* Calendar Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <button onClick={handlePrevMonth} className="admin-btn admin-btn-ghost" style={{ padding: "0.4rem" }}>
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{monthName} {year}</span>
            <button onClick={handleNextMonth} className="admin-btn admin-btn-ghost" style={{ padding: "0.4rem" }}>
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekdays */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: "0.5rem" }}>
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
              <span key={d} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 700, color: "var(--muted)" }}>{d}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
            {days.map((day, i) => (
              <div key={i} style={{ aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {day && (
                  <button
                    onClick={() => handleSelect(day)}
                    style={{
                      width: "100%", height: "100%", borderRadius: "0.5rem", border: "none",
                      background: isSelected(day) ? "var(--admin-accent)" : isToday(day) ? "var(--admin-accent-soft)" : "transparent",
                      color: isSelected(day) ? "#fff" : isToday(day) ? "var(--admin-accent)" : "var(--foreground)",
                      fontSize: "0.8rem", fontWeight: (isSelected(day) || isToday(day)) ? 700 : 500,
                      cursor: "pointer", transition: "all 0.15s"
                    }}
                    className={!isSelected(day) ? "hover:bg-surface-soft" : ""}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Today Button */}
          <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "0.75rem", display: "flex", justifyContent: "center" }}>
            <button 
              className="admin-btn admin-btn-ghost" 
              style={{ fontSize: "0.75rem", width: "100%" }}
              onClick={() => {
                const now = new Date();
                onChange(now.toISOString().split("T")[0]);
                setOpen(false);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
