"use client";

import React, { useEffect, useState, useCallback } from "react";
import { FileCheck, CheckCircle, XCircle, RotateCcw, AlertCircle, Clock, Award, MessageSquare } from "lucide-react";
import { apiFetch } from "../lib/api";
import { COLORS } from "../lib/constants";

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
  pending: { label: "Pending", color: COLORS.warning, bg: COLORS.warningSoft, icon: Clock },
  approved: { label: "Approved", color: COLORS.success, bg: COLORS.successSoft, icon: CheckCircle },
  rejected: { label: "Rejected", color: COLORS.danger, bg: COLORS.dangerSoft, icon: XCircle },
  resubmit_requested: { label: "Resubmit", color: COLORS.accent, bg: COLORS.accentSoft, icon: RotateCcw },
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
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: isErr ? COLORS.dangerSoft : COLORS.successSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            {isErr ? <AlertCircle size={24} color={COLORS.danger} /> : <CheckCircle size={24} color={COLORS.success} />}
          </div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--foreground)" }}>{title}</h3>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 1.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: isErr ? COLORS.danger : COLORS.success, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1.25rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer" }}>OK</button>
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
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontWeight: 700, fontSize: "0.8125rem", color: COLORS.accent, textDecoration: "none", cursor: "pointer", background: "var(--surface-soft)", padding: "0.25rem 0.5rem", borderRadius: "0.375rem", border: `1px solid ${COLORS.accent}` }}
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
                  { val: "approved" as const, label: "Approve", icon: CheckCircle, color: COLORS.success },
                  { val: "rejected" as const, label: "Reject", icon: XCircle, color: COLORS.danger },
                  { val: "resubmit_requested" as const, label: "Resubmit", icon: RotateCcw, color: COLORS.accent },
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
                  <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>
                    <Award size={13} /> Points to Award
                  </label>
                  <input type="number" min={0} max={1000} value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)}
                    style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.875rem", outline: "none", boxSizing: "border-box" }} />
                </div>
              )}

              {/* Feedback */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "0.375rem", fontSize: "0.6875rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.375rem" }}>
                  <MessageSquare size={13} /> Feedback {action !== "approved" && <span style={{ color: COLORS.danger }}>*</span>}
                </label>
                <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Add feedback for the student…"
                  required={action !== "approved"}
                  style={{ width: "100%", padding: "0.625rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.8125rem", outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-soft)", padding: "0.875rem 1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button type="button" onClick={onClose} disabled={saving} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.5rem 1rem", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", color: "var(--foreground)" }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ background: action === "approved" ? COLORS.success : action === "rejected" ? COLORS.danger : COLORS.accent, color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1.25rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer", opacity: saving ? 0.7 : 1 }}>
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

export function SubmissionReviewView() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [reviewSub, setReviewSub] = useState<Submission | null>(null);

  const fetchSubs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch(`/progress/teacher/submissions${activeTab ? `?status=${activeTab}` : ""}`);
      setSubs(data || []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.25rem", background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1.25rem 1.5rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: "0.75rem", background: COLORS.accentSoft, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileCheck size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em" }}>Submission Review</h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Review student file uploads, award points, or request resubmission</p>
          </div>
        </div>
        {/* Submission policy notice */}
        <div style={{ margin: "0 1.5rem 1.25rem", padding: "0.75rem 1rem", borderRadius: "0.625rem", background: `${COLORS.info}08`, border: `1px solid ${COLORS.info}30`, display: "flex", alignItems: "flex-start", gap: "0.625rem" }}>
          <AlertCircle size={14} color={COLORS.info} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.55 }}>
            <strong style={{ color: "var(--foreground)" }}>Submission Policy</strong> — Students are only required to submit a file for assignments and activities where the administrator has explicitly enabled the submission requirement. Items without that flag are completed automatically upon viewing and do not appear in this queue.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.375rem", marginBottom: "1rem", overflowX: "auto" }}>
        {TABS.map(t => {
          const sel = activeTab === t.key;
          return (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: "0.4rem 0.875rem", borderRadius: "0.375rem", border: sel ? `1.5px solid ${COLORS.accent}` : "1px solid var(--border)", background: sel ? COLORS.accentSoft : "var(--surface)", color: sel ? COLORS.accent : "var(--muted)", fontWeight: sel ? 700 : 600, fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "5rem 0", color: "var(--muted)" }}>Loading submissions…</div>
      ) : subs.length === 0 ? (
        <div style={{ textAlign: "center", padding: "5rem 2rem", background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)" }}>
          <div style={{ width: 64, height: 64, borderRadius: "1.25rem", background: COLORS.accentSoft, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            <FileCheck size={32} />
          </div>
          <h3 style={{ margin: 0, fontWeight: 800, color: "var(--foreground)" }}>No submissions found</h3>
          <p style={{ color: "var(--muted)", margin: "0.5rem 0 0", fontSize: "0.875rem" }}>
            {activeTab ? `No ${activeTab.replace("_", " ")} submissions.` : "Students haven't submitted anything yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {subs.map(sub => {
            const st = STATUS_MAP[sub.reviewStatus] || STATUS_MAP.pending;
            const Icon = st.icon;
            return (
              <div key={sub._id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                {/* Left — avatar */}
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: COLORS.accentSoft, color: COLORS.accentText, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0 }}>
                  {sub.studentName.charAt(0).toUpperCase()}
                </div>
                {/* Middle — details */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)" }}>{sub.studentName}</span>
                    <span style={{ fontSize: "0.625rem", color: "var(--muted)" }}>·</span>
                    <span style={{ fontSize: "0.6875rem", color: COLORS.accent, fontWeight: 600 }}>{sub.studentClass}</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.375rem", marginTop: 2 }}>
                    <span style={{ textTransform: "capitalize" }}>{sub.taskType}</span>
                    <span>·</span>
                    <a 
                      href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}${sub.filePath.startsWith('/') ? '' : '/'}${sub.filePath}`} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ color: COLORS.accent, textDecoration: "underline", cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                    >
                      <FileCheck size={12} />
                      {sub.originalName}
                    </a>
                    <span>·</span>
                    <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                  </div>
                  {sub.reviewFeedback && (
                    <div style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 4, fontStyle: "italic" }}>"{sub.reviewFeedback}"</div>
                  )}
                </div>
                {/* Right — status + action */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.6875rem", fontWeight: 700, color: st.color, background: st.bg, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                    <Icon size={12} /> {st.label}
                  </span>
                  {sub.reviewStatus === "approved" && sub.pointsAwarded > 0 && (
                    <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: COLORS.success }}>+{sub.pointsAwarded} pts</span>
                  )}
                  <button onClick={() => setReviewSub(sub)}
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.375rem", padding: "0.3rem 0.625rem", fontWeight: 600, fontSize: "0.6875rem", cursor: "pointer", color: COLORS.accent }}>
                    Review
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReviewDialog
        open={!!reviewSub}
        submission={reviewSub}
        onClose={() => setReviewSub(null)}
        onDone={fetchSubs}
      />
    </div>
  );
}
