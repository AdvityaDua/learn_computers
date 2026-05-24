import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import {
  getLeaderboard,
  getLessonProgress,
  getMyTeachers,
  getUserProfile,
  listActivities,
  listAssignments,
  listChapters,
  listLessons,
  listQuizzes,
  getStudentDeadlines,
  type AppUser,
} from '../lib/api';
import { API_BASE_URL, COLORS } from '../lib/constants';
import { ActivitiesScreen } from './ActivitiesScreen';
import { AssignmentsScreen } from './AssignmentsScreen';
import { CurriculumScreen } from './CurriculumScreen';
import { LeaderboardScreen } from './LeaderboardScreen';
import { OverviewScreen } from './OverviewScreen';
import { ProfileScreen } from './ProfileScreen';
import { QuizzesScreen } from './QuizzesScreen';
import { VideosScreen } from './VideosScreen';

// ── Types ───────────────────────────────────────────────────────────────────
type SectionId = 'Overview' | 'Curriculum' | 'Videos' | 'Quizzes' | 'Assignments' | 'Activities' | 'Leaderboard' | 'Profile';

type ChapterLesson = {
  _id: string;
  title: string;
  order: number;
  items?: Array<{ type: string; refId: string; order: number }>;
};

type ChapterRecord = {
  _id: string;
  title: string;
  description?: string;
  lessons?: ChapterLesson[];
};

type VideoLesson = {
  _id: string;
  title: string;
  tags: string[];
  thumbnailFilePath?: string;
  externalVideoUrl?: string;
  createdAt: string;
};

type Quiz = {
  _id: string;
  title: string;
  description?: string;
  questions: { question: string }[];
  createdAt: string;
};

type Assignment = {
  _id: string;
  title: string;
  tags: string[];
  points?: number;
  dueDate?: string;
  createdAt: string;
};

type ActivityItem = {
  _id: string;
  title: string;
  tags: string[];
  points?: number;
  dueDate?: string;
  createdAt: string;
};

type LeaderboardUser = {
  userId: string;
  fullName: string;
  profileImage?: string | null;
  points: number;
  rank: number;
  completedLessons: number;
  totalLessons: number;
  completedQuizzes: number;
  totalQuizzes: number;
  isTopLearner: boolean;
};

type ProgressSummary = {
  totalLessons: number;
  completedLessons: number;
  pendingLessons: number;
  completionPercentage: number;
  completedLessonIds?: string[];
};

type LessonTab = 'learn' | 'watch' | 'quiz' | 'assignments' | 'activities' | 'finish';

type ContentLocation = {
  chapterId: string;
  chapterTitle: string;
  lessonId: string;
  lessonTitle: string;
  itemId: string;
  itemType: 'video' | 'quiz' | 'assignment' | 'activity';
};

type LessonLaunchTarget = {
  chapterId: string;
  lessonId: string;
  initialTab?: LessonTab;
  focusItemId?: string;
};

function getLessonTab(itemType: ContentLocation['itemType']): LessonTab {
  switch (itemType) {
    case 'video':
      return 'watch';
    case 'quiz':
      return 'quiz';
    case 'assignment':
      return 'assignments';
    case 'activity':
      return 'activities';
    default:
      return 'learn';
  }
}

// ── Nav config ──────────────────────────────────────────────────────────────
const NAV_ITEMS: { id: SectionId; icon: string; label: string }[] = [
  { id: 'Overview',     icon: 'home-outline',           label: 'Home' },
  { id: 'Curriculum',   icon: 'book-outline',            label: 'Lessons' },
  { id: 'Videos',       icon: 'play-circle-outline',     label: 'Videos' },
  { id: 'Quizzes',      icon: 'help-circle-outline',     label: 'Quizzes' },
  { id: 'Assignments',  icon: 'clipboard-outline',       label: 'Tasks' },
  { id: 'Activities',   icon: 'color-wand-outline',      label: 'Activities' },
  { id: 'Leaderboard',  icon: 'trophy-outline',          label: 'Ranks' },
];

// ── Helpers ─────────────────────────────────────────────────────────────────
function asItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items))
    return (payload as { items: T[] }).items;
  return [];
}

// ── Dashboard Screen ─────────────────────────────────────────────────────────
type DashboardScreenProps = {
  user: AppUser;
  onLogout: () => void;
};

export function DashboardScreen({ user, onLogout }: DashboardScreenProps) {
  const [profile, setProfile] = useState<AppUser>(user);
  const [activeSection, setActiveSection] = useState<SectionId>('Overview');
  const [isLessonOpen, setIsLessonOpen] = useState(false);
  const [lessonLaunchTarget, setLessonLaunchTarget] = useState<LessonLaunchTarget | null>(null);
  const [chapters, setChapters] = useState<ChapterRecord[]>([]);
  const [videos, setVideos] = useState<VideoLesson[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [progress, setProgress] = useState<ProgressSummary>({
    totalLessons: 0, completedLessons: 0, pendingLessons: 0,
    completionPercentage: 0, completedLessonIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [teachers, setTeachers] = useState<{ _id: string; fullName: string; email: string; phone: string | null; classIds: string[] }[]>([]);

  const loadDashboard = useCallback(async () => {
    const profileRes = await getUserProfile().catch(() => null);

    // Determine class/school for scoped leaderboard
    const profileUser = (profileRes && typeof profileRes === 'object') ? profileRes as Partial<AppUser> : null;
    const firstClassId = (profileUser as any)?.classIds?.[0] as string | undefined;
    const schoolId = (profileUser as any)?.schoolId as string | undefined;

    const [chaptersRes, videosRes, quizzesRes, assignmentsRes, activitiesRes, progressRes, leaderboardRes, teachersRes, deadlinesRes] =
      await Promise.all([
        listChapters().catch(() => []),
        listLessons({ page: 1, limit: 60, type: 'video' }).catch(() => []),
        listQuizzes({ page: 1, limit: 60 }).catch(() => []),
        listAssignments({ page: 1, limit: 60 }).catch(() => []),
        listActivities({ page: 1, limit: 60 }).catch(() => []),
        getLessonProgress().catch(() => ({ totalLessons: 0, completedLessons: 0, pendingLessons: 0, completionPercentage: 0, completedLessonIds: [] })),
        getLeaderboard({ classId: firstClassId, schoolId }).catch(() => []),
        getMyTeachers().catch(() => []),
        getStudentDeadlines().catch(() => []),
      ]);

    if (profileRes && typeof profileRes === 'object')
      setProfile(prev => ({ ...prev, ...(profileRes as Partial<AppUser>) }));

    const deadlines = Array.isArray(deadlinesRes) ? deadlinesRes : [];
    const assignmentMap = new Map();
    const activityMap = new Map();
    deadlines.forEach((d: any) => {
      if (d.taskType === 'assignment') assignmentMap.set(d.taskId, d.dueDate);
      if (d.taskType === 'activity') activityMap.set(d.taskId, d.dueDate);
    });

    const parsedAssignments = asItems<Assignment>(assignmentsRes).map(a => ({
      ...a,
      dueDate: assignmentMap.get(a._id) ?? a.dueDate,
    }));
    
    const parsedActivities = asItems<ActivityItem>(activitiesRes).map(a => ({
      ...a,
      dueDate: activityMap.get(a._id) ?? a.dueDate,
    }));

    setChapters(asItems<ChapterRecord>(chaptersRes));
    setVideos(asItems<VideoLesson>(videosRes));
    setQuizzes(asItems<Quiz>(quizzesRes));
    setAssignments(parsedAssignments);
    setActivities(parsedActivities);
    setProgress(progressRes as ProgressSummary);
    setLeaderboard(asItems<LeaderboardUser>(leaderboardRes));
    setTeachers(Array.isArray(teachersRes) ? teachersRes : []);
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        setError(undefined);
        await loadDashboard();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [loadDashboard]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      setError(undefined);
      await loadDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh.');
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const firstName = useMemo(() => {
    const n = (profile.fullName || '').trim();
    return n ? n.split(/\s+/)[0] : 'Learner';
  }, [profile.fullName]);

  const completedLessonSet = useMemo(
    () => new Set(progress.completedLessonIds ?? []),
    [progress.completedLessonIds]
  );

  // Build content map: refId → location
  const contentMap = useMemo(() => {
    const map = new Map<string, ContentLocation>();
    for (const chapter of chapters) {
      for (const lesson of chapter.lessons || []) {
        for (const item of lesson.items || []) {
          map.set(String(item.refId), {
            chapterId: String(chapter._id),
            chapterTitle: chapter.title,
            lessonId: String(lesson._id),
            lessonTitle: lesson.title,
            itemId: String(item.refId),
            itemType: item.type as ContentLocation['itemType'],
          });
        }
      }
    }
    return map;
  }, [chapters]);

  const openCurriculumPoint = useCallback((contentId: string) => {
    const location = contentMap.get(contentId);
    if (!location) {
      return;
    }

    setActiveSection('Curriculum');
    setLessonLaunchTarget({
      chapterId: location.chapterId,
      lessonId: location.lessonId,
      initialTab: getLessonTab(location.itemType),
      focusItemId: location.itemId,
    });
  }, [contentMap]);

  const stats = useMemo(() => {
    const totalContent = videos.length + quizzes.length + assignments.length + activities.length;
    const mixedItems = chapters.reduce((sum, c) => sum + (c.lessons || []).reduce((ls, l) => ls + (l.items?.length || 0), 0), 0);
    const lessonItems = chapters.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
    const duePool = [...assignments, ...activities].filter(i => !!i.dueDate);
    const overdue = duePool.filter(d => new Date(d.dueDate || '').getTime() < Date.now()).length;
    const dueSoon = duePool.filter(d => { const t = new Date(d.dueDate || '').getTime() - Date.now(); return t >= 0 && t <= 3 * 86400000; }).length;
    const avgQuestions = quizzes.length ? Math.round(quizzes.reduce((acc, q) => acc + (q.questions?.length || 0), 0) / quizzes.length * 10) / 10 : 0;
    return { totalContent, mixedItems, lessonItems, overdue, dueSoon, avgQuestions };
  }, [chapters, videos, quizzes, assignments, activities]);

  const contentMix = useMemo(() => [
    { name: 'Videos', value: videos.length, color: COLORS.sky },
    { name: 'Quizzes', value: quizzes.length, color: COLORS.secondary },
    { name: 'Assignments', value: assignments.length, color: COLORS.success },
    { name: 'Activities', value: activities.length, color: COLORS.primary },
  ], [videos.length, quizzes.length, assignments.length, activities.length]);

  const dueBuckets = useMemo(() => {
    const pool = [...assignments, ...activities];
    const overdue = pool.filter(x => x.dueDate && new Date(x.dueDate).getTime() < Date.now()).length;
    const dueSoon = pool.filter(x => { if (!x.dueDate) return false; const d = new Date(x.dueDate).getTime() - Date.now(); return d >= 0 && d <= 3 * 86400000; }).length;
    const upcoming = pool.filter(x => { if (!x.dueDate) return false; return new Date(x.dueDate).getTime() - Date.now() > 3 * 86400000; }).length;
    return [{ name: 'Overdue', value: overdue }, { name: 'Due Soon', value: dueSoon }, { name: 'Upcoming', value: upcoming }];
  }, [assignments, activities]);

  // ── Section renderer ───────────────────────────────────────────────────────
  const renderSection = () => {
    if (loading) return null;
    switch (activeSection) {
      case 'Overview':
        return (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
          >
            <OverviewScreen
              firstName={firstName}
              stats={stats}
              contentMix={contentMix}
              dueBuckets={dueBuckets}
              leaderboard={leaderboard}
              lessonProgress={progress}
              teachers={teachers}
              onNavigate={setActiveSection}
            />
          </ScrollView>
        );
      case 'Curriculum':
        return (
          <View style={{ flex: 1 }}>
            <CurriculumScreen
              chapters={chapters}
              lessonProgress={progress}
              completedLessonSet={completedLessonSet}
              launchTarget={lessonLaunchTarget}
              onLaunchHandled={() => setLessonLaunchTarget(null)}
              onProgressUpdate={loadDashboard}
              onLessonOpen={() => setIsLessonOpen(true)}
              onLessonClose={() => {
                setIsLessonOpen(false);
                loadDashboard().catch(() => undefined);
              }}
            />
          </View>
        );
      case 'Videos':
        return (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
          >
            <VideosScreen videos={videos} contentMap={contentMap} onOpenContentPoint={openCurriculumPoint} />
          </ScrollView>
        );
      case 'Quizzes':
        return (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
          >
            <QuizzesScreen quizzes={quizzes} contentMap={contentMap} onOpenContentPoint={openCurriculumPoint} />
          </ScrollView>
        );
      case 'Assignments':
        return (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
          >
            <AssignmentsScreen assignments={assignments} contentMap={contentMap} onOpenContentPoint={openCurriculumPoint} />
          </ScrollView>
        );
      case 'Activities':
        return (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
          >
            <ActivitiesScreen activities={activities} contentMap={contentMap} onOpenContentPoint={openCurriculumPoint} />
          </ScrollView>
        );
      case 'Leaderboard':
        return (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
          >
            <LeaderboardScreen leaderboard={leaderboard} />
          </ScrollView>
        );
      case 'Profile':
        return (
          <ScrollView
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
            showsVerticalScrollIndicator={false}
          >
            <ProfileScreen
              user={profile}
              onUpdate={(updated) => setProfile(prev => ({ ...prev, ...updated }))}
            />
          </ScrollView>
        );
      default:
        return null;
    }
  };

  const activeNav = NAV_ITEMS.find(n => n.id === activeSection);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* ── Top header — hidden when inside a lesson ─────────────────── */}
      {!isLessonOpen && (
        <View style={{
          backgroundColor: COLORS.surface,
          paddingHorizontal: 20,
          paddingTop: Platform.OS === 'android' ? 16 : 8,
          paddingBottom: 16,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Brand */}
          {/* Brand & Profile */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={() => setActiveSection('Profile')}
              style={{ 
                width: 42, height: 42, borderRadius: 21, 
                backgroundColor: COLORS.primaryLight, 
                alignItems: 'center', justifyContent: 'center',
                shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
                borderWidth: 2, borderColor: COLORS.primary, overflow: 'hidden'
              }}
            >
              {profile.profileImage ? (
                <Image source={{ uri: `${API_BASE_URL.replace('/api', '')}${profile.profileImage}` }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ color: COLORS.primary, fontSize: 16, fontWeight: '900' }}>{firstName[0]?.toUpperCase() || 'S'}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveSection('Profile')} activeOpacity={0.8}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, letterSpacing: -0.5 }}>{firstName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Ionicons name="star" size={12} color={COLORS.gold} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.gold }}>{(profile as any).points || 0} pts</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity
            onPress={onLogout}
            activeOpacity={0.6}
            style={{ 
              flexDirection: 'row', alignItems: 'center', gap: 4, 
              paddingHorizontal: 12, paddingVertical: 8, 
              borderRadius: 20, backgroundColor: '#FEF2F2' 
            }}
          >
            <Ionicons name="log-out-outline" size={16} color={COLORS.danger} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.danger }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Error banner ───────────────────────────────────────────────────── */}
      {error && (
        <View style={{ marginHorizontal: 16, marginTop: 8, backgroundColor: '#FEF2F2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#FECACA', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
          <Text style={{ fontSize: 13, color: COLORS.danger, fontWeight: '600', flex: 1 }}>{error}</Text>
        </View>
      )}

      {/* ── Loading state ──────────────────────────────────────────────────── */}
      {loading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="desktop-outline" size={34} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.text }}>Loading your dashboard…</Text>
          <ActivityIndicator color={COLORS.primary} size="small" />
        </View>
      )}

      {/* ── Content area ───────────────────────────────────────────────────── */}
      {!loading && (
        <View style={{ flex: 1 }}>
          {renderSection()}
        </View>
      )}

      {/* ── Bottom navigation bar — hidden inside lesson ──────────────── */}
      {!isLessonOpen && (
        <View style={{
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          paddingHorizontal: 10,
        }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2, gap: 8 }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setActiveSection(item.id)}
                  activeOpacity={0.7}
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    gap: 4,
                    borderRadius: 14,
                    backgroundColor: isActive ? COLORS.primaryLight : 'transparent',
                    minWidth: 66,
                  }}
                >
                  <View style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  backgroundColor: isActive ? COLORS.primary : 'transparent',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <Ionicons
                      name={item.icon as never}
                    size={18}
                      color={isActive ? '#fff' : COLORS.muted}
                    />
                  </View>
                  <Text style={{
                    fontSize: 10,
                  fontWeight: isActive ? '700' : '600',
                    color: isActive ? COLORS.primary : COLORS.muted,
                  letterSpacing: 0,
                  }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}
