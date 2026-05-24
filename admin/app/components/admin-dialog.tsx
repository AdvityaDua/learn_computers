"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

type DialogOptions = {
  type: "error" | "success" | "info";
  title: string;
  message: string;
};

let showDialogFn: (opts: DialogOptions) => void = () => {};

export function showAdminDialog(opts: DialogOptions) {
  showDialogFn(opts);
}

export function AdminDialogProvider() {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);

  useEffect(() => {
    showDialogFn = setDialog;
  }, []);

  if (!dialog) return null;

  const isErr = dialog.type === "error";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.25rem" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }} onClick={() => setDialog(null)} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 380, background: "var(--surface)", border: `1px solid var(--border)`, borderRadius: "0.875rem", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
        <div style={{ padding: "1.5rem", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: isErr ? "#FEF2F2" : dialog.type === "success" ? "#ECFDF5" : "var(--admin-accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
            {isErr ? <AlertCircle size={24} color="#EF4444" /> : <CheckCircle size={24} color={dialog.type === "success" ? "#10B981" : "var(--admin-accent)"} />}
          </div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "var(--foreground)" }}>{dialog.title}</h3>
          <p style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", color: "var(--muted)", lineHeight: 1.5 }}>{dialog.message}</p>
        </div>
        <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 1.25rem", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => setDialog(null)} style={{ background: isErr ? "#EF4444" : dialog.type === "success" ? "#10B981" : "var(--admin-accent)", color: "#fff", border: "none", borderRadius: "0.5rem", padding: "0.5rem 1.25rem", fontWeight: 700, fontSize: "0.8125rem", cursor: "pointer" }}>OK</button>
        </div>
      </div>
    </div>
  );
}
