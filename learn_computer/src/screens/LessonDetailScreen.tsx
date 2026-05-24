import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { getLessonDetail, markLessonAccessed, markLessonCompleted } from '../lib/api';
import { COLORS } from '../lib/constants';
import { mdStyles } from '../components/lesson/MarkdownStyles';
import { QuizSection } from '../components/lesson/QuizSection';
import { TaskSection } from '../components/lesson/TaskSection';
import { VideoSection } from '../components/lesson/VideoPlayer';
import { LessonDetail, QuizData, TaskData, TaskSubmission, VideoData } from '../components/lesson/types';

type LessonTab = 'learn' | 'watch' | 'quiz' | 'assignments' | 'activities' | 'finish';

function resolveInitialTab(detail: LessonDetail, preferredTab?: LessonTab): LessonTab {
  const availableTabs = new Set<LessonTab>();

  if (detail.lesson.description) {
    availableTabs.add('learn');
  }

  for (const item of detail.lesson.items ?? []) {
    if (item.type === 'video' && item.data) {
      availableTabs.add('watch');
    }
    if (item.type === 'quiz' && item.data) {
      availableTabs.add('quiz');
    }
    if (item.type === 'assignment' && item.data) {
      availableTabs.add('assignments');
    }
    if (item.type === 'activity' && item.data) {
      availableTabs.add('activities');
    }
  }

  availableTabs.add('finish');

  if (preferredTab && availableTabs.has(preferredTab)) {
    return preferredTab;
  }

  if (availableTabs.has('learn')) return 'learn';
  if (availableTabs.has('watch')) return 'watch';
  if (availableTabs.has('quiz')) return 'quiz';
  if (availableTabs.has('assignments')) return 'assignments';
  if (availableTabs.has('activities')) return 'activities';
  return 'finish';
}

type Props = {
  chapterId: string;
  lessonId: string;
  onBack: () => void;
  onCompleted: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  initialTab?: LessonTab;
  focusItemId?: string;
};

export function LessonDetailScreen({ chapterId, lessonId, onBack, onCompleted, onNext, onPrev, initialTab, focusItemId }: Props) {
  const [detail, setDetail] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchedVideos, setWatchedVideos] = useState<Set<string>>(new Set());
  const [passedQuizzes, setPassedQuizzes] = useState<Record<string, number>>({});
  const [submittedTasks, setSubmittedTasks] = useState<Record<string, TaskSubmission>>({});
  const [activeTab, setActiveTab] = useState<'learn' | 'watch' | 'quiz' | 'assignments' | 'activities' | 'finish'>('learn');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data: any = await getLessonDetail(chapterId, lessonId);
      markLessonAccessed(chapterId, lessonId).catch(() => undefined);
      setDetail(data);
      if (data.progress.completedQuizzes) {
        setPassedQuizzes(data.progress.completedQuizzes);
      }
      if (data.progress.submittedTasks) {
        setSubmittedTasks(data.progress.submittedTasks);
      }
      setActiveTab(resolveInitialTab(data, initialTab));
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load lesson');
    } finally { setLoading(false); }
  }, [chapterId, initialTab, lessonId]);

  useEffect(() => { load(); }, [load]);

  const items = detail?.lesson.items ?? [];
  const videoItems = items.filter(i => i.type === 'video' && i.data);
  const quizItems = items.filter(i => i.type === 'quiz' && i.data);
  const assignmentItems = items.filter(i => i.type === 'assignment' && i.data);
  const activityItems = items.filter(i => i.type === 'activity' && i.data);
  const taskItems = [...assignmentItems, ...activityItems];

  const hasRequiredVideo = videoItems.length > 0;
  const hasRequiredQuiz = quizItems.length > 0;
  const hasRequiredTask = taskItems.some(i => (i.data as TaskData)?.requiresSubmission);

  const videosWatched = !hasRequiredVideo || videoItems.every(i => watchedVideos.has((i.data as VideoData)._id));
  const quizzesPassed = !hasRequiredQuiz || quizItems.every(i => passedQuizzes[(i.data as QuizData)._id] !== undefined);
  const tasksDone = !hasRequiredTask || taskItems.every(i => {
    const d = i.data as TaskData;
    return !d?.requiresSubmission || submittedTasks[d._id]?.reviewStatus === 'approved';
  });
  const pendingTaskReview = taskItems.some(i => {
    const d = i.data as TaskData;
    return d?.requiresSubmission && submittedTasks[d._id]?.reviewStatus === 'pending';
  });
  const rejectedTaskReview = taskItems.some(i => {
    const d = i.data as TaskData;
    return d?.requiresSubmission && submittedTasks[d._id]?.reviewStatus === 'rejected';
  });

  const canComplete = videosWatched && quizzesPassed && tasksDone && !detail?.progress.completed;

  const gateChecks = [
    { name: 'Videos', done: videosWatched, required: hasRequiredVideo },
    { name: 'Quizzes', done: quizzesPassed, required: hasRequiredQuiz },
    { name: 'Tasks', done: tasksDone, required: hasRequiredTask },
  ].filter(g => g.required);

  const completedGatesCount = gateChecks.filter(g => g.done).length;
  const totalGates = gateChecks.length;
  const progressPercent = totalGates === 0 ? 100 : Math.round((completedGatesCount / totalGates) * 100);

  // Auto complete lesson when all tasks are done
  useEffect(() => {
    if (canComplete && detail && !detail.progress.completed) {
      const autoMarkComplete = async () => {
        try {
          await markLessonCompleted(chapterId, lessonId);
          setDetail(prev => prev ? { ...prev, progress: { ...prev.progress, completed: true } } : null);
          onCompleted();
        } catch (e: any) {
          console.error("Auto complete failed:", e);
        }
      };
      autoMarkComplete();
    }
  }, [canComplete, detail, chapterId, lessonId, onCompleted]);

  if (loading) return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={{ marginTop: 12, color: COLORS.muted, fontWeight: '600' }}>Loading lesson…</Text>
    </View>
  );

  if (!detail) return null;

  const tabs = [
    detail.lesson.description && { id: 'learn', label: 'Theory', icon: 'book-outline' },
    videoItems.length > 0 && { id: 'watch', label: 'Watch', icon: 'play-circle-outline' },
    quizItems.length > 0 && { id: 'quiz', label: 'Quiz', icon: 'help-circle-outline' },
    assignmentItems.length > 0 && { id: 'assignments', label: 'Assignments', icon: 'document-text-outline' },
    activityItems.length > 0 && { id: 'activities', label: 'Activities', icon: 'color-wand-outline' },
    { id: 'finish', label: 'Finish', icon: 'flag-outline' }
  ].filter(Boolean) as Array<{ id: any; label: string; icon: any }>;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <SafeAreaView style={{ backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <View style={{ paddingTop: 14, paddingBottom: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: COLORS.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-back" size={20} color={COLORS.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>{detail.chapter.title}</Text>
            <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.text }} numberOfLines={1}>{detail.lesson.title}</Text>
          </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {detail.progress.completed && (
              <View style={{ backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 99, flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 4 }}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.success }}>Done</Text>
              </View>
            )}
            {onPrev && (
              <TouchableOpacity onPress={onPrev} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={18} color={COLORS.text} />
              </TouchableOpacity>
            )}
            {onNext && (
              <TouchableOpacity onPress={onNext} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.surfaceSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-forward" size={18} color={COLORS.text} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Tabs */}
      <View style={{ backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                  paddingVertical: 12, paddingHorizontal: 4,
                  borderBottomWidth: 3, borderBottomColor: isActive ? COLORS.primary : 'transparent',
                  opacity: isActive ? 1 : 0.5
                }}
              >
                <Ionicons name={tab.icon} size={16} color={isActive ? COLORS.primary : COLORS.muted} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: isActive ? COLORS.primary : COLORS.muted }}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 24 }} showsVerticalScrollIndicator={false}>
        
        {/* Learn Tab */}
        {activeTab === 'learn' && detail.lesson.description && (
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Theory</Text>
            <Markdown style={mdStyles}>{detail.lesson.description}</Markdown>
          </View>
        )}

        {/* Watch Tab */}
        {activeTab === 'watch' && (
          <View style={{ gap: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Videos</Text>
            {videoItems.map(item => (
              <VideoSection key={(item.data as VideoData)._id} item={item.data as VideoData}
                highlighted={focusItemId === (item.data as VideoData)._id}
                watched={watchedVideos.has((item.data as VideoData)._id)}
                onWatched={() => setWatchedVideos(prev => new Set([...prev, (item.data as VideoData)._id]))} />
            ))}
          </View>
        )}

        {/* Quiz Tab */}
        {activeTab === 'quiz' && (
          <View style={{ gap: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Quizzes</Text>
            {quizItems.map(item => {
              const q = item.data as QuizData;
              return (
                <QuizSection key={q._id} item={q} chapterId={chapterId} lessonId={lessonId}
                  highlighted={focusItemId === q._id}
                  score={passedQuizzes[q._id]}
                  onDone={(score) => setPassedQuizzes(prev => ({ ...prev, [q._id]: score }))} />
              );
            })}
          </View>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <View style={{ gap: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Assignments</Text>
            {assignmentItems.map(item => {
              const t = item.data as TaskData;
              const sub = submittedTasks[t._id] ?? detail.progress.submittedTasks?.[t._id];
              return (
                <TaskSection key={t._id} item={t} type="assignment"
                  chapterId={chapterId} lessonId={lessonId}
                  highlighted={focusItemId === t._id}
                  submission={sub}
                  onDone={(nextSubmission) => setSubmittedTasks(prev => ({ ...prev, [t._id]: nextSubmission }))} />
              );
            })}
          </View>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <View style={{ gap: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Activities</Text>
            {activityItems.map(item => {
              const t = item.data as TaskData;
              const sub = submittedTasks[t._id] ?? detail.progress.submittedTasks?.[t._id];
              return (
                <TaskSection key={t._id} item={t} type="activity"
                  chapterId={chapterId} lessonId={lessonId}
                  highlighted={focusItemId === t._id}
                  submission={sub}
                  onDone={(nextSubmission) => setSubmittedTasks(prev => ({ ...prev, [t._id]: nextSubmission }))} />
              );
            })}
          </View>
        )}

        {/* Finish Tab */}
        {activeTab === 'finish' && (
          <View style={{ gap: 24, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
            {detail.progress.completed ? (
              <>
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="trophy" size={50} color={COLORS.success} />
                </View>
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>Awesome work!</Text>
                  <Text style={{ fontSize: 15, color: COLORS.muted, textAlign: 'center' }}>You have successfully completed this lesson.</Text>
                </View>
              </>
            ) : (
              <>
                <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="map-outline" size={50} color="#D97706" />
                </View>
                <View style={{ alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: COLORS.text }}>Keep Going!</Text>
                  <Text style={{ fontSize: 15, color: COLORS.muted, textAlign: 'center' }}>Complete all tabs to finish the lesson automatically.</Text>
                </View>

                {/* Progress Bar */}
                {totalGates > 0 && (
                  <View style={{ alignSelf: 'stretch', backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>Lesson Progress</Text>
                      <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.primary }}>{progressPercent}%</Text>
                    </View>
                    <View style={{ height: 12, backgroundColor: COLORS.surfaceSoft, borderRadius: 6, overflow: 'hidden' }}>
                      <View style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: COLORS.primary, borderRadius: 6 }} />
                    </View>
                  </View>
                )}

                <View style={{ alignSelf: 'stretch', gap: 12, marginTop: 8 }}>
                  {!videosWatched && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}>
                      <Ionicons name="play-circle-outline" size={24} color={COLORS.muted} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>Watch all videos</Text>
                    </View>
                  )}
                  {!quizzesPassed && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}>
                      <Ionicons name="help-circle-outline" size={24} color={COLORS.muted} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>Pass all quizzes</Text>
                    </View>
                  )}
                  {!tasksDone && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border }}>
                      <Ionicons name="cloud-upload-outline" size={24} color={COLORS.muted} />
                      <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
                        {rejectedTaskReview ? 'Resubmit rejected work' : pendingTaskReview ? 'Wait for teacher review' : 'Submit required tasks'}
                      </Text>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        )}

      </ScrollView>
    </View>
  );
}
