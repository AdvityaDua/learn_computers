/** ─── Design Tokens ─────────────────────────────────────────────────── */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const COLORS = {
  /** Primary orange accent */
  accent: "#EA580C",
  accentHover: "#C2410C",
  accentSoft: "#FFF7ED",
  accentSoftBorder: "#FDBA74",
  accentRing: "rgba(234, 88, 12, 0.15)",
  accentText: "#9A3412",
  onAccent: "#FFFFFF",

  /** Status */
  success: "#10B981",
  successSoft: "#ECFDF5",
  warning: "#F59E0B",
  warningSoft: "#FFFBEB",
  danger: "#EF4444",
  dangerSoft: "#FEF2F2",
  info: "#3B82F6",
  infoSoft: "#EFF6FF",

  /** Surfaces (light) */
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceSoft: "#F1F5F9",
  border: "#E2E8F0",
  foreground: "#0F172A",
  muted: "#64748B",

  /** Dark mode surfaces */
  darkBg: "#090E1A",
  darkSurface: "#111827",
  darkSurfaceSoft: "#1F2937",
  darkBorder: "#374151",
  darkForeground: "#F1F5F9",
  darkMuted: "#94A3B8",

  /** Chart palette */
  chart1: "#EA580C",
  chart2: "#3B82F6",
  chart3: "#10B981",
  chart4: "#8B5CF6",
  chart5: "#F59E0B",

  /** Medal colors */
  gold: "#F59E0B",
  silver: "#94A3B8",
  bronze: "#D97706",
} as const;

export const SIDEBAR_WIDTH = 240;
