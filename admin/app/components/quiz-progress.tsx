import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/admin-api";
import { ClassFilter } from "./class-filter";

type QuizStat = { title: string; quizId: string; attempts: number; avgScore: number; maxScore: number };
type School = { _id: string; name: string };

export function QuizProgressView() {
  const [stats, setStats] = useState<QuizStat[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterSchool, setFilterSchool] = useState<string>("");
  const [filterClass, setFilterClass] = useState<string>("Class 3");

  const fetchData = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (filterSchool) query.append("schoolId", filterSchool);
      if (filterClass) query.append("classId", filterClass);
      
      const res = await apiFetch(`/progress/admin/quiz-stats?${query.toString()}`);
      setStats(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const res = await apiFetch("/schools?limit=100");
      setSchools(res.items || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    fetchData();
  }, [filterSchool, filterClass]);

  return (
    <div style={{ maxWidth: 960 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)" }}>Quiz Progress & Analytics</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.25rem" }}>Track student performance across quizzes.</p>
        </div>
      </div>

      <div className="admin-card" style={{ padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", gap: "1.5rem", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted)", textTransform: "uppercase" }}>School:</label>
          <select value={filterSchool} onChange={(e) => setFilterSchool(e.target.value)} className="admin-select" style={{ width: "200px" }}>
            <option value="">All Schools</option>
            {schools.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
        
        <ClassFilter value={filterClass} onChange={setFilterClass} />
      </div>

      <div className="admin-card" style={{ overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)" }}>Loading stats...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Quiz Title</th>
                <th style={{ textAlign: "center" }}>Total Attempts</th>
                <th style={{ textAlign: "center" }}>Average Score</th>
                <th style={{ textAlign: "center" }}>Highest Score</th>
              </tr>
            </thead>
            <tbody>
              {stats.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>No quiz data found for these filters.</td></tr>
              ) : (
                stats.map(s => (
                  <tr key={s.quizId}>
                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="admin-badge admin-badge-gray">{s.attempts} attempts</span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <div style={{ width: 60, height: 6, background: "var(--surface-soft)", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ width: `${s.avgScore}%`, height: "100%", background: s.avgScore >= 80 ? "var(--admin-success)" : s.avgScore >= 50 ? "var(--admin-warning)" : "var(--admin-danger)" }} />
                        </div>
                        <span style={{ fontSize: "0.75rem", fontWeight: 600 }}>{s.avgScore}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontWeight: 700, color: s.maxScore === 100 ? "var(--admin-success)" : "var(--foreground)" }}>
                        {s.maxScore}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
