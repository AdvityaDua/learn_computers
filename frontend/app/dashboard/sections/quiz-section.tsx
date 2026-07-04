"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, PartyPopper, RotateCcw, XCircle } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ProgressBar } from "../../components/ui/progress-bar";
import { Skeleton } from "../../components/ui/skeleton";
import { ErrorState } from "../../components/ui/error-state";
import { useAsync } from "../../lib/use-async";
import { getLessonDetail, submitQuiz } from "../../lib/data";
import { useCurriculum } from "../../context/curriculum-context";
import type { DashboardView } from "../view";
import type { QuizSubmitResult } from "../../lib/types";

function resultMessage(score: number) {
  if (score >= 90) return { text: "Outstanding work! 🌟", tone: "text-success" };
  if (score >= 70) return { text: "Great job! 🎉", tone: "text-success" };
  if (score >= 50) return { text: "Good effort — keep going! 💪", tone: "text-warning" };
  return { text: "Nice try! Let's review and try again. 📚", tone: "text-danger" };
}

export function QuizSection({
  subjectId,
  chapterId,
  lessonId,
  quizId,
  onNavigate,
}: {
  subjectId: string;
  chapterId: string;
  lessonId: string;
  quizId: string;
  onNavigate: (view: DashboardView) => void;
}) {
  const { reloadProgress } = useCurriculum();
  const { data: detail, loading, error } = useAsync(() => getLessonDetail(chapterId, lessonId), [chapterId, lessonId]);
  const quiz = useMemo(
    () => detail?.lesson.items.find((it) => it.type === "quiz" && it.data?._id === quizId),
    [detail, quizId],
  );
  const quizData = quiz && quiz.type === "quiz" ? quiz.data : null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  const questionCount = quizData?.questions.length ?? 0;
  const currentAnswers = answers.length === questionCount ? answers : Array(questionCount).fill(-1);

  const selectAnswer = (optionIndex: number) => {
    const next = [...currentAnswers];
    next[currentIndex] = optionIndex;
    setAnswers(next);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await submitQuiz(chapterId, lessonId, quizId, currentAnswers);
      setResult(res);
      await reloadProgress();
    } finally {
      setSubmitting(false);
    }
  };

  const retake = () => {
    setResult(null);
    setAnswers([]);
    setCurrentIndex(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !quizData) {
    return <ErrorState message={error ?? "Couldn't load this quiz."} />;
  }

  if (result) {
    const message = resultMessage(result.score);
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary-soft text-primary">
            <PartyPopper size={36} />
          </div>
          <p className="font-[family-name:var(--font-display)] text-3xl font-extrabold">{result.score}%</p>
          <p className={`mt-1 text-lg font-bold ${message.tone}`}>{message.text}</p>
          <p className="mt-1 text-sm text-muted">
            You got {result.correctCount} out of {result.totalQuestions} correct
          </p>

          <div className="mt-6 flex flex-col gap-3 text-left">
            {quizData.questions.map((q, idx) => {
              const r = result.results[idx];
              return (
                <div
                  key={idx}
                  className={`rounded-md border p-3 ${r.correct ? "border-success/30 bg-success-soft" : "border-danger/30 bg-danger-soft"}`}
                >
                  <div className="flex items-start gap-2">
                    {r.correct ? (
                      <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-success" />
                    ) : (
                      <XCircle size={17} className="mt-0.5 shrink-0 text-danger" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{q.question}</p>
                      {!r.correct ? (
                        <p className="mt-1 text-xs text-muted">
                          Correct answer: <span className="font-semibold text-foreground">{q.options[r.correctAnswerIndex]}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={retake}>
              <RotateCcw size={16} /> Retake quiz
            </Button>
            <Button onClick={() => onNavigate({ name: "lesson", subjectId, chapterId, lessonId })}>Back to lesson</Button>
          </div>
        </Card>
      </div>
    );
  }

  const question = quizData.questions[currentIndex];
  const isLast = currentIndex === questionCount - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-[family-name:var(--font-display)] text-lg font-bold">{quizData.title}</p>
        <p className="text-sm font-semibold text-muted">
          Question {currentIndex + 1} of {questionCount}
        </p>
      </div>
      <ProgressBar value={((currentIndex + 1) / questionCount) * 100} className="mb-6" />

      <Card className="p-6">
        <p className="mb-5 font-[family-name:var(--font-display)] text-xl font-bold leading-snug">{question.question}</p>
        <div className="flex flex-col gap-2.5">
          {question.options.map((option, i) => {
            const selected = currentAnswers[currentIndex] === i;
            return (
              <button
                key={i}
                onClick={() => selectAnswer(i)}
                className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3.5 text-left text-[15px] font-medium transition-all ${
                  selected
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-surface hover:border-primary/40 hover:bg-surface-soft"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    selected ? "border-primary bg-primary text-white" : "border-border text-muted"
                  }`}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
          <ChevronLeft size={16} /> Previous
        </Button>
        {isLast ? (
          <Button onClick={handleSubmit} isLoading={submitting} disabled={currentAnswers.includes(-1)}>
            Submit quiz
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => Math.min(questionCount - 1, i + 1))} disabled={currentAnswers[currentIndex] === -1}>
            Next <ChevronRight size={16} />
          </Button>
        )}
      </div>
    </div>
  );
}
