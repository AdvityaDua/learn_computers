"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  FileText,
  Menu,
  PlayCircle,
  Presentation,
  Send,
  Trophy,
  X,
  Zap,
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChapterLessonNav = { _id: string; title: string; order: number };

type VideoItem = {
  _id: string;
  title: string;
  description?: string;
  descriptionFilePath?: string;
  videoFilePath?: string;
  externalVideoUrl?: string;
  thumbnailFilePath?: string;
  tags?: string[];
};

type QuizQuestion = { question: string; options: string[] };

type QuizItem = {
  _id: string;
  title: string;
  description?: string;
  questions?: QuizQuestion[];
};

type TaskItem = {
  _id: string;
  title: string;
  description?: string;
  points?: number;
  dueDate?: string;
  attachmentFilePath?: string;
  requiresSubmission?: boolean;
  acceptedFileTypes?: string[];
};

type LessonItem =
  | { type: "video"; data: VideoItem | null }
  | { type: "quiz"; data: QuizItem | null }
  | { type: "assignment"; data: TaskItem | null }
  | { type: "activity"; data: TaskItem | null };

type LessonDetailResponse = {
  chapter: { _id: string; title: string; lessons: ChapterLessonNav[] };
  lesson: { _id: string; title: string; description: string; items: LessonItem[] };
  progress: {
    completed: boolean;
    completedAt?: string | null;
    lastAccessedAt?: string | null;
    completedQuizzes: Record<string, number>;
    submittedTasks: Record<string, { filePath: string; originalName: string; submittedAt: string }>;
  };
};

type QuizResult = {
  results: { questionIndex: number; userAnswer: number; correct: boolean; correctAnswerIndex: number }[];
  score: number;
  totalQuestions: number;
  correctCount: number;
};

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderInline(text: string, key: string): React.ReactNode {
  const INLINE = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+?)\*\*|\*([^*]+?)\*/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2] !== undefined) {
      const url = match[2].startsWith("/") ? `${API_BASE}${match[2]}` : match[2];
      parts.push(<img key={`${key}-img-${i++}`} src={url} alt={match[1] ?? ""} className="dash-md-img" />);
    } else if (match[3] !== undefined) {
      parts.push(<a key={`${key}-a-${i++}`} href={match[4]} target="_blank" rel="noreferrer" className="dash-md-link">{match[3]}</a>);
    } else if (match[5] !== undefined) {
      parts.push(<code key={`${key}-c-${i++}`} className="dash-md-icode">{match[5]}</code>);
    } else if (match[6] !== undefined) {
      parts.push(<strong key={`${key}-b-${i++}`}>{match[6]}</strong>);
    } else if (match[7] !== undefined) {
      parts.push(<em key={`${key}-em-${i++}`}>{match[7]}</em>);
    }
    lastIndex = INLINE.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function MarkdownContent({ text }: { text: string }) {
  if (!text) return <p className="dash-md-p theme-muted">No content provided.</p>;

  const CODE_BLOCK = /```(\w*)\n([\s\S]*?)```/g;
  const segments: Array<{ type: "text" | "code"; content: string; lang?: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = CODE_BLOCK.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: "text", content: text.slice(last, m.index) });
    segments.push({ type: "code", content: m[2], lang: m[1] });
    last = CODE_BLOCK.lastIndex;
  }
  if (last < text.length) segments.push({ type: "text", content: text.slice(last) });

  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const seg of segments) {
    if (seg.type === "code") {
      nodes.push(
        <pre key={key++} className="dash-md-pre">
          {seg.lang ? <div className="mb-1 text-xs font-mono opacity-50">{seg.lang}</div> : null}
          <code>{seg.content}</code>
        </pre>,
      );
      continue;
    }

    const lines = seg.content.split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === "") { nodes.push(<div key={key++} className="dash-md-spacer" />); i++; continue; }
      if (line.startsWith("### ")) { nodes.push(<h3 key={key++} className="dash-md-h dash-md-h3">{renderInline(line.slice(4), String(key))}</h3>); i++; continue; }
      if (line.startsWith("## ")) { nodes.push(<h2 key={key++} className="dash-md-h dash-md-h2">{renderInline(line.slice(3), String(key))}</h2>); i++; continue; }
      if (line.startsWith("# ")) { nodes.push(<h1 key={key++} className="dash-md-h dash-md-h1">{renderInline(line.slice(2), String(key))}</h1>); i++; continue; }
      if (/^-{3,}$/.test(line.trim())) { nodes.push(<hr key={key++} className="my-4 border-[var(--border)]" />); i++; continue; }
      if (/^[-*+] /.test(line)) {
        const items: React.ReactNode[] = [];
        while (i < lines.length && /^[-*+] /.test(lines[i])) { items.push(<li key={i}>{renderInline(lines[i].slice(2), `ul-${key}-${i}`)}</li>); i++; }
        nodes.push(<ul key={key++} className="dash-md-ul">{items}</ul>);
        continue;
      }
      if (/^\d+\. /.test(line)) {
        const items: React.ReactNode[] = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(<li key={i}>{renderInline(lines[i].replace(/^\d+\. /, ""), `ol-${key}-${i}`)}</li>); i++; }
        nodes.push(<ol key={key++} className="dash-md-ol">{items}</ol>);
        continue;
      }
      if (line.startsWith("> ")) { nodes.push(<blockquote key={key++} className="border-l-4 border-[var(--accent)] pl-4 italic theme-muted my-2 text-sm">{renderInline(line.slice(2), String(key))}</blockquote>); i++; continue; }
      nodes.push(<p key={key++} className="dash-md-p">{renderInline(line, String(key))}</p>);
      i++;
    }
  }

  return <div className="dash-md">{nodes}</div>;
}

// ─── Slide Mode ────────────────────────────────────────────────────────────────
// Splits markdown by ## headings into individual slides

function splitIntoSlides(text: string): { title: string; body: string }[] {
  if (!text.trim()) return [];
  const lines = text.split("\n");
  const slides: { title: string; body: string }[] = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  const flush = () => {
    const body = currentLines.join("\n").trim();
    slides.push({ title: currentTitle, body });
  };

  for (const line of lines) {
    if (/^#{1,2} /.test(line)) {
      if (currentTitle || currentLines.length > 0) flush();
      currentTitle = line.replace(/^#{1,2} /, "");
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  if (currentTitle || currentLines.length > 0) flush();

  return slides.length > 0 ? slides : [{ title: "", body: text }];
}

function MarkdownReader({ text }: { text: string }) {
  const [mode, setMode] = useState<"read" | "slide">("read");
  const [slideIdx, setSlideIdx] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const [animKey, setAnimKey] = useState(0);
  const slides = useMemo(() => splitIntoSlides(text), [text]);

  const goTo = (next: number, direction: "next" | "prev") => {
    setDir(direction);
    setAnimKey((k) => k + 1);
    setSlideIdx(next);
  };

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("read")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "read" ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "bg-[var(--surface-soft)] theme-muted hover:bg-[var(--border)]"}`}
        >
          <FileText size={14} /> Read Mode
        </button>
        <button
          type="button"
          onClick={() => { setMode("slide"); setSlideIdx(0); setAnimKey((k) => k + 1); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "slide" ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20" : "bg-[var(--surface-soft)] theme-muted hover:bg-[var(--border)]"}`}
        >
          <Presentation size={14} /> Slide Mode
        </button>
        {mode === "slide" && (
          <span className="ml-auto text-xs theme-muted font-semibold">{slideIdx + 1} / {slides.length}</span>
        )}
      </div>

      {mode === "read" ? (
        <MarkdownContent text={text} />
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden" style={{ minHeight: 300 }}>
          {/* Slide content */}
          <div
            key={animKey}
            className={dir === "next" ? "slide-enter" : "animate-slide-left"}
            style={{ padding: "2rem 2.5rem", minHeight: 260 }}
          >
            {slides[slideIdx]?.title && (
              <h2 className="font-black text-2xl mb-4 leading-tight tracking-tight text-[var(--foreground)]">
                {slides[slideIdx].title}
              </h2>
            )}
            <MarkdownContent text={slides[slideIdx]?.body ?? ""} />
          </div>

          {/* Slide controls */}
          <div className="flex items-center justify-between px-6 py-3 bg-[var(--surface-soft)] border-t border-[var(--border)]">
            <button
              type="button"
              disabled={slideIdx === 0}
              onClick={() => goTo(slideIdx - 1, "prev")}
              className="btn-outline rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              ← Prev
            </button>
            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i, i > slideIdx ? "next" : "prev")}
                  className={`slide-step-dot ${i === slideIdx ? "slide-step-dot-active" : ""}`}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={slideIdx === slides.length - 1}
              onClick={() => goTo(slideIdx + 1, "next")}
              className="btn-primary rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Video utility ────────────────────────────────────────────────────────────

function resolveVideoEmbed(src: string) {
  const yt = src.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]+)/);
  if (yt) return { type: "iframe" as const, url: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  const vm = src.match(/vimeo\.com\/(\d+)/);
  if (vm) return { type: "iframe" as const, url: `https://player.vimeo.com/video/${vm[1]}` };
  if (/\.(mp4|webm|ogg)$/i.test(src) || src.startsWith("/")) {
    return { type: "direct" as const, url: src.startsWith("/") ? `${API_BASE}${src}` : src };
  }
  return { type: "link" as const, url: src };
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[var(--border)] ${className ?? ""}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="flex min-h-screen theme-page bg-[var(--background)]">
      {/* Sidebar skeleton */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-5 border-r border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="flex items-center gap-3 pb-2">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-4 w-32 mb-2" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded-full flex-shrink-0" />
              <Skeleton className={`h-4 flex-1 w-[${60 + (n % 3) * 10}%]`} />
            </div>
          ))}
        </div>
        <div className="mt-auto pt-6 border-t border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-2 w-28" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="flex-1 overflow-y-auto">
        {/* Sticky header skeleton */}
        <div className="sticky top-0 z-40 flex items-center justify-between gap-4 px-6 py-4 bg-[var(--background)] border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-32 rounded-full" />
          </div>
          <Skeleton className="h-8 w-28 rounded-full" />
        </div>

        <div className="mx-auto max-w-4xl px-6 py-10 space-y-10">
          {/* Header section */}
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>

          {/* Large block skeleton */}
          <div className="rounded-3xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-sm">
            <div className="h-14 bg-[var(--surface-soft)] flex items-center px-6 gap-3">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>

          {/* Quiz items skeleton */}
          <div className="space-y-6">
            {[1, 2].map((n) => (
              <div key={n} className="rounded-3xl border border-[var(--border)] p-8 bg-[var(--surface)] space-y-6">
                <Skeleton className="h-6 w-1/2" />
                <div className="grid gap-3">
                  {[1, 2, 3, 4].map((o) => (
                    <Skeleton key={o} className="h-12 w-full rounded-2xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Content blocks ───────────────────────────────────────────────────────────

function VideoBlock({ video }: { video: VideoItem }) {
  const src = video.externalVideoUrl || video.videoFilePath || "";
  const embed = src ? resolveVideoEmbed(src) : null;

  return (
    <section className="lesson-block rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--surface)]">
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-[var(--border)] bg-[var(--surface-soft)]">
        <PlayCircle size={18} className="text-[var(--accent)]" />
        <span className="font-black text-sm">{video.title}</span>
        {video.tags?.length ? (
          <div className="ml-auto flex gap-1 flex-wrap">
            {video.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold">{t}</span>)}
          </div>
        ) : null}
      </div>

      {embed?.type === "iframe" && (
        <div className="relative w-full bg-black" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={embed.url}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )}
      {embed?.type === "direct" && (
        <video controls className="w-full bg-black" src={embed.url} style={{ maxHeight: "480px" }} />
      )}
      {embed?.type === "link" && (
        <div className="px-5 py-4">
          <a href={embed.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] hover:underline">
            <PlayCircle size={16} /> Open Video
          </a>
        </div>
      )}
      {!embed && <div className="px-5 py-4 text-sm theme-muted">No video source available.</div>}

      {video.description && (
        <div className="px-5 py-4 border-t border-[var(--border)]">
          <MarkdownContent text={video.description} />
        </div>
      )}
    </section>
  );
}

function QuizBlock({
  quiz,
  chapterId,
  lessonId,
  token,
  initialCompleted,
  initialScore,
}: {
  quiz: QuizItem;
  chapterId: string;
  lessonId: string;
  token: string;
  initialCompleted: boolean;
  initialScore?: number;
}) {
  const questions = quiz.questions ?? [];
  const [answers, setAnswers] = useState<number[]>(Array(questions.length).fill(-1));
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [completed, setCompleted] = useState(initialCompleted);
  const [score, setScore] = useState<number | undefined>(initialScore);
  const [error, setError] = useState("");

  const allAnswered = answers.every((a) => a !== -1);

  const submit = async () => {
    if (!allAnswered) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/progress/lessons/${chapterId}/${lessonId}/quizzes/${quiz._id}/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        },
      );
      if (!res.ok) throw new Error("Submission failed");
      const data = (await res.json()) as QuizResult;
      setResult(data);
      setCompleted(true);
      setScore(data.score);
    } catch {
      setError("Could not submit quiz. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="lesson-block rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-[var(--border)] bg-[var(--surface-soft)]">
        <BookOpen size={18} className="text-[var(--accent)]" />
        <span className="font-black text-sm">{quiz.title}</span>
        <div className="ml-auto flex items-center gap-2">
          {completed && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Trophy size={12} className="flex-shrink-0" />
              {score ?? 0}% Score
            </span>
          )}
          <span className="text-xs theme-muted">{questions.length} questions • 50% weight</span>
        </div>
      </div>

      {quiz.description && (
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <MarkdownContent text={quiz.description} />
        </div>
      )}

      <div className="px-5 py-4 space-y-6">
        {questions.map((q, qIdx) => {
          const answered = answers[qIdx] !== -1;
          const correctIdx = result?.results[qIdx]?.correctAnswerIndex;
          const userIdx = result?.results[qIdx]?.userAnswer;
          const isCorrect = result?.results[qIdx]?.correct;

          return (
            <div key={qIdx}>
              <p className="font-semibold text-sm mb-3 flex gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-black flex items-center justify-center">{qIdx + 1}</span>
                {q.question}
                {result && (
                  <span className={`ml-auto text-xs font-bold flex-shrink-0 ${isCorrect ? "text-emerald-600" : "text-red-500"}`}>
                    {isCorrect ? "✓ Correct" : "✗ Wrong"}
                  </span>
                )}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oIdx) => {
                  let optClass = "quiz-option";
                  if (result) {
                    if (oIdx === correctIdx) optClass += " quiz-option-correct";
                    else if (oIdx === userIdx && !isCorrect) optClass += " quiz-option-wrong";
                    else optClass += " quiz-option-disabled";
                  } else if (answers[qIdx] === oIdx) {
                    optClass += " quiz-option-selected";
                  } else {
                    optClass += " quiz-option-idle";
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={!!result || submitting}
                      onClick={() => {
                        if (result) return;
                        const next = [...answers];
                        next[qIdx] = oIdx;
                        setAnswers(next);
                      }}
                      className={optClass}
                    >
                      <span className="quiz-option-letter">{String.fromCharCode(65 + oIdx)}</span>
                      <span className="flex-1 text-left">{opt}</span>
                      {result && oIdx === correctIdx && <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {!result && (
        <div className="px-5 pb-5 flex items-center gap-3">
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            {submitting ? "Submitting…" : "Submit Quiz"}
          </button>
          <span className="text-xs theme-muted">
            {answers.filter((a) => a !== -1).length}/{questions.length} answered
          </span>
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>
      )}

      {result && (
        <div className={`mx-5 mb-6 overflow-hidden rounded-2xl border transition-all duration-500 ${
          result.score >= 70 
            ? "border-emerald-500/20 bg-emerald-500/5" 
            : "border-amber-500/20 bg-amber-500/5"
        }`}>
          <div className="flex items-center gap-5 p-5 md:p-6">
            <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl shadow-lg transition-transform hover:scale-110 ${
              result.score >= 70 
                ? "bg-emerald-500 text-white shadow-emerald-500/20" 
                : "bg-amber-500 text-white shadow-amber-500/20"
            }`}>
              <Trophy size={28} strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <h4 className={`text-xl font-black tracking-tight ${
                result.score >= 70 ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
              }`}>
                {result.score}% Score — {result.correctCount}/{result.totalQuestions} Correct
              </h4>
              <p className="mt-1 text-sm font-medium theme-muted">
                {result.score >= 90 ? "Outstanding achievement! You've mastered this topic." : 
                 result.score >= 70 ? "Great job! You have a solid understanding of this content." : 
                 "Keep pushing — review the material and give it another shot."}
              </p>
            </div>
          </div>
          <div className={`h-1.5 w-full ${result.score >= 70 ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
            <div 
              className={`h-full transition-all duration-1000 ease-out ${result.score >= 70 ? "bg-emerald-500" : "bg-amber-500"}`} 
              style={{ width: `${result.score}%` }} 
            />
          </div>
        </div>
      )}
    </section>
  );
}

function TaskBlock({
  item,
  chapterId,
  lessonId,
  token,
  submitted,
  onSubmitted,
}: {
  item: { type: "assignment" | "activity"; data: TaskItem };
  chapterId: string;
  lessonId: string;
  token: string;
  submitted?: { filePath: string; originalName: string; submittedAt: string };
  onSubmitted?: (taskId: string, info: { filePath: string; originalName: string; submittedAt: string }) => void;
}) {
  const isAssignment = item.type === "assignment";
  const Icon = isAssignment ? ClipboardList : Zap;
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const typeLabels: Record<string, string> = {
    pdf: ".pdf",
    image: ".jpg .png .webp",
    document: ".doc .docx",
    zip: ".zip .tar .rar",
    code: ".py .js .ts .java .c .cpp",
    any: "any file type",
  };

  const handleUpload = async () => {
    if (!uploadFile || !onSubmitted) return;
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("submissionFile", uploadFile);
      const res = await fetch(
        `${API_BASE}/progress/lessons/${chapterId}/${lessonId}/tasks/${item.type}/${item.data._id}/submit`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(d.message ?? "Upload failed");
      }
      const result = await res.json() as { filePath: string; originalName: string; submittedAt: string };
      onSubmitted(item.data._id, result);
      setUploadFile(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="lesson-block rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-4 pb-3 border-b border-[var(--border)] bg-[var(--surface-soft)]">
        <Icon size={18} className="text-[var(--accent)]" />
        <span className="font-black text-sm">{item.data.title}</span>
        <div className="ml-auto flex items-center gap-2">
          {item.data.requiresSubmission && (
            submitted ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 size={11} /> Submitted
              </span>
            ) : (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Awaiting Submission
              </span>
            )
          )}
          {item.data.points != null && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">{item.data.points} pts</span>
          )}
          {item.data.dueDate && (
            <span className="text-xs theme-muted">Due {new Date(item.data.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
          )}
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">
        {item.data.description ? (
          <MarkdownContent text={item.data.description} />
        ) : (
          <p className="text-sm theme-muted">No description provided.</p>
        )}
        {item.data.attachmentFilePath && (
          <a
            href={`${API_BASE}${item.data.attachmentFilePath}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--accent)] hover:underline"
          >
            <FileText size={14} /> Open Attachment
          </a>
        )}

        {/* ── Submission area ── */}
        {item.data.requiresSubmission && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-soft)] p-4 space-y-3">
            {submitted ? (
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 flex-shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
                  <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Submission received</p>
                  <p className="text-xs theme-muted truncate">{submitted.originalName}</p>
                  <p className="text-xs theme-muted">{new Date(submitted.submittedAt).toLocaleString()}</p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="ml-auto text-xs font-semibold text-[var(--accent)] hover:underline flex-shrink-0"
                >Re-submit</button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-bold text-sm">File Submission Required</p>
                {item.data.acceptedFileTypes && item.data.acceptedFileTypes.length > 0 && (
                  <p className="text-xs theme-muted">
                    Accepted:{" "}
                    {item.data.acceptedFileTypes[0] === "any"
                      ? "any file type"
                      : item.data.acceptedFileTypes.map((t) => typeLabels[t] ?? t).join(" · ")}
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 text-sm font-semibold px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-soft)] transition-colors text-left truncate"
              >
                {uploadFile ? uploadFile.name : (submitted ? "Choose replacement file" : "Choose file…")}
              </button>
              {uploadFile && (
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {uploading ? "Uploading…" : "Submit"}
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={(e) => { setUploadFile(e.target.files?.[0] ?? null); setUploadError(""); }}
            />
            {uploadError && <p className="text-xs font-semibold text-red-500">{uploadError}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Section type ─────────────────────────────────────────────────────────────

type SectionDef =
  | { id: string; label: string; type: "overview"; item?: undefined }
  | { id: string; label: string; type: "video" | "quiz" | "assignment" | "activity"; item: LessonItem };

function sectionIcon(type: SectionDef["type"]) {
  switch (type) {
    case "video": return PlayCircle;
    case "quiz": return BookOpen;
    case "assignment": return ClipboardList;
    case "activity": return Zap;
    default: return FileText;
  }
}

function sectionTypeLabel(type: SectionDef["type"]) {
  switch (type) {
    case "video": return "Video";
    case "quiz": return "Quiz";
    case "assignment": return "Assignment";
    case "activity": return "Activity";
    default: return "Overview";
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LessonDetailPage() {
  const params = useParams<{ chapterId: string; lessonId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [detail, setDetail] = useState<LessonDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [submittedTasks, setSubmittedTasks] = useState<Record<string, { filePath: string; originalName: string; submittedAt: string }>>({});
  const [navBlockMsg, setNavBlockMsg] = useState("");
  const mainRef = useRef<HTMLDivElement>(null);

  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("accessToken") || "";
  }, []);

  useEffect(() => {
    if (!params.chapterId || !params.lessonId) return;
    if (!token) { router.push("/login"); return; }

    setLoading(true);
    setDetail(null);
    setError("");
    setSidebarOpen(false);
    setActiveSection(0);
    setSubmittedTasks({});
    setNavBlockMsg("");

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_BASE}/progress/lesson-detail/${params.chapterId}/${params.lessonId}`, { headers }),
      fetch(`${API_BASE}/progress/lessons/${params.chapterId}/${params.lessonId}/access`, { method: "POST", headers }),
    ])
      .then(async ([detailRes]) => {
        if (!detailRes.ok) throw new Error("Could not load lesson");
        const data = (await detailRes.json()) as LessonDetailResponse;
        setDetail(data);
        setSubmittedTasks(data.progress.submittedTasks ?? {});
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load lesson"))
      .finally(() => setLoading(false));
  }, [params.chapterId, params.lessonId, router, token]);

  const sortedLessons = useMemo(
    () => detail?.chapter.lessons.slice().sort((a, b) => a.order - b.order) ?? [],
    [detail],
  );

  const currentLessonIdx = useMemo(
    () => sortedLessons.findIndex((l) => l._id === detail?.lesson._id),
    [sortedLessons, detail],
  );

  // Build flat sections list: overview (if description exists) + each content item
  const sections = useMemo((): SectionDef[] => {
    if (!detail) return [];
    const list: SectionDef[] = [];
    if (detail.lesson.description) {
      list.push({ id: "overview", label: "Overview", type: "overview" });
    }
    detail.lesson.items.forEach((item, idx) => {
      if (!item.data) return;
      list.push({
        id: (item.data as { _id: string })._id || `item-${idx}`,
        label: (item.data as { title: string }).title,
        type: item.type as "video" | "quiz" | "assignment" | "activity",
        item,
      });
    });
    return list;
  }, [detail]);

  // Jump to section specified by ?ref= query param (set when navigating from quiz/assignment/activity cards)
  useEffect(() => {
    if (!sections.length) return;
    const ref = searchParams.get("ref");
    if (!ref) return;
    const idx = sections.findIndex((s) => s.id === ref);
    if (idx > 0) {
      setActiveSection(idx);
      mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [sections, searchParams]);

  const prevLesson = currentLessonIdx > 0 ? sortedLessons[currentLessonIdx - 1] : null;
  const nextLesson = currentLessonIdx < sortedLessons.length - 1 ? sortedLessons[currentLessonIdx + 1] : null;

  const markCompleteAndNavigateLesson = async (targetId: string) => {
    if (!token || navigating) return;
    setNavigating(true);
    try {
      await fetch(
        `${API_BASE}/progress/lessons/${params.chapterId}/${params.lessonId}/complete`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      );
    } catch { /* ignore */ }
    router.push(`/dashboard/lessons/${params.chapterId}/${targetId}`);
  };

  const jumpToSection = (idx: number) => {
    setActiveSection(idx);
    setSidebarOpen(false);
    setNavBlockMsg("");
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToPrev = () => {
    if (activeSection > 0) {
      jumpToSection(activeSection - 1);
    } else if (prevLesson) {
      markCompleteAndNavigateLesson(prevLesson._id);
    }
  };

  const goToNext = () => {
    // Check if current section requires a submission that hasn't been made
    const activeSec = sections[activeSection];
    if (activeSec && (activeSec.type === "assignment" || activeSec.type === "activity")) {
      const taskData = activeSec.item?.data as TaskItem | null;
      if (taskData?.requiresSubmission && !submittedTasks[taskData._id]) {
        setNavBlockMsg("You must submit a file before continuing.");
        return;
      }
    }
    setNavBlockMsg("");
    if (activeSection < sections.length - 1) {
      jumpToSection(activeSection + 1);
    } else if (nextLesson) {
      markCompleteAndNavigateLesson(nextLesson._id);
    } else {
      if (!token || navigating) return;
      setNavigating(true);
      fetch(
        `${API_BASE}/progress/lessons/${params.chapterId}/${params.lessonId}/complete`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } },
      ).catch(() => {}).finally(() => router.push("/dashboard"));
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (!detail) {
    return (
      <div className="theme-page min-h-screen flex items-center justify-center p-6">
        <div className="panel max-w-sm w-full rounded-2xl p-8 text-center space-y-3">
          <p className="font-black text-lg">Something went wrong</p>
          <p className="text-sm theme-muted">{error || "Lesson not found"}</p>
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--accent)] hover:underline">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const completedQuizzes = detail.progress.completedQuizzes ?? {};
  const quizCount = detail.lesson.items.filter((i) => i.type === "quiz").length;
  const doneQuizCount = Object.keys(completedQuizzes).length;

  const activeSec = sections[activeSection];
  const hasPrevSec = activeSection > 0;
  const hasNextSec = activeSection < sections.length - 1;
  const isLastEverything = !hasNextSec && !nextLesson;
  const prevLabel = hasPrevSec ? sections[activeSection - 1].label : prevLesson?.title;
  const nextLabel = hasNextSec ? sections[activeSection + 1].label : nextLesson?.title ?? "Finish";

  return (
    <div className="theme-page min-h-screen flex flex-col">
      {/* ── Top header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-[var(--header-bg)] border-b border-[var(--border)] backdrop-blur-md">
        <button
          type="button"
          onClick={() => setSidebarOpen((v) => !v)}
          className="lg:hidden p-2 rounded-xl hover:bg-[var(--surface-soft)] transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
        <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] hover:underline flex-shrink-0">
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <span className="hidden sm:flex items-center gap-2 min-w-0">
          <span className="text-[var(--border)]">·</span>
          <span className="text-sm font-semibold theme-muted truncate max-w-[160px]">{detail.lesson.title}</span>
          <span className="text-[var(--border)]">›</span>
          <span className="text-sm font-semibold truncate max-w-[120px]">{activeSec?.label}</span>
        </span>

        <div className="ml-auto flex items-center gap-3">
          {detail.progress.completed ? (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={13} className="flex-shrink-0" />
              Completed
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold theme-muted bg-[var(--surface-soft)] px-3 py-1.5 rounded-full border border-[var(--border)]">
              <Circle size={13} /> In Progress
            </span>
          )}
          <span className="text-xs font-semibold theme-muted hidden sm:block tabular-nums">
            {activeSection + 1} / {sections.length}
          </span>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 relative">
        {/* ── Mobile overlay ──────────────────────────────────────────────── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside
          className={`
            fixed lg:sticky top-[53px] z-40 lg:z-auto
            h-[calc(100vh-53px)] w-72 flex-shrink-0
            flex flex-col
            bg-[var(--surface)] border-r border-[var(--border)]
            transition-transform duration-250
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
          `}
        >
          {/* Sidebar header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] flex-shrink-0">
            <span className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">Contents</span>
            <button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 hover:bg-[var(--surface-soft)] rounded-lg">
              <X size={14} />
            </button>
          </div>

          {/* Chapter label */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest theme-muted mb-0.5">Chapter</p>
            <p className="text-xs font-semibold truncate">{detail.chapter.title}</p>
          </div>

          {/* Lesson + sections tree */}
          <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
            {sortedLessons.map((lesson, lessonIdx) => {
              const isCurrent = lesson._id === detail.lesson._id;
              const Icon = isCurrent ? ChevronRight : ChevronRight;

              return (
                <div key={lesson._id}>
                  {/* Lesson row */}
                  {isCurrent ? (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-soft-border)]">
                      <span className="sidebar-lesson-index sidebar-index-active flex-shrink-0">{lessonIdx + 1}</span>
                      <span className="flex-1 text-xs font-black text-[var(--accent)] truncate">{lesson.title}</span>
                    </div>
                  ) : (
                    <Link
                      href={`/dashboard/lessons/${params.chapterId}/${lesson._id}`}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl hover:bg-[var(--surface-soft)] transition-colors"
                    >
                      <span className="sidebar-lesson-index flex-shrink-0">{lessonIdx + 1}</span>
                      <span className="flex-1 text-xs font-semibold theme-muted truncate">{lesson.title}</span>
                      <Icon size={11} className="theme-muted flex-shrink-0 opacity-50" />
                    </Link>
                  )}

                  {/* Sections sub-list — only under the active lesson */}
                  {isCurrent && sections.length > 0 && (
                    <div className="mt-1 ml-5 pl-3 border-l-2 border-[var(--accent-soft-border)] space-y-0.5 pb-1">
                      {sections.map((sec, secIdx) => {
                        const SIcon = sectionIcon(sec.type);
                        const isActiveSec = secIdx === activeSection;
                        return (
                          <button
                            key={sec.id}
                            type="button"
                            onClick={() => jumpToSection(secIdx)}
                            className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                              isActiveSec
                                ? "bg-[var(--accent)] text-[var(--on-accent)]"
                                : "hover:bg-[var(--surface-soft)]"
                            }`}
                          >
                            <SIcon size={13} className={`flex-shrink-0 mt-0.5 ${isActiveSec ? "" : "theme-muted"}`} />
                            <div className="min-w-0 flex-1">
                              <div className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isActiveSec ? "opacity-70" : "theme-muted"}`}>
                                {sectionTypeLabel(sec.type)}
                              </div>
                              <div className={`text-xs font-semibold leading-tight truncate ${isActiveSec ? "" : "theme-muted"}`}>
                                {sec.label}
                              </div>
                            </div>
                            {isActiveSec && (
                              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--on-accent)] opacity-70 mt-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Section progress */}
          <div className="px-4 py-4 border-t border-[var(--border)] flex-shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="theme-muted">Section progress</span>
              <span className="text-[var(--accent)] font-black tabular-nums">{activeSection + 1} / {sections.length}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--border)]">
              <div
                className="h-1.5 rounded-full bg-[var(--accent)] transition-all duration-300"
                style={{ width: sections.length > 1 ? `${Math.round((activeSection / (sections.length - 1)) * 100)}%` : "100%" }}
              />
            </div>
            {quizCount > 0 && (
              <p className="text-[11px] theme-muted">Quizzes completed: {doneQuizCount}/{quizCount}</p>
            )}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <main ref={mainRef} className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-4 py-6 lg:px-8 lg:py-8 flex flex-col" style={{ minHeight: "calc(100vh - 53px)" }}>

            {/* Section breadcrumb / stepper */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs theme-muted font-semibold truncate max-w-[200px]">{detail.lesson.title}</span>
              <ChevronRight size={12} className="theme-muted flex-shrink-0" />
              {activeSec && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent-soft-border)]">
                  {(() => { const I = sectionIcon(activeSec.type); return <I size={11} />; })()}
                  {sectionTypeLabel(activeSec.type)}
                </span>
              )}
              <span className="ml-auto text-xs theme-muted font-semibold tabular-nums flex-shrink-0">
                {activeSection + 1} of {sections.length}
              </span>
            </div>

            {/* Active section title */}
            {activeSec && (
              <h1 className="text-xl lg:text-2xl font-black leading-snug mb-5">{activeSec.label}</h1>
            )}

            {/* Section content — one at a time */}
            <div className="flex-1">
              {activeSec?.type === "overview" && (
                <div className="panel rounded-2xl p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]">
                    <BookOpen size={16} className="text-[var(--accent)]" />
                    <span className="text-sm font-black">Lesson Overview</span>
                  </div>
                  <MarkdownReader text={detail.lesson.description} />
                </div>
              )}

              {activeSec && activeSec.type !== "overview" && (() => {
                const item = activeSec.item;
                if (!item.data) return (
                  <div className="rounded-2xl border border-[var(--border)] p-6 bg-[var(--surface-soft)]">
                    <p className="text-sm font-semibold capitalize">{item.type}</p>
                    <p className="text-xs theme-muted mt-1">Content could not be loaded.</p>
                  </div>
                );
                if (item.type === "video") return <VideoBlock video={item.data as VideoItem} />;
                if (item.type === "quiz") {
                  const quiz = item.data as QuizItem;
                  return (
                    <QuizBlock
                      quiz={quiz}
                      chapterId={params.chapterId}
                      lessonId={params.lessonId}
                      token={token}
                      initialCompleted={Boolean(completedQuizzes[quiz._id])}
                      initialScore={completedQuizzes[quiz._id]}
                    />
                  );
                }
                return (
                  <TaskBlock
                    key={item.data._id}
                    item={item as { type: "assignment" | "activity"; data: TaskItem }}
                    chapterId={params.chapterId}
                    lessonId={params.lessonId}
                    token={token}
                    submitted={submittedTasks[(item.data as TaskItem)._id]}
                    onSubmitted={(taskId, info) => setSubmittedTasks((prev) => ({ ...prev, [taskId]: info }))}
                  />
                );
              })()}

              {sections.length === 0 && (
                <div className="rounded-2xl border border-[var(--border)] p-8 text-center space-y-2">
                  <FileText size={32} className="mx-auto theme-muted opacity-40" />
                  <p className="font-semibold">No content yet</p>
                  <p className="text-sm theme-muted">This lesson has no content sections.</p>
                </div>
              )}
            </div>

            {/* Section navigation footer */}
            <div className="mt-8 space-y-3">
              {navBlockMsg && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm font-semibold">
                  <span>⚠</span> {navBlockMsg}
                </div>
              )}
            <div className="pt-5 border-t border-[var(--border)] flex items-stretch gap-3">
              {/* Previous */}
              {(hasPrevSec || prevLesson) ? (
                <button
                  type="button"
                  disabled={navigating}
                  onClick={goToPrev}
                  className="btn-outline rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2.5 disabled:opacity-50 flex-1 min-w-0"
                >
                  <ChevronLeft size={16} className="flex-shrink-0" />
                  <div className="min-w-0 text-left">
                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-0.5">
                      {hasPrevSec ? "Previous Section" : "Previous Lesson"}
                    </div>
                    <div className="text-xs font-semibold truncate">{prevLabel}</div>
                  </div>
                </button>
              ) : <div className="flex-1" />}

              {/* Next */}
              <button
                type="button"
                disabled={navigating}
                onClick={goToNext}
                className="btn-primary rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-2.5 disabled:opacity-50 flex-1 min-w-0"
              >
                <div className="min-w-0 text-right flex-1">
                  <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-0.5">
                    {isLastEverything ? "Finish" : hasNextSec ? "Next Section" : "Next Lesson"}
                  </div>
                  <div className="text-xs font-semibold truncate">
                    {isLastEverything ? "Complete & Go to Dashboard" : nextLabel}
                  </div>
                </div>
                {isLastEverything
                  ? <CheckCircle2 size={16} className="flex-shrink-0" />
                  : <ChevronRight size={16} className="flex-shrink-0" />}
              </button>
            </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

