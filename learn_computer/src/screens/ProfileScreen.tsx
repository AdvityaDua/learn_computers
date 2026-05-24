import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { updateUserProfile, getMyTeachers } from '../lib/api';
import { AppDialog } from '../components/common/AppDialog';
import { COLORS } from '../lib/constants';
import { API_BASE_URL } from '../lib/constants';

type AppUser = {
  sub: string;
  email: string;
  role: string;
  fullName: string;
  profileImage?: string;
  phone?: string;
  classIds?: string[];
  schoolId?: { _id: string; name: string } | string;
};

type TeacherInfo = {
  _id: string;
  fullName: string;
  email: string;
  phone: string | null;
  classIds: string[];
};

type Props = {
  user: AppUser;
  onUpdate: (u: AppUser) => void;
};

const ROLE_ICONS: Record<string, { icon: 'school-outline' | 'people-outline' | 'shield-outline'; label: string }> = {
  student: { icon: 'school-outline', label: 'Student' },
  instructor: { icon: 'people-outline', label: 'Teacher' },
  admin: { icon: 'shield-outline', label: 'Administrator' },
};

export function ProfileScreen({ user, onUpdate }: Props) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState((user as any).phone || '');
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<TeacherInfo[]>([]);
  const [dialog, setDialog] = useState<{ type: 'error' | 'success' | 'info'; title: string; message: string } | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(
    user.profileImage ? `${API_BASE_URL.replace('/api', '')}${user.profileImage}` : null
  );
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);

  useEffect(() => {
    setFullName(user.fullName || '');
    setPhone((user as any).phone || '');
  }, [user.fullName, (user as any).phone]);

  // Fetch assigned teachers
  useEffect(() => {
    getMyTeachers().then(t => setTeachers(t || [])).catch(() => {});
  }, []);

  const initials = (() => {
    const parts = (user.fullName || '').trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return (user.fullName || 'ST').slice(0, 2).toUpperCase();
  })();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setImageUri(result.assets[0].uri);
    }
  };

  const roleConfig = ROLE_ICONS[user.role] ?? { icon: 'person-outline' as const, label: user.role };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setDialog({ type: 'error', title: 'Name Required', message: 'Please enter your full name.' });
      return;
    }
    try {
      setLoading(true);
      const imageFile = selectedImage
        ? {
            uri: selectedImage.uri,
            name: selectedImage.fileName || 'profile.jpg',
            type: selectedImage.mimeType || 'image/jpeg',
          }
        : undefined;
      const updated = await updateUserProfile(
        { fullName: fullName.trim(), phone: phone.trim() || undefined },
        imageFile,
      );
      onUpdate({ ...user, ...(updated as Partial<AppUser>), fullName: fullName.trim() });
      setDialog({ type: 'success', title: 'Profile Updated', message: 'Your profile has been saved successfully.' });
    } catch (err) {
      setDialog({ type: 'error', title: 'Update Failed', message: err instanceof Error ? err.message : 'Could not update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const classIds = (user as any).classIds ?? [];
  const schoolName = typeof (user as any).schoolId === 'object' ? (user as any).schoolId?.name : null;

  return (
    <>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 20 }} showsVerticalScrollIndicator={false}>

        {/* Avatar hero */}
        <View style={{ borderRadius: 24, backgroundColor: COLORS.primary, padding: 28, alignItems: 'center', gap: 14, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.28, shadowRadius: 20, elevation: 10 }}>
          {/* Avatar with edit button */}
          <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
            <View style={{ width: 84, height: 84, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={{ width: '100%', height: '100%' }} />
              ) : (
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>{initials}</Text>
              )}
            </View>
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary }}>
              <Ionicons name="camera" size={14} color={COLORS.primary} />
            </View>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#fff' }}>{user.fullName}</Text>
            <Text style={{ fontSize: 13, color: '#C4B5FD', fontWeight: '600' }}>{user.email}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, marginTop: 4 }}>
              <Ionicons name={roleConfig.icon} size={14} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#fff' }}>{roleConfig.label}</Text>
            </View>
          </View>
        </View>

        {/* Class & School Info */}
        {(classIds.length > 0 || schoolName) && (
          <View style={{ borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="business-outline" size={20} color={COLORS.primary} />
              <Text style={{ fontSize: 17, fontWeight: '900', color: COLORS.text }}>Class & School</Text>
            </View>

            {schoolName && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>School</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surfaceSoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: COLORS.border }}>
                  <Ionicons name="business" size={17} color={COLORS.muted} />
                  <Text style={{ fontSize: 14, color: COLORS.text, fontWeight: '600', flex: 1 }}>{schoolName}</Text>
                  <Ionicons name="lock-closed-outline" size={13} color={COLORS.muted} />
                </View>
              </View>
            )}

            {classIds.length > 0 && (
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Classes</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {classIds.map((c: string) => (
                    <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primaryLight, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border }}>
                      <Ionicons name="book" size={14} color={COLORS.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.primary }}>{c}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '500', marginTop: 2 }}>Class changes can only be made by your teacher</Text>
              </View>
            )}
          </View>
        )}

        {/* Assigned Teacher(s) */}
        {teachers.length > 0 && (
          <View style={{ borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="people-outline" size={20} color={COLORS.primary} />
              <Text style={{ fontSize: 17, fontWeight: '900', color: COLORS.text }}>
                {teachers.length === 1 ? 'Your Teacher' : 'Your Teachers'}
              </Text>
            </View>
            {teachers.map(t => (
              <View key={t._id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surfaceSoft, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: COLORS.border }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 16, fontWeight: '900', color: COLORS.primary }}>
                    {t.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.text }}>{t.fullName}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '500', marginTop: 1 }}>{t.email}</Text>
                  {t.phone && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <Ionicons name="call-outline" size={11} color={COLORS.muted} />
                      <Text style={{ fontSize: 11, color: COLORS.muted, fontWeight: '500' }}>{t.phone}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Settings form */}
        <View style={{ borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, padding: 20, gap: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="settings-outline" size={20} color={COLORS.primary} />
            <Text style={{ fontSize: 17, fontWeight: '900', color: COLORS.text }}>Profile Settings</Text>
          </View>

          {/* Email (read-only) */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Email Address</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surfaceSoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: COLORS.border }}>
              <Ionicons name="mail-outline" size={17} color={COLORS.muted} />
              <Text style={{ fontSize: 14, color: COLORS.muted, fontWeight: '600', flex: 1 }}>{user.email}</Text>
              <Ionicons name="lock-closed-outline" size={13} color={COLORS.muted} />
            </View>
          </View>

          {/* Role (read-only) */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4 }}>Role</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surfaceSoft, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, borderWidth: 1, borderColor: COLORS.border }}>
              <Ionicons name={roleConfig.icon} size={17} color={COLORS.muted} />
              <Text style={{ fontSize: 14, color: COLORS.muted, fontWeight: '600', flex: 1, textTransform: 'capitalize' }}>{roleConfig.label}</Text>
              <Ionicons name="lock-closed-outline" size={13} color={COLORS.muted} />
            </View>
          </View>

          {/* Full name (editable) */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.4 }}>Full Name</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2, borderWidth: 1.5, borderColor: COLORS.primary + '60' }}>
              <Ionicons name="create-outline" size={17} color={COLORS.primary} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your full name"
                placeholderTextColor={COLORS.muted}
                style={{ flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '600', paddingVertical: 12 }}
              />
            </View>
          </View>

          {/* Phone (editable) */}
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.4 }}>Phone Number</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 2, borderWidth: 1.5, borderColor: COLORS.primary + '60' }}>
              <Ionicons name="call-outline" size={17} color={COLORS.primary} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Your phone number (optional)"
                placeholderTextColor={COLORS.muted}
                keyboardType="phone-pad"
                style={{ flex: 1, fontSize: 14, color: COLORS.text, fontWeight: '600', paddingVertical: 12 }}
              />
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleSave}
            disabled={loading}
            style={{ backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5, opacity: loading ? 0.8 : 1 }}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name="save-outline" size={18} color="#fff" />
            }
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#fff' }}>{loading ? 'Saving…' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        {/* Points explanation */}
        <View style={{ borderRadius: 22, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' }}>
          <View style={{ backgroundColor: COLORS.primaryLight, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="star" size={18} color={COLORS.primary} />
            <Text style={{ fontSize: 15, fontWeight: '800', color: COLORS.text }}>How You Earn Points</Text>
          </View>
          <View style={{ padding: 16, gap: 10 }}>
            {[
              { icon: 'book-outline' as const, label: 'Lesson Completion', desc: 'Finish all content items in a lesson — videos, quizzes, assignments, and activities.', color: COLORS.success },
              { icon: 'help-circle-outline' as const, label: 'Quiz Scores', desc: 'Each quiz awards points based on your score. A perfect score earns the maximum points.', color: COLORS.secondary },
              { icon: 'document-attach-outline' as const, label: 'Approved Submissions', desc: 'When your teacher reviews and approves your submitted work, they award you points for it.', color: COLORS.primary },
              { icon: 'star-outline' as const, label: 'Teacher Bonus', desc: 'Your teacher can award bonus points for outstanding effort or deduct points for penalties.', color: '#F59E0B' },
            ].map(src => (
              <View key={src.label} style={{ flexDirection: 'row', gap: 12, backgroundColor: COLORS.surfaceSoft, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.border }}>
                <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: src.color + '18', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ionicons name={src.icon} size={16} color={src.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.text, marginBottom: 2 }}>{src.label}</Text>
                  <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '500', lineHeight: 17 }}>{src.desc}</Text>
                </View>
              </View>
            ))}
          </View>
          <View style={{ paddingHorizontal: 20, paddingVertical: 10, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.surfaceSoft, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <Ionicons name="information-circle-outline" size={15} color={COLORS.muted} style={{ marginTop: 1 }} />
            <Text style={{ fontSize: 11, color: COLORS.muted, flex: 1, lineHeight: 16, fontWeight: '500' }}>
              Points are cumulative. They are visible on the Leaderboard to your classmates and teacher.
            </Text>
          </View>
        </View>

        {/* Info banner */}
        <View style={{ borderRadius: 18, backgroundColor: COLORS.primaryLight, borderWidth: 1, borderColor: COLORS.border, padding: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ marginTop: 1 }}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.primary }}>Keep your profile updated</Text>
            <Text style={{ fontSize: 12, color: COLORS.primary + 'BB', fontWeight: '500', marginTop: 3, lineHeight: 18 }}>
              Your name appears on the leaderboard and helps your teacher identify you. Keep it accurate.
            </Text>
          </View>
        </View>
      </ScrollView>

      <AppDialog
        visible={!!dialog}
        type={dialog?.type || 'info'}
        title={dialog?.title || ''}
        message={dialog?.message || ''}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
