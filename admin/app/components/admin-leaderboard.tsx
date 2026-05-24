"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Trophy, Star, RefreshCcw, Award } from "lucide-react";
import { apiFetch } from "../lib/admin-api";
import { ClassMultiSelect } from "./class-multi-select";
import { SchoolMultiSelect } from "./school-multi-select";

type LeaderboardUser = {
  _id: string;
  userId: string;
  fullName: string;
  points: number;
  score: number;
  contentCount: number;
  lessonCount: number;
  quizCount: number;
  assignmentCount: number;
  activityCount: number;
};

const MEDAL_COLORS = ["#F59E0B", "#94A3B8", "#D97706"];

const PodiumItem = ({ user, rank, color, height }: { user: LeaderboardUser, rank: number, color: string, height: number }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", flex: 1, padding: "1rem", maxWidth: 200 }}>
      {/* Avatar / Medal */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--surface)", border: `3px solid ${color}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${color}40`, zIndex: 2, position: "relative" }}>
          <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)" }}>{user.fullName.charAt(0)}</span>
        </div>
        <div style={{ position: "absolute", bottom: -10, left: "50%", transform: "translateX(-50%)", width: 24, height: 24, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--surface)", zIndex: 3 }}>
          <span style={{ color: "#fff", fontSize: "0.75rem", fontWeight: 800 }}>{rank}</span>
        </div>
      </div>
      
      {/* Name & Score */}
      <div style={{ textAlign: "center", marginBottom: "1rem", zIndex: 2 }}>
        <div style={{ fontSize: "0.9375rem", fontWeight: 800, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{user.fullName}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.25rem", marginTop: "0.25rem" }}>
          <Star size={14} color={color} fill={color} />
          <span style={{ fontSize: "1rem", fontWeight: 800, color: color }}>{user.score || user.points || 0} pts</span>
        </div>
      </div>

      {/* Podium Block */}
      <div style={{ width: "100%", height, background: `linear-gradient(to top, ${color}30, ${color}05)`, borderTop: `3px solid ${color}`, borderTopLeftRadius: "0.75rem", borderTopRightRadius: "0.75rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent, var(--surface))` }} />
      </div>
    </div>
  );
};

export function AdminLeaderboardView() {
  const [data, setData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [schools, setSchools] = useState<string[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (schools.length > 0) params.append("schoolId", schools[0]);
      if (classes.length > 0) params.append("classId", classes[0]);
      
      const res = await apiFetch(`/progress/leaderboard?${params.toString()}`);
      setData(res || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [schools, classes]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="admin-container">
      {/* Header */}
      <div className="admin-header-row" style={{ marginBottom: "2rem" }}>
        <div>
          <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Award size={28} color="var(--admin-accent)" />
            Leaderboards
          </h1>
          <p className="admin-page-subtitle">View top students across the entire platform or filter by school/class</p>
        </div>
        <button onClick={fetchLeaderboard} className="admin-btn admin-btn-ghost" disabled={loading}>
          <RefreshCcw size={16} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card" style={{ marginBottom: "2rem", display: "flex", flexWrap: "wrap", alignItems: "center", gap: "2rem", padding: "1.25rem 1.5rem" }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Filter by School</label>
          <SchoolMultiSelect selectedIds={schools} onChange={ids => setSchools(ids.length ? [ids[ids.length - 1]] : [])} />
        </div>
        <div style={{ width: 1, height: 40, background: "var(--border)", opacity: 0.5 }} />
        <div style={{ flex: 1, minWidth: 250 }}>
          <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.75rem" }}>Filter by Class</label>
          <ClassMultiSelect selectedIds={classes} onChange={ids => setClasses(ids.length ? [ids[ids.length - 1]] : [])} />
        </div>
      </div>

      {/* Leaderboard Area */}
      {loading ? (
        <div className="admin-card">
          <div className="admin-empty-state">Loading leaderboard…</div>
        </div>
      ) : data.length === 0 ? (
        <div className="admin-card">
          <div className="admin-empty-state">
            <div style={{ width: 64, height: 64, borderRadius: "1.25rem", background: "var(--admin-accent-soft)", color: "var(--admin-accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Trophy size={32} />
            </div>
            <h3 style={{ margin: 0, fontWeight: 800, color: "var(--foreground)" }}>No data available</h3>
            <p style={{ color: "var(--muted)", margin: "0.5rem 0 0", fontSize: "0.875rem" }}>
              No students have earned points for the selected filters yet.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Podium */}
          {data.length >= 3 ? (
             <div className="admin-card" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "1.5rem", padding: "2rem 2rem 0" }}>
               <PodiumItem user={data[1]} rank={2} color={MEDAL_COLORS[1]} height={100} />
               <PodiumItem user={data[0]} rank={1} color={MEDAL_COLORS[0]} height={140} />
               <PodiumItem user={data[2]} rank={3} color={MEDAL_COLORS[2]} height={80} />
             </div>
          ) : (
            <div className="admin-card" style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "1.5rem", padding: "2rem 2rem 0" }}>
               {data[0] && <PodiumItem user={data[0]} rank={1} color={MEDAL_COLORS[0]} height={140} />}
               {data[1] && <PodiumItem user={data[1]} rank={2} color={MEDAL_COLORS[1]} height={100} />}
             </div>
          )}

          {/* Table */}
          <div className="admin-card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, textAlign: "center" }}>Rank</th>
                  <th>Student</th>
                  <th style={{ textAlign: "right" }}>Score (Pts)</th>
                  <th style={{ textAlign: "right" }}>Activity</th>
                </tr>
              </thead>
              <tbody>
                {data.map((user, idx) => (
                  <tr key={user._id || user.userId || idx} style={{ background: idx < 3 ? "var(--surface-soft)" : "transparent" }}>
                    <td style={{ textAlign: "center" }}>
                      {idx < 3 ? (
                        <div style={{ width: 32, height: 32, margin: "0 auto", borderRadius: "50%", background: `${MEDAL_COLORS[idx]}15`, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${MEDAL_COLORS[idx]}` }}>
                          <span style={{ color: MEDAL_COLORS[idx], fontSize: "0.875rem", fontWeight: 800 }}>{idx + 1}</span>
                        </div>
                      ) : (
                        <div style={{ width: 32, height: 32, margin: "0 auto", borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)" }}>
                           <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--muted)" }}>{idx + 1}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                         <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", fontWeight: 700, color: "var(--foreground)", border: "1px solid var(--border)" }}>
                           {user.fullName.charAt(0)}
                         </div>
                         <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>{user.fullName}</div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.375rem" }}>
                        <Star size={16} color={idx === 0 ? "#F59E0B" : "var(--muted)"} fill={idx === 0 ? "#F59E0B" : "var(--border)"} />
                        <span style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)" }}>{user.score || user.points || 0}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.75rem", color: "var(--muted)", fontSize: "0.75rem" }}>
                        <span style={{ background: "var(--surface)", padding: "0.375rem 0.5rem", borderRadius: "0.375rem", fontWeight: 600, border: "1px solid var(--border)" }}>{user.lessonCount || 0} Lessons</span>
                        <span style={{ background: "var(--surface)", padding: "0.375rem 0.5rem", borderRadius: "0.375rem", fontWeight: 600, border: "1px solid var(--border)" }}>{user.quizCount || 0} Quizzes</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
