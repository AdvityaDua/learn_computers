import { Ionicons } from '@expo/vector-icons';
import { Image, ScrollView, Text, View } from 'react-native';
import { COLORS } from '../lib/constants';

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

type Props = {
  leaderboard: LeaderboardUser[];
};

const RANK_STYLES = [
  { border: '#F59E0B', bg: '#FFFBEB', labelColor: '#B45309', label: '1st Place' },
  { border: '#94A3B8', bg: '#F8FAFC', labelColor: '#475569', label: '2nd Place' },
  { border: '#CD7C2F', bg: '#FFFAF5', labelColor: '#92400E', label: '3rd Place' },
];

/* ── How Points Work panel ──────────────────────────────────────── */
const POINT_SOURCES = [
  {
    icon: 'book-outline' as const,
    label: 'Completing Lessons',
    desc: 'Finish all videos, quizzes, and tasks inside a lesson to earn points.',
    color: '#10B981',
  },
  {
    icon: 'help-circle-outline' as const,
    label: 'Quiz Scores',
    desc: 'Your score on each quiz directly determines how many points you receive. Aim for 100%.',
    color: '#3B82F6',
  },
  {
    icon: 'document-attach-outline' as const,
    label: 'Approved Submissions',
    desc: 'When your teacher reviews and approves an assignment or activity, they award you points for your work.',
    color: '#EA580C',
  },
  {
    icon: 'star-outline' as const,
    label: 'Teacher Bonus Points',
    desc: 'Your teacher can award extra points for outstanding effort or deduct points as a penalty. Check the Leaderboard to stay updated.',
    color: '#F59E0B',
  },
];

function HowPointsWork() {
  return (
    <View style={{ borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' }}>
      <View style={{ backgroundColor: COLORS.primaryLight, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="star" size={18} color={COLORS.primary} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>How You Earn Points</Text>
      </View>
      <View style={{ padding: 14, gap: 10 }}>
        {POINT_SOURCES.map(src => (
          <View key={src.label} style={{ flexDirection: 'row', gap: 12, backgroundColor: COLORS.surfaceSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: src.color + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ionicons name={src.icon} size={17} color={src.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 2 }}>{src.label}</Text>
              <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '500', lineHeight: 17 }}>{src.desc}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surfaceSoft, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <Ionicons name="information-circle-outline" size={15} color={COLORS.muted} style={{ marginTop: 1 }} />
        <Text style={{ fontSize: 11, color: COLORS.muted, flex: 1, lineHeight: 16, fontWeight: '500' }}>
          Points are cumulative and visible to everyone on the Leaderboard. Keep learning to climb the ranks.
        </Text>
      </View>
    </View>
  );
}

function Avatar({ name, profileImage }: { name: string; profileImage?: string | null }) {
  if (profileImage) {
    return (
      <Image
        source={{ uri: profileImage }}
        style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.border }}
      />
    );
  }
  const initials = name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');
  return (
    <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.primary }}>{initials}</Text>
    </View>
  );
}

export function LeaderboardScreen({ leaderboard }: Props) {
  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trophy" size={20} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Top Learners</Text>
        </View>
        <Text style={{ fontSize: 13, color: COLORS.muted, fontWeight: '500', marginLeft: 44 }}>
          Class rankings by total points earned.
        </Text>
      </View>

      {/* How you earn points — always visible */}
      <HowPointsWork />

      {leaderboard.length === 0 ? (
        <View style={{ borderRadius: 18, backgroundColor: COLORS.surface, padding: 40, alignItems: 'center', gap: 14, borderWidth: 1, borderColor: COLORS.border }}>
          <View style={{ width: 60, height: 60, borderRadius: 20, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trophy-outline" size={30} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>No learners ranked yet</Text>
          <Text style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center', lineHeight: 20 }}>
            Complete lessons and quizzes to earn your place on the leaderboard.
          </Text>
        </View>
      ) : (
        <>
          {/* Podium — top 3 */}
          {top3.length > 0 && (
            <View style={{ borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 14, elevation: 4 }}>
              <View style={{ backgroundColor: COLORS.primary, padding: 20, gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="trophy" size={20} color="#FDE68A" />
                  <Text style={{ fontSize: 16, fontWeight: '900', color: '#fff' }}>Champions Podium</Text>
                </View>
                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginLeft: 28 }}>
                  Fully completed curriculum ranked by total points
                </Text>
              </View>

              <View style={{ padding: 16, gap: 10 }}>
                {top3.map((user, idx) => {
                  const style = RANK_STYLES[idx];
                  return (
                    <View
                      key={user.userId}
                      style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: style.bg, borderRadius: 16, borderWidth: 1.5, borderColor: style.border, padding: 14 }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: style.border + '30', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: style.border }}>
                          <Text style={{ fontSize: 16, fontWeight: '900', color: style.labelColor }}>#{user.rank}</Text>
                        </View>
                        <View style={{ gap: 2 }}>
                          <Text style={{ fontSize: 10, fontWeight: '800', color: style.labelColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>{style.label}</Text>
                          <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.text }}>{user.fullName}</Text>
                          <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '600' }}>
                            {user.completedLessons}/{user.totalLessons} lessons · {user.completedQuizzes}/{user.totalQuizzes} quizzes
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'center', minWidth: 48 }}>
                        <Ionicons name="star" size={13} color={COLORS.gold} />
                        <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 1 }}>{user.points}</Text>
                        <Text style={{ fontSize: 9, color: COLORS.muted, fontWeight: '700', textTransform: 'uppercase' }}>pts</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Rest of rankings */}
          {rest.length > 0 && (
            <View style={{ borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' }}>
              <View style={{ backgroundColor: COLORS.surfaceSoft, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="list-outline" size={16} color={COLORS.text} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>Full Rankings</Text>
              </View>
              <View style={{ padding: 12, gap: 8 }}>
                {rest.map((user) => (
                  <View
                    key={user.userId}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.surfaceSoft, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 9, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 12, fontWeight: '900', color: COLORS.primary }}>#{user.rank}</Text>
                      </View>
                      <Avatar name={user.fullName} profileImage={user.profileImage} />
                      <View style={{ gap: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: COLORS.text }}>{user.fullName}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '600' }}>
                          {user.completedLessons} lessons · {user.completedQuizzes} quizzes
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="star" size={12} color={COLORS.gold} />
                      <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.text }}>{user.points}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}
