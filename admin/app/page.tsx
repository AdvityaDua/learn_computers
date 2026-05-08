"use client";

import React from "react";
import { ThemeProvider } from "./theme-context";
import { AdminShell } from "./shell";

export default function AdminPage() {
  return (
    <ThemeProvider>
      <AdminShell />
    </ThemeProvider>
  );
}
