import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { submitTaskSubmission } from '../../lib/api';
import { COLORS } from '../../lib/constants';
import { mdStyles } from './MarkdownStyles';
import { TaskData, TaskSubmission } from './types';

export function TaskSection({ item, type, chapterId, lessonId, submission, highlighted, onDone }: {
  item: TaskData; type: 'assignment' | 'activity'; chapterId: string; lessonId: string;
  submission?: TaskSubmission; highlighted?: boolean; onDone: (submission: TaskSubmission) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const pick = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.[0]) return;
      const file = res.assets[0];
      setUploading(true);
      const nextSubmission = await submitTaskSubmission(chapterId, lessonId, type, item._id, {
        uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream',
      });
      onDone(nextSubmission as TaskSubmission);
    } catch (e: any) {
      Alert.alert('Upload Error', e.message || 'Failed to upload');
    } finally { setUploading(false); }
  };

  const icon = type === 'assignment' ? 'clipboard-outline' : 'color-wand-outline';
  const accent = type === 'assignment' ? COLORS.success : '#D97706';
  const requiresSubmission = item.requiresSubmission;
  const reviewStatus = submission?.reviewStatus;
  const isApproved = reviewStatus === 'approved';
  const isPending = reviewStatus === 'pending';
  const isRejected = reviewStatus === 'rejected';
  const isResubmitRequested = reviewStatus === 'resubmit_requested';
  const borderColor = isApproved
    ? '#BBF7D0'
    : isRejected || isResubmitRequested
      ? '#FECACA'
      : highlighted
        ? accent
        : COLORS.border;
  const compactStatusLabel = !requiresSubmission
    ? 'No submission needed'
    : isApproved
      ? 'Approved'
      : isPending
        ? 'Pending review'
        : isResubmitRequested
          ? 'Resubmission requested'
          : isRejected
            ? 'Declined — resubmit'
            : 'Teacher review required';

  return (
    <View style={{ gap: 24 }}>
      <View style={{ borderRadius: 16, backgroundColor: COLORS.surface, borderWidth: 1.5, borderColor, overflow: 'hidden' }}>
        <View style={{ height: 4, backgroundColor: accent }} />
        <View style={{ padding: 20, gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: accent + '18', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon} size={24} color={accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{type}</Text>
              <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>{item.title}</Text>
            </View>
            {isApproved && <Ionicons name="checkmark-circle" size={28} color={COLORS.success} />}
          </View>

          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: requiresSubmission ? '#EFF6FF' : COLORS.surfaceSoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
            <Ionicons name={requiresSubmission ? 'shield-checkmark-outline' : 'sparkles-outline'} size={14} color={requiresSubmission ? COLORS.primary : COLORS.muted} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: requiresSubmission ? COLORS.primary : COLORS.muted }}>{compactStatusLabel}</Text>
          </View>
          
          {item.points != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
              <Ionicons name="star" size={14} color="#D97706" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#D97706' }}>{item.points} Points Available</Text>
            </View>
          )}

          {isApproved ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0FDF4', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BBF7D0' }}>
              <Ionicons name="document-text" size={24} color={COLORS.success} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: COLORS.success, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Approved By Teacher</Text>
                <Text style={{ fontSize: 14, color: '#166534', fontWeight: '700' }} numberOfLines={1}>
                  {submission?.originalName || 'Submission approved'}
                </Text>
              </View>
            </View>
          ) : isPending ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#EFF6FF', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE' }}>
              <Ionicons name="time-outline" size={22} color={COLORS.primary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Awaiting Teacher Review</Text>
                <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '700' }} numberOfLines={1}>{submission?.originalName}</Text>
                <Text style={{ fontSize: 13, color: COLORS.muted, fontWeight: '500', marginTop: 2 }}>This work will count toward lesson progress after a teacher approves it.</Text>
              </View>
            </View>
          ) : isResubmitRequested ? (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FFF7ED', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FED7AA' }}>
                <Ionicons name="refresh-circle-outline" size={22} color="#D97706" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: '#D97706', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Resubmission Requested</Text>
                  <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '700' }} numberOfLines={1}>{submission?.originalName}</Text>
                  <Text style={{ fontSize: 13, color: '#92400E', fontWeight: '500', marginTop: 2 }}>
                    {submission?.reviewFeedback?.trim() || 'Your teacher would like you to submit an updated version.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={pick} disabled={uploading} activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#D97706', borderRadius: 12, paddingVertical: 14, opacity: uploading ? 0.7 : 1 }}>
                {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="refresh-outline" size={20} color="#fff" />}
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{uploading ? 'Uploading…' : 'Submit Updated Version'}</Text>
              </TouchableOpacity>
            </View>
          ) : isRejected ? (
            <View style={{ gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#FEF2F2', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' }}>
                <Ionicons name="alert-circle-outline" size={22} color={COLORS.danger} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, color: COLORS.danger, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 }}>Needs Resubmission</Text>
                  <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '700' }} numberOfLines={1}>{submission?.originalName}</Text>
                  <Text style={{ fontSize: 13, color: COLORS.danger, fontWeight: '500', marginTop: 2 }}>
                    {submission?.reviewFeedback?.trim() || 'Your teacher requested another submission.'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={pick} disabled={uploading} activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: accent, borderRadius: 12, paddingVertical: 14, opacity: uploading ? 0.7 : 1 }}>
                {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="refresh-outline" size={20} color="#fff" />}
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{uploading ? 'Uploading…' : 'Re-upload For Review'}</Text>
              </TouchableOpacity>
            </View>
          ) : !requiresSubmission ? null : (
            <View style={{ gap: 10 }}>
              <TouchableOpacity onPress={pick} disabled={uploading} activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: accent, borderRadius: 12, paddingVertical: 14, opacity: uploading ? 0.7 : 1 }}>
                {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="cloud-upload-outline" size={20} color="#fff" />}
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{uploading ? 'Uploading…' : 'Upload Submission'}</Text>
              </TouchableOpacity>
              <Text style={{ fontSize: 13, color: COLORS.muted, fontWeight: '500' }}>Your submission stays pending until a teacher reviews it.</Text>
            </View>
          )}

          {requiresSubmission && item.acceptedFileTypes && item.acceptedFileTypes.length > 0 && !item.acceptedFileTypes.includes('any') ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {item.acceptedFileTypes.map((fileType) => (
                <View key={fileType} style={{ backgroundColor: COLORS.surfaceSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted }}>{fileType}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      {item.description ? (
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>Instructions</Text>
          <Markdown style={mdStyles}>{item.description}</Markdown>
        </View>
      ) : null}
    </View>
  );
}
