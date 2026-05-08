"use client";

import { useMemo, useState } from "react";
import { Button } from "../common/button";

type PortalKey = "daily" | "exam" | "revision";

const tabs: Array<{ key: PortalKey; label: string; title: string; subtitle: string; items: string[] }> = [
  {
    key: "daily",
    label: "Daily Learning",
    title: "Daily Learning View",
    subtitle: "Stay consistent with bite-sized lessons and short practice sessions.",
    items: ["Today's lesson queue", "Quick concept checks", "Progress streak tracker"],
  },
  {
    key: "exam",
    label: "Exam Prep",
    title: "Exam Prep View",
    subtitle: "Focus on high-weight topics and timed practice before your exam.",
    items: ["Topic priority list", "Timed mock quizzes", "Accuracy and speed insights"],
  },
  {
    key: "revision",
    label: "Revision",
    title: "Revision View",
    subtitle: "Revise weak areas with a smart checklist tailored to your mistakes.",
    items: ["Weak-topic revision stack", "Past mistakes replay", "Confidence score by chapter"],
  },
];

export function PortalPreviewTabs() {
  const [active, setActive] = useState<PortalKey>("daily");
  const current = useMemo(() => tabs.find((tab) => tab.key === active) ?? tabs[0], [active]);

  return (
    <section className="theme-surface theme-border rounded-3xl border p-6 shadow-sm md:p-8">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Button
              key={tab.key}
              onClick={() => setActive(tab.key)}
              variant={isActive ? "primary" : "outline"}
              size="md"
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="accent-text text-sm font-bold uppercase tracking-[0.14em]">Preview</p>
          <h3 className="theme-text mt-2 text-2xl font-black">{current.title}</h3>
          <p className="theme-muted mt-2">{current.subtitle}</p>
          <ul className="mt-4 space-y-2">
            {current.items.map((item) => (
              <li key={item} className="theme-muted flex items-start gap-2 text-sm">
                <span className="accent-bg mt-1 h-2 w-2 rounded-full" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="theme-surface-soft theme-border rounded-2xl border p-4">
          <div className="theme-surface theme-border rounded-xl border p-4">
            <div className="theme-border mb-4 h-3 w-28 rounded-full border" />
            <div className="grid grid-cols-3 gap-3">
              <div className="theme-surface theme-border h-20 rounded-lg border" />
              <div className="theme-surface theme-border h-20 rounded-lg border" />
              <div className="theme-surface theme-border h-20 rounded-lg border" />
            </div>
            <div className="theme-surface theme-border mt-4 h-24 rounded-lg border" />
          </div>
        </div>
      </div>
    </section>
  );
}
