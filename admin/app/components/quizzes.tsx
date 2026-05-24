"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  Plus,
  Search,
  Pencil,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
} from "lucide-react";
import { AdminAuthError, fetchAdmin } from "../lib/admin-api";
import { MarkdownEditor } from "./markdown-editor";
import { ClassMultiSelect } from "./class-multi-select";

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface Quiz {
  _id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  createdAt: string;
  classIds?: string[];
}

interface QuizForm {
  title: string;
  description: string;
  questions: QuizQuestion[];
  classIds: string[];
}

const blankQuestion = (): QuizQuestion => ({
  question: "",
  options: ["", "", "", ""],
  correctAnswerIndex: 0,
});

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function QuizDialog({
  open,
  editing,
  onClose,
  onSuccess,
}: {
  open: boolean;
  editing: Quiz | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<QuizForm>({
    title: "",
    description: "",
    questions: [blankQuestion()],
    classIds: ["Class 3"],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description ?? "",
        questions: editing.questions.length ? editing.questions.map((q) => ({ ...q, options: [...q.options] })) : [blankQuestion()],
        classIds: editing.classIds || ["Class 3"],
      });
      setError("");
    } else {
      setForm({ title: "", description: "", questions: [blankQuestion()], classIds: ["Class 3"] });
      setError("");
    }
  }, [open, editing]);

  const updateQuestion = (idx: number, patch: Partial<QuizQuestion>) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    }));
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== qIdx) return q;
        const options = [...q.options];
        options[optIdx] = value;
        return { ...q, options };
      }),
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({ ...prev, questions: [...prev.questions, blankQuestion()] }));
  };

  const removeQuestion = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== idx),
    }));
  };

  const validate = (): string | null => {
    if (!form.title.trim()) return "Quiz title is required.";
    if (!form.questions.length) return "Add at least one question.";

    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question.trim()) return `Question ${i + 1} is empty.`;
      const validOptions = q.options.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length < 2) return `Question ${i + 1} needs at least 2 non-empty options.`;
      if (q.correctAnswerIndex < 0 || q.correctAnswerIndex >= q.options.length) {
        return `Question ${i + 1} has invalid correct answer index.`;
      }
      if (!q.options[q.correctAnswerIndex]?.trim()) {
        return `Question ${i + 1} has an empty correct answer option.`;
      }
    }

    return null;
  };

  const save = async () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    const payload: QuizForm = {
      title: form.title.trim(),
      description: form.description.trim(),
      questions: form.questions.map((q) => ({
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        correctAnswerIndex: q.correctAnswerIndex,
      })),
      classIds: form.classIds,
    };

    setSaving(true);
    setError("");
    try {
      const res = editing
        ? await fetchAdmin(`/quizzes/${editing._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetchAdmin("/quizzes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { message?: string | string[] };
        throw new Error(Array.isArray(d.message) ? d.message.join(", ") : (d.message ?? "Failed"));
      }

      onSuccess();
      onClose();
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        setError(err instanceof Error ? err.message : "Could not save quiz");
      }
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1300, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1.25rem", overflowY: "auto" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.62)" }} onClick={() => !saving && onClose()} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 920, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "1rem", boxShadow: "0 28px 70px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        {/* ── Header ── */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "0.875rem", flexShrink: 0 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "0.625rem",
            background: "var(--admin-accent-soft)", color: "var(--admin-accent)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: "var(--foreground)" }}>{editing ? "Edit Quiz" : "Create Quiz"}</h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>Build question sets with options and answer key</p>
          </div>
          <button
            type="button" onClick={onClose}
            style={{
              background: "none", border: "1px solid var(--border)", cursor: "pointer",
              color: "var(--muted)", borderRadius: "0.5rem",
              width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "1.75rem 1.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* §1 Basic Info */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--admin-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>1</div>
              <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700 }}>Basic Information</h3>
            </div>
            <div style={{ display: "grid", gap: "1.25rem" }}>
              <div>
                <label className="admin-label">Quiz Title <span style={{ color: "var(--admin-danger)" }}>*</span></label>
                <input className="admin-input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="e.g. JavaScript Basics Quiz" autoFocus />
              </div>
              <div>
                <label className="admin-label">Description (optional)</label>
                <MarkdownEditor
                  value={form.description}
                  onChange={(v) => setForm((p) => ({ ...p, description: v }))}
                  minHeight={100}
                  placeholder="Short quiz intro..."
                />
              </div>
              <div>
                <label className="admin-label">Assigned Classes</label>
                <ClassMultiSelect 
                  selectedIds={form.classIds} 
                  onChange={(ids) => setForm((p) => ({ ...p, classIds: ids }))} 
                />
              </div>
            </div>
          </section>

          <div style={{ borderTop: "1px solid var(--border)" }} />

          {/* §2 Questions */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--admin-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>2</div>
                <h3 style={{ margin: 0, fontSize: "0.9375rem", fontWeight: 700 }}>Questions Builder</h3>
              </div>
              <button className="admin-btn admin-btn-primary" type="button" onClick={addQuestion} style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}>
                + Add Question
              </button>
            </div>

            <div style={{ display: "grid", gap: "1.5rem" }}>
              {form.questions.map((q, qIdx) => (
                <div key={qIdx} style={{ 
                  border: "1px solid var(--border)", borderRadius: "1rem", 
                  padding: "1.25rem", background: "var(--surface)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="admin-badge admin-badge-blue">Q{qIdx + 1}</span>
                      <strong style={{ fontSize: "0.875rem", color: "var(--foreground)" }}>Question details</strong>
                    </div>
                    {form.questions.length > 1 && (
                      <button 
                        className="admin-btn admin-btn-danger admin-btn-ghost" 
                        type="button" 
                        onClick={() => removeQuestion(qIdx)} 
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", gap: "0.3rem" }}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ marginBottom: "1.25rem" }}>
                    <input
                      className="admin-input"
                      value={q.question}
                      onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                      placeholder="Type the question"
                      style={{ fontWeight: 600, fontSize: "0.95rem" }}
                    />
                  </div>

                  <div style={{ display: "grid", gap: "0.75rem" }}>
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctAnswerIndex === optIdx;
                      const letter = String.fromCharCode(65 + optIdx);
                      return (
                        <div key={optIdx} style={{ 
                          display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "0.875rem", 
                          alignItems: "center", padding: "0.5rem", borderRadius: "0.75rem",
                          border: `1px solid ${isCorrect ? "var(--admin-accent)" : "var(--border)"}`,
                          background: isCorrect ? "var(--admin-accent-soft)" : "transparent",
                          transition: "all 0.2s"
                        }}>
                          <div style={{ 
                            width: 28, height: 28, borderRadius: "50%", 
                            background: isCorrect ? "var(--admin-accent)" : "var(--surface-soft)",
                            color: isCorrect ? "#fff" : "var(--muted)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "0.75rem", fontWeight: 800
                          }}>
                            {letter}
                          </div>
                          <input
                            className="admin-input"
                            value={opt}
                            onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${optIdx + 1}`}
                            style={{ border: "none", padding: "0.25rem 0", background: "transparent", fontWeight: 500 }}
                          />
                          <label style={{ cursor: "pointer", padding: "0.25rem 0.5rem" }}>
                            <input
                              type="radio"
                              name={`correct-${qIdx}`}
                              checked={isCorrect}
                              onChange={() => updateQuestion(qIdx, { correctAnswerIndex: optIdx })}
                              style={{ transform: "scale(1.2)" }}
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {error && (
            <div style={{ 
              background: "var(--admin-danger-soft)", border: "1px solid var(--admin-danger)",
              padding: "0.75rem 1rem", borderRadius: "0.75rem", color: "var(--admin-danger)",
              fontSize: "0.82rem", fontWeight: 700, display: "flex", gap: "0.5rem"
            }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", background: "var(--surface-soft)", padding: "0.9rem 1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button className="admin-btn admin-btn-ghost" type="button" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="admin-btn admin-btn-primary" type="button" onClick={save} disabled={saving}>{saving ? "Saving..." : (editing ? "Save Quiz" : "Create Quiz")}</button>
        </div>
      </div>
    </div>
  );
}

export function QuizzesView() {
  const [items, setItems] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchAll = async (nextPage = page, nextLimit = pageSize, nextSearch = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(nextPage),
        limit: String(nextLimit),
      });
      if (nextSearch.trim()) {
        params.set("search", nextSearch.trim());
      }

      const res = await fetchAdmin(`/quizzes?${params.toString()}`);
      if (res.ok) {
        const payload = await res.json() as
          | Quiz[]
          | { items: Quiz[]; total: number; page: number; limit: number; totalPages: number };

        if (Array.isArray(payload)) {
          setItems(payload);
          setTotal(payload.length);
        } else {
          setItems(payload.items ?? []);
          setTotal(payload.total ?? 0);
          if (payload.page && payload.page !== nextPage) {
            setPage(payload.page);
          }
        }
      }
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAll(page, pageSize, search);
  }, [page, pageSize, search]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = total === 0 ? 0 : pageStart + items.length - 1;

  const remove = async (quiz: Quiz) => {
    const ok = window.confirm(`Delete quiz \"${quiz.title}\"? This cannot be undone.`);
    if (!ok) return;
    setDeletingId(quiz._id);
    try {
      await fetchAdmin(`/quizzes/${quiz._id}`, { method: "DELETE" });
      await fetchAll(page, pageSize, search);
    } catch (err) {
      if (!(err instanceof AdminAuthError)) {
        console.error(err);
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: 1100 }}>
      {/* ── Page Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "var(--foreground)" }}>Quizzes</h1>
          <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.875rem" }}>
            {loading ? "Loading..." : `${total} quiz${total !== 1 ? "zes" : ""}`}
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" type="button" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus size={14} />
          New Quiz
        </button>
      </div>

      {/* ── Search ── */}
      {!loading && total > 0 && (
        <div style={{ position: "relative", maxWidth: 420, marginBottom: "1.5rem" }}>
          <Search size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }} />
          <input 
            className="admin-input" 
            value={search} 
            onChange={(e) => { setPage(1); setSearch(e.target.value); }} 
            placeholder="Search quizzes by title..." 
            style={{ paddingLeft: "2.25rem" }}
          />
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div style={{ padding: "5rem 2rem", textAlign: "center", color: "var(--muted)" }}>
          <svg viewBox="0 0 24 24" width={36} height={36} fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: "qz-spin 1s linear infinite", marginBottom: "0.75rem" }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>Loading quizzes...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="admin-card" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "1.25rem", background: "var(--admin-accent-soft)", color: "var(--admin-accent)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
            <HelpCircle size={32} />
          </div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: "1.125rem", color: "var(--foreground)" }}>{total === 0 ? "No quizzes yet" : "No results found"}</p>
          <p style={{ margin: "0.5rem 0 1.5rem", color: "var(--muted)", fontSize: "0.875rem", maxWidth: 320, marginLeft: "auto", marginRight: "auto" }}>
            {total === 0 ? "Create your first quiz with the builder to start testing your students." : "Try a different search keyword."}
          </p>
          {total === 0 && (
            <button className="admin-btn admin-btn-primary" type="button" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              Create First Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="admin-card" style={{ overflow: "hidden" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Questions</th>
                <th>Classes</th>
                <th>Description</th>
                <th>Created</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((quiz) => (
                <tr key={quiz._id}>
                  <td style={{ fontWeight: 700, color: "var(--foreground)" }}>{quiz.title}</td>
                  <td><span className="admin-badge admin-badge-blue">{quiz.questions.length} Questions</span></td>
                  <td>
                    {quiz.classIds && quiz.classIds.length > 0 ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                        {quiz.classIds.map((cls) => (
                          <span key={cls} className="admin-badge admin-badge-blue" style={{ fontSize: "0.65rem", padding: "0.1rem 0.3rem" }}>{cls}</span>
                        ))}
                      </div>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ color: "var(--muted)", maxWidth: 300 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {quiz.description || <span style={{ fontStyle: "italic", opacity: 0.5 }}>No description</span>}
                    </div>
                  </td>
                  <td style={{ color: "var(--muted)", fontSize: "0.8125rem" }}>{fmtDate(quiz.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                      <button className="admin-btn admin-btn-secondary" type="button" onClick={() => { setEditing(quiz); setDialogOpen(true); }} style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}><Pencil size={13} /> Edit</button>
                      <button className="admin-btn admin-btn-danger" type="button" onClick={() => { void remove(quiz); }} disabled={deletingId === quiz._id} style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                        {deletingId === quiz._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ borderTop: "1px solid var(--border)", padding: "0.75rem 0.9rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap", background: "var(--surface-soft)" }}>
            <p style={{ margin: 0, fontSize: "0.77rem", color: "var(--muted)", fontWeight: 600 }}>
              Showing {pageStart} to {pageEnd} of {total}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              <label className="admin-label" style={{ margin: 0 }}>Items</label>
              <select className="admin-select" value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} style={{ width: 88, padding: "0.32rem 0.5rem" }}>
                {[5, 10, 15, 20, 50].map((n) => <option key={n} value={n}>{n}/page</option>)}
              </select>
              <button className="admin-btn admin-btn-secondary" type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "0.3rem 0.5rem" }}><ChevronLeft size={14} /></button>
              <span className="admin-badge admin-badge-gray">Page {currentPage} / {totalPages}</span>
              <button className="admin-btn admin-btn-secondary" type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "0.3rem 0.5rem" }}><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      )}
      <style>{`@keyframes qz-spin { to { transform: rotate(360deg); } }`}</style>

      <QuizDialog
        open={dialogOpen}
        editing={editing}
        onClose={() => setDialogOpen(false)}
        onSuccess={() => { void fetchAll(page, pageSize, search); }}
      />
    </div>
  );
}
