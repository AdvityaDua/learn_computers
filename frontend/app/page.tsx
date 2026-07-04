"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getToken } from "./lib/api";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getToken() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-4 bg-bg">
      <div className="flex h-16 w-16 animate-pulse items-center justify-center rounded-2xl bg-primary shadow-[var(--shadow-lift)]">
        <GraduationCap size={30} className="text-white" />
      </div>
      <p className="font-[family-name:var(--font-display)] text-sm font-semibold text-muted">Loading your space…</p>
    </div>
  );
}
