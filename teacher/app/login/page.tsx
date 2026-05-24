"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, saveSession } from "../lib/api";
import { COLORS } from "../lib/constants";
import { BookOpen, Eye, EyeOff, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid credentials");
      }

      const data = await res.json();

      if (data.user?.role !== "instructor" && data.user?.role !== "admin") {
        throw new Error("Access restricted to teachers only");
      }

      saveSession(data.accessToken, data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--background)",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 420,
        animation: "slideUp 0.3s ease-out",
      }}>
        {/* Logo / Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: 16,
            background: COLORS.accent,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "1rem",
            boxShadow: `0 4px 12px ${COLORS.accentRing}`,
          }}>
            <BookOpen size={28} color={COLORS.onAccent} />
          </div>
          <h1 style={{
            fontSize: "1.5rem",
            fontWeight: 800,
            color: "var(--foreground)",
            margin: "0 0 0.25rem",
            letterSpacing: "-0.02em",
          }}>
            Teacher Portal
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", margin: 0 }}>
            Sign in to manage your classes and students
          </p>
        </div>

        {/* Login Card */}
        <div className="t-card" style={{ padding: "2rem" }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: COLORS.dangerSoft,
                color: COLORS.danger,
                border: `1px solid ${COLORS.danger}`,
                borderRadius: 8,
                padding: "0.75rem 1rem",
                fontSize: "0.8125rem",
                fontWeight: 600,
                marginBottom: "1.25rem",
              }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom: "1.25rem" }}>
              <label className="t-label">Email</label>
              <input
                className="t-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher@school.edu"
                required
                autoFocus
              />
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="t-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="t-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ paddingRight: "2.5rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted)",
                    padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="t-btn t-btn-primary"
              disabled={loading}
              style={{ width: "100%", height: 44, fontSize: "0.875rem" }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }} />
                  Signing In...
                </span>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{
          textAlign: "center",
          marginTop: "1.5rem",
          fontSize: "0.75rem",
          color: "var(--muted)",
        }}>
          Contact your administrator if you need access
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
