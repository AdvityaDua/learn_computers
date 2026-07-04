import React from "react";
import { AuthProvider } from "../context/auth-context";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
