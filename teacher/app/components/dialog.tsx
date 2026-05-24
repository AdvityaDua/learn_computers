"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: number;
}

export function Dialog({ open, onClose, title, children, footer, maxWidth = 560 }: DialogProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="t-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="t-dialog" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="t-dialog-header">
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--foreground)", margin: 0 }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--muted)", padding: 4, borderRadius: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.color = "var(--foreground)"; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.color = "var(--muted)"; }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="t-dialog-body">
          {children}
        </div>

        {footer && (
          <div className="t-dialog-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
