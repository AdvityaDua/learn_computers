import React from "react";

const PALETTE = ["#4f5bd5", "#ff8a3d", "#1ea672", "#e0525f", "#2f9bd6", "#a855f7"];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({
  name,
  src,
  size = 40,
  className = "",
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      // Uploaded/remote avatar URLs come from an arbitrary backend host, so next/image's fixed domain allowlist isn't worth the setup here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white font-[family-name:var(--font-display)] ${className}`}
      style={{ width: size, height: size, background: colorFor(name || "?"), fontSize: size * 0.4 }}
    >
      {initials(name)}
    </div>
  );
}
