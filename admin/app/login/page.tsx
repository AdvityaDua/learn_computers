"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession, ensureAdminSession } from "../lib/admin-api";
import { Eye, EyeOff, GraduationCap, BookOpen, Users, BarChart3, Shield } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const FEATURES = [
  { icon: <BookOpen size={18} />, title: "Curriculum Management", desc: "Build and organize lesson content across all chapters" },
  { icon: <Users size={18} />,   title: "Student & Teacher Admin", desc: "Manage users, classes, and school assignments" },
  { icon: <BarChart3 size={18} />, title: "Analytics & Insights",  desc: "Track attendance, reviews, and performance in real time" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("admin-theme") : null;
    if (saved === "dark") setIsDark(true);
    else if (saved === "light") setIsDark(false);
    else setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const checkExistingSession = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) return;
      const ok = await ensureAdminSession();
      if (!isMounted) return;
      if (ok) router.replace("/");
      else clearAdminSession();
    };
    void checkExistingSession();
    return () => { isMounted = false; };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      if (data.user.role !== "admin") throw new Error("Access denied. Only admins can enter.");
      localStorage.setItem("adminToken", data.accessToken);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      router.replace("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const panelBg = isDark
    ? "linear-gradient(150deg, #0c0e16 0%, #140510 45%, #1e0612 75%, #0a000f 100%)"
    : "linear-gradient(150deg, #1e0612 0%, #3b0c1e 40%, #4f0d26 70%, #1a020e 100%)";

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", background: "var(--background)" }}>
      <style>{`
        @media (max-width: 840px) {
          .login-grid { grid-template-columns: 1fr !important; }
          .login-brand-panel { display: none !important; }
        }
        @keyframes loginSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes loginSpin { to { transform: rotate(360deg); } }
        .login-form-wrap { animation: loginSlideUp 0.45s cubic-bezier(0.22,1,0.36,1) both; }
        .login-submit-btn { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .login-submit-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 32px rgba(225,29,72,0.4), 0 2px 8px rgba(225,29,72,0.2) !important;
          filter: brightness(1.06);
        }
        .login-submit-btn:not(:disabled):active { transform: translateY(0); }
        .login-pw-toggle:hover { color: var(--foreground) !important; }
        .login-input-styled {
          width: 100%; font-size: 0.9375rem; padding: 0.8125rem 1rem;
          border: 1.5px solid var(--border); border-radius: 0.625rem;
          background: var(--surface); color: var(--foreground);
          outline: none; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s;
        }
        .login-input-styled::placeholder { color: var(--muted-2); }
        .login-input-styled:focus {
          border-color: #cb444a;
          box-shadow: 0 0 0 3px rgba(203,68,74,0.18);
        }
      `}</style>

      {/* ── Left: Brand Panel ─────────────────────────────── */}
      <div
        className="login-brand-panel"
        style={{
          background: panelBg,
          display: "flex", flexDirection: "column",
          padding: "2.75rem 3rem",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "-15%", right: "-20%", width: "70%", paddingBottom: "70%", borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.16) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-8%", left: "-15%", width: "55%", paddingBottom: "55%", borderRadius: "50%", background: "radial-gradient(circle, rgba(244,63,94,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: "50%", right: "15%", width: "30%", paddingBottom: "30%", borderRadius: "50%", background: "radial-gradient(circle, rgba(190,18,60,0.07) 0%, transparent 65%)", pointerEvents: "none" }} />

        {/* Brand mark */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "4rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "0.875rem", flexShrink: 0,
            background: "linear-gradient(135deg, #9b2226, #cb444a)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 28px rgba(244,63,94,0.4)",
          }}>
            <GraduationCap size={26} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2 }}>Bagat Puran Singh</p>
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: "rgba(255,255,255,0.7)", lineHeight: 1.2 }}>School for Deaf</p>
            <p style={{ margin: 0, fontSize: "0.5625rem", fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: "0.125rem" }}>Admin Portal</p>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ position: "relative", zIndex: 1, flex: 1 }}>
          <h2 style={{ color: "#fff", fontSize: "2.25rem", fontWeight: 800, margin: "0 0 1rem", lineHeight: 1.15, letterSpacing: "-0.03em" }}>
            Empowering deaf<br />
            <span style={{ background: "linear-gradient(90deg, #cb444a 0%, #dc5a60 55%, #ef8b8f 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              education together
            </span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.46)", fontSize: "0.9375rem", margin: "0 0 3rem", lineHeight: 1.65, maxWidth: 340 }}>
            One powerful dashboard to manage curriculum, students, and progress at Bagat Puran Singh School for Deaf.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{
                  width: 42, height: 42, borderRadius: "0.875rem", flexShrink: 0,
                  background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#dc5a60",
                }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: "0.9375rem", lineHeight: 1.3 }}>{f.title}</div>
                  <div style={{ color: "rgba(255,255,255,0.36)", fontSize: "0.8125rem", marginTop: "0.2rem", lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom security badge */}
        <div style={{ position: "relative", zIndex: 1, marginTop: "3rem" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem",
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: "99px", padding: "0.45rem 1rem",
          }}>
            <Shield size={13} color="rgba(255,255,255,0.35)" />
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.6875rem", fontWeight: 600 }}>Secured · Admins only</span>
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ─────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "2rem", background: "var(--background)",
      }}>
        <div className="login-form-wrap" style={{ width: "100%", maxWidth: 420 }}>

          {/* Form heading */}
          <div style={{ marginBottom: "2.25rem" }}>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, color: "var(--foreground)", margin: "0 0 0.5rem", letterSpacing: "-0.03em" }}>
              Welcome back
            </h1>
            <p style={{ fontSize: "0.9375rem", color: "var(--muted)", margin: 0, lineHeight: 1.55 }}>
              Sign in to continue managing your school.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>

            <div>
              <label className="admin-label">Email Address</label>
              <input
                type="email"
                className="login-input-styled"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@school.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="admin-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="login-input-styled"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingRight: "3.25rem" }}
                />
                <button
                  type="button"
                  className="login-pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--muted-2)", padding: "0.25rem", lineHeight: 1, transition: "color 0.15s",
                  }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{
                background: "var(--admin-danger-soft)", color: "var(--admin-danger)",
                padding: "0.875rem 1rem", borderRadius: "0.625rem",
                fontSize: "0.875rem", border: "1px solid var(--admin-danger-border)",
                display: "flex", alignItems: "flex-start", gap: "0.625rem", lineHeight: 1.5,
              }}>
                <span style={{ flexShrink: 0, fontSize: "1rem" }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="login-submit-btn"
              style={{
                width: "100%", padding: "0.9375rem 1rem", marginTop: "0.5rem",
                background: loading
                  ? "var(--surface-soft)"
                  : "linear-gradient(135deg, #9b2226 0%, #cb444a 55%, #dc5a60 100%)",
                color: loading ? "var(--muted)" : "#ffffff",
                border: loading ? "1.5px solid var(--border)" : "none",
                borderRadius: "0.75rem",
                fontSize: "0.9375rem", fontWeight: 700, letterSpacing: "-0.01em",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.625rem",
                boxShadow: loading ? "none" : "0 4px 18px rgba(203,68,74,0.32), 0 1px 4px rgba(203,68,74,0.18)",
                fontFamily: "inherit",
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    border: "2.5px solid var(--border)",
                    borderTopColor: "var(--admin-accent)",
                    animation: "loginSpin 0.75s linear infinite",
                  }} />
                  Signing in…
                </>
              ) : "Sign in to Admin Portal"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "2rem", fontSize: "0.75rem", color: "var(--muted-2)" }}>
            Access restricted to authorized administrators only.
          </p>
        </div>
      </div>
    </div>
  );
}
