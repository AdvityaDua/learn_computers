"use client";

import React, { useEffect, useState } from "react";
import { X, User, BookOpen, Brain, ClipboardList, Puzzle, CheckCircle, XCircle, Clock, AlertCircle, ChevronDown, ChevronRight, Camera } from "lucide-react";
import { apiFetch, API_BASE_URL } from "../lib/api";
import { COLORS } from "../lib/constants";

type StudentInfo = {
  _id: string;
  fullName: string;
  email: string;
  phone: string | null;
  profileImage: string | null;
  classIds: string[];
  school: { _id: string; name: string } | null;
  teacher: { _id: string; fullName: string; email: string } | null;
  points: number;
};

type ItemStatus = {
  type: string;
  refId: string;
  title: string;
  completed?: boolean;
  score?: number | null;
  totalQuestions?: number;
  points?: number;
  requiresSubmission?: boolean;
  submitted?: boolean;
  submittedAt?: string | null;
  reviewStatus?: string;
  reviewFeedback?: string;
  pointsAwarded?: number;
};

type LessonDetail = {
  _id: string;
  title: string;
  order: number;
  completed: boolean;
  items: ItemStatus[];
};

type ChapterDetail = {
  _id: string;
  title: string;
  order: number;
  lessons: LessonDetail[];
};

type Summary = {
  completionPct: number;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
  submittedTasks: number;
  totalTasks: number;
  approvedTasks: number;
  pendingTasks: number;
  rejectedTasks: number;
};

type DetailData = {
  student: StudentInfo;
  summary: Summary;
  chapters: ChapterDetail[];
};

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  approved: { label: "Approved", color: COLORS.success, bg: COLORS.successSoft, Icon: CheckCircle },
  pending: { label: "Pending", color: COLORS.warning, bg: COLORS.warningSoft, Icon: Clock },
  rejected: { label: "Rejected", color: COLORS.danger, bg: COLORS.dangerSoft, Icon: XCircle },
  resubmit_requested: { label: "Resubmit", color: COLORS.accent, bg: COLORS.accentSoft, Icon: AlertCircle },
  not_submitted: { label: "Not Submitted", color: "var(--muted)", bg: "var(--surface-soft)", Icon: Clock },
};

function ProgressRing({ percent, size = 56, strokeWidth = 4 }: { percent: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  const color = percent >= 70 ? COLORS.success : percent >= 40 ? COLORS.warning : COLORS.danger;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.6s ease" }} />
    </svg>
  );
}

export function StudentDetailPanel({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<"overview" | "chapters">("overview");

  useEffect(() => {
    setLoading(true);
    apiFetch(`/progress/teacher/students/${studentId}/detail`)
      .then((d: DetailData) => {
        setData(d);
        // Expand all chapters by default
        setExpandedChapters(new Set(d.chapters.map(c => c._id)));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [studentId]);

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleLesson = (id: string) => {
    setExpandedLessons(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1400, display: "flex", justifyContent: "flex-end" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1, width: "min(620px, 100vw)", height: "100vh", background: "var(--surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", animation: "slideInRight 0.3s cubic-bezier(.22,1,.36,1) both", overflow: "hidden" }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>

        {loading ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 32, height: 32, border: `3px solid var(--border)`, borderTopColor: COLORS.accent, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !data ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>Failed to load data.</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: data.student.profileImage ? "transparent" : COLORS.accentSoft, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0, border: `2px solid ${COLORS.accent}20` }}>
                {data.student.profileImage ? (
                  <img src={`${API_BASE_URL.replace('/api', '')}${data.student.profileImage}`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontSize: "1rem", fontWeight: 900, color: COLORS.accentText }}>{data.student.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: "1rem", color: "var(--foreground)" }}>{data.student.fullName}</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{data.student.email}</div>
                <div style={{ display: "flex", gap: "0.375rem", marginTop: 4 }}>
                  {data.student.classIds.map(c => (
                    <span key={c} style={{ fontSize: "0.6rem", fontWeight: 700, color: COLORS.accent, background: COLORS.accentSoft, padding: "0.1rem 0.35rem", borderRadius: "0.2rem" }}>{c}</span>
                  ))}
                </div>
              </div>
              <button onClick={onClose} style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--muted)" }}>
                <X size={14} />
              </button>
            </div>

            {/* Summary Stats */}
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <ProgressRing percent={data.summary.completionPct} />
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.75rem", color: "var(--foreground)" }}>
                    {data.summary.completionPct}%
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "0.75rem", flex: 1 }}>
                  <div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--foreground)" }}>{data.summary.completedLessons}/{data.summary.totalLessons}</div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Lessons</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--foreground)" }}>{data.summary.completedQuizzes}/{data.summary.totalQuizzes}</div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Quizzes</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "1.125rem", fontWeight: 900, color: "var(--foreground)" }}>{data.summary.submittedTasks}/{data.summary.totalTasks}</div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Submitted</div>
                  </div>
                  <div>
                    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: COLORS.success, background: COLORS.successSoft, padding: "0.1rem 0.3rem", borderRadius: "0.2rem" }}>OK: {data.summary.approvedTasks}</span>
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: COLORS.warning, background: COLORS.warningSoft, padding: "0.1rem 0.3rem", borderRadius: "0.2rem" }}>Pending: {data.summary.pendingTasks}</span>
                      <span style={{ fontSize: "0.625rem", fontWeight: 700, color: COLORS.danger, background: COLORS.dangerSoft, padding: "0.1rem 0.3rem", borderRadius: "0.2rem" }}>Rejected: {data.summary.rejectedTasks}</span>
                    </div>
                    <div style={{ fontSize: "0.6rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", marginTop: 2 }}>Reviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ padding: "0 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", gap: "0.25rem" }}>
              {(["overview", "chapters"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: "0.75rem 1rem", fontSize: "0.8125rem", fontWeight: 700, border: "none",
                  background: "none", cursor: "pointer", color: tab === t ? COLORS.accent : "var(--muted)",
                  borderBottom: tab === t ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                  textTransform: "capitalize", transition: "color 0.15s",
                }}>
                  {t === "overview" ? "Submission Status" : "Chapter Progress"}
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
              {tab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {data.chapters.flatMap(ch =>
                    ch.lessons.flatMap(l =>
                      l.items.filter(i => i.type === "assignment" || i.type === "activity").map(item => {
                        const badge = STATUS_BADGE[item.reviewStatus || "not_submitted"] || STATUS_BADGE.not_submitted;
                        return (
                          <div key={`${item.type}-${item.refId}`} style={{ background: "var(--surface-soft)", borderRadius: "0.625rem", padding: "0.75rem 1rem", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${COLORS.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              {item.type === "assignment" ? <ClipboardList size={14} color={COLORS.accent} /> : <Puzzle size={14} color={COLORS.success} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</div>
                              <div style={{ fontSize: "0.625rem", color: "var(--muted)", marginTop: 1 }}>
                                <span style={{ textTransform: "capitalize" }}>{item.type}</span>
                                {item.submittedAt && <> · {new Date(item.submittedAt).toLocaleDateString()}</>}
                                {item.pointsAwarded != null && item.pointsAwarded > 0 && <> · <span style={{ color: COLORS.success, fontWeight: 700 }}>+{item.pointsAwarded} pts</span></>}
                              </div>
                            </div>
                            <span style={{ display: "flex", alignItems: "center", gap: "0.2rem", fontSize: "0.625rem", fontWeight: 700, color: badge.color, background: badge.bg, padding: "0.15rem 0.4rem", borderRadius: "0.25rem", flexShrink: 0 }}>
                              <badge.Icon size={10} /> {badge.label}
                            </span>
                          </div>
                        );
                      })
                    )
                  )}
                  {data.chapters.flatMap(ch => ch.lessons.flatMap(l => l.items.filter(i => i.type === "assignment" || i.type === "activity"))).length === 0 && (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)", fontSize: "0.875rem" }}>No assignments or activities in curriculum.</div>
                  )}
                </div>
              )}

              {tab === "chapters" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {data.chapters.map(ch => {
                    const expanded = expandedChapters.has(ch._id);
                    const completedCount = ch.lessons.filter(l => l.completed).length;
                    return (
                      <div key={ch._id} style={{ background: "var(--surface-soft)", borderRadius: "0.625rem", border: "1px solid var(--border)", overflow: "hidden" }}>
                        <button onClick={() => toggleChapter(ch._id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1rem", background: "none", border: "none", cursor: "pointer" }}>
                          <div style={{ flex: 1, textAlign: "left" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.8125rem", color: "var(--foreground)" }}>{ch.title}</div>
                            <div style={{ fontSize: "0.625rem", color: "var(--muted)", marginTop: 1 }}>
                              {completedCount}/{ch.lessons.length} lessons completed
                            </div>
                          </div>
                          <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)", overflow: "hidden", flexShrink: 0 }}>
                            <div style={{ height: "100%", width: `${ch.lessons.length > 0 ? (completedCount / ch.lessons.length) * 100 : 0}%`, background: COLORS.success, borderRadius: 2, transition: "width 0.3s" }} />
                          </div>
                          {expanded ? <ChevronDown size={14} color="var(--muted)" /> : <ChevronRight size={14} color="var(--muted)" />}
                        </button>
                        {expanded && ch.lessons.map(l => (
                          <div key={l._id} style={{ borderTop: "1px solid var(--border)", padding: "0.5rem 1rem 0.5rem 1.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            {l.completed
                              ? <CheckCircle size={14} color={COLORS.success} />
                              : <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1.5px solid var(--border)" }} />}
                            <span style={{ fontSize: "0.75rem", fontWeight: 600, color: l.completed ? "var(--foreground)" : "var(--muted)", flex: 1 }}>{l.title}</span>
                            <div style={{ display: "flex", gap: "0.2rem" }}>
                              {l.items.map((item, i) => {
                                const col = item.type === "quiz"
                                  ? (item.completed ? COLORS.success : "var(--muted)")
                                  : (item.submitted ? (item.reviewStatus === "approved" ? COLORS.success : item.reviewStatus === "rejected" ? COLORS.danger : COLORS.warning) : "var(--border)");
                                return <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: col }} title={`${item.type}: ${item.title}`} />;
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "0.75rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                Points: <span style={{ fontWeight: 800, color: COLORS.accent }}>{data.student.points}</span>
              </div>
              <button onClick={onClose} style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "0.5rem", padding: "0.4rem 1rem", fontWeight: 600, fontSize: "0.8125rem", cursor: "pointer", color: "var(--foreground)" }}>
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
