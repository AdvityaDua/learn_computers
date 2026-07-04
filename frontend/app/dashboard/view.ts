export type DashboardView =
  | { name: "home" }
  | { name: "subjects" }
  | { name: "subject"; subjectId: string }
  | { name: "chapter"; subjectId: string; chapterId: string }
  | { name: "lesson"; subjectId: string; chapterId: string; lessonId: string }
  | { name: "quiz"; subjectId: string; chapterId: string; lessonId: string; quizId: string }
  | { name: "leaderboard" }
  | { name: "deadlines" }
  | { name: "profile" };

export type NavKey = "home" | "subjects" | "leaderboard" | "deadlines" | "profile";

export function navKeyFor(view: DashboardView): NavKey {
  switch (view.name) {
    case "home":
      return "home";
    case "subjects":
    case "subject":
    case "chapter":
    case "lesson":
    case "quiz":
      return "subjects";
    case "leaderboard":
      return "leaderboard";
    case "deadlines":
      return "deadlines";
    case "profile":
      return "profile";
  }
}
