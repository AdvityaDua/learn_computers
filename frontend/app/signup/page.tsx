"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { SiteHeader } from "../components/common/site-header";
import { SiteFooter } from "../components/common/site-footer";
import { Button } from "../components/common/button";
import { getFirebaseClient } from "../lib/firebase";


type AuthResult = {
  accessToken: string;
  user?: unknown;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.239 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.84 1.154 7.957 3.043l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.84 1.154 7.957 3.043l5.657-5.657C34.046 6.053 29.27 4 24 4c-7.682 0-14.347 4.337-17.694 10.691z" />
      <path fill="#4CAF50" d="M24 44c5.169 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.145 35.091 26.715 36 24 36c-5.218 0-9.62-3.317-11.283-7.946l-6.522 5.025C9.504 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-4.084 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.651-.389-3.917z" />
    </svg>
  );
}

async function postAuth(path: string, payload: Record<string, string>): Promise<AuthResult> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<AuthResult> & { message?: string };

  if (!response.ok || !data.accessToken) {
    throw new Error(data.message ?? "Unable to create your account right now.");
  }

  return {
    accessToken: data.accessToken,
    user: data.user,
  };
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await postAuth("/auth/register", {
        fullName,
        email,
        password,
        role: "student",
      });

      localStorage.setItem("accessToken", data.accessToken);
      if (data.user) {
        localStorage.setItem("authUser", JSON.stringify(data.user));
      }
      window.location.href = "/dashboard";
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create your account right now.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleSignup = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      const { auth, provider } = getFirebaseClient();
      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken(true);
      const data = await postAuth("/auth/google", { idToken });

      localStorage.setItem("accessToken", data.accessToken);
      if (data.user) {
        localStorage.setItem("authUser", JSON.stringify(data.user));
      }

      await signOut(auth);
      window.location.href = "/dashboard";
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to continue with Google right now.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="theme-page min-h-screen">
      <SiteHeader />

      <main className="auth-shell mx-auto grid w-full max-w-6xl items-center px-6 py-12 md:px-10">
        <section className="mx-auto w-full max-w-md auth-card p-6 md:p-8">
          <h1 className="mt-5 text-3xl font-black">Create your account</h1>
          <p className="section-subtitle">Set up your account to start learning and monitor your growth from day one.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="theme-muted mb-1 block text-sm font-semibold">Full Name</label>
              <input
                type="text"
                className="input-theme"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                minLength={2}
                required
              />
            </div>

            <div>
              <label className="theme-muted mb-1 block text-sm font-semibold">Email</label>
              <input
                type="email"
                className="input-theme"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="theme-muted mb-1 block text-sm font-semibold">Password</label>
              <input
                type="password"
                className="input-theme"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a password"
                minLength={6}
                required
              />
            </div>

            <div>
              <label className="theme-muted mb-1 block text-sm font-semibold">Confirm Password</label>
              <input
                type="password"
                className="input-theme"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter your password"
                minLength={6}
                required
              />
            </div>

            {error ? <p className="text-sm font-semibold text-[#de555b]">{error}</p> : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="auth-divider mt-6">or continue with</p>

          <Button
            type="button"
            onClick={onGoogleSignup}
            variant="google"
            size="lg"
            className="mt-4 w-full gap-2"
            aria-label="Sign up with Google"
            disabled={googleLoading || loading}
          >
            <GoogleIcon />
            {googleLoading ? "Connecting Google..." : "Continue with Google"}
          </Button>

          <p className="theme-muted mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="accent-text font-semibold">
              Login
            </Link>
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
