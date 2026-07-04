"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, clearSession, ensureSession, getToken, getUser, type SessionUser } from "../lib/api";

export type StudentProfile = {
  _id: string;
  email: string;
  fullName: string;
  profileImage?: string;
  phone?: string;
  classIds: string[];
  schoolId?: string;
  teacherId?: string;
  points: number;
};

type AuthContextValue = {
  sessionUser: SessionUser | null;
  profile: StudentProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    clearSession();
    setSessionUser(null);
    setProfile(null);
    router.replace("/login");
  }, [router]);

  const refreshProfile = useCallback(async () => {
    try {
      const data = await apiFetch("/users/profile_data");
      setProfile(data);
    } catch {
      // handled by the unauthorized event / apiFetch's own redirect trigger
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const handleUnauthorized = () => {
      if (!isMounted) return;
      clearSession();
      setSessionUser(null);
      setProfile(null);
      router.replace("/login");
    };

    window.addEventListener("student:unauthorized", handleUnauthorized);

    const validate = async () => {
      if (!getToken()) {
        if (isMounted) setLoading(false);
        router.replace("/login");
        return;
      }

      const ok = await ensureSession();
      if (!isMounted) return;

      if (!ok) {
        clearSession();
        setLoading(false);
        router.replace("/login");
        return;
      }

      const localUser = getUser();
      if (localUser && localUser.role !== "student") {
        clearSession();
        setLoading(false);
        router.replace("/login");
        return;
      }

      setSessionUser(localUser);
      await refreshProfile();
      if (isMounted) setLoading(false);
    };

    void validate();

    return () => {
      isMounted = false;
      window.removeEventListener("student:unauthorized", handleUnauthorized);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ sessionUser, profile, loading, refreshProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
