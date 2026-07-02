"use client";

import React from "react";
import {
  Calculator, FlaskConical, Globe, Laptop, Palette, Music,
  Dumbbell, BookOpen, Pencil, Microscope, MapPin, Lightbulb,
  Leaf, Wrench, Languages, Clock, Atom, Sigma, Brush, Drama,
} from "lucide-react";

export const SUBJECT_ICON_LIST: { name: string; label: string }[] = [
  { name: "BookOpen",     label: "General"        },
  { name: "Calculator",   label: "Mathematics"    },
  { name: "Sigma",        label: "Algebra"        },
  { name: "Atom",         label: "Physics"        },
  { name: "FlaskConical", label: "Chemistry"      },
  { name: "Microscope",   label: "Biology"        },
  { name: "Globe",        label: "Geography"      },
  { name: "MapPin",       label: "Social Studies" },
  { name: "Clock",        label: "History"        },
  { name: "Languages",    label: "Languages"      },
  { name: "Pencil",       label: "Writing"        },
  { name: "Laptop",       label: "Computer Sci."  },
  { name: "Palette",      label: "Art"            },
  { name: "Brush",        label: "Drawing"        },
  { name: "Music",        label: "Music"          },
  { name: "Dumbbell",     label: "Physical Ed."   },
  { name: "Lightbulb",    label: "Innovation"     },
  { name: "Leaf",         label: "Environment"    },
  { name: "Wrench",       label: "Technology"     },
  { name: "Drama",        label: "Drama"          },
];

const ICON_MAP: Record<string, (size: number, color?: string) => React.ReactNode> = {
  BookOpen:     (s, c) => <BookOpen     size={s} color={c} />,
  Calculator:   (s, c) => <Calculator   size={s} color={c} />,
  Sigma:        (s, c) => <Sigma        size={s} color={c} />,
  Atom:         (s, c) => <Atom         size={s} color={c} />,
  FlaskConical: (s, c) => <FlaskConical size={s} color={c} />,
  Microscope:   (s, c) => <Microscope   size={s} color={c} />,
  Globe:        (s, c) => <Globe        size={s} color={c} />,
  MapPin:       (s, c) => <MapPin       size={s} color={c} />,
  Clock:        (s, c) => <Clock        size={s} color={c} />,
  Languages:    (s, c) => <Languages    size={s} color={c} />,
  Pencil:       (s, c) => <Pencil       size={s} color={c} />,
  Laptop:       (s, c) => <Laptop       size={s} color={c} />,
  Palette:      (s, c) => <Palette      size={s} color={c} />,
  Brush:        (s, c) => <Brush        size={s} color={c} />,
  Music:        (s, c) => <Music        size={s} color={c} />,
  Dumbbell:     (s, c) => <Dumbbell     size={s} color={c} />,
  Lightbulb:    (s, c) => <Lightbulb   size={s} color={c} />,
  Leaf:         (s, c) => <Leaf         size={s} color={c} />,
  Wrench:       (s, c) => <Wrench       size={s} color={c} />,
  Drama:        (s, c) => <Drama        size={s} color={c} />,
};

export function SubjectIcon({
  name,
  size = 18,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const renderer = ICON_MAP[name] ?? ICON_MAP["BookOpen"];
  return <>{renderer(size, color)}</>;
}
