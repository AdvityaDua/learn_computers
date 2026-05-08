"use client";

import React, { useState } from "react";

type ActivityType = "quiz" | "assignment" | "activity";

interface SubLesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  quizzes: string[];
  assignments: string[];
  activities: string[];
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  subLessons: SubLesson[];
}

const EMPTY_LESSON: Omit<SubLesson, "id"> = {
  title: "", description: "", videoUrl: "",
  quizzes: [], assignments: [], activities: [],
};

const MOCK_UPLOADS = [
  { id: "v1", name: "Intro to Hardware.mp4", type: "video" },
  { id: "v2", name: "How Internet Works.mp4", type: "video" },
  { id: "v3", name: "OS Basics.mp4", type: "video" },
  { id: "v4", name: "Networking Lecture.mp4", type: "video" },
];

function Icon({ d, size = 15 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function ActivityTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.25rem",
      background: "var(--admin-accent-soft)", color: "var(--admin-accent-text)",
      border: "1px solid var(--admin-accent-soft-border)",
      padding: "0.175rem 0.5rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600,
    }}>
      {label}
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--admin-accent-text)", padding: 0, lineHeight: 1, marginLeft: 2 }}>×</button>
    </span>
  );
}

function LessonEditor({
  lesson,
  onChange,
  onClose,
}: {
  lesson: Omit<SubLesson, "id">;
  onChange: (l: Omit<SubLesson, "id">) => void;
  onClose: () => void;
}) {
  const [newQuiz, setNewQuiz] = useState("");
  const [newAssign, setNewAssign] = useState("");
  const [newActivity, setNewActivity] = useState("");
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  const addItem = (type: ActivityType) => {
    if (type === "quiz" && newQuiz.trim()) {
      onChange({ ...lesson, quizzes: [...lesson.quizzes, newQuiz.trim()] });
      setNewQuiz("");
    } else if (type === "assignment" && newAssign.trim()) {
      onChange({ ...lesson, assignments: [...lesson.assignments, newAssign.trim()] });
      setNewAssign("");
    } else if (type === "activity" && newActivity.trim()) {
      onChange({ ...lesson, activities: [...lesson.activities, newActivity.trim()] });
      setNewActivity("");
    }
  };

  const removeItem = (type: ActivityType, idx: number) => {
    if (type === "quiz") onChange({ ...lesson, quizzes: lesson.quizzes.filter((_, i) => i !== idx) });
    else if (type === "assignment") onChange({ ...lesson, assignments: lesson.assignments.filter((_, i) => i !== idx) });
    else onChange({ ...lesson, activities: lesson.activities.filter((_, i) => i !== idx) });
  };

  const Row = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <div style={{ marginBottom: "0.875rem" }}>
      <label className="admin-label">{label}</label>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
        <input
          className="admin-input"
          placeholder={`Enter ${label.toLowerCase()}…`}
          value={value}
          onChange={(e) => {
            const map: Record<string, string> = { "Lesson Title": "title", "Description": "description" };
            if (map[label]) onChange({ ...lesson, [map[label]]: e.target.value });
          }}
        />
      </div>
    </div>
  );

  const ActivityRow = ({
    label, items, type, val, setVal,
  }: { label: string; items: string[]; type: ActivityType; val: string; setVal: (v: string) => void }) => (
    <div style={{ marginBottom: "0.875rem" }}>
      <label className="admin-label">{label}</label>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.375rem" }}>
        <input className="admin-input" placeholder={`Add ${label.slice(0, -1)}…`} value={val} onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem(type)} style={{ flex: 1 }} />
        <button className="admin-btn admin-btn-secondary" onClick={() => addItem(type)}>Add</button>
      </div>
      {items.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
          {items.map((item, i) => (
            <ActivityTag key={i} label={item} onRemove={() => removeItem(type, i)} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "0.75rem",
      padding: "1.25rem", marginTop: "0.75rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--foreground)" }}>Edit Sub-Lesson</span>
        <button className="admin-btn admin-btn-ghost" onClick={onClose} style={{ fontSize: "0.75rem" }}>✕ Close</button>
      </div>

      <div style={{ marginBottom: "0.875rem" }}>
        <label className="admin-label">Lesson Title</label>
        <input className="admin-input" placeholder="Enter lesson title…" value={lesson.title}
          onChange={(e) => onChange({ ...lesson, title: e.target.value })} />
      </div>

      <div style={{ marginBottom: "0.875rem" }}>
        <label className="admin-label">Description</label>
        <textarea className="admin-textarea" placeholder="Describe what students will learn…" value={lesson.description}
          onChange={(e) => onChange({ ...lesson, description: e.target.value })} style={{ minHeight: 64 }} />
      </div>

      <div style={{ marginBottom: "0.875rem" }}>
        <label className="admin-label">Video</label>
        {lesson.videoUrl ? (
          <div style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            background: "var(--admin-accent-soft)", border: "1px solid var(--admin-accent-soft-border)",
            borderRadius: "0.5rem", padding: "0.625rem 0.875rem",
          }}>
            <Icon d="M15 10l4.553-2.369A1 1 0 0 1 21 8.535v6.93a1 1 0 0 1-1.447.904L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
            <span style={{ fontSize: "0.8125rem", flex: 1, color: "var(--admin-accent-text)", fontWeight: 600 }}>{lesson.videoUrl}</span>
            <button className="admin-btn admin-btn-ghost" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
              onClick={() => { onChange({ ...lesson, videoUrl: "" }); setShowVideoPicker(false); }}>
              Remove
            </button>
          </div>
        ) : (
          <button className="admin-btn admin-btn-secondary" style={{ width: "100%", justifyContent: "center" }}
            onClick={() => setShowVideoPicker(!showVideoPicker)}>
            <Icon d="M15 10l4.553-2.369A1 1 0 0 1 21 8.535v6.93a1 1 0 0 1-1.447.904L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" />
            Select from Uploads
          </button>
        )}

        {showVideoPicker && (
          <div style={{
            marginTop: "0.5rem", border: "1px solid var(--border)", borderRadius: "0.5rem",
            overflow: "hidden", background: "var(--surface)",
          }}>
            {MOCK_UPLOADS.filter((u) => u.type === "video").map((u) => (
              <button key={u.id} onClick={() => { onChange({ ...lesson, videoUrl: u.name }); setShowVideoPicker(false); }}
                style={{
                  display: "flex", alignItems: "center", gap: "0.625rem",
                  width: "100%", padding: "0.625rem 0.875rem", background: "none",
                  border: "none", borderBottom: "1px solid var(--border)", cursor: "pointer",
                  textAlign: "left", fontSize: "0.8125rem", color: "var(--foreground)",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-soft)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                <Icon d="M15 10l4.553-2.369A1 1 0 0 1 21 8.535v6.93a1 1 0 0 1-1.447.904L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" size={13} />
                {u.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <ActivityRow label="Quizzes" items={lesson.quizzes} type="quiz" val={newQuiz} setVal={setNewQuiz} />
      <ActivityRow label="Assignments" items={lesson.assignments} type="assignment" val={newAssign} setVal={setNewAssign} />
      <ActivityRow label="Activities" items={lesson.activities} type="activity" val={newActivity} setVal={setNewActivity} />
    </div>
  );
}

export function ChaptersView() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<{ chapterId: string; lessonId: string | null } | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [newChapterDesc, setNewChapterDesc] = useState("");
  const [showAddChapter, setShowAddChapter] = useState(false);

  const addChapter = () => {
    if (!newChapterTitle.trim()) return;
    const ch: Chapter = {
      id: Date.now().toString(), title: newChapterTitle.trim(),
      description: newChapterDesc.trim(), subLessons: [],
    };
    setChapters([...chapters, ch]);
    setNewChapterTitle(""); setNewChapterDesc(""); setShowAddChapter(false);
  };

  const addLesson = (chapterId: string) => {
    const lesson: SubLesson = { id: Date.now().toString(), ...EMPTY_LESSON };
    setChapters(chapters.map((c) => c.id === chapterId ? { ...c, subLessons: [...c.subLessons, lesson] } : c));
    setEditingLesson({ chapterId, lessonId: lesson.id });
  };

  const updateLesson = (chapterId: string, lessonId: string, data: Omit<SubLesson, "id">) => {
    setChapters(chapters.map((c) => c.id === chapterId
      ? { ...c, subLessons: c.subLessons.map((l) => l.id === lessonId ? { id: lessonId, ...data } : l) }
      : c));
  };

  const deleteLesson = (chapterId: string, lessonId: string) => {
    setChapters(chapters.map((c) => c.id === chapterId
      ? { ...c, subLessons: c.subLessons.filter((l) => l.id !== lessonId) }
      : c));
    if (editingLesson?.lessonId === lessonId) setEditingLesson(null);
  };

  const deleteChapter = (id: string) => setChapters(chapters.filter((c) => c.id !== id));

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--foreground)" }}>Chapters & Lessons</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted)", marginTop: "0.2rem" }}>
            Create chapters, add sub-lessons, attach videos and learning activities.
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => setShowAddChapter(true)}>
          <Icon d="M12 5v14M5 12h14" size={14} /> New Chapter
        </button>
      </div>

      {/* Add chapter form */}
      {showAddChapter && (
        <div className="admin-card" style={{ padding: "1.25rem", marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, marginBottom: "0.875rem", color: "var(--foreground)" }}>New Chapter</p>
          <div style={{ marginBottom: "0.625rem" }}>
            <label className="admin-label">Chapter Title</label>
            <input className="admin-input" placeholder="e.g. Introduction to Hardware" value={newChapterTitle} onChange={(e) => setNewChapterTitle(e.target.value)} />
          </div>
          <div style={{ marginBottom: "0.875rem" }}>
            <label className="admin-label">Description</label>
            <textarea className="admin-textarea" placeholder="Brief overview of this chapter…" value={newChapterDesc} onChange={(e) => setNewChapterDesc(e.target.value)} style={{ minHeight: 56 }} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button className="admin-btn admin-btn-primary" onClick={addChapter}>Create Chapter</button>
            <button className="admin-btn admin-btn-ghost" onClick={() => setShowAddChapter(false)}>Cancel</button>
          </div>
        </div>
      )}

      {chapters.length === 0 && !showAddChapter && (
        <div className="admin-card" style={{ padding: "3rem", textAlign: "center" }}>
          <div className="admin-accent-soft-bg" style={{ width: 48, height: 48, borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.875rem" }}>
            <Icon d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5v-13z" size={22} />
          </div>
          <p style={{ fontWeight: 700, color: "var(--foreground)", fontSize: "0.9375rem" }}>No chapters yet</p>
          <p style={{ color: "var(--muted)", fontSize: "0.8125rem", marginTop: "0.25rem" }}>Create your first chapter to get started.</p>
        </div>
      )}

      {/* Chapter list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {chapters.map((chapter, ci) => {
          const isOpen = expandedChapter === chapter.id;
          return (
            <div key={chapter.id} className="admin-card">
              {/* Chapter header */}
              <div
                className="admin-accordion-header"
                onClick={() => setExpandedChapter(isOpen ? null : chapter.id)}
                style={{ borderBottom: isOpen ? "1px solid var(--border)" : "none" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                  <span className="admin-badge admin-badge-blue">{ci + 1}</span>
                  <div>
                    <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--foreground)" }}>{chapter.title}</p>
                    {chapter.description && (
                      <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.1rem" }}>{chapter.description}</p>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span className="admin-badge admin-badge-gray">{chapter.subLessons.length} lessons</span>
                  <button className="admin-btn admin-btn-ghost" style={{ padding: "0.25rem" }}
                    onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }}>
                    <Icon d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2" size={13} />
                  </button>
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "var(--muted)" }}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </div>

              {/* Sub-lessons */}
              {isOpen && (
                <div style={{ padding: "0.75rem" }}>
                  {chapter.subLessons.map((lesson) => {
                    const isEditing = editingLesson?.chapterId === chapter.id && editingLesson?.lessonId === lesson.id;
                    return (
                      <div key={lesson.id} style={{ marginBottom: "0.5rem" }}>
                        <div style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          background: "var(--surface-soft)", borderRadius: "0.5rem",
                          padding: "0.625rem 0.875rem", border: "1px solid var(--border)",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", minWidth: 0 }}>
                            <Icon d="M15 10l4.553-2.369A1 1 0 0 1 21 8.535v6.93a1 1 0 0 1-1.447.904L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" size={13} />
                            <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {lesson.title || "Untitled Lesson"}
                            </span>
                            {lesson.videoUrl && <span className="admin-badge admin-badge-blue" style={{ flexShrink: 0 }}>Video</span>}
                            {lesson.quizzes.length > 0 && <span className="admin-badge admin-badge-green" style={{ flexShrink: 0 }}>{lesson.quizzes.length} Quiz</span>}
                            {lesson.assignments.length > 0 && <span className="admin-badge admin-badge-yellow" style={{ flexShrink: 0 }}>{lesson.assignments.length} Assign</span>}
                          </div>
                          <div style={{ display: "flex", gap: "0.375rem", flexShrink: 0 }}>
                            <button className="admin-btn admin-btn-secondary" style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                              onClick={() => setEditingLesson(isEditing ? null : { chapterId: chapter.id, lessonId: lesson.id })}>
                              {isEditing ? "Done" : "Edit"}
                            </button>
                            <button className="admin-btn admin-btn-ghost" style={{ padding: "0.25rem" }}
                              onClick={() => deleteLesson(chapter.id, lesson.id)}>
                              <Icon d="M3 6h18M19 6l-1 14H6L5 6M10 6V4h4v2" size={12} />
                            </button>
                          </div>
                        </div>
                        {isEditing && (
                          <LessonEditor
                            lesson={lesson}
                            onChange={(data) => updateLesson(chapter.id, lesson.id, data)}
                            onClose={() => setEditingLesson(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                  <button className="admin-btn admin-btn-secondary" style={{ width: "100%", justifyContent: "center", marginTop: "0.375rem" }}
                    onClick={() => addLesson(chapter.id)}>
                    <Icon d="M12 5v14M5 12h14" size={13} /> Add Sub-Lesson
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
