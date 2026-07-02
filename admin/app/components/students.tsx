"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, Circle, PlaySquare, HelpCircle, FileText,
  Zap, ChevronDown, ChevronUp, X, Layers, Search, Star,
  GraduationCap, Award, Users,
} from "lucide-react";
import { fetchAdmin, apiFetch, API_BASE_URL } from "../lib/admin-api";
import { showAdminDialog } from "./admin-dialog";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Teacher { _id: string; fullName: string; email: string }
interface ClassDoc  { _id: string; name: string }
interface School    { _id: string; name: string }

interface Student {
  _id: string; fullName: string; email: string; role: string;
  createdAt?: string; profileImage?: string;
  classIds?: string[]; points?: number;
  teacherId?: { _id: string; fullName: string; email: string } | string;
  schoolId?:  { _id: string; name: string } | string;
}

interface ProgressSummary {
  pct: number; completedLessons: number; totalLessons: number;
  quizAttempts: number; submissions: number;
}

interface CompletedLesson {
  lessonId: string; chapterId: string;
  chapterTitle: string; lessonTitle: string; completedAt: string;
}

interface QuizAttempt {
  quizId: string; title: string; score: number; totalQuestions: number; completedAt: string;
}

interface TaskSubmission {
  taskType: string; taskId: string; title: string; originalName: string;
  submittedAt: string; reviewStatus: string; reviewFeedback?: string;
}

interface UserProgress {
  completionPercentage: number; totalLessons: number;
  completedLessons: CompletedLesson[];
  quizAttempts: QuizAttempt[]; submissions: TaskSubmission[];
}

interface CurriculumItem {
  type: string; refId: string; title?: string; order: number;
}
interface CurriculumLesson {
  _id: string; title: string; order: number; items: CurriculumItem[];
}
interface CurriculumChapter {
  _id: string; title: string; order: number; lessons: CurriculumLesson[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function Avatar({ name, image, size = 36 }: { name: string; image?: string; size?: number }) {
  const initials = (name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  if (image) {
    const src = image.startsWith("http") ? image : `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
    return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3, fontWeight: 800,
    }}>{initials}</div>
  );
}

function Ring({ pct, size = 48 }: { pct: number; size?: number }) {
  const sw = 4.5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct / 100, 1) * circ;
  const color = pct >= 70 ? "var(--admin-success)" : pct >= 40 ? "var(--admin-warning)" : "var(--admin-danger)";
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={sw} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dasharray 0.7s ease" }}
      />
      <text
        x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.2, fontWeight: 800, fill: color }}
      >{pct}%</text>
    </svg>
  );
}

function MiniBar({ value }: { value: number }) {
  const c = value >= 70 ? "var(--admin-success)" : value >= 40 ? "var(--admin-warning)" : "var(--admin-danger)";
  return (
    <div style={{ height: 3, background: "var(--border)", borderRadius: 999, overflow: "hidden", marginTop: 5 }}>
      <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, background: c, borderRadius: 999, transition: "width 0.7s ease" }} />
    </div>
  );
}

const ITEM_ICON: Record<string, React.ReactNode> = {
  video:      <PlaySquare size={11} />,
  quiz:       <HelpCircle size={11} />,
  assignment: <FileText size={11} />,
  activity:   <Zap size={11} />,
};

const ITEM_COLOR: Record<string, string> = {
  video: "#6366F1", quiz: "#D97706", assignment: "#3B82F6", activity: "#8B5CF6",
};

const ITEM_BG: Record<string, string> = {
  video: "rgba(99,102,241,0.1)", quiz: "rgba(245,158,11,0.1)",
  assignment: "rgba(59,130,246,0.1)", activity: "rgba(139,92,246,0.1)",
};

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  approved:           { label: "Approved",  color: "#10B981", bg: "#ECFDF5" },
  pending:            { label: "Pending",   color: "#F59E0B", bg: "#FFFBEB" },
  rejected:           { label: "Rejected",  color: "#EF4444", bg: "#FEF2F2" },
  resubmit_requested: { label: "Resubmit",  color: "var(--admin-accent)", bg: "var(--admin-accent-soft)" },
};

// ─── Progress Drawer ─────────────────────────────────────────────────────────

function ProgressDrawer({ student, onClose }: { student: Student; onClose: () => void }) {
  const [progress, setProgress]     = useState<UserProgress | null>(null);
  const [curriculum, setCurriculum] = useState<CurriculumChapter[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<"curriculum" | "quizzes" | "submissions">("curriculum");
  const [expanded, setExpanded]     = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchAdmin(`/progress/admin/users/${student._id}`).then((r) => r.json()),
      fetchAdmin("/progress/curriculum-tree").then((r) => r.json()),
    ])
      .then(([prog, curr]) => {
        setProgress(prog);
        const chapters: CurriculumChapter[] = Array.isArray(curr) ? curr : [];
        setCurriculum(chapters);
        // expand chapters that have at least one completed lesson so the user sees progress immediately
        if (prog?.completedLessons?.length) {
          const doneIds = new Set(prog.completedLessons.map((l: CompletedLesson) => l.lessonId));
          const toExpand = new Set<string>();
          chapters.forEach((ch) => {
            if (ch.lessons.some((l) => doneIds.has(l._id))) toExpand.add(ch._id);
          });
          setExpanded(toExpand.size ? toExpand : new Set(chapters.slice(0, 3).map((c) => c._id)));
        } else {
          setExpanded(new Set(chapters.slice(0, 3).map((c) => c._id)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [student._id]);

  const completedIds  = useMemo(() => new Set((progress?.completedLessons ?? []).map((l) => l.lessonId)), [progress]);
  const quizMap       = useMemo(() => new Map((progress?.quizAttempts ?? []).map((q) => [q.quizId, q])), [progress]);

  const pct        = progress?.completionPercentage ?? 0;
  const totalL     = progress?.totalLessons ?? 0;
  const doneL      = progress?.completedLessons.length ?? 0;
  const totalQ     = useMemo(() => { let n = 0; curriculum.forEach((c) => c.lessons.forEach((l) => l.items.forEach((i) => { if (i.type === "quiz") n++; }))); return n; }, [curriculum]);
  const doneQ      = progress?.quizAttempts.length ?? 0;
  const totalSub   = progress?.submissions.length ?? 0;
  const approvedSub = useMemo(() => (progress?.submissions ?? []).filter((s) => s.reviewStatus === "approved").length, [progress]);

  const toggleChapter = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const teacherName = typeof student.teacherId === "object" && student.teacherId
    ? student.teacherId.fullName : "—";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.52)", display: "flex", justifyContent: "flex-end", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes slideInRight { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } }
        .progress-drawer { animation: slideInRight 0.28s cubic-bezier(.22,1,.36,1) both; }
      `}</style>

      <div className="progress-drawer" style={{
        width: "min(620px, 100vw)", height: "100vh",
        background: "var(--surface)", borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>

        {/* ── Student profile header ─────────────────────────────────── */}
        <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", background: "var(--surface-soft)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "1.25rem" }}>
            <Avatar name={student.fullName || student.email} image={student.profileImage} size={56} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: "1.0625rem", color: "var(--foreground)" }}>
                {student.fullName || "—"}
              </div>
              <div style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: 2 }}>{student.email}</div>
              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                {(student.classIds ?? []).map((c) => (
                  <span key={c} style={{
                    fontSize: "0.6875rem", fontWeight: 700,
                    background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)",
                    padding: "0.15rem 0.5rem", borderRadius: "0.375rem",
                  }}>{c}</span>
                ))}
                {teacherName !== "—" && (
                  <span style={{ fontSize: "0.6875rem", color: "var(--muted)", fontWeight: 500 }}>with {teacherName}</span>
                )}
                {student.createdAt && (
                  <span style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>Joined {fmtDate(student.createdAt)}</span>
                )}
              </div>
            </div>
            <button
              type="button" onClick={onClose}
              style={{ padding: "0.375rem", borderRadius: "0.5rem", background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted)", lineHeight: 1, flexShrink: 0 }}
            ><X size={16} /></button>
          </div>

          {/* ── Stats row ── */}
          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{ height: 68, background: "var(--border)", borderRadius: "0.75rem", opacity: 0.5 + i * 0.1 }} />
              ))}
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.625rem" }}>
              {/* Completion */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.375rem", fontWeight: 900, color: pct >= 70 ? "var(--admin-success)" : pct >= 40 ? "var(--admin-warning)" : "var(--admin-danger)" }}>{pct}%</div>
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Complete</div>
                <MiniBar value={pct} />
              </div>
              {/* Lessons */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.375rem", fontWeight: 900, color: "var(--foreground)" }}>{doneL}</div>
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>/ {totalL} Lessons</div>
                <MiniBar value={totalL > 0 ? Math.round(doneL / totalL * 100) : 0} />
              </div>
              {/* Quizzes */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.375rem", fontWeight: 900, color: "var(--foreground)" }}>{doneQ}</div>
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>/ {totalQ} Quizzes</div>
                <MiniBar value={totalQ > 0 ? Math.round(doneQ / totalQ * 100) : 0} />
              </div>
              {/* Submissions */}
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
                <div style={{ fontSize: "1.375rem", fontWeight: 900, color: "var(--foreground)" }}>{totalSub}</div>
                <div style={{ fontSize: "0.6rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 2 }}>Tasks</div>
                {totalSub > 0 && (
                  <div style={{ fontSize: "0.6rem", color: "#10B981", fontWeight: 700, marginTop: 4 }}>{approvedSub} approved</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          {(["curriculum", "quizzes", "submissions"] as const).map((t) => (
            <button key={t} type="button" onClick={() => setTab(t)} style={{
              flex: 1, padding: "0.875rem 0.5rem", border: "none",
              background: "none", cursor: "pointer", fontFamily: "inherit",
              fontSize: "0.8125rem", fontWeight: 700,
              color: tab === t ? "var(--admin-accent)" : "var(--muted)",
              borderBottom: tab === t ? "2px solid var(--admin-accent)" : "2px solid transparent",
              transition: "color 0.15s",
            }}>
              {t === "curriculum" ? "Curriculum" : t === "quizzes" ? "Quizzes" : "Submissions"}
            </button>
          ))}
        </div>

        {/* ── Tab content ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ height: 64, background: "var(--surface-soft)", borderRadius: "0.75rem", opacity: 0.8 - i * 0.15 }} />
              ))}
            </div>
          )}
          {!loading && !progress && (
            <div style={{ color: "var(--admin-danger)", fontSize: "0.875rem" }}>Could not load progress data.</div>
          )}

          {/* ──── Curriculum ──── */}
          {!loading && progress && tab === "curriculum" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {curriculum.length === 0 && (
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", textAlign: "center", padding: "3rem 1rem" }}>
                  No curriculum chapters found.
                </div>
              )}

              {curriculum.map((chapter) => {
                const chDone  = chapter.lessons.filter((l) => completedIds.has(l._id)).length;
                const chTotal = chapter.lessons.length;
                const chPct   = chTotal > 0 ? Math.round(chDone / chTotal * 100) : 0;
                const isOpen  = expanded.has(chapter._id);
                const statusColor = chPct === 100 ? "var(--admin-success)" : chPct > 0 ? "var(--admin-warning)" : "var(--muted)";

                return (
                  <div key={chapter._id} style={{ border: "1px solid var(--border)", borderRadius: "0.875rem", overflow: "hidden" }}>
                    {/* Chapter row */}
                    <button
                      type="button" onClick={() => toggleChapter(chapter._id)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: "0.875rem",
                        padding: "0.875rem 1rem",
                        background: chPct === 100 ? "rgba(16,185,129,0.05)" : "var(--surface-soft)",
                        border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                      }}
                    >
                      {chPct === 100
                        ? <CheckCircle2 size={18} color="var(--admin-success)" style={{ flexShrink: 0 }} />
                        : <Layers size={18} color={statusColor} style={{ flexShrink: 0 }} />}

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>
                          {chapter.title}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", marginTop: "0.3rem" }}>
                          <div style={{ flex: 1, height: 3, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${chPct}%`, background: statusColor, borderRadius: 999, transition: "width 0.6s ease" }} />
                          </div>
                          <span style={{ fontSize: "0.6875rem", fontWeight: 700, color: statusColor, whiteSpace: "nowrap" }}>
                            {chDone}/{chTotal}
                          </span>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp size={14} color="var(--muted)" /> : <ChevronDown size={14} color="var(--muted)" />}
                    </button>

                    {/* Lesson rows */}
                    {isOpen && (
                      <div style={{ borderTop: "1px solid var(--border)" }}>
                        {chapter.lessons.length === 0 && (
                          <div style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--muted)" }}>No lessons in this chapter.</div>
                        )}
                        {chapter.lessons.map((lesson, li) => {
                          const done = completedIds.has(lesson._id);
                          return (
                            <div
                              key={lesson._id}
                              style={{
                                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                                padding: "0.625rem 1rem",
                                background: done ? "rgba(16,185,129,0.03)" : "transparent",
                                borderBottom: li < chapter.lessons.length - 1 ? "1px solid var(--border)" : undefined,
                              }}
                            >
                              {done
                                ? <CheckCircle2 size={15} color="var(--admin-success)" style={{ flexShrink: 0, marginTop: 2 }} />
                                : <Circle size={15} color="var(--border)" style={{ flexShrink: 0, marginTop: 2 }} />}

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: "0.8125rem", fontWeight: 600,
                                  color: done ? "var(--foreground)" : "var(--muted)",
                                }}>
                                  {lesson.title}
                                </div>

                                {/* Item chips */}
                                {lesson.items.length > 0 && (
                                  <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.3rem", flexWrap: "wrap" }}>
                                    {lesson.items.map((item, ii) => {
                                      const qa = item.type === "quiz" ? quizMap.get(item.refId) : null;
                                      const scoreColor = qa ? (qa.score >= 70 ? "#10B981" : qa.score >= 40 ? "#F59E0B" : "#EF4444") : undefined;
                                      return (
                                        <span key={ii} style={{
                                          display: "inline-flex", alignItems: "center", gap: "0.2rem",
                                          fontSize: "0.6rem", fontWeight: 700, padding: "0.15rem 0.4rem",
                                          borderRadius: "0.25rem",
                                          background: ITEM_BG[item.type] ?? "rgba(156,163,175,0.1)",
                                          color: ITEM_COLOR[item.type] ?? "var(--muted)",
                                        }}>
                                          {ITEM_ICON[item.type]}
                                          {item.title ?? item.type}
                                          {qa && <span style={{ color: scoreColor, marginLeft: "0.15rem" }}>· {qa.score}%</span>}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ──── Quizzes ──── */}
          {!loading && progress && tab === "quizzes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {progress.quizAttempts.length === 0 && (
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", textAlign: "center", padding: "3rem 1rem" }}>
                  No quizzes attempted yet.
                </div>
              )}
              {progress.quizAttempts.map((q) => {
                const sPct = q.totalQuestions > 0 ? Math.round(q.score / q.totalQuestions * 100) : q.score;
                const sColor = sPct >= 70 ? "var(--admin-success)" : sPct >= 40 ? "var(--admin-warning)" : "var(--admin-danger)";
                return (
                  <div key={q.quizId} style={{ background: "var(--surface-soft)", borderRadius: "0.875rem", padding: "1rem", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.625rem" }}>
                      <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)", flex: 1, minWidth: 0 }}>{q.title}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                        <span style={{ fontSize: "1.125rem", fontWeight: 900, color: sColor }}>{sPct}%</span>
                        <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{fmtDate(q.completedAt)}</span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${sPct}%`, background: sColor, borderRadius: 999, transition: "width 0.6s ease" }} />
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "0.375rem" }}>
                      Score: {q.score} / {q.totalQuestions} questions
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ──── Submissions ──── */}
          {!loading && progress && tab === "submissions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              {progress.submissions.length === 0 && (
                <div style={{ color: "var(--muted)", fontSize: "0.875rem", textAlign: "center", padding: "3rem 1rem" }}>
                  No tasks submitted yet.
                </div>
              )}
              {progress.submissions.map((s) => {
                const st = STATUS_STYLE[s.reviewStatus] ?? STATUS_STYLE.pending;
                return (
                  <div key={`${s.taskType}-${s.taskId}`} style={{ background: "var(--surface-soft)", borderRadius: "0.875rem", padding: "1rem", border: "1px solid var(--border)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>{s.title}</div>
                        <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", marginTop: "0.25rem", flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: "0.6875rem", fontWeight: 700,
                            background: ITEM_BG[s.taskType] ?? "rgba(156,163,175,0.1)",
                            color: ITEM_COLOR[s.taskType] ?? "var(--muted)",
                            padding: "0.1rem 0.375rem", borderRadius: "0.25rem",
                            display: "inline-flex", alignItems: "center", gap: "0.2rem",
                          }}>
                            {ITEM_ICON[s.taskType]} {s.taskType}
                          </span>
                          <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{s.originalName}</span>
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: 4 }}>{fmtDate(s.submittedAt)}</div>
                      </div>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: st.color, background: st.bg, padding: "0.25rem 0.625rem", borderRadius: "0.375rem", flexShrink: 0 }}>
                        {st.label}
                      </span>
                    </div>
                    {s.reviewFeedback && (
                      <div style={{ marginTop: "0.625rem", padding: "0.5rem 0.75rem", background: "var(--surface)", borderRadius: "0.5rem", border: "1px solid var(--border)", fontSize: "0.75rem", color: "var(--muted)", fontStyle: "italic" }}>
                        &ldquo;{s.reviewFeedback}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function StudentsView() {
  const [students, setStudents]         = useState<Student[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [search, setSearch]             = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [progressCache, setProgressCache] = useState<Record<string, ProgressSummary>>({});

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses]   = useState<ClassDoc[]>([]);
  const [schools, setSchools]   = useState<School[]>([]);

  const [showForm, setShowForm]           = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData]           = useState({ fullName: "", email: "", password: "", teacherId: "", classId: "", schoolId: "" });

  const [filterSchool, setFilterSchool]   = useState("");
  const [filterClass, setFilterClass]     = useState("");
  const [filterTeacher, setFilterTeacher] = useState("");

  const fetchUsers = () => {
    setLoading(true);
    fetchAdmin("/users?role=student")
      .then((r) => r.json())
      .then((data) => {
        const list: Student[] = Array.isArray(data) ? data.filter((u: Student) => u.role === "student") : [];
        setStudents(list);
        list.forEach((s) => {
          fetchAdmin(`/progress/admin/users/${s._id}`)
            .then((r) => r.json())
            .then((p) => {
              if (typeof p?.completionPercentage === "number") {
                setProgressCache((prev) => ({
                  ...prev,
                  [s._id]: {
                    pct: p.completionPercentage,
                    completedLessons: p.completedLessons?.length ?? 0,
                    totalLessons: p.totalLessons ?? 0,
                    quizAttempts: p.quizAttempts?.length ?? 0,
                    submissions: p.submissions?.length ?? 0,
                  },
                }));
              }
            })
            .catch(() => {});
        });
      })
      .catch(() => setError("Could not load students."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
    apiFetch("/users/teachers").then(setTeachers).catch(() => {});
    apiFetch("/classes?limit=100").then((d: any) => setClasses(d?.items || [])).catch(() => {});
    apiFetch("/schools?limit=100").then((d: any) => setSchools(d?.items || [])).catch(() => {});
  }, []);

  const openEdit = (s: Student) => {
    const tid = typeof s.teacherId === "object" && s.teacherId ? s.teacherId._id : (s.teacherId as string || "");
    const sid = typeof s.schoolId  === "object" && s.schoolId  ? s.schoolId._id  : (s.schoolId  as string || "");
    setEditingStudent(s);
    setFormData({ fullName: s.fullName, email: s.email, password: "", teacherId: tid, classId: s.classIds?.[0] || "", schoolId: sid });
    setShowForm(true);
  };

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await apiFetch(`/users/admin/students/${editingStudent._id}`, {
          method: "PATCH",
          body: JSON.stringify({
            fullName: formData.fullName,
            ...(formData.password ? { password: formData.password } : {}),
            classIds: formData.classId ? [formData.classId] : undefined,
            teacherId: formData.teacherId || undefined,
            schoolId: formData.schoolId || undefined,
          }),
        });
      } else {
        if (!formData.teacherId) { showAdminDialog({ type: "error", title: "Teacher Required", message: "Assign a teacher." }); return; }
        if (!formData.classId)   { showAdminDialog({ type: "error", title: "Class Required", message: "Assign a class." }); return; }
        if (!formData.schoolId)  { showAdminDialog({ type: "error", title: "School Required", message: "Assign a school." }); return; }
        await apiFetch("/users", {
          method: "POST",
          body: JSON.stringify({ fullName: formData.fullName, email: formData.email, password: formData.password, role: "student", teacherId: formData.teacherId, classIds: [formData.classId], schoolId: formData.schoolId }),
        });
      }
      setShowForm(false); setEditingStudent(null);
      setFormData({ fullName: "", email: "", password: "", teacherId: "", classId: "", schoolId: "" });
      fetchUsers();
    } catch (err: any) {
      showAdminDialog({ type: "error", title: editingStudent ? "Update Failed" : "Creation Failed", message: err.message || "Error" });
    }
  };

  const handleDelete = async (s: Student) => {
    if (!confirm(`Delete ${s.fullName}? This cannot be undone.`)) return;
    try {
      await apiFetch(`/users/${s._id}`, { method: "DELETE" });
      fetchUsers();
    } catch (err: any) {
      showAdminDialog({ type: "error", title: "Delete Failed", message: err.message || "Failed to delete." });
    }
  };

  const getTeacherName = (s: Student) => {
    if (typeof s.teacherId === "object" && s.teacherId) return s.teacherId.fullName;
    if (typeof s.teacherId === "string" && s.teacherId) return teachers.find((t) => t._id === s.teacherId)?.fullName || "—";
    return "—";
  };

  const filtered = students.filter((s) => {
    if (search && !s.fullName?.toLowerCase().includes(search.toLowerCase()) && !s.email?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterSchool) { const sid = typeof s.schoolId === "object" ? s.schoolId?._id : s.schoolId; if (sid !== filterSchool) return false; }
    if (filterClass)  { if (!s.classIds?.includes(filterClass)) return false; }
    if (filterTeacher) { const tid = typeof s.teacherId === "object" ? s.teacherId?._id : s.teacherId; if (tid !== filterTeacher) return false; }
    return true;
  });

  // Derived: avg completion across students with loaded progress
  const cachedList = Object.values(progressCache);
  const avgPct = cachedList.length > 0
    ? Math.round(cachedList.reduce((a, b) => a + b.pct, 0) / cachedList.length)
    : 0;

  return (
    <div style={{ maxWidth: 1080 }}>
      {selectedStudent && <ProgressDrawer student={selectedStudent} onClose={() => setSelectedStudent(null)} />}

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)", margin: 0 }}>Students</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.2rem", margin: 0 }}>
            {loading ? "Loading…" : `${students.length} registered students`}
          </p>
        </div>
        {!showForm && (
          <button
            className="admin-btn admin-btn-primary"
            onClick={() => { setEditingStudent(null); setFormData({ fullName: "", email: "", password: "", teacherId: "", classId: "", schoolId: "" }); setShowForm(true); }}
          >
            + Add Student
          </button>
        )}
      </div>

      {/* ── Summary tiles ── */}
      {!loading && students.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.875rem", marginBottom: "1.5rem" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "0.75rem", background: "var(--admin-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Users size={20} color="var(--admin-accent-text)" />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--foreground)", lineHeight: 1 }}>{students.length}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>Total Students</div>
            </div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "0.75rem", background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <GraduationCap size={20} color="#10B981" />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--foreground)", lineHeight: 1 }}>{cachedList.filter((p) => p.pct >= 70).length}</div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>On Track</div>
            </div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", padding: "1rem 1.25rem", display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "0.75rem", background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Award size={20} color="#D97706" />
            </div>
            <div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "var(--foreground)", lineHeight: 1 }}>{avgPct}%</div>
              <div style={{ fontSize: "0.7rem", color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>Avg Completion</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit form ── */}
      {showForm && (
        <div className="admin-card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "1rem" }}>
            {editingStudent ? "Edit Student" : "Create New Student"}
          </h3>
          <form onSubmit={handleCreateOrEdit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="admin-label">Full Name <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required className="admin-input" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Email <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input required={!editingStudent} type="email" className="admin-input" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingStudent} style={{ opacity: editingStudent ? 0.6 : 1 }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="admin-label">
                  Password {editingStudent
                    ? <span style={{ color: "var(--muted)", fontWeight: 400, textTransform: "none" }}>(leave blank to keep)</span>
                    : <span style={{ color: "var(--admin-danger)" }}>*</span>}
                </label>
                <input type="password" minLength={6} className="admin-input" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingStudent} />
              </div>
              <div>
                <label className="admin-label">Assign Teacher <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <select required={!editingStudent} className="admin-select" value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}>
                  <option value="">Select a teacher</option>
                  {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName} ({t.email})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label className="admin-label">Assign Class <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <select required={!editingStudent} className="admin-select" value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}>
                  <option value="">Select a class</option>
                  {classes.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Assign School <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <select required className="admin-select" value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}>
                  <option value="">Select a school</option>
                  {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
              <button type="submit" className="admin-btn admin-btn-primary">{editingStudent ? "Save Changes" : "Create Student"}</button>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { setShowForm(false); setEditingStudent(null); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search + filters ── */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
          <input className="admin-input" placeholder="Search by name or email…" value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: "2.25rem" }} />
        </div>
        <select className="admin-select" style={{ flex: "0 0 180px" }} value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)}>
          <option value="">All Schools</option>
          {schools.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select className="admin-select" style={{ flex: "0 0 140px" }} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="">All Classes</option>
          {classes.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
        </select>
        <select className="admin-select" style={{ flex: "0 0 180px" }} value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}>
          <option value="">All Teachers</option>
          {teachers.map((t) => <option key={t._id} value={t._id}>{t.fullName}</option>)}
        </select>
        {(search || filterSchool || filterClass || filterTeacher) && (
          <button className="admin-btn admin-btn-secondary" style={{ fontSize: "0.75rem" }}
            onClick={() => { setSearch(""); setFilterSchool(""); setFilterClass(""); setFilterTeacher(""); }}>
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: "var(--admin-danger-soft)", border: "1px solid var(--admin-danger)", borderRadius: "0.5rem", padding: "0.875rem 1rem", marginBottom: "1rem", fontSize: "0.8125rem", color: "var(--admin-danger)" }}>
          {error}
        </div>
      )}

      {/* ── Student cards ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ height: 88, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", opacity: 0.7 - i * 0.1 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", padding: "3rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", fontSize: "0.875rem" }}>
              {search || filterSchool || filterClass || filterTeacher ? "No students match your filters." : "No students yet. Add one above."}
            </div>
          )}

          {filtered.map((s) => {
            const summary = progressCache[s._id];
            const pct = summary?.pct ?? 0;
            const statusColor = pct >= 70 ? "var(--admin-success)" : pct >= 40 ? "var(--admin-warning)" : "var(--admin-danger)";
            const statusLabel = pct >= 70 ? "On Track" : pct >= 40 ? "In Progress" : "Needs Help";

            return (
              <div key={s._id} style={{
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "0.875rem", padding: "1rem 1.25rem",
                display: "flex", alignItems: "center", gap: "1.25rem",
                transition: "box-shadow 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
              >
                {/* Avatar */}
                <Avatar name={s.fullName || s.email} image={s.profileImage} size={44} />

                {/* Name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>
                    {s.fullName || "—"}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: 2 }}>{s.email}</div>
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.375rem", flexWrap: "wrap", alignItems: "center" }}>
                    {(s.classIds ?? []).map((c) => (
                      <span key={c} style={{
                        fontSize: "0.65rem", fontWeight: 700,
                        background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)",
                        padding: "0.1rem 0.4rem", borderRadius: "0.3rem",
                      }}>{c}</span>
                    ))}
                    <span style={{ fontSize: "0.7rem", color: "var(--muted)" }}>{getTeacherName(s)}</span>
                  </div>
                </div>

                {/* Progress ring + stats */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
                  {summary ? (
                    <>
                      <Ring pct={pct} size={52} />
                      <div style={{ minWidth: 110 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.2rem" }}>
                          <span style={{ fontSize: "0.6rem", fontWeight: 700, color: statusColor, background: statusColor + "18", padding: "0.15rem 0.4rem", borderRadius: "0.25rem" }}>
                            {statusLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "var(--muted)", lineHeight: 1.6 }}>
                          <div>{summary.completedLessons}/{summary.totalLessons} lessons</div>
                          <div>{summary.quizAttempts} quiz attempt{summary.quizAttempts !== 1 ? "s" : ""}</div>
                          <div>{summary.submissions} task{summary.submissions !== 1 ? "s" : ""} submitted</div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--border)", flexShrink: 0 }} />
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem", flexShrink: 0 }}>
                  <button
                    type="button" className="admin-btn admin-btn-primary"
                    style={{ fontSize: "0.7rem", padding: "0.3rem 0.75rem", whiteSpace: "nowrap" }}
                    onClick={() => setSelectedStudent(s)}
                  >
                    View Progress
                  </button>
                  <div style={{ display: "flex", gap: "0.3rem" }}>
                    <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem", flex: 1 }} onClick={() => openEdit(s)}>Edit</button>
                    <button type="button" className="admin-btn admin-btn-secondary"
                      style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem", flex: 1, color: "var(--admin-danger)", borderColor: "var(--admin-danger-soft)" }}
                      onClick={() => handleDelete(s)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
