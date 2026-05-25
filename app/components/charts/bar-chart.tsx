"use client";

import React, { useRef, useEffect } from "react";
import { COLORS } from "../../lib/constants";

interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  title?: string;
}

export function BarChart({ data, height = 200, color = COLORS.accent, title }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padTop = 20;
    const padBottom = 40;
    const padLeft = 40;
    const padRight = 20;

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const chartW = w - padLeft - padRight;
    const chartH = h - padTop - padBottom;
    const barW = Math.min(40, chartW / data.length * 0.6);
    const gap = (chartW - barW * data.length) / (data.length + 1);

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Grid lines
    const gridLines = 4;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--border").trim() || "#E2E8F0";
    ctx.lineWidth = 0.5;
    const textColor = getComputedStyle(document.documentElement).getPropertyValue("--muted").trim() || "#64748B";

    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + chartH - (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(w - padRight, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = textColor;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(Math.round((maxVal / gridLines) * i).toString(), padLeft - 6, y + 3);
    }

    // Bars
    data.forEach((d, i) => {
      const x = padLeft + gap + i * (barW + gap);
      const barH = (d.value / maxVal) * chartH;
      const y = padTop + chartH - barH;

      ctx.fillStyle = color;
      ctx.beginPath();
      const radius = 4;
      ctx.roundRect(x, y, barW, barH, [radius, radius, 0, 0]);
      ctx.fill();

      // Value on top
      ctx.fillStyle = color;
      ctx.font = "bold 10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(d.value.toString(), x + barW / 2, y - 4);

      // X-axis labels
      ctx.fillStyle = textColor;
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "center";
      const labelText = d.label.length > 8 ? d.label.substring(0, 7) + "…" : d.label;
      ctx.fillText(labelText, x + barW / 2, h - padBottom + 16);
    });
  }, [data, height, color]);

  return (
    <div>
      {title && (
        <div style={{
          fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", color: "var(--muted)", marginBottom: "0.75rem",
        }}>
          {title}
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height }}
      />
    </div>
  );
}
