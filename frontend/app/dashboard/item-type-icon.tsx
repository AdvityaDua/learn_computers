import { ClipboardList, HelpCircle, PlayCircle, PuzzleIcon, type LucideIcon } from "lucide-react";
import type { ChapterLessonItemType } from "../lib/types";

export const ITEM_TYPE_META: Record<ChapterLessonItemType, { label: string; icon: LucideIcon; tone: string }> = {
  video: { label: "Video", icon: PlayCircle, tone: "text-info" },
  quiz: { label: "Quiz", icon: HelpCircle, tone: "text-secondary" },
  assignment: { label: "Assignment", icon: ClipboardList, tone: "text-warning" },
  activity: { label: "Activity", icon: PuzzleIcon, tone: "text-success" },
};
