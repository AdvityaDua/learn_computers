import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../lib/constants';

type Quiz = {
  _id: string;
  title: string;
  description?: string;
  questions: { question: string }[];
  createdAt: string;
};

type ContentLocation = {
  chapterId: string;
  chapterTitle: string;
  lessonId: string;
  lessonTitle: string;
  itemId: string;
  itemType: 'video' | 'quiz' | 'assignment' | 'activity';
};

type Props = {
  quizzes: Quiz[];
  contentMap: Map<string, ContentLocation>;
  onOpenContentPoint?: (contentId: string) => void;
};

type ExpandedState = {
  [key: string]: boolean;
};

const QUIZ_ACCENTS = [
  { bg: '#EDE9FE', border: '#C4B5FD', icon: COLORS.primary },
  { bg: '#FEF3C7', border: '#FDE68A', icon: '#D97706' },
  { bg: '#D1FAE5', border: '#A7F3D0', icon: '#059669' },
  { bg: '#DBEAFE', border: '#BFDBFE', icon: '#2563EB' },
  { bg: '#FCE7F3', border: '#FBCFE8', icon: '#BE185D' },
];

function fmtDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function QuizzesScreen({ quizzes, contentMap, onOpenContentPoint }: Props) {
  const [search, setSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [lengthFilter, setLengthFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [sortFilter, setSortFilter] = useState<'newest' | 'oldest'>('newest');
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = useMemo(() => {
    const next = quizzes
      .filter(q => !search || q.title.toLowerCase().includes(search.toLowerCase()))
      .filter(q => {
        const isLinked = contentMap.has(q._id);
        if (linkFilter === 'linked' && !isLinked) return false;
        if (linkFilter === 'unlinked' && isLinked) return false;

        const count = q.questions?.length || 0;
        if (lengthFilter === 'short' && count > 5) return false;
        if (lengthFilter === 'medium' && (count < 6 || count > 10)) return false;
        if (lengthFilter === 'long' && count <= 10) return false;
        return true;
      });

    next.sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sortFilter === 'newest' ? bt - at : at - bt;
    });

    return next;
  }, [quizzes, search, contentMap, linkFilter, lengthFilter, sortFilter]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="help-circle-outline" size={22} color={COLORS.primary} />
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Quiz Bank</Text>
        </View>
        <Text style={{ fontSize: 13, color: COLORS.muted, fontWeight: '500', marginLeft: 30 }}>Practice-ready quizzes to test your knowledge.</Text>
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: COLORS.border, gap: 8 }}>
        <Ionicons name="search-outline" size={16} color={COLORS.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search quizzes…" placeholderTextColor={COLORS.muted} style={{ flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' }} />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[
          { label: 'All', active: linkFilter === 'all', onPress: () => setLinkFilter('all') },
          { label: 'In Curriculum', active: linkFilter === 'linked', onPress: () => setLinkFilter('linked') },
          { label: 'Unlinked', active: linkFilter === 'unlinked', onPress: () => setLinkFilter('unlinked') },
          { label: 'Short', active: lengthFilter === 'short', onPress: () => setLengthFilter('short') },
          { label: 'Medium', active: lengthFilter === 'medium', onPress: () => setLengthFilter('medium') },
          { label: 'Long', active: lengthFilter === 'long', onPress: () => setLengthFilter('long') },
          { label: sortFilter === 'newest' ? 'Newest' : 'Oldest', active: true, onPress: () => setSortFilter(prev => prev === 'newest' ? 'oldest' : 'newest') },
        ].map((chip) => (
          <TouchableOpacity key={chip.label} onPress={chip.onPress} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: chip.active ? COLORS.primary : COLORS.border, backgroundColor: chip.active ? COLORS.primaryLight : COLORS.surface }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: chip.active ? COLORS.primary : COLORS.muted }}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '700' }}>
        {filtered.length} {filtered.length !== 1 ? 'quizzes' : 'quiz'} available
      </Text>

      {filtered.length === 0 ? (
        <View style={{ borderRadius: 18, backgroundColor: COLORS.surface, padding: 40, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="help-circle-outline" size={26} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>No quizzes found</Text>
          <Text style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center' }}>Try a different search term.</Text>
        </View>
      ) : (
        filtered.map((q, idx) => {
          const loc = contentMap.get(q._id);
          const theme = QUIZ_ACCENTS[idx % QUIZ_ACCENTS.length];
          const qCount = q.questions?.length || 0;
          const isExpanded = expanded[q._id];
          const handleOpen = () => {
            if (loc) {
              onOpenContentPoint?.(q._id);
            }
          };

          return (
            <TouchableOpacity key={q._id} onPress={handleOpen} disabled={!loc} activeOpacity={loc ? 0.85 : 1} style={{ borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor: theme.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              {/* Top stripe */}
              <View style={{ height: 4, backgroundColor: theme.icon }} />

              <View style={{ padding: 14, gap: 10 }}>
                {/* Header row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="help-circle-outline" size={24} color={theme.icon} />
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View style={{ backgroundColor: theme.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: theme.icon }}>{qCount} Q</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.gold + '1A', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: COLORS.gold + '40' }}>
                      <Ionicons name="star" size={12} color={COLORS.gold} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.gold }}>Up to 10 Points</Text>
                    </View>
                  </View>
                </View>

                {/* Title */}
                <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text, lineHeight: 20 }} numberOfLines={isExpanded ? 0 : 2}>{q.title}</Text>

                {/* Description - compact */}
                {q.description && !isExpanded && (
                  <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '500', lineHeight: 16 }} numberOfLines={2} ellipsizeMode="tail">{q.description}</Text>
                )}

                {/* Expandable content */}
                {isExpanded && (
                  <View style={{ gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                    {q.description && (
                      <View style={{ gap: 4 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>Description</Text>
                        <Text style={{ fontSize: 11, color: COLORS.text, fontWeight: '500', lineHeight: 16 }}>{q.description}</Text>
                      </View>
                    )}
                    {/* Curriculum location */}
                    {loc && (
                      <View style={{ gap: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>In Curriculum</Text>
                        <View style={{ backgroundColor: theme.icon + '08', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: theme.icon + '30', gap: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="book-outline" size={12} color={theme.icon} />
                            <Text style={{ flex: 1, fontSize: 11, fontWeight: '700', color: COLORS.text }}>{loc.chapterTitle}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 12 }}>
                            <Ionicons name="bookmark-outline" size={10} color={COLORS.muted} />
                            <Text style={{ flex: 1, fontSize: 10, fontWeight: '600', color: COLORS.muted }}>{loc.lessonTitle}</Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}

                {/* Expand/Collapse button */}
                <TouchableOpacity onPress={() => toggleExpanded(q._id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, marginTop: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>{isExpanded ? 'Show Less' : 'Show More'}</Text>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.primary} />
                </TouchableOpacity>

                {/* Open button */}
                {loc && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.icon, paddingVertical: 11, borderRadius: 12 }}>
                    <Ionicons name="play-outline" size={16} color="#fff" />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Start Quiz</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}
