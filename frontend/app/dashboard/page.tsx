"use client";

import React from "react";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { CurriculumProvider } from "../context/curriculum-context";
import { DashboardShell } from "./dashboard-shell";

export default function DashboardPage() {
  const { loading, profile } = useAuth();

  if (loading || !profile) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-bg">
        <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-lift)]">
          <GraduationCap size={30} className="text-white" />
        </div>
        <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-muted">Getting your dashboard ready…</p>
      </div>
    );
  }

  return (
    <CurriculumProvider>
      <DashboardShell />
    </CurriculumProvider>
  );
}
