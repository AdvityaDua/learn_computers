import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import Markdown from 'react-native-markdown-display';
import { COLORS } from '../lib/constants';
import { LessonDetailScreen } from './LessonDetailScreen';

/** Strip markdown syntax for plain-text previews */
function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s*/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/^[-*>]\s+/gm, '')
    .replace(/---/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const chapterMdStyles = {
  body: { color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  heading1: { fontSize: 15, fontWeight: '800' as const, color: COLORS.text, marginBottom: 6, marginTop: 10 },
  heading2: { fontSize: 14, fontWeight: '700' as const, color: COLORS.text, marginBottom: 4, marginTop: 8 },
  heading3: { fontSize: 13, fontWeight: '700' as const, color: COLORS.text, marginBottom: 4, marginTop: 6 },
  paragraph: { marginBottom: 8, color: COLORS.muted, lineHeight: 20, fontSize: 13 },
  bullet_list: { marginBottom: 8 },
  ordered_list: { marginBottom: 8 },
  list_item: { marginBottom: 4, color: COLORS.muted, fontSize: 13, lineHeight: 20 },
  strong: { fontWeight: '700' as const, color: COLORS.text },
  em: { fontStyle: 'italic' as const },
  hr: { backgroundColor: COLORS.border, height: 1, marginVertical: 8 },
  code_inline: { backgroundColor: COLORS.surfaceSoft, borderRadius: 4, paddingHorizontal: 4, fontFamily: 'monospace', fontSize: 12, color: COLORS.primary },
  fence: { backgroundColor: '#0F172A', borderRadius: 8, padding: 10, marginVertical: 8, color: '#E2E8F0', fontFamily: 'monospace', fontSize: 12 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: COLORS.primary, paddingLeft: 10, marginLeft: 0, opacity: 0.9 },
};

type LessonTab = 'learn' | 'watch' | 'quiz' | 'assignments' | 'activities' | 'finish';

type ChapterLesson = {
  _id: string;
  title: string;
  order: number;
  items?: Array<{ type: string; refId: string; order: number }>;
};

type Chapter = {
  _id: string;
  title: string;
  description?: string;
  lessons?: ChapterLesson[];
};

type Props = {
  chapters: Chapter[];
  lessonProgress: {
    totalLessons: number;
    completedLessons: number;
    pendingLessons: number;
    completionPercentage: number;
    completedLessonIds?: string[];
  };
  completedLessonSet: Set<string>;
  launchTarget?: {
    chapterId: string;
    lessonId: string;
    initialTab?: LessonTab;
    focusItemId?: string;
  } | null;
  onLaunchHandled?: () => void;
  onProgressUpdate?: () => void;
  onLessonOpen?: () => void;
  onLessonClose?: () => void;
};

const CHAPTER_ACCENTS = [
  { bg: '#EDE9FE', icon: COLORS.primary, border: '#C4B5FD' },
  { bg: '#DBEAFE', icon: '#2563EB', border: '#BFDBFE' },
  { bg: '#D1FAE5', icon: '#059669', border: '#A7F3D0' },
  { bg: '#FEF3C7', icon: '#D97706', border: '#FDE68A' },
  { bg: '#FCE7F3', icon: '#BE185D', border: '#FBCFE8' },
];

export function CurriculumScreen({ chapters, lessonProgress, completedLessonSet, launchTarget, onLaunchHandled, onProgressUpdate, onLessonOpen, onLessonClose }: Props) {
  const pct = lessonProgress.completionPercentage;
  const [activeLesson, setActiveLesson] = useState<{ chapterId: string; lessonId: string; initialTab?: LessonTab; focusItemId?: string } | null>(null);
  const [expandedChapters, setExpandedChapters] = useState<{ [id: string]: boolean }>({});

  const toggleChapter = (id: string) => {
    setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openLesson = (chapterId: string, lessonId: string, initialTab?: LessonTab, focusItemId?: string) => {
    setActiveLesson({ chapterId, lessonId, initialTab, focusItemId });
    onLessonOpen?.();
  };

  const closeLesson = () => {
    setActiveLesson(null);
    onLessonClose?.();
  };

  useEffect(() => {
    if (!launchTarget) {
      return;
    }

    setActiveLesson({
      chapterId: launchTarget.chapterId,
      lessonId: launchTarget.lessonId,
      initialTab: launchTarget.initialTab,
      focusItemId: launchTarget.focusItemId,
    });
    onLessonOpen?.();
    onLaunchHandled?.();
  }, [launchTarget, onLaunchHandled, onLessonOpen]);

  const flatLessons = chapters.flatMap(c => (c.lessons || []).map(l => ({ chapterId: c._id, lessonId: l._id })));
  const currentLessonIdx = activeLesson ? flatLessons.findIndex(l => l.lessonId === activeLesson.lessonId) : -1;
  const prevLesson = currentLessonIdx > 0 ? flatLessons[currentLessonIdx - 1] : null;
  const nextLesson = currentLessonIdx !== -1 && currentLessonIdx < flatLessons.length - 1 ? flatLessons[currentLessonIdx + 1] : null;

  if (activeLesson) {
    return (
      <LessonDetailScreen
        chapterId={activeLesson.chapterId}
        lessonId={activeLesson.lessonId}
        initialTab={activeLesson.initialTab}
        focusItemId={activeLesson.focusItemId}
        onBack={closeLesson}
        onCompleted={() => {
          onProgressUpdate?.();
        }}
        onNext={nextLesson ? () => openLesson(nextLesson.chapterId, nextLesson.lessonId) : undefined}
        onPrev={prevLesson ? () => openLesson(prevLesson.chapterId, prevLesson.lessonId) : undefined}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false}>

      {/* Progress summary card */}
      <View style={{ borderRadius: 22, backgroundColor: COLORS.primary, padding: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.28, shadowRadius: 16, elevation: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Ionicons name="school-outline" size={16} color="#C4B5FD" />
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#C4B5FD', textTransform: 'uppercase', letterSpacing: 1 }}>Course Progress</Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff' }}>{pct}% Complete</Text>
        <Text style={{ fontSize: 13, color: '#DDD6FE', marginTop: 2, fontWeight: '500' }}>
          {lessonProgress.completedLessons} done · {lessonProgress.pendingLessons} remaining
        </Text>
        <View style={{ marginTop: 14, height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)' }}>
          <View style={{ height: 8, borderRadius: 99, backgroundColor: '#A78BFA', width: `${Math.min(100, pct)}%` as `${number}%` }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: '#A78BFA' }} />
            <Text style={{ fontSize: 11, color: '#C4B5FD', fontWeight: '600' }}>Completed</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <View style={{ width: 8, height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <Text style={{ fontSize: 11, color: '#C4B5FD', fontWeight: '600' }}>Pending</Text>
          </View>
        </View>
      </View>

      {/* Empty state */}
      {chapters.length === 0 ? (
        <View style={{ borderRadius: 18, backgroundColor: COLORS.surface, padding: 40, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border }}>
          <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="book-outline" size={28} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>No chapters yet</Text>
          <Text style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20 }}>Content will appear here once published by your teacher.</Text>
        </View>
      ) : (
        chapters.map((chapter, cidx) => {
          const theme = CHAPTER_ACCENTS[cidx % CHAPTER_ACCENTS.length];
          const lessons = chapter.lessons || [];
          const done = lessons.filter(l => completedLessonSet.has(l._id)).length;
          const chapterPct = lessons.length > 0 ? Math.round((done / lessons.length) * 100) : 0;

          return (
            <View key={chapter._id} style={{ borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              {/* Chapter header */}
              <View style={{ backgroundColor: theme.bg, padding: 18, gap: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.border }}>
                    <Ionicons name="book-outline" size={24} color={theme.icon} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.icon, textTransform: 'uppercase', letterSpacing: 0.8 }}>Chapter {cidx + 1}</Text>
                    <Text style={{ fontSize: 17, fontWeight: '900', color: COLORS.text, marginTop: 1, lineHeight: 23 }}>{chapter.title}</Text>
                  </View>
                  <View style={{ backgroundColor: chapterPct === 100 ? COLORS.success : theme.icon, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, maxWidth: '34%', alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#fff' }} numberOfLines={1}>
                      {chapterPct === 100 ? 'Done' : `${done}/${lessons.length}`}
                    </Text>
                  </View>
                </View>

                {chapter.description ? (
                  <View style={{ gap: 6 }}>
                    {/* Preview: plain text snippet, always visible */}
                    {!expandedChapters[chapter._id] && (
                      <Text style={{ fontSize: 13, color: COLORS.muted, fontWeight: '500', lineHeight: 19 }} numberOfLines={2} ellipsizeMode="tail">
                        {stripMarkdown(chapter.description)}
                      </Text>
                    )}
                    {/* Full markdown, shown when expanded */}
                    {expandedChapters[chapter._id] && (
                      <View style={{ backgroundColor: 'rgba(255,255,255,0.55)', borderRadius: 12, padding: 12 }}>
                        <Markdown style={chapterMdStyles}>{chapter.description}</Markdown>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => toggleChapter(chapter._id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.icon }}>
                        {expandedChapters[chapter._id] ? 'Show less' : 'Read more'}
                      </Text>
                      <Ionicons name={expandedChapters[chapter._id] ? 'chevron-up' : 'chevron-down'} size={13} color={theme.icon} />
                    </TouchableOpacity>
                  </View>
                ) : null}

                <View style={{ height: 5, borderRadius: 99, backgroundColor: 'rgba(0,0,0,0.1)' }}>
                  <View style={{ height: 5, borderRadius: 99, backgroundColor: theme.icon, width: `${chapterPct}%` as `${number}%` }} />
                </View>
              </View>

              {/* Lessons */}
              <View style={{ padding: 14, gap: 8 }}>
                {lessons.length === 0 ? (
                  <Text style={{ fontSize: 13, color: COLORS.muted, fontWeight: '500', textAlign: 'center', paddingVertical: 10 }}>No lessons in this chapter yet.</Text>
                ) : (
                  lessons.map((lesson, lidx) => {
                    const isCompleted = completedLessonSet.has(lesson._id);
                    return (
                      <TouchableOpacity key={lesson._id} onPress={() => openLesson(chapter._id, lesson._id)} activeOpacity={0.75} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: isCompleted ? '#F0FDF4' : COLORS.surfaceSoft, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: isCompleted ? '#BBF7D0' : COLORS.border }}>
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: isCompleted ? '#D1FAE5' : theme.bg, alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={isCompleted ? COLORS.success : theme.icon} />
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text, lineHeight: 19 }}>{lesson.title}</Text>
                          <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '600', marginTop: 2 }}>
                            {lesson.items?.length || 0} items · Lesson {lidx + 1}
                          </Text>
                        </View>
                        <Ionicons name={isCompleted ? 'checkmark-done-outline' : 'chevron-forward'} size={18} color={isCompleted ? COLORS.success : COLORS.muted} />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}
