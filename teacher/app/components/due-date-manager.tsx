"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { COLORS } from "../lib/constants";
import { Dialog } from "./dialog";
import { Calendar, ClipboardList, Brain, Puzzle, Save, Clock, Plus, Trash2 } from "lucide-react";

type DeadlineItem = {
  _id: string;
  teacherId: string;
  taskType: "assignment" | "activity" | "quiz";
  taskId: string;
  taskTitle: string;
  classId: string;
  dueDate: string;
};

type TaskItem = {
  _id: string;
  title: string;
  dueDate?: string;
  classIds: string[];
  type: "assignment" | "activity" | "quiz";
};

type ClassInfo = { _id: string; name: string; grade: number };

export function DueDateManager() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>([]);
  const [allTasks, setAllTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"deadlines" | "set">("deadlines");

  // Set dialog
  const [showSetDialog, setShowSetDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [newDueDate, setNewDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/users/teacher/dashboard");
        setClasses(data.classes);
        if (data.classes.length > 0) setSelectedClass(data.classes[0].name);
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const fetchDeadlines = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const [dls, asgRes, actRes, qzRes] = await Promise.all([
        apiFetch(`/progress/teacher/deadlines?classId=${encodeURIComponent(selectedClass)}`),
        apiFetch("/assignments?limit=100"),
        apiFetch("/activities?limit=100"),
        apiFetch("/quizzes?limit=100"),
      ]);
      setDeadlines(dls || []);

      const asgItems = (asgRes.items || asgRes || []).map((a: TaskItem & Record<string, unknown>) => ({ ...a, type: "assignment" as const }));
      const actItems = (actRes.items || actRes || []).map((a: TaskItem & Record<string, unknown>) => ({ ...a, type: "activity" as const }));
      const qzItems = (qzRes.items || qzRes || []).map((q: TaskItem & Record<string, unknown>) => ({ ...q, type: "quiz" as const }));

      const all = [...asgItems, ...actItems, ...qzItems].filter((a: TaskItem) =>
        (a.classIds || []).includes(selectedClass)
      );
      setAllTasks(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDeadlines(); }, [selectedClass]);

  const handleSetDeadline = async () => {
    if (!selectedTask || !selectedClass) return;
    setSaving(true);
    try {
      await apiFetch("/progress/teacher/deadlines", {
        method: "POST",
        body: JSON.stringify({
          taskType: selectedTask.type,
          taskId: selectedTask._id,
          classId: selectedClass,
          dueDate: newDueDate || null,
        }),
      });
      setShowSetDialog(false);
      setSelectedTask(null);
      setNewDueDate("");
      fetchDeadlines();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to set deadline");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveDeadline = async (dl: DeadlineItem) => {
    try {
      await apiFetch("/progress/teacher/deadlines", {
        method: "POST",
        body: JSON.stringify({
          taskType: dl.taskType,
          taskId: dl.taskId,
          classId: dl.classId,
          dueDate: null,
        }),
      });
      fetchDeadlines();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to remove deadline");
    }
  };

  const getDueDateStatus = (dueDate?: string) => {
    if (!dueDate) return { label: "No deadline", color: "var(--muted)", bg: "var(--surface-soft)" };
    const d = new Date(dueDate);
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { label: `Overdue (${Math.abs(days)}d ago)`, color: COLORS.danger, bg: COLORS.dangerSoft };
    if (days <= 3) return { label: `${days}d left`, color: COLORS.warning, bg: COLORS.warningSoft };
    return { label: `${days}d left`, color: COLORS.success, bg: COLORS.successSoft };
  };

  const typeIcon = (type: string) => {
    if (type === "assignment") return <ClipboardList size={14} color={COLORS.accent} />;
    if (type === "activity") return <Puzzle size={14} color={COLORS.success} />;
    return <Brain size={14} color={COLORS.warning} />;
  };

  // Tasks that don't have a teacher-scoped deadline yet
  const tasksWithoutDeadline = allTasks.filter(t =>
    !deadlines.some(d => d.taskId === t._id && d.taskType === t.type)
  );

  return (
    <div style={{ animation: "slideUp 0.3s ease-out" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Deadline Management</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.25rem" }}>
            Set deadlines for <strong>your students only</strong>. Other teachers are not affected.
          </p>
        </div>
        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}
          style={{ maxWidth: 200, padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.8125rem", cursor: "pointer", outline: "none" }}>
          {classes.map(c => (<option key={c._id} value={c.name}>{c.name}</option>))}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--border)", marginBottom: "1.25rem" }}>
        {[
          { key: "deadlines" as const, label: "My Deadlines", count: deadlines.length },
          { key: "set" as const, label: "Set New", count: tasksWithoutDeadline.length },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 700, border: "none", background: "none", cursor: "pointer", color: activeTab === t.key ? COLORS.accent : "var(--muted)", borderBottom: activeTab === t.key ? `2px solid ${COLORS.accent}` : "2px solid transparent", transition: "color 0.15s", display: "flex", alignItems: "center", gap: "0.375rem" }}>
              {t.label}
              <span style={{ background: activeTab === t.key ? `${COLORS.accent}15` : "var(--surface-soft)", color: activeTab === t.key ? COLORS.accent : "var(--muted)", fontSize: "0.625rem", fontWeight: 700, padding: "0.1rem 0.375rem", borderRadius: 999 }}>
                {t.count}
              </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading...</div>
      ) : activeTab === "deadlines" ? (
        deadlines.length === 0 ? (
          <div style={{ background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)", padding: "3rem", textAlign: "center" }}>
            <Calendar size={32} color="var(--muted)" style={{ marginBottom: "0.5rem" }} />
            <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No deadlines set for this class yet</div>
            <button onClick={() => setActiveTab("set")} style={{ marginTop: "1rem", background: COLORS.accent, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer" }}>
              <Plus size={14} style={{ marginRight: 4, verticalAlign: "middle" }} /> Set a Deadline
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {deadlines.map(dl => {
              const status = getDueDateStatus(dl.dueDate);
              return (
                <div key={dl._id} style={{ background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {typeIcon(dl.taskType)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--foreground)" }}>{dl.taskTitle}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.125rem" }}>
                      <span style={{ textTransform: "capitalize" }}>{dl.taskType}</span> ·{" "}
                      {new Date(dl.dueDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                  <div style={{ padding: "0.25rem 0.625rem", borderRadius: 999, background: status.bg, color: status.color, fontSize: "0.6875rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.25rem", flexShrink: 0 }}>
                    <Clock size={10} /> {status.label}
                  </div>
                  <button onClick={() => handleRemoveDeadline(dl)} style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "0.375rem", padding: "0.3rem 0.5rem", cursor: "pointer", color: COLORS.danger, display: "flex", alignItems: "center" }} title="Remove deadline">
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Set new deadlines tab */
        tasksWithoutDeadline.length === 0 ? (
          <div style={{ background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)", padding: "3rem", textAlign: "center" }}>
            <Calendar size={32} color="var(--muted)" style={{ marginBottom: "0.5rem" }} />
            <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>All tasks in this class already have deadlines set.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {tasksWithoutDeadline.map(task => (
              <div key={`${task.type}-${task._id}`} style={{ background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", cursor: "pointer", transition: "all 0.15s" }}
                onClick={() => { setSelectedTask(task); setNewDueDate(""); setShowSetDialog(true); }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${COLORS.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {typeIcon(task.type)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--foreground)" }}>{task.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 1, textTransform: "capitalize" }}>{task.type}</div>
                </div>
                <span style={{ fontSize: "0.6875rem", fontWeight: 600, color: COLORS.accent }}>+ Set Deadline</span>
              </div>
            ))}
          </div>
        )
      )}

      {/* Set Deadline Dialog */}
      {showSetDialog && selectedTask && (
        <Dialog
          open={true}
          onClose={() => { setShowSetDialog(false); setSelectedTask(null); setNewDueDate(""); }}
          title="Set Deadline"
          footer={
            <>
              <button onClick={() => { setShowSetDialog(false); setSelectedTask(null); setNewDueDate(""); }}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", color: "var(--foreground)" }}>Cancel</button>
              <button onClick={handleSetDeadline} disabled={saving || !newDueDate}
                style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: COLORS.accent, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1.25rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer", opacity: saving || !newDueDate ? 0.6 : 1 }}>
                <Save size={14} /> {saving ? "Saving..." : "Save"}
              </button>
            </>
          }
        >
          <div style={{ marginBottom: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: `${COLORS.accent}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {typeIcon(selectedTask.type)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{selectedTask.title}</div>
                <span style={{ marginTop: "0.25rem", textTransform: "capitalize", fontSize: "0.6875rem", fontWeight: 700, color: COLORS.accent, background: COLORS.accentSoft, padding: "0.15rem 0.4rem", borderRadius: "0.25rem", display: "inline-block" }}>{selectedTask.type}</span>
              </div>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>Due Date & Time</label>
            <input type="datetime-local" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)}
              style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.5rem" }}>
              Note: This deadline <strong>only affects your students</strong> in {selectedClass}. No other teacher&apos;s students will be impacted.
            </p>
          </div>
        </Dialog>
      )}
    </div>
  );
}
