"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, saveSession } from "../lib/api";
import { Eye, EyeOff, GraduationCap, LogIn, Sparkles } from "lucide-react";
import { Button } from "../components/ui/button";

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
        throw new Error(data.message || "That email or password doesn't look right.");
      }

      const data = await res.json();

      if (data.user?.role !== "student") {
        throw new Error("This sign-in page is just for students.");
      }

      saveSession(data.accessToken, data.user);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Couldn't sign in, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md animate-pop-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-card)]">
            <GraduationCap size={30} className="text-white" />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-extrabold tracking-tight">
            Welcome back!
          </h1>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-muted">
            <Sparkles size={14} className="text-secondary" />
            Sign in to keep learning
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-7 shadow-[var(--shadow-card)]">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? (
              <div className="rounded-md border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
                {error}
              </div>
            ) : null}

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.com"
                required
                autoFocus
                className="h-11 rounded-md border border-border bg-surface px-3.5 text-[15px] outline-none transition-colors focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-foreground">Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your secret password"
                  required
                  className="h-11 w-full rounded-md border border-border bg-surface px-3.5 pr-10 text-[15px] outline-none transition-colors focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            <Button type="submit" size="lg" isLoading={loading} className="mt-2 w-full">
              {!loading ? <LogIn size={18} /> : null}
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Ask your teacher if you don&apos;t have an account yet.
        </p>
      </div>
    </div>
  );
}
