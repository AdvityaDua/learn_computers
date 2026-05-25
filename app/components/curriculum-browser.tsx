"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  BookOpen, ChevronDown, ChevronRight, Search, Filter,
  Video, Brain, ClipboardList, Puzzle, Layers, FileText,
  CheckSquare, Info,
} from "lucide-react";
import { apiFetch, API_BASE_URL } from "../lib/api";
import { COLORS } from "../lib/constants";
import ReactMarkdown from "react-markdown";

type ContentItem = { type: string; refId: string; order: number; title?: string; submissionRequired?: boolean };
type Lesson = { _id: string; title: string; order: number; itemCount: number; items: ContentItem[] };
type Chapter = { _id: string; title: string; order: number; coverImageFilePath: string | null; lessonCount: number; lessons: Lesson[] };

/* ── Content type configuration ───────────────────────────────── */
const CONTENT_CONFIG: Record<string, {
  Icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  description: string;
}> = {
  video: {
    Icon: Video,
    label: "Video Lesson",
    color: COLORS.info,
    bg: `${COLORS.info}15`,
    description: "Watch a recorded lesson to learn the concept.",
  },
  quiz: {
    Icon: Brain,
    label: "Quiz",
    color: COLORS.warning,
    bg: `${COLORS.warning}15`,
    description: "Answer questions to test your understanding. Points awarded based on score.",
  },
  assignment: {
    Icon: ClipboardList,
    label: "Assignment",
    color: COLORS.accent,
    bg: `${COLORS.accent}15`,
    description: "A written or practical task to be completed.",
  },
  activity: {
    Icon: Puzzle,
    label: "Activity",
    color: COLORS.success,
    bg: `${COLORS.success}15`,
    description: "An interactive exercise or hands-on task.",
  },
};

const DEFAULT_CONFIG = {
  Icon: Layers,
  label: "Content",
  color: COLORS.muted,
  bg: "var(--surface-soft)",
  description: "Additional learning material.",
};

/* ── Markdown Custom Styles ────────────────────────────────────────── */
const markdownComponents = {
  h1: ({ node, ...props }: any) => <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "1.5rem", marginBottom: "0.75rem", color: "var(--foreground)" }} {...props} />,
  h2: ({ node, ...props }: any) => <h2 style={{ fontSize: "1.25rem", fontWeight: 700, marginTop: "1.25rem", marginBottom: "0.75rem", color: "var(--foreground)", borderBottom: "1px solid var(--border)", paddingBottom: "0.25rem" }} {...props} />,
  h3: ({ node, ...props }: any) => <h3 style={{ fontSize: "1.125rem", fontWeight: 700, marginTop: "1rem", marginBottom: "0.5rem", color: "var(--foreground)" }} {...props} />,
  p: ({ node, ...props }: any) => <p style={{ marginTop: "0", marginBottom: "1rem", lineHeight: 1.6, color: "var(--muted)" }} {...props} />,
  ul: ({ node, ...props }: any) => <ul style={{ marginTop: "0", marginBottom: "1rem", paddingLeft: "1.5rem", listStyleType: "disc", color: "var(--muted)" }} {...props} />,
  ol: ({ node, ...props }: any) => <ol style={{ marginTop: "0", marginBottom: "1rem", paddingLeft: "1.5rem", listStyleType: "decimal", color: "var(--muted)" }} {...props} />,
  li: ({ node, ...props }: any) => <li style={{ marginBottom: "0.375rem" }} {...props} />,
  a: ({ node, ...props }: any) => <a style={{ color: "var(--admin-accent)", textDecoration: "none", fontWeight: 600 }} {...props} />,
  strong: ({ node, ...props }: any) => <strong style={{ fontWeight: 700, color: "var(--foreground)" }} {...props} />,
  blockquote: ({ node, ...props }: any) => <blockquote style={{ borderLeft: "4px solid var(--admin-accent)", margin: "0 0 1rem 0", padding: "0.5rem 0 0.5rem 1rem", backgroundColor: "var(--surface-soft)", fontStyle: "italic", color: "var(--muted)", borderRadius: "0 0.25rem 0.25rem 0" }} {...props} />,
  pre: ({ node, ...props }: any) => <pre style={{ backgroundColor: "var(--surface-soft)", padding: "1rem", borderRadius: "0.5rem", overflowX: "auto", marginBottom: "1rem", border: "1px solid var(--border)" }} {...props} />,
  code: ({ node, className, ...props }: any) => {
    const isBlock = String(props.children).includes('\n') || /language-(\w+)/.exec(className || '');
    return isBlock
      ? <code style={{ fontFamily: "monospace", fontSize: "0.85em", color: "var(--foreground)" }} className={className} {...props} />
      : <code style={{ backgroundColor: "var(--surface-soft)", padding: "0.15rem 0.3rem", borderRadius: "0.25rem", fontFamily: "monospace", fontSize: "0.85em", color: "var(--admin-accent)", border: "1px solid var(--border)" }} className={className} {...props} />;
  },
  hr: ({ node, ...props }: any) => <hr style={{ border: "0", borderTop: "1px solid var(--border)", margin: "1.5rem 0" }} {...props} />,
};

/* ── Content Item Row ─────────────────────────────────────────── */
function ContentRow({ item, index, onPreview }: { item: ContentItem; index: number; onPreview: () => void }) {
  const cfg = CONTENT_CONFIG[item.type] || DEFAULT_CONFIG;
  const { Icon } = cfg;
  const submissionRequired = item.submissionRequired === true;

  return (
    <div 
      onClick={onPreview}
      style={{
        display: "flex", alignItems: "flex-start", gap: "0.875rem",
        padding: "0.75rem 1rem", borderRadius: "0.5rem",
        background: "var(--surface)", border: "1px solid var(--border)",
        marginBottom: "0.375rem", cursor: "pointer", transition: "all 0.15s ease",
      }}
      onMouseOver={e => e.currentTarget.style.borderColor = "var(--admin-accent)"}
      onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}
    >
      {/* Type icon */}
      <div style={{
        width: 34, height: 34, borderRadius: 8,
        background: cfg.bg, display: "flex", alignItems: "center",
        justifyContent: "center", flexShrink: 0, marginTop: 1,
      }}>
        <Icon size={16} color={cfg.color} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Type badge */}
          <span style={{
            fontSize: "0.5625rem", fontWeight: 800, textTransform: "uppercase",
            letterSpacing: "0.07em", color: cfg.color, background: cfg.bg,
            padding: "0.15rem 0.45rem", borderRadius: "0.25rem",
          }}>
            {cfg.label}
          </span>
          {/* Item index */}
          <span style={{ fontSize: "0.625rem", color: "var(--muted)", fontWeight: 600 }}>
            Item {index + 1}
          </span>
          {/* Submission required badge */}
          {submissionRequired && (
            <span style={{
              fontSize: "0.5625rem", fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.06em", color: COLORS.danger,
              background: COLORS.dangerSoft, padding: "0.15rem 0.45rem",
              borderRadius: "0.25rem", border: `1px solid ${COLORS.danger}30`,
              display: "flex", alignItems: "center", gap: "0.2rem",
            }}>
              <CheckSquare size={9} /> Submission Required
            </span>
          )}
          {!submissionRequired && (item.type === "assignment" || item.type === "activity") && (
            <span style={{
              fontSize: "0.5625rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.06em", color: "var(--muted)",
              background: "var(--surface-soft)", padding: "0.15rem 0.45rem",
              borderRadius: "0.25rem", border: "1px solid var(--border)",
            }}>
              No Submission Required
            </span>
          )}
        </div>

        {/* Title */}
        {item.title ? (
          <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--foreground)", marginTop: 3 }}>
            {item.title}
          </div>
        ) : (
          <div style={{ fontWeight: 500, fontSize: "0.75rem", color: "var(--muted)", marginTop: 3, fontStyle: "italic" }}>
            {cfg.description}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Chapter summary pills ─────────────────────────────────────── */
function ChapterContentSummary({ lessons }: { lessons: Lesson[] }) {
  const counts: Record<string, number> = {};
  for (const l of lessons) {
    for (const item of l.items || []) {
      counts[item.type] = (counts[item.type] || 0) + 1;
    }
  }
  const entries = Object.entries(counts);
  if (entries.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", padding: "0 1.25rem 0.75rem 1.25rem" }}>
      {entries.map(([type, count]) => {
        const cfg = CONTENT_CONFIG[type] || DEFAULT_CONFIG;
        const { Icon } = cfg;
        return (
          <span key={type} style={{
            display: "inline-flex", alignItems: "center", gap: "0.25rem",
            fontSize: "0.625rem", fontWeight: 700, textTransform: "uppercase",
            letterSpacing: "0.04em", color: cfg.color, background: cfg.bg,
            padding: "0.15rem 0.5rem", borderRadius: "0.25rem",
          }}>
            <Icon size={10} /> {count} {cfg.label}{count !== 1 ? "s" : ""}
          </span>
        );
      })}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export function CurriculumBrowser() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState("");
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    apiFetch("/progress/curriculum-tree")
      .then((data: Chapter[]) => {
        setChapters(data || []);
        const ids = new Set((data || []).map((c: Chapter) => c._id));
        setExpandedChapters(ids);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleLesson = (id: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handlePreview = async (item: ContentItem) => {
    setPreviewItem(item);
    setPreviewData(null);
    setLoadingPreview(true);
    try {
      let endpoint = "";
      if (item.type === "video" || item.type === "documentation") endpoint = `/lessons/${item.refId}`;
      else if (item.type === "assignment") endpoint = `/assignments/${item.refId}`;
      else if (item.type === "activity") endpoint = `/activities/${item.refId}`;
      else if (item.type === "quiz") endpoint = `/quizzes/${item.refId}`;
      
      if (endpoint) {
        const data = await apiFetch(endpoint);
        let mdContent = "";
        if (data.descriptionFilePath) {
          const path = data.descriptionFilePath.startsWith('/') ? data.descriptionFilePath : `/${data.descriptionFilePath}`;
          const mdUrl = data.descriptionFilePath.startsWith('http') ? data.descriptionFilePath : `${API_BASE_URL}${path}`;
          try {
            const res = await fetch(mdUrl);
            if (res.ok) mdContent = await res.text();
          } catch (e) {
            console.error("Failed to fetch markdown content:", e);
          }
        }
        setPreviewData({ ...data, mdContent });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPreview(false);
    }
  };

  const filteredChapters = useMemo(() => {
    let list = chapters;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.map(ch => ({
        ...ch,
        lessons: ch.lessons.filter(l => l.title.toLowerCase().includes(q) || ch.title.toLowerCase().includes(q)),
      })).filter(ch => ch.lessons.length > 0 || ch.title.toLowerCase().includes(q));
    }
    if (filterType) {
      list = list.map(ch => ({
        ...ch,
        lessons: ch.lessons.map(l => ({
          ...l,
          items: l.items.filter(i => i.type === filterType),
        })).filter(l => l.items.length > 0),
      })).filter(ch => ch.lessons.length > 0);
    }
    return list;
  }, [chapters, search, filterType]);

  const totalContent = chapters.reduce((s, ch) => s + ch.lessons.reduce((ls, l) => ls + l.items.length, 0), 0);
  const totalLessons = chapters.reduce((s, ch) => s + ch.lessons.length, 0);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem" }}>
        <div style={{ width: 32, height: 32, border: `3px solid var(--border)`, borderTopColor: COLORS.accent, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ animation: "slideUp 0.3s ease-out" }}>
      {/* Preview Modal */}
      {previewItem && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
             onClick={(e) => { if (e.target === e.currentTarget) setPreviewItem(null); }}>
          <div style={{ width: 600, maxWidth: "90vw", maxHeight: "90vh", background: "var(--surface)", borderRadius: "1rem", display: "flex", flexDirection: "column", overflow: "hidden", animation: "slideUp 0.3s ease-out" }}>
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--surface-soft)" }}>
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--admin-accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.25rem" }}>
                  {previewItem.type} Preview
                </div>
                <div style={{ fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)" }}>
                  {previewItem.title || "Content Preview"}
                </div>
              </div>
              <button onClick={() => setPreviewItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: "0.5rem" }}>✕</button>
            </div>
            
            <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
              {loadingPreview ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "var(--muted)" }}>Loading preview...</div>
              ) : previewData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {previewData.mdContent ? (
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>DESCRIPTION</div>
                      <div className="prose" style={{ fontSize: "0.9375rem", color: "var(--foreground)", lineHeight: 1.6 }}>
                        <ReactMarkdown components={markdownComponents}>{previewData.mdContent}</ReactMarkdown>
                      </div>
                    </div>
                  ) : previewData.description ? (
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>DESCRIPTION</div>
                      <div style={{ fontSize: "0.9375rem", color: "var(--foreground)", lineHeight: 1.6 }}>{previewData.description}</div>
                    </div>
                  ) : null}
                  {previewData.points != null && (
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>POINTS AWARDED</div>
                      <div style={{ fontSize: "1rem", fontWeight: 800, color: "var(--admin-accent)" }}>{previewData.points} pts</div>
                    </div>
                  )}
                  {previewData.questions && previewData.questions.length > 0 && (
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>QUIZ QUESTIONS ({previewData.questions.length})</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {previewData.questions.map((q: any, i: number) => (
                          <div key={i} style={{ padding: "1rem", background: "var(--surface-soft)", borderRadius: "0.5rem", border: "1px solid var(--border)" }}>
                            <div style={{ fontWeight: 600, fontSize: "0.9375rem", marginBottom: "0.75rem", color: "var(--foreground)" }}>{i + 1}. {q.question}</div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                              {q.options?.map((opt: string, j: number) => (
                                <div key={j} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", color: j === q.correctAnswerIndex ? "var(--admin-success)" : "var(--muted)", fontWeight: j === q.correctAnswerIndex ? 700 : 400 }}>
                                  <div style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${j === q.correctAnswerIndex ? "var(--admin-success)" : "var(--border)"}`, background: j === q.correctAnswerIndex ? "var(--admin-success)" : "transparent" }} />
                                  {opt}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {previewData.videoFilePath && (
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>VIDEO CONTENT</div>
                      <video src={previewData.videoFilePath.startsWith('http') ? previewData.videoFilePath : `${API_BASE_URL}${previewData.videoFilePath.startsWith('/') ? '' : '/'}${previewData.videoFilePath}`} controls style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid var(--border)" }} />
                    </div>
                  )}
                  {previewData.externalVideoUrl && (
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>EXTERNAL VIDEO URL</div>
                      {previewData.externalVideoUrl.includes("youtube.com") || previewData.externalVideoUrl.includes("youtu.be") ? (
                        <iframe
                          width="100%"
                          height="315"
                          src={previewData.externalVideoUrl.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{ borderRadius: "0.5rem", border: "1px solid var(--border)" }}
                        ></iframe>
                      ) : (
                        <a href={previewData.externalVideoUrl} target="_blank" rel="noreferrer" style={{ color: "var(--admin-accent)", fontSize: "0.9375rem", fontWeight: 600 }}>{previewData.externalVideoUrl}</a>
                      )}
                    </div>
                  )}
                  {previewData.attachmentFilePath && (
                    <div>
                      <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--muted)", marginBottom: "0.5rem" }}>ATTACHMENT</div>
                      <a href={previewData.attachmentFilePath.startsWith('http') ? previewData.attachmentFilePath : `${API_BASE_URL}${previewData.attachmentFilePath.startsWith('/') ? '' : '/'}${previewData.attachmentFilePath}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", background: "var(--surface-soft)", border: "1px solid var(--border)", borderRadius: "0.5rem", color: "var(--foreground)", textDecoration: "none", fontSize: "0.875rem", fontWeight: 600 }}>
                        <FileText size={16} /> View/Download Attachment
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: "var(--admin-danger)", textAlign: "center" }}>Failed to load preview details.</div>
              )}
            </div>
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setPreviewItem(null)} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontWeight: 600, cursor: "pointer" }}>Close Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 42, height: 42, borderRadius: "0.75rem", background: COLORS.accentSoft, color: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BookOpen size={22} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 800, color: "var(--foreground)", letterSpacing: "-0.02em" }}>Curriculum</h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>
              {chapters.length} chapters · {totalLessons} lessons · {totalContent} content items
            </p>
          </div>
        </div>
      </div>

      {/* Submission note */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: "0.625rem",
        padding: "0.75rem 1rem", borderRadius: "0.625rem",
        background: `${COLORS.info}08`, border: `1px solid ${COLORS.info}30`,
        marginBottom: "1.25rem",
      }}>
        <Info size={14} color={COLORS.info} style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: "0.75rem", color: "var(--muted)", lineHeight: 1.55 }}>
          <strong style={{ color: "var(--foreground)" }}>Submission requirement</strong> — Assignments and activities only require a file submission if the administrator has explicitly marked them as requiring one. Items without a submission badge are auto-completed upon viewing.
        </span>
      </div>

      {/* Search & Filter */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chapters or lessons..."
            style={{ width: "100%", padding: "0.625rem 0.75rem 0.625rem 2.25rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.8125rem", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
          <Filter size={13} color="var(--muted)" />
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ padding: "0.5rem 0.75rem", borderRadius: "0.5rem", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", fontSize: "0.8125rem", cursor: "pointer" }}>
            <option value="">All Types</option>
            <option value="video">Video Lessons</option>
            <option value="quiz">Quizzes</option>
            <option value="assignment">Assignments</option>
            <option value="activity">Activities</option>
          </select>
        </div>
      </div>

      {/* Chapter list */}
      {filteredChapters.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)" }}>
          <BookOpen size={32} color="var(--muted)" style={{ marginBottom: "0.75rem" }} />
          <h3 style={{ margin: 0, fontWeight: 700, color: "var(--foreground)" }}>No content found</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0.5rem 0 0" }}>
            {search || filterType ? "Try adjusting your search or filter." : "No chapters in the curriculum yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
          {filteredChapters.map((ch, idx) => {
            const expanded = expandedChapters.has(ch._id);
            return (
              <div key={ch._id} style={{ background: "var(--surface)", borderRadius: "0.875rem", border: "1px solid var(--border)", overflow: "hidden" }}>
                {/* Chapter header */}
                <button
                  onClick={() => toggleChapter(ch._id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${COLORS.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontWeight: 900, fontSize: "0.9375rem", color: COLORS.accent }}>{idx + 1}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9375rem", color: "var(--foreground)" }}>{ch.title}</div>
                    <div style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 2 }}>
                      {ch.lessonCount} lesson{ch.lessonCount !== 1 ? "s" : ""}
                    </div>
                  </div>
                  {expanded ? <ChevronDown size={18} color="var(--muted)" /> : <ChevronRight size={18} color="var(--muted)" />}
                </button>

                {/* Chapter content summary (always visible when chapter has lessons) */}
                {ch.lessons.length > 0 && <ChapterContentSummary lessons={ch.lessons} />}

                {/* Lessons */}
                {expanded && (
                  <div style={{ borderTop: "1px solid var(--border)" }}>
                    {ch.lessons.length === 0 ? (
                      <div style={{ padding: "1.5rem", textAlign: "center", fontSize: "0.8125rem", color: "var(--muted)" }}>No lessons in this chapter</div>
                    ) : ch.lessons.map(lesson => {
                      const lessonExpanded = expandedLessons.has(lesson._id);
                      return (
                        <div key={lesson._id} style={{ borderBottom: "1px solid var(--border)" }}>
                          {/* Lesson row */}
                          <button
                            onClick={() => toggleLesson(lesson._id)}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.625rem", padding: "0.75rem 1.25rem 0.75rem 2.5rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                          >
                            <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--surface-soft)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid var(--border)" }}>
                              <span style={{ fontWeight: 700, fontSize: "0.625rem", color: "var(--muted)" }}>{lesson.order + 1}</span>
                            </div>
                            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                              <div style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--foreground)" }}>{lesson.title}</div>
                              <div style={{ fontSize: "0.625rem", color: "var(--muted)", marginTop: 1 }}>
                                {lesson.itemCount} item{lesson.itemCount !== 1 ? "s" : ""} — click to view content breakdown
                              </div>
                            </div>
                            {lessonExpanded
                              ? <ChevronDown size={14} color="var(--muted)" />
                              : <ChevronRight size={14} color="var(--muted)" />}
                          </button>

                          {/* Content items for this lesson */}
                          {lessonExpanded && (
                            <div style={{ padding: "0.5rem 1.25rem 1rem 4rem" }}>
                              {lesson.items.length === 0 ? (
                                <div style={{ fontSize: "0.75rem", color: "var(--muted)", padding: "0.5rem 0", fontStyle: "italic" }}>
                                  No content items in this lesson.
                                </div>
                              ) : lesson.items.map((item, i) => (
                                <ContentRow key={`${item.type}-${item.refId}-${i}`} item={item} index={i} onPreview={() => handlePreview(item)} />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
