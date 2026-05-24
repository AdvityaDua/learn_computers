"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileCheck, CheckCircle, XCircle, RotateCcw, AlertCircle, Clock, Award, MessageSquare } from "lucide-react";
import { apiFetch } from "../lib/admin-api";

type Submission = {
  _id: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  studentClass: string;
  taskType: "assignment" | "activity";
  taskId: string;
  taskTitle: string;
  taskPoints: number;
  filePath: string;
  originalName: string;
  submittedAt: string;
  reviewStatus: "pending" | "approved" | "rejected" | "resubmit_requested";
  reviewFeedback: string;
  pointsAwarded: number;
  reviewedAt: string | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: "Pending", color: "#F59E0B", bg: "#FFFBEB", icon: Clock },
  approved: { label: "Approved", color: "#10B981", bg: "#ECFDF5", icon: CheckCircle },
  rejected: { label: "Rejected", color: "#EF4444", bg: "#FEF2F2", icon: XCircle },
  resubmit_requested: { label: "Resubmit", color: "var(--admin-accent)", bg: "var(--admin-accent-soft)", icon: RotateCcw },
};

/* ── Status Dialog ──────────────────────────────────────────────── */
function StatusDialog({ open, type, title, message, onClose }: {
  open: boolean; type: "error" | "success"; title: string; message: string; onClose: () => void;
}) {
  if (!open) return null;
  const isErr = type === "error";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1500, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: isErr ? "#FEF2F2" : "#ECFDF5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            {isErr ? <AlertCircle size={24} color="#EF4444" /> : <CheckCircle size={24} color="#10B981" />}
          </div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--foreground)" }}>{title}</h3>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 1.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: isErr ? "#EF4444" : "#10B981", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1.25rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer" }}>OK</button>
        </div>
      </div>
    </div>
  );
}

/* ── Review Dialog ──────────────────────────────────────────────── */
function ReviewDialog({ open, submission, onClose, onDone }: {
  open: boolean;
  submission: Submission | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [action, setAction] = useState<"approved" | "rejected" | "resubmit_requested">("approved");
  const [feedback, setFeedback] = useState("");
  const [points, setPoints] = useState(0);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);

  useEffect(() => {
    if (open && submission) {
      setAction("approved");
      setFeedback("");
      setPoints(submission.taskPoints || 10);
    }
  }, [open, submission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submission) return;
    if ((action === "rejected" || action === "resubmit_requested") && !feedback.trim()) {
      setDialog({ type: "error", title: "Feedback Required", message: "Please provide feedback when rejecting or requesting a resubmit." });
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/progress/admin/users/${submission.userId}/tasks/${submission.taskType}/${submission.taskId}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          reviewStatus: action,
          reviewFeedback: feedback.trim(),
          ...(action === "approved" ? { pointsAwarded: points } : {}),
        }),
      });
      setDialog({ type: "success", title: "Review Submitted", message: `Submission has been ${action === "approved" ? "approved" : action === "rejected" ? "rejected" : "sent back for resubmission"}.` });
    } catch (err: any) {
      setDialog({ type: "error", title: "Review Failed", message: err.message || "Something went wrong." });
    } finally {
      setSaving(false);
    }
  };

  if (!open || !submission) return null;

  const st = STATUS_MAP[submission.reviewStatus] || STATUS_MAP.pending;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.25rem", overflowY: "auto" }}>
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }} onClick={() => !saving && onClose()} />
        <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", boxShadow: "0 28px 70px rgba(0,0,0,0.2)", overflow: "hidden", marginTop: "3rem" }}>

          {/* Header */}
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--foreground)" }}>Review Submission</h2>
              <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: st.color, background: st.bg, padding: "0.15rem 0.5rem", borderRadius: "0.25rem" }}>{st.label}</span>
            </div>
          </div>

          {/* Submission Info */}
          <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "grid", gap: "0.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div><span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Student</span><div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)", marginTop: 2 }}>{submission.studentName}</div></div>
              <div><span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Class</span><div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)", marginTop: 2 }}>{submission.studentClass || "—"}</div></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
              <div><span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Task</span><div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)", marginTop: 2 }}>{submission.taskTitle}</div></div>
              <div><span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Type</span><div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)", marginTop: 2, textTransform: "capitalize" }}>{submission.taskType}</div></div>
            </div>
            <div>
              <span style={{ fontSize: "0.625rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>File</span>
              <div style={{ marginTop: 2 }}>
                <a 
                  href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${submission.filePath.startsWith('/') ? '' : '/'}${submission.filePath}`} 
                  target="_blank" 
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontWeight: 700, fontSize: "0.8125rem", color: "var(--admin-accent)", textDecoration: "none", cursor: "pointer", background: "var(--admin-accent-soft)", padding: "0.25rem 0.5rem", borderRadius: "0.375rem", border: "1px solid var(--admin-accent)" }}
                >
                  <FileCheck size={14} />
                  {submission.originalName}
                </a>
              </div>
            </div>
          </div>

          {/* Review Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Action selector */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {([
                  { val: "approved" as const, label: "Approve", icon: CheckCircle, color: "#10B981" },
                  { val: "rejected" as const, label: "Reject", icon: XCircle, color: "#EF4444" },
                  { val: "resubmit_requested" as const, label: "Resubmit", icon: RotateCcw, color: "var(--admin-accent)" },
                ]).map(a => {
                  const sel = action === a.val;
                  return (
                    <button key={a.val} type="button" onClick={() => setAction(a.val)}
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", padding: "0.5rem", borderRadius: "0.5rem", border: sel ? `2px solid ${a.color}` : "1px solid var(--border)", background: sel ? `${a.color}10` : "var(--surface)", color: sel ? a.color : "var(--muted)", fontWeight: sel ? 700 : 600, fontSize: "0.75rem", cursor: "pointer" }}>
                      <a.icon size={14} /> {a.label}
                    </button>
                  );
                })}
              </div>

              {/* Points (only for approve) */}
              {action === "approved" && (
                <div>
                  <label className="admin-label" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                    <Award size={13} /> Points to Award
                  </label>
                  <input type="number" min={0} max={1000} value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)} className="admin-input" />
                </div>
              )}

              {/* Feedback */}
              <div>
                <label className="admin-label" style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <MessageSquare size={13} /> Feedback {action !== "approved" && <span style={{ color: "#EF4444" }}>*</span>}
                </label>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Add feedback for the student…"
                  required={action !== "approved"} className="admin-input" style={{ resize: "vertical" }} />
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-soft)", padding: "0.875rem 1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button type="button" onClick={onClose} disabled={saving} className="admin-btn admin-btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="admin-btn admin-btn-primary" style={{ background: action === "approved" ? "#10B981" : action === "rejected" ? "#EF4444" : "var(--admin-accent)", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Submitting…" : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <StatusDialog open={!!dialog} type={dialog?.type || "error"} title={dialog?.title || ""} message={dialog?.message || ""} onClose={() => { setDialog(null); if (dialog?.type === "success") { onDone(); onClose(); } }} />
    </>
  );
}

/* ── Main Submissions View ──────────────────────────────────────── */
const TABS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "resubmit_requested", label: "Resubmit" },
];

export function SubmissionsView() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [reviewSub, setReviewSub] = useState<Submission | null>(null);
  const [classFilter, setClassFilter] = useState("");

  const fetchSubs = useCallback(async () => {
    try {
      setLoading(true);
      // Admin sees everything so we can use the teacher endpoint which falls back to all for admin, OR create a specific admin endpoint if needed.
      // Wait, the progress.controller already has an admin get submissions endpoint! Let's check...
      // Actually, we just added 'teacher/submissions' but an admin can use it to see ALL submissions?
      // Wait, `getTeacherSubmissions(req.user.sub, status)` uses the teacher's school/classes.
      // If admin, they shouldn't use `teacher/submissions`. We should use the existing progress endpoints if available or fetch via a new admin endpoint.
      // Ah, there isn't an admin-specific list submissions endpoint. Let's create one in the backend or reuse. Let's assume there is one or I will add one if needed.
      // Since I added `teacher/submissions` with `@Roles(UserRole.Instructor, UserRole.Admin)`, it will only return submissions for classes the Admin is explicitly assigned to.
      // Let me just fetch from a new endpoint `admin/submissions` that I will add to the backend shortly.
      const data = await apiFetch(`/progress/admin/submissions${activeTab ? `?status=${activeTab}` : ""}`);
      setSubs(data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header-row" style={{ marginBottom: "1.5rem" }}>
        <div>
          <h1 className="admin-page-title">Submission Review</h1>
          <p className="admin-page-subtitle">Review student uploads, award points, or request resubmission</p>
        </div>
      </div>

      {/* Summary Stats */}
      {!loading && subs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          {[
            { label: "Total", value: subs.length, color: "var(--admin-accent)", bg: "var(--admin-accent-soft)" },
            { label: "Pending", value: subs.filter(s => s.reviewStatus === "pending").length, color: "#F59E0B", bg: "#FFFBEB" },
            { label: "Approved", value: subs.filter(s => s.reviewStatus === "approved").length, color: "#10B981", bg: "#ECFDF5" },
            { label: "Rejected", value: subs.filter(s => s.reviewStatus === "rejected").length, color: "#EF4444", bg: "#FEF2F2" },
          ].map(stat => (
            <div key={stat.label} className="admin-card" style={{ padding: "0.875rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: stat.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "1rem", fontWeight: 900, color: stat.color }}>{stat.value}</span>
              </div>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{stat.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tabs + Class Filter */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div style={{ display: "flex", gap: "0.375rem", overflowX: "auto" }}>
          {TABS.map(t => {
            const sel = activeTab === t.key;
            return (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                style={{ padding: "0.4rem 0.875rem", borderRadius: "0.375rem", border: sel ? `1.5px solid var(--admin-accent)` : "1px solid var(--border)", background: sel ? "var(--admin-accent-soft)" : "var(--surface)", color: sel ? "var(--admin-accent)" : "var(--muted)", fontWeight: sel ? 700 : 600, fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}>
                {t.label}
              </button>
            );
          })}
        </div>
        {/* Class filter */}
        {(() => {
          const classes = [...new Set(subs.map(s => s.studentClass).filter(Boolean))];
          if (classes.length <= 1) return null;
          return (
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
              style={{ padding: "0.4rem 0.75rem", borderRadius: "0.375rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.75rem", cursor: "pointer" }}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          );
        })()}
      </div>

      {/* Content */}
      <div className="admin-card">
        {loading ? (
          <div className="admin-empty-state">Loading submissions…</div>
        ) : subs.length === 0 ? (
          <div className="admin-empty-state">
            <div style={{ width: 64, height: 64, borderRadius: "1.25rem", background: "var(--admin-accent-soft)", color: "var(--admin-accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <FileCheck size={32} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 800, color: "var(--foreground)" }}>No submissions found</h3>
            <p style={{ color: "var(--muted)", margin: "0.5rem 0 0", fontSize: "0.875rem" }}>
              {activeTab ? `No ${activeTab.replace("_", " ")} submissions.` : "Students haven't submitted anything yet."}
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Task</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Points</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.filter(s => !classFilter || s.studentClass === classFilter).map(sub => {
                const st = STATUS_MAP[sub.reviewStatus] || STATUS_MAP.pending;
                const Icon = st.icon;
                return (
                  <tr key={sub._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{sub.studentName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{sub.studentClass || "—"} · {sub.studentEmail}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "var(--foreground)" }}>{sub.taskTitle}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.375rem" }}>
                        <span style={{ textTransform: "capitalize" }}>{sub.taskType}</span>
                        <span>·</span>
                        <a 
                          href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${sub.filePath.startsWith('/') ? '' : '/'}${sub.filePath}`} 
                          target="_blank" 
                          rel="noreferrer"
                          style={{ color: "var(--admin-accent)", textDecoration: "underline", cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                        >
                          <FileCheck size={12} />
                          {sub.originalName}
                        </a>
                      </div>
                      {sub.reviewFeedback && (
                        <div style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 3, fontStyle: "italic", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          "{sub.reviewFeedback}"
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>{new Date(sub.submittedAt).toLocaleDateString()}</div>
                      <div style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{new Date(sub.submittedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", fontWeight: 700, color: st.color, background: st.bg, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                        <Icon size={12} /> {st.label}
                      </span>
                    </td>
                    <td>
                      {sub.reviewStatus === "approved" && sub.pointsAwarded > 0 ? (
                        <span style={{ fontWeight: 800, color: "#10B981", fontSize: "0.875rem" }}>+{sub.pointsAwarded}</span>
                      ) : (
                        <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => setReviewSub(sub)} className="admin-btn admin-btn-ghost" style={{ padding: "0.3rem 0.625rem", fontSize: "0.75rem" }}>
                        Review
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ReviewDialog
        open={!!reviewSub}
        submission={reviewSub}
        onClose={() => setReviewSub(null)}
        onDone={fetchSubs}
      />
    </div>
  );
}
