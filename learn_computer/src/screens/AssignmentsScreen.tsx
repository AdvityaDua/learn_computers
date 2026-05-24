import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../lib/constants';

type Assignment = {
  _id: string;
  title: string;
  tags: string[];
  points?: number;
  dueDate?: string;
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
  assignments: Assignment[];
  contentMap: Map<string, ContentLocation>;
  onOpenContentPoint?: (contentId: string) => void;
};

type ExpandedState = {
  [key: string]: boolean;
};

type DueInfo = {
  label: string;
  color: string;
  bg: string;
  icon: 'close-circle-outline' | 'time-outline' | 'calendar-outline' | 'remove-circle-outline';
  stripeColor: string;
};

function getDueInfo(iso?: string): DueInfo {
  if (!iso) {
    return {
      label: 'No due date',
      color: COLORS.primary,
      bg: COLORS.primaryLight,
      icon: 'remove-circle-outline',
      stripeColor: '#BFDBFE',
    };
  }
  const diff = new Date(iso).getTime() - Date.now();
  const days = Math.floor(diff / 86400000);
  if (diff < 0) return { label: `Overdue ${Math.abs(days)}d`, color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle-outline', stripeColor: '#EF4444' };
  if (days <= 3) return { label: `Due in ${days}d`, color: '#D97706', bg: '#FEF3C7', icon: 'time-outline', stripeColor: '#F59E0B' };
  return {
    label: new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    color: COLORS.success, bg: '#D1FAE5', icon: 'calendar-outline', stripeColor: COLORS.success,
  };
}

export function AssignmentsScreen({ assignments, contentMap, onOpenContentPoint }: Props) {
  const [search, setSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [dueFilter, setDueFilter] = useState<'all' | 'overdue' | 'due-soon' | 'no-due'>('all');
  const [sortFilter, setSortFilter] = useState<'newest' | 'oldest'>('newest');
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    const next = assignments
      .filter(a => !search || a.title.toLowerCase().includes(search.toLowerCase()))
      .filter(a => {
        const isLinked = contentMap.has(a._id);
        if (linkFilter === 'linked' && !isLinked) return false;
        if (linkFilter === 'unlinked' && isLinked) return false;

        const dueMs = a.dueDate ? new Date(a.dueDate).getTime() : null;
        if (dueFilter === 'no-due' && dueMs != null) return false;
        if (dueFilter === 'overdue' && (dueMs == null || dueMs >= now)) return false;
        if (dueFilter === 'due-soon' && (dueMs == null || dueMs < now || dueMs > now + 3 * 86400000)) return false;
        return true;
      });

    next.sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sortFilter === 'newest' ? bt - at : at - bt;
    });

    return next;
  }, [assignments, search, contentMap, linkFilter, dueFilter, sortFilter]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="clipboard-outline" size={22} color={COLORS.primary} />
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Assignments</Text>
        </View>
        <Text style={{ fontSize: 13, color: COLORS.muted, fontWeight: '500', marginLeft: 30 }}>Stay on top of tasks and deadlines.</Text>
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: COLORS.border, gap: 8 }}>
        <Ionicons name="search-outline" size={16} color={COLORS.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search assignments…" placeholderTextColor={COLORS.muted} style={{ flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' }} />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {[
          { label: 'All', active: linkFilter === 'all' && dueFilter === 'all', onPress: () => { setLinkFilter('all'); setDueFilter('all'); } },
          { label: 'In Curriculum', active: linkFilter === 'linked', onPress: () => setLinkFilter('linked') },
          { label: 'Unlinked', active: linkFilter === 'unlinked', onPress: () => setLinkFilter('unlinked') },
          { label: 'Overdue', active: dueFilter === 'overdue', onPress: () => setDueFilter('overdue') },
          { label: 'Due Soon', active: dueFilter === 'due-soon', onPress: () => setDueFilter('due-soon') },
          { label: 'No Due Date', active: dueFilter === 'no-due', onPress: () => setDueFilter('no-due') },
          { label: sortFilter === 'newest' ? 'Newest' : 'Oldest', active: true, onPress: () => setSortFilter(prev => prev === 'newest' ? 'oldest' : 'newest') },
        ].map((chip) => (
          <TouchableOpacity key={chip.label} onPress={chip.onPress} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: chip.active ? COLORS.primary : COLORS.border, backgroundColor: chip.active ? COLORS.primaryLight : COLORS.surface }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: chip.active ? COLORS.primary : COLORS.muted }}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '700' }}>
        {filtered.length} {filtered.length !== 1 ? 'assignments' : 'assignment'}
      </Text>

      {filtered.length === 0 ? (
        <View style={{ borderRadius: 18, backgroundColor: COLORS.surface, padding: 40, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="clipboard-outline" size={26} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>No assignments found</Text>
          <Text style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center' }}>New tasks will appear here when assigned.</Text>
        </View>
      ) : (
        filtered.map((a) => {
          const loc = contentMap.get(a._id);
          const due = getDueInfo(a.dueDate);
          const isExpanded = expanded[a._id];
          const cardBorderColor = loc ? '#BFDBFE' : COLORS.border;
          const handleOpen = () => {
            if (loc) {
              onOpenContentPoint?.(a._id);
            }
          };

          return (
            <TouchableOpacity key={a._id} onPress={handleOpen} disabled={!loc} activeOpacity={loc ? 0.85 : 1} style={{ borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: cardBorderColor, overflow: 'hidden', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: loc ? 0.08 : 0.04, shadowRadius: 10, elevation: 2 }}>
              {/* Urgency stripe */}
              <View style={{ height: 4, backgroundColor: due.stripeColor }} />

              <View style={{ padding: 14, gap: 10 }}>
                {/* Top row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#BFDBFE' }}>
                    <Ionicons name="clipboard-outline" size={22} color={COLORS.primary} />
                  </View>
                  <View style={{ backgroundColor: due.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, flex: 1, borderWidth: 1, borderColor: due.stripeColor + '55' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name={due.icon} size={13} color={due.color} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: due.color }}>{due.label}</Text>
                    </View>
                  </View>
                </View>

                {/* Title */}
                <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text, lineHeight: 20 }} numberOfLines={isExpanded ? 0 : 2}>{a.title}</Text>

                {/* Metadata row - compact */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="calendar-outline" size={10} color={COLORS.muted} />
                    <Text style={{ fontSize: 10, color: COLORS.muted, fontWeight: '600' }}>
                      {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </Text>
                  </View>
                  {a.points != null && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.gold + '1A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: COLORS.gold + '40' }}>
                      <Ionicons name="star" size={10} color={COLORS.gold} />
                      <Text style={{ fontSize: 10, fontWeight: '800', color: COLORS.gold }}>{a.points} Points</Text>
                    </View>
                  )}
                </View>

                {/* Tags - compact display */}
                {(a.tags || []).length > 0 && !isExpanded && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.primary }}>#{a.tags[0]}</Text>
                    </View>
                    {a.tags.length > 1 && (
                      <View style={{ backgroundColor: COLORS.surfaceSoft, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.muted }}>+{a.tags.length - 1}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Expandable content */}
                {isExpanded && (
                  <View style={{ gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                    {/* All tags */}
                    {(a.tags || []).length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        {a.tags.map(tag => (
                          <View key={tag} style={{ backgroundColor: '#DBEAFE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.primary }}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {/* Curriculum location */}
                    {loc && (
                      <View style={{ gap: 6 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>In Curriculum</Text>
                        <View style={{ backgroundColor: COLORS.primaryLight + '40', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary + '30', gap: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="book-outline" size={12} color={COLORS.primary} />
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
                <TouchableOpacity onPress={() => toggleExpanded(a._id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, marginTop: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>{isExpanded ? 'Show Less' : 'Show More'}</Text>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.primary} />
                </TouchableOpacity>

                {/* Open button */}
                {loc && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryDark }}>
                    <Ionicons name="open-outline" size={16} color="#fff" />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Open Assignment</Text>
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
