"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { clearAdminSession, ensureAdminSession } from "../lib/admin-api";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkExistingSession = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        return;
      }

      const ok = await ensureAdminSession();
      if (!isMounted) {
        return;
      }

      if (ok) {
        router.replace("/");
      } else {
        clearAdminSession();
      }
    };

    void checkExistingSession();

    return () => {
      isMounted = false;
    };
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

      if (!res.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (data.user.role !== "admin") {
        throw new Error("Access denied. Only admins can enter.");
      }

      localStorage.setItem("adminToken", data.accessToken);
      localStorage.setItem("adminUser", JSON.stringify(data.user));
      router.replace("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--background)", padding: "1.5rem"
    }}>
      <div className="admin-card" style={{ width: "100%", maxWidth: 400, padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "0.75rem", background: "var(--admin-accent)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1rem"
          }}>
            <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>Admin Login</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--muted)", marginTop: "0.5rem" }}>Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1.25rem" }}>
            <label className="admin-label">Email Address</label>
            <input
              type="email"
              className="admin-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="admin@example.com"
            />
          </div>
          <div style={{ marginBottom: "1.5rem" }}>
            <label className="admin-label">Password</label>
            <input
              type="password"
              className="admin-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              background: "var(--admin-danger-soft)", color: "var(--admin-danger)",
              padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.875rem",
              marginBottom: "1.5rem", border: "1px solid var(--admin-danger)"
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="admin-btn admin-btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login to Console"}
          </button>
        </form>
      </div>
    </div>
  );
}
