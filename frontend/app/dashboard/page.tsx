"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, ClipboardList, GraduationCap, HelpCircle, Layers,
  LayoutDashboard, LogOut, Menu, Moon, PlayCircle, Sun, Trophy, UserCircle, X,
} from "lucide-react";
import { useTheme } from "../components/common/theme-context";
import OverviewSection from "./components/OverviewSection";
import CurriculumSection from "./components/CurriculumSection";
import VideosSection from "./components/VideosSection";
import QuizzesSection from "./components/QuizzesSection";
import AssignmentsSection from "./components/AssignmentsSection";
import ActivitiesSection from "./components/ActivitiesSection";
import LeaderboardSection from "./components/LeaderboardSection";
import ProfileSection from "./components/ProfileSection";
import type { SectionId, UserData, Chapter, VideoLesson, Quiz, Assignment, ActivityItem, LeaderboardUser, LessonProgressSummary } from "./components/types";
import { API_BASE, toItems } from "./components/types";

const NAV_ITEMS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "Overview", label: "Overview", icon: <LayoutDashboard size={16} /> },
  { id: "Curriculum", label: "Curriculum", icon: <Layers size={16} /> },
  { id: "Videos", label: "Videos", icon: <PlayCircle size={16} /> },
  { id: "Quizzes", label: "Quizzes", icon: <HelpCircle size={16} /> },
  { id: "Assignments", label: "Assignments", icon: <ClipboardList size={16} /> },
  { id: "Activities", label: "Activities", icon: <Activity size={16} /> },
  { id: "Leaderboard", label: "Leaderboard", icon: <Trophy size={16} /> },
  { id: "Profile", label: "Profile", icon: <UserCircle size={16} /> },
];

function Sidebar({
  active, onSelect, user, mounted, theme, onToggleTheme, onLogout,
}: {
  active: SectionId;
  onSelect: (s: SectionId) => void;
  user: UserData | null;
  mounted: boolean;
  theme: string;
  onToggleTheme: () => void;
  onLogout: () => void;
}) {
  const initials = useMemo(() => {
    const full = user?.fullName?.trim();
    if (!full) return "ST";
    const parts = full.split(/\s+/);
    if (parts.length >= 2)
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return full.slice(0, 2).toUpperCase();
  }, [user?.fullName]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="flex items-center gap-3 border-b theme-border px-4 py-4">
        <div className="accent-bg grid h-10 w-10 place-items-center rounded-xl">
          <GraduationCap size={18} />
        </div>
        <div>
          <p className="text-sm font-black tracking-tight">Student Panel</p>
          <p className="theme-muted text-xs">Learn Computers</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={[
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition",
                isActive
                  ? "accent-soft-bg accent-text"
                  : "theme-muted hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="space-y-1 border-t theme-border px-3 py-3">
        <button
          type="button"
          onClick={onToggleTheme}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold theme-muted transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
        >
          {mounted && theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          {mounted ? (theme === "dark" ? "Light Mode" : "Dark Mode") : "Theme"}
        </button>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-semibold theme-muted transition hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)]"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
      <div className="border-t theme-border px-4 py-4">
        <div className="flex items-center gap-3">
          {user?.profileImage ? (
            <img
              src={user.profileImage.startsWith("http") ? user.profileImage : `${API_BASE}${user.profileImage}`}
              alt={user.fullName}
              className="h-9 w-9 rounded-full object-cover border theme-border"
            />
          ) : (
            <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--surface-soft)] text-xs font-black">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{user?.fullName || "Student"}</p>
            <p className="theme-muted truncate text-xs">{user?.email || ""}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { theme, mounted, toggleTheme } = useTheme();
  const router = useRouter();

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<SectionId>("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dataError, setDataError] = useState("");

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [leaderboardUsers, setLeaderboardUsers] = useState<LeaderboardUser[]>([]);
  const [lessonProgress, setLessonProgress] = useState<LessonProgressSummary>({
    totalLessons: 0,
    completedLessons: 0,
    pendingLessons: 0,
    completionPercentage: 0,
    completedLessonIds: [],
  });

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    router.push("/");
  };

  const handleUserUpdate = (updated: UserData) => {
    setUser(updated);
    localStorage.setItem("authUser", JSON.stringify(updated));
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) { router.push("/login"); return; }

    const load = async () => {
      try {
        const userRaw = localStorage.getItem("authUser");
        if (userRaw) {
          try { setUser(JSON.parse(userRaw) as UserData); }
          catch { localStorage.removeItem("authUser"); }
        }

        const profileRes = await fetch(`${API_BASE}/users/profile_data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) handleUserUpdate((await profileRes.json()) as UserData);

        const headers = { Authorization: `Bearer ${token}` };
        const [chapRes, vidRes, quizRes, asgRes, actRes, boardRes, progressRes, deadRes] = await Promise.all([
          fetch(`${API_BASE}/chapters`, { headers }),
          fetch(`${API_BASE}/lessons?page=1&limit=60&type=video`, { headers }),
          fetch(`${API_BASE}/quizzes?page=1&limit=60`, { headers }),
          fetch(`${API_BASE}/assignments?page=1&limit=60`, { headers }),
          fetch(`${API_BASE}/activities?page=1&limit=60`, { headers }),
          fetch(`${API_BASE}/users/leaderboard`, { headers }),
          fetch(`${API_BASE}/progress/lessons`, { headers }),
          fetch(`${API_BASE}/progress/student/deadlines`, { headers }),
        ]);

        const [chapData, vidData, quizData, asgData, actData, boardData, progressData, deadData] = await Promise.all([
          chapRes.ok ? chapRes.json() : [],
          vidRes.ok ? vidRes.json() : [],
          quizRes.ok ? quizRes.json() : [],
          asgRes.ok ? asgRes.json() : [],
          actRes.ok ? actRes.json() : [],
          boardRes.ok ? boardRes.json() : [],
          progressRes.ok
            ? progressRes.json()
            : { totalLessons: 0, completedLessons: 0, pendingLessons: 0, completionPercentage: 0, completedLessonIds: [] },
          deadRes.ok ? deadRes.json() : [],
        ]);

        const deadlines = Array.isArray(deadData) ? deadData : [];
        const assignmentMap = new Map();
        const activityMap = new Map();
        deadlines.forEach((d: any) => {
          if (d.taskType === 'assignment') assignmentMap.set(d.taskId, d.dueDate);
          if (d.taskType === 'activity') activityMap.set(d.taskId, d.dueDate);
        });

        const parsedAssignments = toItems<Assignment>(asgData).map(a => ({
          ...a,
          dueDate: assignmentMap.get(String(a._id)) ?? a.dueDate,
        }));
        
        const parsedActivities = toItems<ActivityItem>(actData).map(a => ({
          ...a,
          dueDate: activityMap.get(String(a._id)) ?? a.dueDate,
        }));

        setChapters(Array.isArray(chapData) ? chapData : []);
        setVideos(toItems<VideoLesson>(vidData));
        setQuizzes(toItems<Quiz>(quizData));
        setAssignments(parsedAssignments);
        setActivities(parsedActivities);
        setLeaderboardUsers(Array.isArray(boardData) ? boardData : []);
        setLessonProgress(progressData as LessonProgressSummary);
      } catch {
        setDataError("Could not load dashboard data. Please refresh.");
      } finally {
        setLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contentMap = useMemo(() => {
    const map = new Map<string, { chapterId: string; chapterTitle: string; lessonId: string; lessonTitle: string }>();
    for (const chapter of chapters) {
      for (const lesson of chapter.lessons || []) {
        for (const item of lesson.items || []) {
          map.set(String(item.refId), {
            chapterId: String(chapter._id),
            chapterTitle: chapter.title,
            lessonId: String(lesson._id),
            lessonTitle: lesson.title,
          });
        }
      }
    }
    return map;
  }, [chapters]);

  const completedLessonSet = useMemo(
    () => new Set(lessonProgress.completedLessonIds),
    [lessonProgress.completedLessonIds]
  );

  const leaderboard = useMemo(() => leaderboardUsers.slice(0, 10), [leaderboardUsers]);

  const stats = useMemo(() => {
    const lessonItems = chapters.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
    const mixedItems = chapters.reduce(
      (sum, c) => sum + (c.lessons || []).reduce((ls, l) => ls + (l.items?.length || 0), 0), 0
    );
    const duePool = [...assignments, ...activities].filter((i) => !!i.dueDate);
    const overdue = duePool.filter((d) => new Date(d.dueDate || "").getTime() < Date.now()).length;
    const dueSoon = duePool.filter((d) => {
      const t = new Date(d.dueDate || "").getTime() - Date.now();
      return t >= 0 && t <= 3 * 86400000;
    }).length;
    const avgQuestions = quizzes.length
      ? Math.round((quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0) / quizzes.length) * 10) / 10
      : 0;
    return {
      lessonItems, mixedItems, overdue, dueSoon, avgQuestions,
      totalContent: videos.length + quizzes.length + assignments.length + activities.length,
    };
  }, [chapters, videos, quizzes, assignments, activities]);

  const contentMix = useMemo(() => [
    { name: "Videos", value: videos.length, color: "#0ea5e9" },
    { name: "Quizzes", value: quizzes.length, color: "#f59e0b" },
    { name: "Assignments", value: assignments.length, color: "#10b981" },
    { name: "Activities", value: activities.length, color: "#8b5cf6" },
  ], [videos.length, quizzes.length, assignments.length, activities.length]);

  const weeklyTrend = useMemo(() => {
    const base = new Date();
    const rows: { label: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i * 7);
      const weekStart = new Date(d);
      const weekEnd = new Date(d);
      weekEnd.setDate(weekStart.getDate() + 6);
      const count = [...videos, ...quizzes, ...assignments, ...activities].filter((x) => {
        const t = new Date((x as { createdAt?: string }).createdAt || 0).getTime();
        return t >= weekStart.getTime() && t <= weekEnd.getTime();
      }).length;
      rows.push({ label: weekStart.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), count });
    }
    return rows;
  }, [videos, quizzes, assignments, activities]);

  const dueBuckets = useMemo(() => {
    const pool = [...assignments, ...activities];
    const overdue = pool.filter((x) => x.dueDate && new Date(x.dueDate).getTime() < Date.now()).length;
    const dueSoon = pool.filter((x) => {
      if (!x.dueDate) return false;
      const diff = new Date(x.dueDate).getTime() - Date.now();
      return diff >= 0 && diff <= 3 * 86400000;
    }).length;
    const upcoming = pool.filter((x) => {
      if (!x.dueDate) return false;
      return new Date(x.dueDate).getTime() - Date.now() > 3 * 86400000;
    }).length;
    return [
      { name: "Overdue", value: overdue },
      { name: "Due Soon", value: dueSoon },
      { name: "Upcoming", value: upcoming },
    ];
  }, [assignments, activities]);

  const firstName = user?.fullName?.split(" ")[0] || "Student";

  if (loading) {
    return (
      <div className="theme-page fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[var(--background)]">
        <div className="relative flex flex-col items-center">
          <div className="absolute -inset-10 animate-pulse bg-[var(--accent)]/5 blur-3xl" />
          <div className="relative mb-6">
            <div className="accent-bg flex h-20 w-20 animate-bounce items-center justify-center rounded-[2.5rem] shadow-2xl shadow-[var(--accent)]/30 duration-[2000ms]">
              <GraduationCap size={40} className="text-white" />
            </div>
            <div className="absolute -inset-3 animate-spin rounded-full border-t-2 border-[var(--accent)]/40 duration-700" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black tracking-tighter">Learn Computers</h2>
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="h-1 w-1 animate-bounce rounded-full bg-[var(--accent)]" />
              <div className="h-1 w-1 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:0.2s]" />
              <div className="h-1 w-1 animate-bounce rounded-full bg-[var(--accent)] [animation-delay:0.4s]" />
              <p className="theme-muted text-xs font-bold uppercase tracking-widest ml-1">Synchronizing Dashboard</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    switch (active) {
      case "Overview":
        return (
          <OverviewSection
            firstName={firstName}
            stats={stats}
            weeklyTrend={weeklyTrend}
            contentMix={contentMix}
            dueBuckets={dueBuckets}
            leaderboard={leaderboard}
          />
        );
      case "Curriculum":
        return (
          <CurriculumSection
            chapters={chapters}
            lessonProgress={lessonProgress}
            completedLessonSet={completedLessonSet}
          />
        );
      case "Videos":
        return <VideosSection videos={videos} chapters={chapters} contentMap={contentMap} />;
      case "Quizzes":
        return <QuizzesSection quizzes={quizzes} chapters={chapters} contentMap={contentMap} />;
      case "Assignments":
        return <AssignmentsSection assignments={assignments} chapters={chapters} contentMap={contentMap} />;
      case "Activities":
        return <ActivitiesSection activities={activities} chapters={chapters} contentMap={contentMap} />;
      case "Leaderboard":
        return <LeaderboardSection leaderboard={leaderboard} />;
      case "Profile":
        return <ProfileSection user={user} onUpdate={handleUserUpdate} />;
      default:
        return null;
    }
  };

  const sidebarProps = {
    active,
    onSelect: (s: SectionId) => { setActive(s); setSidebarOpen(false); },
    user, mounted, theme,
    onToggleTheme: toggleTheme,
    onLogout: handleLogout,
  };

  return (
    <div className="theme-page flex min-h-screen">
      <aside className="hidden w-[272px] shrink-0 border-r theme-border bg-[var(--surface)] lg:block">
        <div className="sticky top-0 h-screen">
          <Sidebar {...sidebarProps} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b theme-border bg-[var(--surface)] px-4 md:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border theme-border lg:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <p className="flex-1 truncate text-sm font-semibold">Welcome back, {firstName}</p>
          <span className="theme-muted hidden text-xs font-semibold sm:inline">{active}</span>
        </header>

        {dataError && (
          <div className="mx-5 mt-4 rounded-xl border border-red-400 bg-red-50 px-3 py-2 text-sm font-semibold text-red-500 dark:bg-red-950/20">
            {dataError}
          </div>
        )}

        {renderSection()}
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          />
          <div className="relative flex h-full w-[272px] flex-col border-r theme-border bg-[var(--surface)] shadow-2xl">
            <div className="flex items-center justify-between border-b theme-border px-4 py-3">
              <p className="text-sm font-black">Navigation</p>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border theme-border"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>
            <Sidebar {...sidebarProps} />
          </div>
        </div>
      )}
    </div>
  );
}
