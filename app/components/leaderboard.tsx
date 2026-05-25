"use client";

import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { COLORS, API_BASE_URL } from "../lib/constants";
import { Dialog } from "./dialog";
import { Trophy, Medal, Minus, Plus, AlertTriangle, Award, Info, BookOpen, Brain, FileCheck, Puzzle } from "lucide-react";

type ClassInfo = { _id: string; name: string; grade: number };

type LeaderboardEntry = {
  rank: number;
  userId: string;
  fullName: string;
  profileImage: string | null;
  points: number;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
};

export function LeaderboardView() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Point adjustment dialog
  const [adjustDialog, setAdjustDialog] = useState<{ student: LeaderboardEntry; mode: "add" | "deduct" } | null>(null);
  const [adjustPoints, setAdjustPoints] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjusting, setAdjusting] = useState(false);

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

  const fetchLeaderboard = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/progress/teacher/leaderboard?classId=${encodeURIComponent(selectedClass)}`);
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedClass]);

  const handleAdjustPoints = async () => {
    if (!adjustDialog || !adjustPoints || !adjustReason.trim()) return;
    setAdjusting(true);
    try {
      const pts = parseInt(adjustPoints);
      if (adjustDialog.mode === "deduct") {
        await apiFetch(`/progress/students/${adjustDialog.student.userId}/deduct-points`, {
          method: "POST",
          body: JSON.stringify({ points: pts, reason: adjustReason.trim() }),
        });
      }
      // For adding points, we use the user update endpoint
      if (adjustDialog.mode === "add") {
        const newPoints = adjustDialog.student.points + pts;
        await apiFetch(`/users/${adjustDialog.student.userId}`, {
          method: "PATCH",
          body: JSON.stringify({ points: newPoints }),
        });
      }
      setAdjustDialog(null);
      setAdjustPoints("");
      setAdjustReason("");
      fetchLeaderboard();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to adjust points");
    } finally {
      setAdjusting(false);
    }
  };

  const getMedalColor = (rank: number) => {
    if (rank === 1) return COLORS.gold;
    if (rank === 2) return COLORS.silver;
    if (rank === 3) return COLORS.bronze;
    return "transparent";
  };

  const getMedalBg = (rank: number) => {
    if (rank === 1) return `${COLORS.gold}20`;
    if (rank === 2) return `${COLORS.silver}20`;
    if (rank === 3) return `${COLORS.bronze}20`;
    return "transparent";
  };

  return (
    <div style={{ animation: "slideUp 0.3s ease-out" }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: "0.75rem", background: `${COLORS.gold}15`, color: COLORS.gold, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trophy size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)", margin: 0, letterSpacing: "-0.02em" }}>Leaderboard</h2>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: 0 }}>Student rankings by points — use the +/- buttons to award or deduct points</p>
          </div>
        </div>
        <select
          className="t-select"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          {classes.map(c => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* How Points Work — teacher reference panel */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.875rem", overflow: "hidden", marginBottom: "1.5rem" }}>
        <div style={{ padding: "0.875rem 1.25rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.625rem", background: `${COLORS.gold}08` }}>
          <Award size={16} color={COLORS.gold} />
          <span style={{ fontWeight: 700, fontSize: "0.875rem", color: "var(--foreground)" }}>How Students Earn Points</span>
          <span style={{ fontSize: "0.6875rem", color: "var(--muted)", marginLeft: 2 }}>— teacher reference</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", padding: "1rem 1.25rem" }}>
          {[
            { icon: BookOpen, label: "Lesson Completion", desc: "Points awarded when all items in a lesson are finished.", color: COLORS.success },
            { icon: Brain, label: "Quiz Performance", desc: "Points scale with quiz score — higher scores earn more points.", color: COLORS.info },
            { icon: FileCheck, label: "Approved Submissions", desc: "You set the points when approving an assignment or activity file upload.", color: COLORS.accent },
            { icon: Award, label: "Teacher Bonus", desc: "Manually award or deduct bonus points here. Always enter a reason.", color: COLORS.gold },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", gap: "0.625rem", padding: "0.75rem", borderRadius: "0.5rem", background: "var(--surface-soft)", border: "1px solid var(--border)" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <item.icon size={15} color={item.color} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.75rem", color: "var(--foreground)", marginBottom: 2 }}>{item.label}</div>
                <div style={{ fontSize: "0.6875rem", color: "var(--muted)", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0.625rem 1.25rem", borderTop: "1px solid var(--border)", background: "var(--surface-soft)", display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
          <Info size={13} color={COLORS.info} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: "0.6875rem", color: "var(--muted)", lineHeight: 1.5 }}>
            All manual point adjustments are logged with your stated reason. Students can see their total points on the Leaderboard and in their profile.
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", color: "var(--muted)" }}>Loading leaderboard...</div>
      ) : entries.length === 0 ? (
        <div className="t-card" style={{ padding: "3rem", textAlign: "center" }}>
          <Trophy size={40} color="var(--muted)" style={{ marginBottom: "0.75rem" }} />
          <div style={{ color: "var(--muted)", fontSize: "0.875rem" }}>No students found for this class</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* Top 3 podium */}
          {entries.length >= 3 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              {[entries[1], entries[0], entries[2]].map((e, podiumIdx) => {
                const rank = e.rank;
                const isFirst = rank === 1;
                return (
                  <div
                    key={e.userId}
                    className="t-card"
                    style={{
                      padding: "1.25rem",
                      textAlign: "center",
                      border: isFirst ? `2px solid ${COLORS.gold}` : undefined,
                      transform: isFirst ? "scale(1.05)" : undefined,
                      zIndex: isFirst ? 1 : 0,
                      position: "relative",
                    }}
                  >
                    {/* Medal */}
                    <div style={{
                      width: 28, height: 28,
                      borderRadius: "50%",
                      background: getMedalBg(rank),
                      border: `2px solid ${getMedalColor(rank)}`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "0.5rem",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: getMedalColor(rank),
                    }}>
                      {rank}
                    </div>

                    {/* Avatar */}
                    <div style={{
                      width: isFirst ? 52 : 44, height: isFirst ? 52 : 44,
                      borderRadius: "50%",
                      background: `${COLORS.accent}15`,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: isFirst ? "1.125rem" : "0.875rem",
                      fontWeight: 800,
                      color: COLORS.accent,
                      margin: "0 auto 0.5rem",
                    }}>
                      {e.profileImage ? (
                        <img src={e.profileImage.startsWith("http") ? e.profileImage : `${API_BASE_URL}${e.profileImage.startsWith("/") ? "" : "/"}${e.profileImage}`} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        e.fullName.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div style={{ fontWeight: 700, fontSize: isFirst ? "0.9375rem" : "0.8125rem", color: "var(--foreground)", marginBottom: "0.25rem" }}>
                      {e.fullName}
                    </div>
                    <div style={{
                      fontSize: isFirst ? "1.25rem" : "1rem",
                      fontWeight: 800,
                      color: COLORS.accent,
                    }}>
                      {e.points} <span style={{ fontSize: "0.625rem", fontWeight: 500, color: "var(--muted)" }}>pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Rest of the leaderboard */}
          <div className="t-card" style={{ overflow: "hidden" }}>
            <table className="t-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>Rank</th>
                  <th>Student</th>
                  <th>Lessons</th>
                  <th>Quizzes</th>
                  <th>Points</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.userId}>
                    <td>
                      <div style={{
                        width: 24, height: 24,
                        borderRadius: "50%",
                        background: e.rank <= 3 ? getMedalBg(e.rank) : "var(--surface-soft)",
                        border: e.rank <= 3 ? `1.5px solid ${getMedalColor(e.rank)}` : "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.6875rem",
                        fontWeight: 800,
                        color: e.rank <= 3 ? getMedalColor(e.rank) : "var(--muted)",
                      }}>
                        {e.rank}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div style={{
                          width: 28, height: 28,
                          borderRadius: "50%",
                          background: `${COLORS.accent}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          color: COLORS.accent,
                          flexShrink: 0,
                        }}>
                          {e.profileImage ? (
                             <img src={e.profileImage.startsWith("http") ? e.profileImage : `${API_BASE_URL}${e.profileImage.startsWith("/") ? "" : "/"}${e.profileImage}`} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                          ) : (
                            e.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: "0.8125rem" }}>{e.fullName}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        {e.completedLessons}/{e.totalLessons}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        {e.completedQuizzes}/{e.totalQuizzes}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: COLORS.accent }}>{e.points}</span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "0.25rem" }}>
                        <button
                          className="t-btn t-btn-ghost"
                          style={{ padding: "0.2rem 0.375rem", color: COLORS.success }}
                          title="Add points"
                          onClick={() => setAdjustDialog({ student: e, mode: "add" })}
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          className="t-btn t-btn-ghost"
                          style={{ padding: "0.2rem 0.375rem", color: COLORS.danger }}
                          title="Deduct points"
                          onClick={() => setAdjustDialog({ student: e, mode: "deduct" })}
                        >
                          <Minus size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Points Dialog */}
      {adjustDialog && (
        <Dialog
          open={true}
          onClose={() => { setAdjustDialog(null); setAdjustPoints(""); setAdjustReason(""); }}
          title={`${adjustDialog.mode === "add" ? "Add" : "Deduct"} Points`}
          footer={
            <>
              <button className="t-btn t-btn-secondary" onClick={() => { setAdjustDialog(null); setAdjustPoints(""); setAdjustReason(""); }}>
                Cancel
              </button>
              <button
                className={`t-btn ${adjustDialog.mode === "add" ? "t-btn-primary" : "t-btn-danger"}`}
                onClick={handleAdjustPoints}
                disabled={adjusting || !adjustPoints || !adjustReason.trim()}
              >
                {adjusting ? "Processing..." : adjustDialog.mode === "add" ? "Add Points" : "Deduct Points"}
              </button>
            </>
          }
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: "50%",
              background: adjustDialog.mode === "add" ? `${COLORS.success}15` : `${COLORS.danger}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              {adjustDialog.mode === "add" ? <Plus size={20} color={COLORS.success} /> : <Minus size={20} color={COLORS.danger} />}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9375rem" }}>{adjustDialog.student.fullName}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Current: {adjustDialog.student.points} points</div>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="t-label">Points</label>
            <input
              className="t-input"
              type="number"
              min="1"
              value={adjustPoints}
              onChange={(e) => setAdjustPoints(e.target.value)}
              placeholder="Enter point amount"
              autoFocus
            />
          </div>

          <div>
            <label className="t-label">Reason</label>
            <input
              className="t-input"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g., Extra credit, Late submission penalty"
            />
          </div>

          {adjustDialog.mode === "deduct" && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: "0.5rem",
              marginTop: "1rem", padding: "0.75rem",
              background: COLORS.warningSoft, borderRadius: 8,
              border: `1px solid ${COLORS.warning}`,
              fontSize: "0.75rem", color: COLORS.warning,
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>Points will be deducted from the student&apos;s total. This cannot be automatically undone.</span>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}
