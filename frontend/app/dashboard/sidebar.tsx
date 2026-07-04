"use client";

import React from "react";
import { GraduationCap, Home, LogOut, Notebook, Trophy, User, CalendarClock } from "lucide-react";
import { Avatar } from "../components/ui/avatar";
import { useAuth } from "../context/auth-context";
import { resolveAssetUrl } from "../lib/asset-url";
import type { DashboardView, NavKey } from "./view";

const NAV_ITEMS: { key: NavKey; label: string; icon: typeof Home; view: DashboardView }[] = [
  { key: "home", label: "Home", icon: Home, view: { name: "home" } },
  { key: "subjects", label: "My Subjects", icon: Notebook, view: { name: "subjects" } },
  { key: "leaderboard", label: "Leaderboard", icon: Trophy, view: { name: "leaderboard" } },
  { key: "deadlines", label: "Due Soon", icon: CalendarClock, view: { name: "deadlines" } },
  { key: "profile", label: "My Profile", icon: User, view: { name: "profile" } },
];

export function Sidebar({
  active,
  onNavigate,
  onClose,
}: {
  active: NavKey;
  onNavigate: (view: DashboardView) => void;
  onClose?: () => void;
}) {
  const { profile, sessionUser, logout } = useAuth();
  const name = profile?.fullName ?? sessionUser?.fullName ?? "Student";

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-surface px-4 py-5">
      <div className="mb-6 flex items-center gap-2.5 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-[var(--shadow-card)]">
          <GraduationCap size={20} />
        </div>
        <div>
          <p className="font-[family-name:var(--font-display)] text-base font-extrabold leading-tight">
            Learn Computers
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => {
                onNavigate(item.view);
                onClose?.();
              }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-semibold transition-colors ${
                isActive ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-soft hover:text-foreground"
              }`}
            >
              <Icon size={19} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-surface-soft p-3">
        <Avatar name={name} src={resolveAssetUrl(profile?.profileImage)} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="text-xs text-muted">{profile?.points ?? 0} pts</p>
        </div>
        <button
          onClick={logout}
          aria-label="Log out"
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
