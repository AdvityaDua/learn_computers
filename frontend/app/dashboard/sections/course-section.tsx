"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  Paperclip,
  PlayCircle,
  PuzzleIcon,
  Upload,
} from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { ProgressBar } from "../../components/ui/progress-bar";
import { Skeleton } from "../../components/ui/skeleton";
import { EmptyState } from "../../components/ui/empty-state";
import { ErrorState } from "../../components/ui/error-state";
import { Markdown } from "../../components/ui/markdown";
import { SectionHeader } from "../section-header";
import { ITEM_TYPE_META } from "../item-type-icon";
import { useAsync } from "../../lib/use-async";
import { getLessonDetail, markLessonAccessed, markLessonCompleted, submitTask } from "../../lib/data";
import { resolveAssetUrl } from "../../lib/asset-url";
import { useCurriculum } from "../../context/curriculum-context";
import { chapterCompletedCount, chapterLessonCount } from "../../lib/curriculum-utils";
import type { DashboardView } from "../view";
import type { ChapterLesson, ChapterLessonItem, LessonDetail, LessonVideoContent, TaskContent } from "../../lib/types";

/** A sidebar entry is either a lesson's own overview, or one of its items (video/quiz/assignment/activity). */
type Entry = { lessonId: string; itemId: string | null };

function sortedItems(lesson: ChapterLesson): ChapterLessonItem[] {
  return [...lesson.items].sort((a, b) => a.order - b.order);
}

/** Labels duplicate item types within a lesson ("Activity 1", "Activity 2") so sidebar rows stay unambiguous. */
function itemLabel(items: ChapterLessonItem[], item: ChapterLessonItem): string {
  const meta = ITEM_TYPE_META[item.type];
  const sameType = items.filter((i) => i.type === item.type);
  if (sameType.length <= 1) return meta.label;
  return `${meta.label} ${sameType.findIndex((i) => i._id === item._id) + 1}`;
}

/**
 * There's no manual "mark as done" — a lesson finishes itself once every item in it has been
 * engaged with: quizzes attempted, assignments/activities submitted (or just opened, when they
 * don't require a submission at all — some activities are discussion prompts with nothing to
 * upload), videos watched to the end. Video-watched state only lives on the client (the backend
 * has no per-item progress), so it can't survive a round trip to the quiz-taking screen — once a
 * lesson also has a quiz or task, those server-tracked signals decide completion instead and
 * video-watched no longer gates it.
 *
 * `chapterItems` and `viewedItemIds` share the chapter-level item id space (index-aligned with
 * `detail.lesson.items`) so a "no submission needed" item can be satisfied by having been opened.
 */
function isLessonAutoDone(
  detail: LessonDetail,
  chapterItems: ChapterLessonItem[],
  watchedVideoIds: Set<string>,
  viewedItemIds: Set<string>,
): boolean {
  const items = detail.lesson.items;
  if (items.length === 0) return false;
  const hasGradedItem = items.some((it) => it.type === "quiz" || it.type === "assignment" || it.type === "activity");

  return items.every((item, idx) => {
    if (item.type === "video") {
      if (hasGradedItem) return true;
      return item.data ? watchedVideoIds.has(item.data._id) : true;
    }
    if (item.type === "quiz") {
      return item.data ? detail.progress.completedQuizzes[item.data._id] !== undefined : true;
    }
    if (!item.data) return true;
    if (item.data.requiresSubmission) return Boolean(detail.progress.submittedTasks[item.data._id]);
    const chapterItemId = chapterItems[idx]?._id;
    return chapterItemId ? viewedItemIds.has(chapterItemId) : true;
  });
}

function VideoBlock({ data, onWatched }: { data: LessonVideoContent | null; onWatched: () => void }) {
  const videoSrc = data ? resolveAssetUrl(data.videoFilePath) : undefined;
  const documentSrc = data ? resolveAssetUrl(data.documentFilePath) : undefined;

  useEffect(() => {
    // There's no way to detect "finished watching" for an embedded/external video (cross-origin
    // iframe gives no ended event), so it's counted as watched as soon as it's opened. Self-hosted
    // videos wait for the real onEnded event below instead.
    if (data && !videoSrc) onWatched();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?._id, videoSrc]);

  if (!data) return null;

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2 text-info">
        <PlayCircle size={18} />
        <p className="font-[family-name:var(--font-display)] font-bold">{data.title}</p>
      </div>

      {videoSrc ? (
        <video controls onEnded={onWatched} className="mb-3 w-full rounded-md bg-black" poster={resolveAssetUrl(data.thumbnailFilePath)}>
          <source src={videoSrc} />
        </video>
      ) : data.externalVideoUrl ? (
        <div className="mb-3 aspect-video w-full overflow-hidden rounded-md">
          <iframe src={data.externalVideoUrl} className="h-full w-full" allowFullScreen title={data.title} />
        </div>
      ) : null}

      {data.description ? <Markdown content={data.description} /> : null}

      {documentSrc ? (
        <a
          href={documentSrc}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <FileText size={16} /> View document
        </a>
      ) : null}
    </Card>
  );
}

/** Mirrors the backend's category → extension mapping (progress.service.ts) so the file picker and any client-side check agree with what the server will actually accept. */
const FILE_TYPE_EXTENSIONS: Record<string, string[]> = {
  pdf: ["pdf"],
  image: ["jpg", "jpeg", "png", "gif", "webp"],
  document: ["doc", "docx", "pdf"],
  zip: ["zip", "tar", "gz", "rar", "7z"],
  code: ["js", "ts", "py", "java", "c", "cpp", "cs", "rb", "go", "html", "css", "jsx", "tsx"],
};

/** Returns null when there's no restriction ("any" or unset), otherwise the flattened list of allowed extensions. */
function resolveAcceptedExtensions(acceptedFileTypes: string[]): string[] | null {
  if (acceptedFileTypes.length === 0 || acceptedFileTypes.includes("any")) return null;
  return acceptedFileTypes.flatMap((t) => FILE_TYPE_EXTENSIONS[t] ?? [t]);
}

function TaskBlock({
  data,
  taskType,
  chapterId,
  lessonId,
  submitted,
  onSubmitted,
}: {
  data: TaskContent;
  taskType: "assignment" | "activity";
  chapterId: string;
  lessonId: string;
  submitted?: { originalName: string; reviewStatus: string; reviewFeedback: string };
  onSubmitted: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const Icon = taskType === "assignment" ? ClipboardList : PuzzleIcon;
  const tone = taskType === "assignment" ? "text-warning" : "text-success";
  const attachmentSrc = resolveAssetUrl(data.attachmentFilePath);
  const imageSrcs = (data.imageFilePaths ?? []).map((p) => resolveAssetUrl(p)).filter(Boolean) as string[];
  const acceptedExtensions = resolveAcceptedExtensions(data.acceptedFileTypes ?? []);
  const acceptAttr = acceptedExtensions?.map((e) => `.${e}`).join(",");
  const acceptedLabel = acceptedExtensions?.map((e) => e.toUpperCase()).join(", ");

  const handleUpload = async () => {
    if (!file) return;
    if (acceptedExtensions) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!acceptedExtensions.includes(ext)) {
        setError(`.${ext} isn't accepted here. Accepted file types: ${acceptedLabel}`);
        return;
      }
    }
    setUploading(true);
    setError("");
    try {
      await submitTask(chapterId, lessonId, taskType, data._id, file);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed, please try again.");
    } finally {
      setUploading(false);
    }
  };

  const statusTone =
    submitted?.reviewStatus === "approved"
      ? "success"
      : submitted?.reviewStatus === "rejected"
        ? "danger"
        : submitted?.reviewStatus === "resubmit_requested"
          ? "warning"
          : "info";

  return (
    <Card className="p-5">
      <div className={`mb-2 flex items-center gap-2 ${tone}`}>
        <Icon size={18} />
        <p className="font-[family-name:var(--font-display)] font-bold">{data.title}</p>
        {data.points ? <Badge tone="primary">{data.points} pts</Badge> : null}
      </div>
      {data.description ? <Markdown content={data.description} className="mb-3" /> : null}
      {data.dueDate ? (
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-muted">
          <Clock size={13} /> Due {new Date(data.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      ) : null}

      {imageSrcs.length > 0 ? (
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {imageSrcs.map((src, i) => (
            <a key={i} href={src} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${data.title} attachment ${i + 1}`} className="aspect-video w-full object-cover" />
            </a>
          ))}
        </div>
      ) : null}

      {attachmentSrc ? (
        <a
          href={attachmentSrc}
          target="_blank"
          rel="noreferrer"
          className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <Paperclip size={15} /> View attachment
        </a>
      ) : null}

      {data.requiresSubmission ? (
        submitted ? (
          <div className="rounded-md border border-border bg-surface-soft p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="truncate text-sm font-medium">{submitted.originalName}</p>
              <Badge tone={statusTone}>{submitted.reviewStatus.replace("_", " ")}</Badge>
            </div>
            {submitted.reviewFeedback ? <p className="mt-2 text-xs text-muted">&ldquo;{submitted.reviewFeedback}&rdquo;</p> : null}
            {submitted.reviewStatus === "resubmit_requested" || submitted.reviewStatus === "rejected" ? (
              <div className="mt-3">
                {acceptedLabel ? <p className="mb-1.5 text-xs text-muted">Accepted file types: {acceptedLabel}</p> : null}
                <div className="flex items-center gap-2">
                  <input ref={inputRef} type="file" accept={acceptAttr} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
                  <Button size="sm" onClick={handleUpload} isLoading={uploading} disabled={!file}>
                    <Upload size={14} /> Resubmit
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div>
            {acceptedLabel ? <p className="mb-1.5 text-xs text-muted">Accepted file types: {acceptedLabel}</p> : null}
            <div className="flex flex-wrap items-center gap-2">
              <input ref={inputRef} type="file" accept={acceptAttr} onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-xs" />
              <Button size="sm" onClick={handleUpload} isLoading={uploading} disabled={!file}>
                <Upload size={14} /> Submit
              </Button>
            </div>
          </div>
        )
      ) : null}
      {error ? <p className="mt-2 text-xs font-semibold text-danger">{error}</p> : null}
    </Card>
  );
}

function CourseOverview({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!description) return null;

  return (
    <Card className="mb-5 p-5">
      <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <p className="font-[family-name:var(--font-display)] text-base font-bold">About this course</p>
        <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      <div className={expanded ? "mt-3" : "mt-3 max-h-24 overflow-hidden [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"}>
        <Markdown content={description} />
      </div>
      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="mt-1 text-xs font-semibold text-primary hover:underline">
          Show more
        </button>
      ) : null}
    </Card>
  );
}

export function CourseSection({
  subjectId,
  chapterId,
  initialLessonId,
  onNavigate,
}: {
  subjectId: string;
  chapterId: string;
  initialLessonId?: string;
  onNavigate: (view: DashboardView) => void;
}) {
  const { chaptersBySubject, progress, loading: curriculumLoading, reloadProgress } = useCurriculum();
  const chapter = (chaptersBySubject[subjectId] ?? []).find((c) => c._id === chapterId);
  const completedLessonIds = new Set(progress?.completedLessonIds ?? []);
  const lessons = useMemo(() => (chapter ? [...chapter.lessons].sort((a, b) => a.order - b.order) : []), [chapter]);

  const firstIncompleteLesson = lessons.find((l) => !completedLessonIds.has(l._id));
  const defaultLessonId = (firstIncompleteLesson ?? lessons[0])?._id;

  const [pickedLessonId, setPickedLessonId] = useState<string | undefined>(initialLessonId);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [expandedLessonIds, setExpandedLessonIds] = useState<Set<string>>(
    () => new Set(initialLessonId ? [initialLessonId] : []),
  );

  const selectedLessonId = pickedLessonId && lessons.some((l) => l._id === pickedLessonId) ? pickedLessonId : defaultLessonId;
  const selectedLesson = lessons.find((l) => l._id === selectedLessonId);
  const chapterItems = selectedLesson ? sortedItems(selectedLesson) : [];

  const flatEntries = useMemo<Entry[]>(
    () => lessons.flatMap((lesson) => [{ lessonId: lesson._id, itemId: null }, ...sortedItems(lesson).map((it) => ({ lessonId: lesson._id, itemId: it._id }))]),
    [lessons],
  );

  // Tracks every sidebar row (overview + each item) the student has actually opened, keyed
  // "lessonId:itemId|overview" — this is what makes the "Course content" bar move as soon as
  // you page through with Next, instead of only jumping once a whole lesson is graded complete.
  const [viewedEntryKeys, setViewedEntryKeys] = useState<Set<string>>(() =>
    initialLessonId ? new Set([`${initialLessonId}:overview`]) : new Set(),
  );

  const goToEntry = (entry: Entry) => {
    setPickedLessonId(entry.lessonId);
    setSelectedItemId(entry.itemId);
    setExpandedLessonIds((prev) => (prev.has(entry.lessonId) ? prev : new Set(prev).add(entry.lessonId)));
    setViewedEntryKeys((prev) => {
      const key = `${entry.lessonId}:${entry.itemId ?? "overview"}`;
      return prev.has(key) ? prev : new Set(prev).add(key);
    });
    onNavigate({ name: "lesson", subjectId, chapterId, lessonId: entry.lessonId });
  };

  const toggleLesson = (lessonId: string) => {
    if (lessonId === selectedLessonId) return;
    setExpandedLessonIds((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) next.delete(lessonId);
      else next.add(lessonId);
      return next;
    });
  };

  const {
    data: detail,
    loading: lessonLoading,
    error,
    reload,
  } = useAsync(
    () => getLessonDetail(chapterId, selectedLessonId!),
    [chapterId, selectedLessonId],
    !selectedLessonId,
  );

  useEffect(() => {
    if (selectedLessonId) void markLessonAccessed(chapterId, selectedLessonId);
  }, [chapterId, selectedLessonId]);

  const [watchedVideoIds, setWatchedVideoIds] = useState<Set<string>>(new Set());
  const markVideoWatched = (videoId: string) =>
    setWatchedVideoIds((prev) => (prev.has(videoId) ? prev : new Set(prev).add(videoId)));

  const autoCompletedLessonRef = useRef<string | null>(null);
  const viewedItemIdsForSelected = new Set(
    chapterItems.filter((ci) => viewedEntryKeys.has(`${selectedLessonId}:${ci._id}`)).map((ci) => ci._id),
  );

  useEffect(() => {
    if (!detail || !selectedLessonId || detail.progress.completed) return;
    if (autoCompletedLessonRef.current === selectedLessonId) return;
    if (!isLessonAutoDone(detail, chapterItems, watchedVideoIds, viewedItemIdsForSelected)) return;

    autoCompletedLessonRef.current = selectedLessonId;
    void (async () => {
      await markLessonCompleted(chapterId, selectedLessonId);
      await reloadProgress();
      reload();
    })();
    // chapterItems/viewedItemIdsForSelected are plain derived values recomputed each render from
    // the state already in this dependency list (selectedLessonId, viewedEntryKeys via goToEntry).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, selectedLessonId, watchedVideoIds, viewedEntryKeys, chapterId, reloadProgress, reload]);

  if (curriculumLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-56" />
        <div className="flex flex-col gap-4 lg:flex-row">
          <Skeleton className="h-64 w-full lg:flex-1" />
          <Skeleton className="h-64 w-full lg:w-80" />
        </div>
      </div>
    );
  }

  if (!chapter) {
    return <EmptyState icon={Layers} title="Course not found" description="This course might have been removed." />;
  }

  const totalLessons = chapterLessonCount(chapter);
  const doneLessons = chapterCompletedCount(chapter, progress?.completedLessonIds ?? []);
  const selectedIdx = lessons.findIndex((l) => l._id === selectedLessonId);

  const currentEntryIdx = flatEntries.findIndex((e) => e.lessonId === selectedLessonId && e.itemId === selectedItemId);
  const prevEntry = currentEntryIdx > 0 ? flatEntries[currentEntryIdx - 1] : null;
  const nextEntry = currentEntryIdx >= 0 && currentEntryIdx < flatEntries.length - 1 ? flatEntries[currentEntryIdx + 1] : null;

  // "Course content" progress tracks how much has actually been opened (via sidebar/Next), so it
  // moves immediately as you read through — separate from the stricter per-lesson auto-complete
  // used for the leaderboard, which also waits on quiz/assignment completion.
  const viewedCount = flatEntries.filter((e) => viewedEntryKeys.has(`${e.lessonId}:${e.itemId ?? "overview"}`)).length;
  const pct = flatEntries.length > 0 ? Math.round((viewedCount / flatEntries.length) * 100) : 0;

  const selectedItemIdx = selectedItemId ? chapterItems.findIndex((ci) => ci._id === selectedItemId) : -1;
  const selectedDetailItem = detail && selectedItemIdx >= 0 ? detail.lesson.items[selectedItemIdx] ?? null : null;
  const currentEntryLabel =
    selectedItemId === null ? "Overview" : chapterItems[selectedItemIdx] ? itemLabel(chapterItems, chapterItems[selectedItemIdx]) : "";

  return (
    <div>
      <SectionHeader
        title={chapter.title}
        subtitle={`${doneLessons}/${totalLessons} lessons complete`}
        onBack={() => onNavigate({ name: "subject", subjectId })}
      />

      {lessons.length === 0 ? (
        <EmptyState icon={Layers} title="No lessons yet" description="This course doesn't have any lessons added yet." />
      ) : (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <div className="order-2 min-w-0 flex-1 lg:order-1">
            <CourseOverview description={chapter.description} />

            {lessonLoading || !detail ? (
              <div className="flex flex-col gap-4">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-56 w-full" />
              </div>
            ) : error ? (
              <ErrorState message={error} onRetry={reload} />
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Lesson {selectedIdx + 1} of {lessons.length} · {currentEntryLabel}
                  </p>
                  <h2 className="mt-0.5 font-[family-name:var(--font-display)] text-xl font-extrabold">{detail.lesson.title}</h2>
                </div>

                {selectedItemId === null ? (
                  detail.lesson.description ? (
                    <Card className="p-5">
                      <Markdown content={detail.lesson.description} />
                    </Card>
                  ) : (
                    <EmptyState
                      icon={BookOpen}
                      title="Nothing here yet"
                      description="This lesson doesn't have an overview — pick an item from the sidebar to get started."
                    />
                  )
                ) : selectedDetailItem?.type === "video" ? (
                  <VideoBlock
                    data={selectedDetailItem.data}
                    onWatched={() => selectedDetailItem.data && markVideoWatched(selectedDetailItem.data._id)}
                  />
                ) : selectedDetailItem?.type === "quiz" && selectedDetailItem.data ? (
                  <Card className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-secondary">
                      <HelpCircle size={18} />
                      <p className="font-[family-name:var(--font-display)] font-bold">{selectedDetailItem.data.title}</p>
                      {detail.progress.completedQuizzes[selectedDetailItem.data._id] !== undefined ? (
                        <Badge tone="success">Score: {detail.progress.completedQuizzes[selectedDetailItem.data._id]}%</Badge>
                      ) : null}
                    </div>
                    {selectedDetailItem.data.description ? <Markdown content={selectedDetailItem.data.description} className="mb-3" /> : null}
                    <p className="mb-3 text-xs font-semibold text-muted">{selectedDetailItem.data.questions.length} questions</p>
                    <Button
                      onClick={() =>
                        onNavigate({
                          name: "quiz",
                          subjectId,
                          chapterId,
                          lessonId: selectedLessonId!,
                          quizId: selectedDetailItem.data!._id,
                        })
                      }
                    >
                      {detail.progress.completedQuizzes[selectedDetailItem.data._id] !== undefined ? "Retake quiz" : "Start quiz"}
                    </Button>
                  </Card>
                ) : (selectedDetailItem?.type === "assignment" || selectedDetailItem?.type === "activity") && selectedDetailItem.data ? (
                  <TaskBlock
                    data={selectedDetailItem.data}
                    taskType={selectedDetailItem.type}
                    chapterId={chapterId}
                    lessonId={selectedLessonId!}
                    submitted={detail.progress.submittedTasks[selectedDetailItem.data._id]}
                    onSubmitted={reload}
                  />
                ) : (
                  <EmptyState icon={Layers} title="Not available" description="This item couldn't be loaded." />
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                  <Button variant="outline" onClick={() => prevEntry && goToEntry(prevEntry)} disabled={!prevEntry}>
                    <ChevronLeft size={16} /> Previous
                  </Button>
                  {detail.progress.completed ? (
                    <Badge tone="success" className="px-4 py-2 text-sm">
                      <CheckCircle2 size={15} /> Lesson complete
                    </Badge>
                  ) : (
                    <p className="text-xs font-medium text-muted">Finish every item to complete this lesson</p>
                  )}
                  <Button variant="outline" onClick={() => nextEntry && goToEntry(nextEntry)} disabled={!nextEntry}>
                    Next <ChevronRight size={16} />
                  </Button>
                </div>
              </>
            )}
          </div>

          <aside className="order-1 w-full shrink-0 lg:order-2 lg:w-80">
            <Card className="p-4 lg:sticky lg:top-6">
              <div className="mb-3">
                <p className="font-[family-name:var(--font-display)] text-sm font-bold">Course content</p>
                <div className="mt-2 flex items-center gap-2">
                  <ProgressBar value={pct} className="flex-1" />
                  <span className="shrink-0 text-xs font-semibold text-muted">{pct}%</span>
                </div>
              </div>
              <ol className="flex max-h-[70vh] flex-col gap-0.5 overflow-y-auto pr-1">
                {lessons.map((lesson, idx) => {
                  const isDone = completedLessonIds.has(lesson._id);
                  const isSelectedLesson = lesson._id === selectedLessonId;
                  const isExpanded = isSelectedLesson || expandedLessonIds.has(lesson._id);
                  const items = sortedItems(lesson);

                  return (
                    <li key={lesson._id}>
                      <button
                        onClick={() => toggleLesson(lesson._id)}
                        className={`flex w-full items-center gap-2.5 rounded-lg p-2.5 text-left transition-colors ${
                          isSelectedLesson ? "bg-primary-soft" : "hover:bg-surface-soft"
                        }`}
                      >
                        <div
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold font-[family-name:var(--font-display)] ${
                            isDone ? "bg-success-soft text-success" : isSelectedLesson ? "bg-primary text-white" : "bg-surface-soft text-muted"
                          }`}
                        >
                          {isDone ? <CheckCircle2 size={14} /> : idx + 1}
                        </div>
                        <p className={`min-w-0 flex-1 truncate text-sm font-semibold ${isSelectedLesson ? "text-primary" : "text-foreground"}`}>
                          {lesson.title}
                        </p>
                        <ChevronDown size={15} className={`shrink-0 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {isExpanded ? (
                        <ul className="ml-3.5 mb-1 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-3">
                          <li>
                            <button
                              onClick={() => goToEntry({ lessonId: lesson._id, itemId: null })}
                              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors ${
                                isSelectedLesson && selectedItemId === null
                                  ? "bg-primary-soft text-primary"
                                  : "text-muted hover:bg-surface-soft hover:text-foreground"
                              }`}
                            >
                              <FileText size={14} /> Overview
                            </button>
                          </li>
                          {items.map((item) => {
                            const meta = ITEM_TYPE_META[item.type];
                            const Icon = meta.icon;
                            const active = isSelectedLesson && selectedItemId === item._id;
                            return (
                              <li key={item._id}>
                                <button
                                  onClick={() => goToEntry({ lessonId: lesson._id, itemId: item._id })}
                                  className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] font-medium transition-colors ${
                                    active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-soft hover:text-foreground"
                                  }`}
                                >
                                  <Icon size={14} className={active ? "" : meta.tone} /> {itemLabel(items, item)}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
