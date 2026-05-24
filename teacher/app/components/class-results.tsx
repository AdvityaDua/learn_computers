"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { COLORS } from "../lib/constants";
import { Users, Search, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { StudentDetailDialog } from "./student-detail-dialog";

type ClassInfo = { _id: string; name: string; grade: number; studentCount: number };

type StudentResult = {
  userId: string;
  fullName: string;
  email: string;
  profileImage: string | null;
  points: number;
  completedLessons: number;
  totalLessons: number;
  lessonCompletion: number;
  completedQuizzes: number;
  totalQuizzes: number;
  avgQuizScore: number;
  submissions: { pending: number; approved: number; rejected: number; total: number };
};

type ClassResult = {
  students: StudentResult[];
  summary: { totalStudents: number; avgCompletion: number; avgPoints: number; totalLessons: number; totalQuizzes: number };
};

export function ClassResultsView() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [results, setResults] = useState<ClassResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"points" | "completion" | "quizScore">("points");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch("/users/teacher/dashboard");
        setClasses(data.classes);
        if (data.classes.length > 0) {
          setSelectedClass(data.classes[0].name);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    (async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/progress/teacher/class-results/${encodeURIComponent(selectedClass)}`);
        setResults(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedClass]);

  const filteredStudents = (results?.students ?? [])
    .filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      let aVal = 0, bVal = 0;
      if (sortBy === "points") { aVal = a.points; bVal = b.points; }
      else if (sortBy === "completion") { aVal = a.lessonCompletion; bVal = b.lessonCompletion; }
      else { aVal = a.avgQuizScore; bVal = b.avgQuizScore; }
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });

  const handleSort = (field: "points" | "completion" | "quizScore") => {
    if (sortBy === field) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortDir === "desc" ? <ChevronDown size={12} /> : <ChevronUp size={12} />;
  };

  const getCompletionColor = (pct: number) => {
    if (pct >= 80) return COLORS.success;
    if (pct >= 50) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <div style={{ animation: "slideUp 0.3s ease-out" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Class Results</h2>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.25rem" }}>View detailed student performance for each class</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <select
          className="t-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          {classes.map(c => (
            <option key={c._id} value={c.name}>{c.name} (Grade {c.grade})</option>
          ))}
        </select>

        <div style={{ position: "relative", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input
            className="t-input"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: "2rem" }}
          />
        </div>
      </div>

      {/* Summary Stats */}
      {results && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.25rem" }}>
          <div className="t-stat-card" style={{ padding: "1rem" }}>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Students</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: COLORS.accent }}>{results.summary.totalStudents}</div>
          </div>
          <div className="t-stat-card" style={{ padding: "1rem" }}>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Avg Completion</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: COLORS.success }}>{results.summary.avgCompletion}%</div>
          </div>
          <div className="t-stat-card" style={{ padding: "1rem" }}>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Avg Points</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: COLORS.warning }}>{results.summary.avgPoints}</div>
          </div>
          <div className="t-stat-card" style={{ padding: "1rem" }}>
            <div style={{ fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>Total Lessons</div>
            <div style={{ fontSize: "1.25rem", fontWeight: 800, color: COLORS.info }}>{results.summary.totalLessons}</div>
          </div>
        </div>
      )}

      {/* Results Table */}
      <div className="t-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading results...</div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center" }}>
            <Users size={32} color="var(--muted)" style={{ marginBottom: "0.5rem" }} />
            <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No students found</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="t-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("completion")}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>Lessons <SortIcon field="completion" /></span>
                  </th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("quizScore")}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>Quiz Avg <SortIcon field="quizScore" /></span>
                  </th>
                  <th>Submissions</th>
                  <th style={{ cursor: "pointer" }} onClick={() => handleSort("points")}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>Points <SortIcon field="points" /></span>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.userId}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                        <div style={{
                          width: 32, height: 32,
                          borderRadius: "50%",
                          background: `${COLORS.accent}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          color: COLORS.accent,
                          flexShrink: 0,
                        }}>
                          {s.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{s.fullName}</div>
                          <div style={{ fontSize: "0.6875rem", color: "var(--muted)" }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: 60, height: 6, borderRadius: 3,
                          background: "var(--surface-soft)", overflow: "hidden",
                        }}>
                          <div style={{
                            height: "100%", borderRadius: 3,
                            background: getCompletionColor(s.lessonCompletion),
                            width: `${s.lessonCompletion}%`,
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: getCompletionColor(s.lessonCompletion) }}>
                          {s.lessonCompletion}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: s.avgQuizScore >= 70 ? COLORS.success : s.avgQuizScore >= 40 ? COLORS.warning : COLORS.danger }}>
                        {s.avgQuizScore}%
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.375rem" }}>
                        {s.submissions.approved > 0 && <span className="t-badge t-badge-green">{s.submissions.approved} OK</span>}
                        {s.submissions.pending > 0 && <span className="t-badge t-badge-yellow">{s.submissions.pending} Pending</span>}
                        {s.submissions.rejected > 0 && <span className="t-badge t-badge-red">{s.submissions.rejected} REJ</span>}
                        {s.submissions.total === 0 && <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>—</span>}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: COLORS.accent, fontSize: "0.875rem" }}>{s.points}</span>
                    </td>
                    <td>
                      <button
                        className="t-btn t-btn-ghost"
                        style={{ padding: "0.25rem 0.5rem" }}
                        onClick={() => setSelectedStudent(s)}
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedStudent && (
        <StudentDetailDialog
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}
