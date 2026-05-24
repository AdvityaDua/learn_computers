"use client";

import React, { useRef, useEffect } from "react";
import { COLORS } from "../../lib/constants";

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({ data, size = 160, strokeWidth = 24, centerLabel, centerValue }: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const radius = (size - strokeWidth) / 2;
    const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

    ctx.clearRect(0, 0, size, size);

    // Background ring
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--border").trim() || "#E2E8F0";
    ctx.lineWidth = strokeWidth;
    ctx.stroke();

    // Data arcs
    let startAngle = -Math.PI / 2;
    data.forEach((d) => {
      const sweep = (d.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, startAngle, startAngle + sweep);
      ctx.strokeStyle = d.color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.stroke();
      startAngle += sweep;
    });

    // Center text
    if (centerValue) {
      const textColor = getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() || "#0F172A";
      const mutedColor = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#64748B";

      ctx.fillStyle = textColor;
      ctx.font = `bold ${size * 0.16}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(centerValue, cx, centerLabel ? cy - 6 : cy);

      if (centerLabel) {
        ctx.fillStyle = mutedColor;
        ctx.font = `${size * 0.07}px system-ui, sans-serif`;
        ctx.fillText(centerLabel, cx, cy + 14);
      }
    }
  }, [data, size, strokeWidth, centerLabel, centerValue]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      {data.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", justifyContent: "center" }}>
          {data.map((d, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: d.color }} />
              <span style={{ color: "var(--muted)" }}>{d.label}</span>
              <span style={{ fontWeight: 700, color: "var(--foreground)" }}>{d.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
