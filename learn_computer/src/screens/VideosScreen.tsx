import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../lib/constants';

type VideoLesson = {
  _id: string;
  title: string;
  tags: string[];
  thumbnailFilePath?: string;
  externalVideoUrl?: string;
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
  videos: VideoLesson[];
  contentMap: Map<string, ContentLocation>;
  onOpenContentPoint?: (contentId: string) => void;
};

const VIDEO_ACCENTS = [COLORS.primary, COLORS.sky, '#059669', '#D97706', '#BE185D', '#0EA5E9'];

type ExpandedState = {
  [key: string]: boolean;
};

function fmtDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function VideosScreen({ videos, contentMap, onOpenContentPoint }: Props) {
  const [search, setSearch] = useState('');
  const [linkFilter, setLinkFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [tagFilter, setTagFilter] = useState<'all' | 'tagged' | 'untagged'>('all');
  const [sortFilter, setSortFilter] = useState<'newest' | 'oldest'>('newest');
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const toggleExpanded = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filtered = useMemo(() => {
    const next = videos.filter(v => {
      if (!search) return true;
      const q = search.toLowerCase();
      return v.title.toLowerCase().includes(q) || (v.tags || []).some(t => t.toLowerCase().includes(q));
    }).filter(v => {
      const isLinked = contentMap.has(v._id);
      if (linkFilter === 'linked' && !isLinked) return false;
      if (linkFilter === 'unlinked' && isLinked) return false;

      const hasTags = (v.tags || []).length > 0;
      if (tagFilter === 'tagged' && !hasTags) return false;
      if (tagFilter === 'untagged' && hasTags) return false;
      return true;
    });

    next.sort((a, b) => {
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return sortFilter === 'newest' ? bt - at : at - bt;
    });

    return next;
  }, [videos, search, contentMap, linkFilter, tagFilter, sortFilter]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 16 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="play-circle-outline" size={22} color={COLORS.primary} />
          <Text style={{ fontSize: 22, fontWeight: '900', color: COLORS.text }}>Video Library</Text>
        </View>
        <Text style={{ fontSize: 13, color: COLORS.muted, fontWeight: '500', marginLeft: 30 }}>Browse lesson videos and watch at your pace.</Text>
      </View>

      {/* Search */}
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1.5, borderColor: COLORS.border, gap: 8 }}>
        <Ionicons name="search-outline" size={16} color={COLORS.muted} />
        <TextInput value={search} onChangeText={setSearch} placeholder="Search videos or tags…" placeholderTextColor={COLORS.muted} style={{ flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '500' }} />
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
          { label: 'Tagged', active: tagFilter === 'tagged', onPress: () => setTagFilter('tagged') },
          { label: 'Untagged', active: tagFilter === 'untagged', onPress: () => setTagFilter('untagged') },
          { label: sortFilter === 'newest' ? 'Newest' : 'Oldest', active: true, onPress: () => setSortFilter(prev => prev === 'newest' ? 'oldest' : 'newest') },
        ].map((chip) => (
          <TouchableOpacity key={chip.label} onPress={chip.onPress} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: chip.active ? COLORS.primary : COLORS.border, backgroundColor: chip.active ? COLORS.primaryLight : COLORS.surface }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: chip.active ? COLORS.primary : COLORS.muted }}>{chip.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '700' }}>
        {filtered.length} {filtered.length !== 1 ? 'videos' : 'video'} found
      </Text>

      {filtered.length === 0 ? (
        <View style={{ borderRadius: 18, backgroundColor: COLORS.surface, padding: 40, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: COLORS.border }}>
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="videocam-off-outline" size={26} color={COLORS.primary} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>No videos found</Text>
          <Text style={{ fontSize: 13, color: COLORS.muted, textAlign: 'center' }}>Try adjusting your search term.</Text>
        </View>
      ) : (
        filtered.map((v, idx) => {
          const loc = contentMap.get(v._id);
          const accent = VIDEO_ACCENTS[idx % VIDEO_ACCENTS.length];
          const isExpanded = expanded[v._id];
          const handleOpen = () => {
            if (loc) {
              onOpenContentPoint?.(v._id);
            }
          };
          return (
            <TouchableOpacity key={v._id} onPress={handleOpen} disabled={!loc} activeOpacity={loc ? 0.85 : 1} style={{ borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }}>
              {/* Thumbnail placeholder */}
              <View style={{ height: 100, backgroundColor: accent + '15', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: accent }}>
                <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 }}>
                  <Ionicons name="play" size={24} color={accent} />
                </View>
              </View>

              <View style={{ padding: 14, gap: 10 }}>
                {/* Header row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                  <View style={{ backgroundColor: accent + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>VIDEO</Text>
                  </View>
                  <Text style={{ fontSize: 10, color: COLORS.muted, fontWeight: '600' }}>{fmtDate(v.createdAt)}</Text>
                </View>

                {/* Title */}
                <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text, lineHeight: 20 }} numberOfLines={isExpanded ? 0 : 2}>{v.title}</Text>

                {/* Tags - compact display */}
                {(v.tags || []).length > 0 && !isExpanded && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <View style={{ backgroundColor: accent + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: accent }}>#{v.tags[0]}</Text>
                    </View>
                    {v.tags.length > 1 && (
                      <View style={{ backgroundColor: COLORS.border, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 }}>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: COLORS.muted }}>+{v.tags.length - 1}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Expandable content */}
                {isExpanded && (
                  <View style={{ gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border }}>
                    {/* All tags */}
                    {(v.tags || []).length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                        {v.tags.map(tag => (
                          <View key={tag} style={{ backgroundColor: accent + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 }}>
                            <Text style={{ fontSize: 9, fontWeight: '700', color: accent }}>#{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                    {/* Curriculum location */}
                    {loc && (
                      <View style={{ gap: 6 }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.3 }}>In Curriculum</Text>
                        <View style={{ backgroundColor: accent + '08', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: accent + '30', gap: 6 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="book-outline" size={12} color={accent} />
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
                <TouchableOpacity onPress={() => toggleExpanded(v._id)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, marginTop: 2 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>{isExpanded ? 'Show Less' : 'Show More'}</Text>
                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={COLORS.primary} />
                </TouchableOpacity>

                {/* Open button */}
                {loc && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: accent, paddingVertical: 11, borderRadius: 12 }}>
                    <Ionicons name="play-outline" size={16} color="#fff" />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>Watch Now</Text>
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
