"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import {
  BookOpen, Plus, Trash2, Pencil, RotateCcw, GripVertical,
  Video, HelpCircle, ClipboardList, CheckSquare, X, Save,
  ChevronDown, ChevronUp, ChevronRight, Image,
} from "lucide-react";
import { AdminAuthError, fetchAdmin } from "../lib/admin-api";
import { MarkdownEditor } from "./markdown-editor";

type LessonItemType = "video" | "quiz" | "assignment" | "activity";

type Option = {
  _id: string;
  title: string;
};

type LessonItem = {
  _id: string;
  type: LessonItemType;
  refId: string;
  order: number;
};

type ChapterLesson = {
  _id: string;
  title: string;
  description: string;
  descriptionFilePath?: string;
  coverImageFilePath?: string;
  order: number;
  items: LessonItem[];
};

type Chapter = {
  _id: string;
  title: string;
  description: string;
  descriptionFilePath?: string;
  coverImageFilePath?: string;
  lessons: ChapterLesson[];
};

type LessonEditorState = {
  title: string;
  description: string;
  items: LessonItem[];
};

const ITEM_LABEL: Record<LessonItemType, string> = {
  video: "Video",
  quiz: "Quiz",
  assignment: "Assignment",
  activity: "Activity",
};

const ITEM_ICON: Record<LessonItemType, React.ReactNode> = {
  video: <Video size={12} />,
  quiz: <HelpCircle size={12} />,
  assignment: <ClipboardList size={12} />,
  activity: <CheckSquare size={12} />,
};

function CollapsibleMarkdown({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  if (!content?.trim()) {
    return <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: 0, fontStyle: "italic" }}>No description provided.</p>;
  }
  return (
    <div style={{ position: "relative", marginBottom: "1rem" }}>
      <div style={{ position: "relative", overflow: "hidden", maxHeight: expanded ? "none" : "10em", transition: "max-height 0.3s ease" }}>
        <div className="admin-prose">
          <Markdown>{content}</Markdown>
        </div>
        {!expanded && content.length > 300 && (
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "4em",
            background: "var(--surface)",
            pointerEvents: "none",
          }} />
        )}
      </div>
      {content.length > 300 && (
        <button
          onClick={() => setExpanded((p) => !p)}
          className="admin-btn admin-btn-ghost"
          style={{ 
            padding: "0.25rem 0", fontSize: "0.75rem", fontWeight: 700, 
            gap: "0.3rem", color: "var(--admin-accent-text)",
            marginTop: "0.5rem"
          }}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {expanded ? "Show less" : "Read full description"}
        </button>
      )}
    </div>
  );
}

function sortByOrder<T extends { order: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.order - b.order);
}

export function ChaptersView() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [videos, setVideos] = useState<Option[]>([]);
  const [quizzes, setQuizzes] = useState<Option[]>([]);
  const [assignments, setAssignments] = useState<Option[]>([]);
  const [activities, setActivities] = useState<Option[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [expandedChapterId, setExpandedChapterId] = useState<string | null>(null);
  const [dragLesson, setDragLesson] = useState<{ chapterId: string; lessonId: string } | null>(null);

  const [showChapterDialog, setShowChapterDialog] = useState(false);
  const [editingChapterObj, setEditingChapterObj] = useState<Chapter | null>(null);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");

  const [showLessonCreateDialog, setShowLessonCreateDialog] = useState(false);
  const [lessonCreateChapterId, setLessonCreateChapterId] = useState<string | null>(null);
  const [lessonCreateTitle, setLessonCreateTitle] = useState("");
  const [lessonCreateDescription, setLessonCreateDescription] = useState("");

  const [showLessonEditDialog, setShowLessonEditDialog] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [dragItemKey, setDragItemKey] = useState<string | null>(null);
  const [lessonEditor, setLessonEditor] = useState<LessonEditorState | null>(null);

  const [addItemType, setAddItemType] = useState<LessonItemType>("video");
  const [addItemRefId, setAddItemRefId] = useState("");

  const coverInputRef = useRef<HTMLInputElement>(null);
  const [coverTarget, setCoverTarget] = useState<{ chapterId: string; lessonId?: string } | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const triggerCoverUpload = (chapterId: string, lessonId?: string) => {
    setCoverTarget({ chapterId, lessonId });
    coverInputRef.current?.click();
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !coverTarget) return;
    setCoverUploading(true);
    try {
      const form = new FormData();
      form.append("coverImage", file);
      const url = coverTarget.lessonId
        ? `/chapters/${coverTarget.chapterId}/lessons/${coverTarget.lessonId}/cover`
        : `/chapters/${coverTarget.chapterId}/cover`;
      const res = await fetchAdmin(url, { method: "POST", body: form });
      if (res.ok) {
        const data = await res.json() as { coverImageFilePath: string };
        setChapters((prev) => prev.map((ch) => {
          if (ch._id !== coverTarget.chapterId) return ch;
          if (!coverTarget.lessonId) return { ...ch, coverImageFilePath: data.coverImageFilePath };
          return { ...ch, lessons: ch.lessons.map((l) => l._id === coverTarget.lessonId ? { ...l, coverImageFilePath: data.coverImageFilePath } : l) };
        }));
      }
    } catch { /* ignore */ }
    finally {
      setCoverUploading(false);
      setCoverTarget(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const optionsByType = useMemo(
    () => ({
      video: videos,
      quiz: quizzes,
      assignment: assignments,
      activity: activities,
    }),
    [videos, quizzes, assignments, activities],
  );

  const contentTitle = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of videos) map.set(`video:${item._id}`, item.title);
    for (const item of quizzes) map.set(`quiz:${item._id}`, item.title);
    for (const item of assignments) map.set(`assignment:${item._id}`, item.title);
    for (const item of activities) map.set(`activity:${item._id}`, item.title);
    return (type: LessonItemType, refId: string) => map.get(`${type}:${refId}`) || "Missing content";
  }, [videos, quizzes, assignments, activities]);

  const findChapter = (chapterId: string) => chapters.find((chapter) => chapter._id === chapterId) || null;

  const fetchAll = async () => {
    setLoading(true);
    setError("");

    try {
      const [chaptersRes, lessonsRes, quizzesRes, assignmentsRes, activitiesRes] = await Promise.all([
        fetchAdmin("/chapters"),
        fetchAdmin("/lessons"),
        fetchAdmin("/quizzes"),
        fetchAdmin("/assignments"),
        fetchAdmin("/activities"),
      ]);

      const [chaptersData, lessonsData, quizzesData, assignmentsData, activitiesData] = await Promise.all([
        chaptersRes.ok ? chaptersRes.json() : [],
        lessonsRes.ok ? lessonsRes.json() : [],
        quizzesRes.ok ? quizzesRes.json() : [],
        assignmentsRes.ok ? assignmentsRes.json() : [],
        activitiesRes.ok ? activitiesRes.json() : [],
      ]);

      const chapterRows = Array.isArray(chaptersData) ? (chaptersData as Chapter[]) : [];
      setChapters(chapterRows);

      const lessonRows = Array.isArray(lessonsData) ? lessonsData : [];
      setVideos(
        lessonRows
          .filter((row: { _id?: string; title?: string; type?: string }) => row?._id && row?.title && row?.type === "video")
          .map((row: { _id: string; title: string }) => ({ _id: row._id, title: row.title })),
      );
      setQuizzes(
        (Array.isArray(quizzesData) ? quizzesData : [])
          .filter((row: { _id?: string; title?: string }) => row?._id && row?.title)
          .map((row: { _id: string; title: string }) => ({ _id: row._id, title: row.title })),
      );
      setAssignments(
        (Array.isArray(assignmentsData) ? assignmentsData : [])
          .filter((row: { _id?: string; title?: string }) => row?._id && row?.title)
          .map((row: { _id: string; title: string }) => ({ _id: row._id, title: row.title })),
      );
      setActivities(
        (Array.isArray(activitiesData) ? activitiesData : [])
          .filter((row: { _id?: string; title?: string }) => row?._id && row?.title)
          .map((row: { _id: string; title: string }) => ({ _id: row._id, title: row.title })),
      );
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        setError("Failed to load curriculum data.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchAll();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const openCreateChapterDialog = () => {
    setEditingChapterObj(null);
    setChapterTitle("");
    setChapterDescription("");
    setShowChapterDialog(true);
  };
  
  const openEditChapterDialog = (chapter: Chapter) => {
    setEditingChapterObj(chapter);
    setChapterTitle(chapter.title);
    setChapterDescription(chapter.description);
    setShowChapterDialog(true);
  };
  
  const saveChapter = async () => {
    if (!chapterTitle.trim()) return;
  
    try {
      const payload = {
        title: chapterTitle.trim(),
        description: chapterDescription,
      };
      
      const res = editingChapterObj
        ? await fetchAdmin(`/chapters/${editingChapterObj._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetchAdmin("/chapters", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
  
      if (res.ok) {
        await fetchAll();
        setShowChapterDialog(false);
      }
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        setError(editingChapterObj ? "Could not update chapter." : "Could not create chapter.");
      }
    }
  };

  const removeChapter = async (chapterId: string) => {
    if (!window.confirm("Delete this chapter and all its lessons?")) return;

    try {
      const res = await fetchAdmin(`/chapters/${chapterId}`, { method: "DELETE" });
      if (res.ok) {
        setChapters((prev) => prev.filter((chapter) => chapter._id !== chapterId));
      }
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        setError("Could not delete chapter.");
      }
    }
  };

  const openCreateLessonDialog = (chapterId: string) => {
    setLessonCreateChapterId(chapterId);
    setLessonCreateTitle("");
    setLessonCreateDescription("");
    setShowLessonCreateDialog(true);
  };

  const createLesson = async () => {
    if (!lessonCreateChapterId || !lessonCreateTitle.trim()) return;

    try {
      const res = await fetchAdmin(`/chapters/${lessonCreateChapterId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonCreateTitle.trim(),
          description: lessonCreateDescription,
        }),
      });

      if (res.ok) {
        const updated = (await res.json()) as Chapter;
        setChapters((prev) => prev.map((chapter) => (chapter._id === updated._id ? updated : chapter)));
        setShowLessonCreateDialog(false);
      }
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        setError("Could not create lesson.");
      }
    }
  };

  const openEditLessonDialog = (chapterId: string, lessonId: string) => {
    const chapter = findChapter(chapterId);
    const lesson = chapter?.lessons.find((entry) => entry._id === lessonId);
    if (!chapter || !lesson) return;

    const items = sortByOrder(lesson.items).map((item, idx) => ({ ...item, order: idx }));
    setEditingChapterId(chapterId);
    setEditingLessonId(lessonId);
    setLessonEditor({
      title: lesson.title,
      description: lesson.description,
      items,
    });
    setAddItemType("video");
    const firstVideoId = videos[0]?._id || "";
    setAddItemRefId(firstVideoId);
    setShowLessonEditDialog(true);
  };

  const removeLesson = async (chapterId: string, lessonId: string) => {
    if (!window.confirm("Delete this lesson?")) return;

    try {
      const res = await fetchAdmin(`/chapters/${chapterId}/lessons/${lessonId}`, { method: "DELETE" });
      if (res.ok) {
        const updated = (await res.json()) as Chapter;
        setChapters((prev) => prev.map((chapter) => (chapter._id === updated._id ? updated : chapter)));
      }
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        setError("Could not delete lesson.");
      }
    }
  };

  const reorderLessons = async (chapterId: string, draggedLessonId: string, targetLessonId: string) => {
    if (draggedLessonId === targetLessonId) return;

    const chapter = findChapter(chapterId);
    if (!chapter) return;

    const list = sortByOrder(chapter.lessons);
    const from = list.findIndex((lesson) => lesson._id === draggedLessonId);
    const to = list.findIndex((lesson) => lesson._id === targetLessonId);
    if (from < 0 || to < 0) return;

    const next = [...list];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    const lessonIds = next.map((lesson) => lesson._id);

    try {
      const res = await fetchAdmin(`/chapters/${chapterId}/lessons/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonIds }),
      });

      if (res.ok) {
        const updated = (await res.json()) as Chapter;
        setChapters((prev) => prev.map((chapterRow) => (chapterRow._id === updated._id ? updated : chapterRow)));
      }
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        setError("Could not reorder lessons.");
      }
    }
  };

  const addLessonItem = () => {
    if (!lessonEditor || !addItemRefId) return;

    const next = [
      ...lessonEditor.items,
      {
        _id: `temp-${Date.now()}`,
        type: addItemType,
        refId: addItemRefId,
        order: lessonEditor.items.length,
      },
    ];

    setLessonEditor({ ...lessonEditor, items: next });
  };

  const onItemTypeChange = (nextType: LessonItemType) => {
    setAddItemType(nextType);
    setAddItemRefId(optionsByType[nextType][0]?._id || "");
  };

  const reorderEditorItems = (draggedKey: string, targetKey: string) => {
    if (!lessonEditor || draggedKey === targetKey) return;

    const from = lessonEditor.items.findIndex((item, idx) => `${item.type}:${item.refId}:${idx}` === draggedKey);
    const to = lessonEditor.items.findIndex((item, idx) => `${item.type}:${item.refId}:${idx}` === targetKey);
    if (from < 0 || to < 0) return;

    const next = [...lessonEditor.items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    setLessonEditor({
      ...lessonEditor,
      items: next.map((item, idx) => ({ ...item, order: idx })),
    });
  };

  const removeEditorItem = (index: number) => {
    if (!lessonEditor) return;
    const next = lessonEditor.items.filter((_, idx) => idx !== index).map((item, idx) => ({ ...item, order: idx }));
    setLessonEditor({ ...lessonEditor, items: next });
  };

  const saveLessonEditor = async () => {
    if (!lessonEditor || !editingChapterId || !editingLessonId || !lessonEditor.title.trim()) return;

    try {
      const res = await fetchAdmin(`/chapters/${editingChapterId}/lessons/${editingLessonId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: lessonEditor.title.trim(),
          description: lessonEditor.description,
          items: lessonEditor.items.map((item) => ({
            type: item.type,
            refId: item.refId,
          })),
        }),
      });

      if (res.ok) {
        const updated = (await res.json()) as Chapter;
        setChapters((prev) => prev.map((chapter) => (chapter._id === updated._id ? updated : chapter)));
        setShowLessonEditDialog(false);
      } else {
        const payload = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        const message = Array.isArray(payload.message) ? payload.message.join(", ") : payload.message || "Could not save lesson.";
        setError(message);
      }
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        setError("Could not save lesson.");
      }
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "1.5rem 0" }}>
      <div style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "center", 
        gap: "1.5rem", marginBottom: "2rem", padding: "1.5rem", 
        background: "var(--surface)", borderRadius: "1rem", border: "1px solid var(--border)",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div style={{ 
            width: 52, height: 52, borderRadius: "1rem", 
            background: "var(--admin-accent)", 
            display: "grid", placeItems: "center", color: "#fff",
            boxShadow: "0 4px 12px var(--admin-accent-ring)"
          }}>
            <ClipboardList size={28} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, letterSpacing: "-0.02em" }}>Curriculum Builder</h1>
            <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.875rem", fontWeight: 500 }}>
              Design your course structure. Manage chapters, lessons, and content items.
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="admin-btn admin-btn-secondary" onClick={() => void fetchAll()}><RotateCcw size={16} /> Refresh</button>
          <button className="admin-btn admin-btn-primary" style={{ padding: "0.6rem 1.25rem", fontSize: "0.875rem" }} onClick={openCreateChapterDialog}><Plus size={18} /> New Chapter</button>
        </div>
      </div>

      {error && (
        <div className="admin-card" style={{ marginBottom: "0.9rem", padding: "0.75rem 1rem", borderColor: "var(--admin-danger)", color: "var(--admin-danger)" }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--muted)" }}>Loading curriculum...</div>
      ) : chapters.length === 0 ? (
        <div className="admin-card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--muted)" }}>No chapters yet.</div>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {/* Hidden cover image input */}
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => void handleCoverFileChange(e)} />
          {chapters.map((chapter, chapterIdx) => (
            <div key={chapter._id} className="admin-card" style={{ overflow: "hidden" }}>
              <div
                style={{
                  padding: "1.25rem 1.5rem",
                  background: expandedChapterId === chapter._id ? "var(--admin-accent-soft)" : "var(--surface-soft)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onClick={() => setExpandedChapterId((prev) => (prev === chapter._id ? null : chapter._id))}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ 
                    width: 40, height: 40, borderRadius: "0.75rem", 
                    background: "var(--surface)", display: "grid", placeItems: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)", border: "1px solid var(--border)"
                  }}>
                    <BookOpen size={20} style={{ color: "var(--admin-accent)" }} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800 }}>
                      Chapter {chapterIdx + 1}: {chapter.title}
                    </h3>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--muted)", fontWeight: 500 }}>
                      {chapter.lessons.length} lessons · {chapter.lessons.reduce((acc, l) => acc + l.items.length, 0)} items
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <button className="admin-btn admin-btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }} onClick={(e) => { e.stopPropagation(); openEditChapterDialog(chapter); }}><Pencil size={14} /> Edit</button>
                  <button className="admin-btn admin-btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }} title={chapter.coverImageFilePath ? "Change cover" : "Add cover image"} onClick={(e) => { e.stopPropagation(); triggerCoverUpload(chapter._id); }} disabled={coverUploading}>
                    {chapter.coverImageFilePath ? <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}${chapter.coverImageFilePath}`} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: "cover" }} /> : <Image size={14} />}
                    {coverUploading && coverTarget?.chapterId === chapter._id && !coverTarget?.lessonId ? "Uploading…" : "Cover"}
                  </button>
                  <button className="admin-btn admin-btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }} onClick={(e) => { e.stopPropagation(); openCreateLessonDialog(chapter._id); }}><Plus size={14} /> Add Lesson</button>
                  <button className="admin-btn admin-btn-danger" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }} onClick={(e) => { e.stopPropagation(); void removeChapter(chapter._id); }}><Trash2 size={14} /> Delete</button>
                  <div style={{ marginLeft: "0.5rem", width: 32, height: 32, borderRadius: "50%", background: "var(--surface)", display: "grid", placeItems: "center", border: "1px solid var(--border)" }}>
                    {expandedChapterId === chapter._id ? <ChevronUp size={18} style={{ color: "var(--muted)" }} /> : <ChevronDown size={18} style={{ color: "var(--muted)" }} />}
                  </div>
                </div>
              </div>

              {expandedChapterId === chapter._id && (
                <div style={{ padding: "1rem" }}>
                  <div style={{ margin: "0 0 0.8rem", fontSize: "0.82rem" }}>
                    <CollapsibleMarkdown content={chapter.description} />
                  </div>

                  <div style={{ display: "grid", gap: "0.5rem" }}>
                    {sortByOrder(chapter.lessons).map((lesson, idx) => (
                      <div
                        key={lesson._id}
                        draggable
                        onDragStart={() => setDragLesson({ chapterId: chapter._id, lessonId: lesson._id })}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (!dragLesson || dragLesson.chapterId !== chapter._id) return;
                          void reorderLessons(chapter._id, dragLesson.lessonId, lesson._id);
                          setDragLesson(null);
                        }}
                        style={{
                          borderBottom: idx === chapter.lessons.length - 1 ? "none" : "1px solid var(--border)",
                          padding: "1rem 0.5rem",
                          background: "transparent",
                          cursor: "grab",
                          transition: "all 0.2s",
                        }}
                        className="hover:bg-surface-soft"
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "1rem", minWidth: 0 }}>
                            <div style={{ color: "var(--muted)", flexShrink: 0, display: "grid", placeItems: "center" }}>
                              <GripVertical size={18} />
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem", color: "var(--foreground)" }}>
                                Lesson {idx + 1}: {lesson.title}
                              </p>
                              <div style={{ margin: "0.3rem 0 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--muted)", fontSize: "0.75rem", fontWeight: 500 }}>
                                  <Video size={13} /> {lesson.items.filter(i => i.type === 'video').length}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--muted)", fontSize: "0.75rem", fontWeight: 500 }}>
                                  <HelpCircle size={13} /> {lesson.items.filter(i => i.type === 'quiz').length}
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "var(--muted)", fontSize: "0.75rem", fontWeight: 500 }}>
                                  <ClipboardList size={13} /> {lesson.items.filter(i => i.type === 'assignment').length}
                                </span>
                                <span style={{ width: 1, height: 12, background: "var(--border)" }} />
                                <span style={{ color: "var(--admin-accent-text)", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.02em" }}>
                                  {lesson.items.length} items total
                                </span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="admin-btn admin-btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }} onClick={() => openEditLessonDialog(chapter._id, lesson._id)}>
                              <Pencil size={14} /> Edit
                            </button>
                            <button className="admin-btn admin-btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }} title={lesson.coverImageFilePath ? "Change cover" : "Add cover"} onClick={() => triggerCoverUpload(chapter._id, lesson._id)} disabled={coverUploading}>
                              {lesson.coverImageFilePath ? <img src={`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001"}${lesson.coverImageFilePath}`} alt="" style={{ width: 14, height: 14, borderRadius: 3, objectFit: "cover" }} /> : <Image size={14} />}
                              Cover
                            </button>
                            <button className="admin-btn admin-btn-danger" style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }} onClick={() => void removeLesson(chapter._id, lesson._id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showChapterDialog && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1200, display: "grid", placeItems: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.58)" }} onClick={() => setShowChapterDialog(false)} />
          <div className="admin-card" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 640, padding: "1.25rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>{editingChapterObj ? "Edit Chapter" : "Create Chapter"}</h3>
            <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
              <div>
                <label className="admin-label">Chapter Title</label>
                <input className="admin-input" placeholder="e.g. Python for Beginners" value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="admin-label">Chapter Description (Markdown)</label>
                <MarkdownEditor
                  value={chapterDescription}
                  onChange={setChapterDescription}
                  minHeight={220}
                  maxHeight={400}
                  placeholder="# Chapter overview\n\nDescribe what this chapter covers..."
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setShowChapterDialog(false)}><X size={14} /> Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={() => void saveChapter()}>
                  {editingChapterObj ? <Save size={14} /> : <Plus size={14} />}
                  {editingChapterObj ? "Save Changes" : "Create Chapter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLessonCreateDialog && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1250, display: "grid", placeItems: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.58)" }} onClick={() => setShowLessonCreateDialog(false)} />
          <div className="admin-card" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 760, padding: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Create Lesson</h3>
            <div style={{ display: "grid", gap: "0.7rem", marginTop: "0.8rem" }}>
              <input className="admin-input" placeholder="Lesson title" value={lessonCreateTitle} onChange={(e) => setLessonCreateTitle(e.target.value)} autoFocus />
              <div>
                <label className="admin-label">Lesson Description (Markdown)</label>
                <MarkdownEditor
                  value={lessonCreateDescription}
                  onChange={setLessonCreateDescription}
                  minHeight={220}
                  maxHeight={400}
                  placeholder="# Lesson intro\n\nWrite lesson overview in markdown..."
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setShowLessonCreateDialog(false)}><X size={14} /> Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={() => void createLesson()}><BookOpen size={14} /> Create Lesson</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showLessonEditDialog && lessonEditor && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "grid", placeItems: "center", padding: "1rem" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setShowLessonEditDialog(false)} />
          <div className="admin-card" style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 980, maxHeight: "90vh", overflowY: "auto", padding: "1rem" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Edit Lesson Structure</h3>
            <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.75rem" }}>
              Drag and drop to reorder. IDs are linked via content `refId` values when you save.
            </p>

            <div style={{ display: "grid", gap: "0.8rem", marginTop: "0.8rem" }}>
              <input className="admin-input" value={lessonEditor.title} onChange={(e) => setLessonEditor({ ...lessonEditor, title: e.target.value })} placeholder="Lesson title" />

              <div>
                <label className="admin-label">Lesson Description (Markdown)</label>
                <MarkdownEditor
                  value={lessonEditor.description}
                  onChange={(v) => setLessonEditor({ ...lessonEditor, description: v })}
                  minHeight={240}
                  maxHeight={400}
                  placeholder="# Lesson\n\nThis lesson covers..."
                />
              </div>

              <div className="admin-card" style={{ padding: "0.8rem", borderStyle: "dashed" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: "0.5rem", alignItems: "center" }}>
                  <select className="admin-select" value={addItemType} onChange={(e) => onItemTypeChange(e.target.value as LessonItemType)}>
                    <option value="video">Video</option>
                    <option value="quiz">Quiz</option>
                    <option value="assignment">Assignment</option>
                    <option value="activity">Activity</option>
                  </select>
                  <select className="admin-select" value={addItemRefId} onChange={(e) => setAddItemRefId(e.target.value)}>
                    {(optionsByType[addItemType] || []).map((option) => (
                      <option key={option._id} value={option._id}>{option.title}</option>
                    ))}
                  </select>
                <button className="admin-btn admin-btn-secondary" onClick={addLessonItem}><Plus size={13} /> Add Item</button>
                </div>
              </div>

              <div style={{ display: "grid", gap: "0.45rem" }}>
                {lessonEditor.items.length === 0 && (
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.8rem" }}>No lesson items yet.</p>
                )}

                {lessonEditor.items.map((item, idx) => {
                  const key = `${item.type}:${item.refId}:${idx}`;
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => setDragItemKey(key)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (!dragItemKey) return;
                        reorderEditorItems(dragItemKey, key);
                        setDragItemKey(null);
                      }}
                      style={{
                        border: "1px solid var(--border)",
                        borderRadius: "0.6rem",
                        padding: "0.65rem",
                        display: "flex",
                        justifyContent: "space-between",
                        gap: "0.5rem",
                        alignItems: "center",
                        cursor: "grab",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
                        <GripVertical size={13} style={{ color: "var(--muted)", flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "0.83rem", fontWeight: 700 }}>
                            {idx + 1}. {contentTitle(item.type, item.refId)}
                          </p>
                          <p style={{ margin: "0.2rem 0 0", fontSize: "0.73rem", color: "var(--muted)", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            {ITEM_ICON[item.type]} {ITEM_LABEL[item.type]}
                          </p>
                        </div>
                      </div>
                      <button className="admin-btn admin-btn-danger" onClick={() => removeEditorItem(idx)}><X size={13} /> Remove</button>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button className="admin-btn admin-btn-ghost" onClick={() => setShowLessonEditDialog(false)}><X size={14} /> Cancel</button>
                <button className="admin-btn admin-btn-primary" onClick={() => void saveLessonEditor()}><Save size={14} /> Save Lesson</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
