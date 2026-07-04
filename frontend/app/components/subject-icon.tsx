import React from "react";
import {
  Calculator, FlaskConical, Globe, Laptop, Palette, Music,
  Dumbbell, BookOpen, Pencil, Microscope, MapPin, Lightbulb,
  Leaf, Wrench, Languages, Clock, Atom, Sigma, Brush, Drama,
  type LucideIcon,
} from "lucide-react";

/** Mirrors admin/app/components/subject-icon.tsx so subject.icon values set by admins always resolve here. */
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen, Calculator, Sigma, Atom, FlaskConical, Microscope, Globe,
  MapPin, Clock, Languages, Pencil, Laptop, Palette, Brush, Music,
  Dumbbell, Lightbulb, Leaf, Wrench, Drama,
};

export function SubjectIcon({
  name,
  size = 20,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICON_MAP[name] ?? BookOpen;
  return <Icon size={size} className={className} />;
}
