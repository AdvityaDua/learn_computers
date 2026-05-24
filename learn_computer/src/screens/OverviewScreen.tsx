import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../lib/constants';

type SectionId = 'Overview' | 'Curriculum' | 'Videos' | 'Quizzes' | 'Assignments' | 'Activities' | 'Leaderboard' | 'Profile';

type LeaderboardUser = {
  _id?: string;
  userId?: string;
  fullName?: string;
  points?: number;
  score?: number;
  contentCount?: number;
  lessonCount?: number;
  quizCount?: number;
  assignmentCount?: number;
  activityCount?: number;
};

type TeacherInfo = {
  _id: string;
  fullName: string;
  email: string;
  phone: string | null;
  classIds: string[];
};

type Props = {
  firstName: string;
  stats: {
    totalContent: number;
    mixedItems: number;
    lessonItems: number;
    dueSoon: number;
    overdue: number;
    avgQuestions: number;
  };
  contentMix: { name: string; value: number; color: string }[];
  dueBuckets: { name: string; value: number }[];
  leaderboard: LeaderboardUser[];
  lessonProgress: {
    completionPercentage: number;
    completedLessons: number;
    totalLessons: number;
  };
  teachers?: TeacherInfo[];
  onNavigate: (section: SectionId) => void;
};

const STAT_CARDS = [
  { key: 'totalContent',  icon: 'library-outline' as const,  label: 'Total Content',    color: COLORS.primary,   bg: COLORS.primaryLight,  nav: 'Videos' as SectionId },
  { key: 'mixedItems',    icon: 'layers-outline' as const,    label: 'Curriculum Items', color: COLORS.sky,       bg: '#E0F2FE',             nav: 'Curriculum' as SectionId },
  { key: 'dueSoon',       icon: 'alarm-outline' as const,     label: 'Due Soon',         color: '#D97706',        bg: '#FEF3C7',             nav: 'Assignments' as SectionId },
  { key: 'overdue',       icon: 'warning-outline' as const,   label: 'Overdue',          color: COLORS.danger,    bg: '#FEE2E2',             nav: 'Assignments' as SectionId },
];

const CONTENT_MIX_ICONS: Record<string, { icon: string; nav: SectionId }> = {
  Videos:      { icon: 'play-circle-outline', nav: 'Videos' },
  Quizzes:     { icon: 'help-circle-outline', nav: 'Quizzes' },
  Assignments: { icon: 'clipboard-outline',   nav: 'Assignments' },
  Activities:  { icon: 'color-wand-outline',  nav: 'Activities' },
};

const RANK_MEDAL_COLORS = ['#F59E0B', '#94A3B8', '#CD7C2F'];

export function OverviewScreen({ firstName, stats, contentMix, dueBuckets, leaderboard, lessonProgress, teachers, onNavigate }: Props) {
  const pct = lessonProgress.completionPercentage || 0;
  const topLearners = useMemo(() => leaderboard.slice(0, 5), [leaderboard]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false}>

      {/* Welcome hero */}
      <View style={{ borderRadius: 24, backgroundColor: COLORS.primary, padding: 22, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Ionicons name="hand-right-outline" size={16} color="#93C5FD" />
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#93C5FD', letterSpacing: 1, textTransform: 'uppercase' }}>
            Welcome back
          </Text>
        </View>
        <Text style={{ fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>
          {firstName}
        </Text>
        <Text style={{ fontSize: 13, color: '#BFDBFE', marginTop: 4, fontWeight: '500' }}>
          Here is your learning summary for today.
        </Text>

        {/* Progress bar */}
        <View style={{ marginTop: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 12, color: '#93C5FD', fontWeight: '700' }}>Overall Progress</Text>
            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '900' }}>{pct}%</Text>
          </View>
          <View style={{ height: 8, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)' }}>
            <View style={{ height: 8, borderRadius: 99, backgroundColor: '#60A5FA', width: `${Math.min(100, pct)}%` as `${number}%` }} />
          </View>
          <Text style={{ fontSize: 11, color: '#93C5FD', marginTop: 6, fontWeight: '600' }}>
            {lessonProgress.completedLessons} of {lessonProgress.totalLessons} lessons completed
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={() => onNavigate('Curriculum')}
          activeOpacity={0.8}
          style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingVertical: 10, borderRadius: 12 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>Continue Learning</Text>
          <Ionicons name="arrow-forward-outline" size={14} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Teacher card */}
      {teachers && teachers.length > 0 && (
        <View style={{ borderRadius: 22, backgroundColor: COLORS.surface, padding: 18, borderWidth: 1, borderColor: COLORS.border, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="people-outline" size={18} color={COLORS.text} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>
              {teachers.length === 1 ? 'Your Teacher' : 'Your Teachers'}
            </Text>
          </View>
          {teachers.map(t => (
            <View key={t._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surfaceSoft, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
              <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.primary }}>
                  {t.fullName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>{t.fullName}</Text>
                <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '500', marginTop: 1 }}>{t.email}</Text>
              </View>
              {t.phone && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="call-outline" size={13} color={COLORS.muted} />
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Stats grid */}
      <View style={{ gap: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Your Stats</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {STAT_CARDS.map((card) => {
            const value = stats[card.key as keyof typeof stats];
            return (
              <TouchableOpacity
                key={card.key}
                onPress={() => onNavigate(card.nav)}
                activeOpacity={0.8}
                style={{ flex: 1, minWidth: '44%', borderRadius: 18, backgroundColor: COLORS.surface, padding: 16, borderWidth: 1.5, borderColor: card.bg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3, gap: 10 }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: card.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={card.icon} size={20} color={card.color} />
                </View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: COLORS.text }}>{value}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted }}>{card.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Content mix */}
      <View style={{ borderRadius: 22, backgroundColor: COLORS.surface, padding: 18, borderWidth: 1, borderColor: COLORS.border, gap: 14 }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Content Overview</Text>
          <Text style={{ fontSize: 12, color: COLORS.muted, marginTop: 2, fontWeight: '500' }}>Tap a card to browse that section</Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {contentMix.map((item) => {
            const meta = CONTENT_MIX_ICONS[item.name];
            const iconName = meta?.icon ?? 'cube-outline';
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => meta && onNavigate(meta.nav)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  minWidth: '44%',
                  backgroundColor: COLORS.surface,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                  elevation: 2,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: item.color + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={iconName as never} size={18} color={item.color} />
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: '800', color: COLORS.text }}>{item.value}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: COLORS.muted }}>{item.name}</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.muted} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Deadline tracker */}
      <View style={{ borderRadius: 22, backgroundColor: COLORS.surface, padding: 18, borderWidth: 1, borderColor: COLORS.border, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="time-outline" size={18} color={COLORS.text} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Deadline Tracker</Text>
        </View>
        {dueBuckets.map((bucket, i) => {
          const bucketColors = [COLORS.danger, '#D97706', COLORS.success];
          const bucketIcons = ['close-circle-outline', 'time-outline', 'checkmark-circle-outline'] as const;
          const max = Math.max(...dueBuckets.map(b => b.value), 1);
          return (
            <View key={bucket.name} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={bucketIcons[i]} size={14} color={bucketColors[i]} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.text }}>{bucket.name}</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '900', color: bucketColors[i] }}>{bucket.value}</Text>
              </View>
              <View style={{ height: 7, borderRadius: 99, backgroundColor: COLORS.surfaceSoft }}>
                <View style={{ height: 7, borderRadius: 99, backgroundColor: bucketColors[i], width: `${(bucket.value / max) * 100}%` as `${number}%` }} />
              </View>
            </View>
          );
        })}
        <TouchableOpacity
          onPress={() => onNavigate('Assignments')}
          activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.surfaceSoft, borderRadius: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.muted }}>View All Tasks</Text>
          <Ionicons name="arrow-forward-outline" size={13} color={COLORS.muted} />
        </TouchableOpacity>
      </View>

      {/* Leaderboard preview */}
      <View style={{ borderRadius: 22, backgroundColor: COLORS.surface, padding: 18, borderWidth: 1, borderColor: COLORS.border, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="trophy-outline" size={18} color={COLORS.text} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Top Learners</Text>
          </View>
          <TouchableOpacity
            onPress={() => onNavigate('Leaderboard')}
            style={{ backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}
          >
            <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.primary, letterSpacing: 0.5 }}>SEE ALL →</Text>
          </TouchableOpacity>
        </View>

        {topLearners.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 16, gap: 8 }}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={{ fontSize: 13, color: COLORS.muted, fontWeight: '500' }}>No data yet</Text>
          </View>
        ) : (
          topLearners.map((learner, idx) => (
            <View key={`${learner._id ?? learner.userId ?? idx}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: idx === 0 ? '#FFFBEB' : COLORS.surfaceSoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: idx === 0 ? '#FDE68A' : COLORS.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: (RANK_MEDAL_COLORS[idx] ?? COLORS.primaryLight) + '25', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: RANK_MEDAL_COLORS[idx] ?? COLORS.border }}>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: RANK_MEDAL_COLORS[idx] ?? COLORS.muted }}>{idx + 1}</Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{learner.fullName || 'Learner'}</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={13} color={COLORS.gold} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>{learner.score ?? learner.points ?? 0}</Text>
                <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '600' }}>pts</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
