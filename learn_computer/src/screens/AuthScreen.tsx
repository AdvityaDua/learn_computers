import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../lib/constants';

type FormState = { fullName: string; email: string; password: string };
type AuthMode = 'login' | 'signup';

type AuthScreenProps = {
  mode: AuthMode;
  onModeChange: (nextMode: AuthMode) => void;
  form: FormState;
  onFormChange: (patch: Partial<FormState>) => void;
  onSubmit: () => void;
  onGoogle: () => void;
  submitting: boolean;
  googleLoading: boolean;
  error?: string;
  googleEnabled: boolean;
};

export function AuthScreen({
  mode, onModeChange, form, onFormChange, onSubmit,
  onGoogle, submitting, googleLoading, error, googleEnabled,
}: AuthScreenProps) {
  const isSignup = mode === 'signup';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 28 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={{ backgroundColor: COLORS.primary, paddingTop: 64, paddingBottom: 36, paddingHorizontal: 24, alignItems: 'center', gap: 14, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 }}>
          {/* Placeholder icon instead of logo */}
          <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.15)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="desktop-outline" size={38} color="#fff" />
          </View>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.4 }}>Learn Computers</Text>
            <Text style={{ fontSize: 14, color: '#DDD6FE', fontWeight: '500' }}>
              {isSignup ? 'Create your account to get started' : 'Welcome back — sign in to continue'}
            </Text>
          </View>
        </View>

        {/* Mode toggle */}
        {/* <View style={{ flexDirection: 'row', marginHorizontal: 24, marginTop: 28, marginBottom: 24, backgroundColor: COLORS.primaryLight, borderRadius: 16, padding: 4, borderWidth: 1, borderColor: COLORS.border, gap: 4 }}>
          {(['login', 'signup'] as AuthMode[]).map((m) => {
            const isActive = mode === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => onModeChange(m)}
                style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: isActive ? COLORS.primary : 'transparent', shadowColor: isActive ? COLORS.primary : 'transparent', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 8, elevation: isActive ? 3 : 0 }}
              >
                <Text style={{ fontSize: 14, fontWeight: '800', color: isActive ? '#fff' : COLORS.muted }}>
                  {m === 'login' ? 'Sign In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View> */}
        <View style={{ height: 28 }} />

        {/* Form */}
        <View style={{ paddingHorizontal: 24, gap: 14 }}>
          {isSignup && (
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.4 }}>Full Name</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: COLORS.border }}>
                <Ionicons name="person-outline" size={17} color={COLORS.muted} />
                <TextInput value={form.fullName} onChangeText={n => onFormChange({ fullName: n })} placeholder="Your full name" placeholderTextColor={COLORS.muted} autoCapitalize="words" style={{ flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '600', paddingVertical: 13 }} />
              </View>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.4 }}>Email Address</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: COLORS.border }}>
              <Ionicons name="mail-outline" size={17} color={COLORS.muted} />
              <TextInput value={form.email} onChangeText={e => onFormChange({ email: e })} placeholder="you@example.com" placeholderTextColor={COLORS.muted} keyboardType="email-address" autoCapitalize="none" style={{ flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '600', paddingVertical: 13 }} />
            </View>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text, textTransform: 'uppercase', letterSpacing: 0.4 }}>Password</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1.5, borderColor: COLORS.border }}>
              <Ionicons name="lock-closed-outline" size={17} color={COLORS.muted} />
              <TextInput value={form.password} onChangeText={p => onFormChange({ password: p })} placeholder="At least 6 characters" placeholderTextColor={COLORS.muted} secureTextEntry style={{ flex: 1, fontSize: 15, color: COLORS.text, fontWeight: '600', paddingVertical: 13 }} />
            </View>
          </View>

          {!isSignup && (
            <TouchableOpacity style={{ alignSelf: 'flex-end' }}>
              <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '700' }}>Forgot password?</Text>
            </TouchableOpacity>
          )}

          {/* Error */}
          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', padding: 12 }}>
              <Ionicons name="alert-circle-outline" size={16} color={COLORS.danger} />
              <Text style={{ fontSize: 13, color: COLORS.danger, fontWeight: '600', flex: 1 }}>{error}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            onPress={onSubmit}
            activeOpacity={0.88}
            disabled={submitting}
            style={{ height: 54, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 10, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.26, shadowRadius: 14, elevation: 7, opacity: submitting ? 0.8 : 1, marginTop: 4 }}
          >
            {submitting
              ? <ActivityIndicator color="#fff" size="small" />
              : <Ionicons name={isSignup ? 'person-add-outline' : 'log-in-outline'} size={19} color="#fff" />
            }
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>
              {submitting ? 'Please wait…' : isSignup ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Divider */}
          {/* <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
            <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '600' }}>or</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: COLORS.border }} />
          </View> */}

          {/* Google */}
          {/* <TouchableOpacity
            onPress={onGoogle}
            disabled={!googleEnabled || googleLoading}
            style={{ flexDirection: 'row', height: 52, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', gap: 10, opacity: !googleEnabled ? 0.5 : 1 }}
          >
            {googleLoading
              ? <ActivityIndicator size="small" color={COLORS.muted} />
              : <Ionicons name="logo-google" size={20} color="#4285F4" />
            }
            <Text style={{ fontSize: 15, fontWeight: '700', color: COLORS.text }}>
              {googleEnabled ? 'Continue with Google' : 'Google unavailable'}
            </Text>
          </TouchableOpacity> */}

          {/* Toggle */}
          {/* <TouchableOpacity onPress={() => onModeChange(isSignup ? 'login' : 'signup')} style={{ alignItems: 'center', paddingVertical: 12, marginBottom: 32 }}>
            <Text style={{ fontSize: 14, color: COLORS.muted }}>
              {isSignup ? 'Already have an account?  ' : "Don't have an account?  "}
              <Text style={{ color: COLORS.primary, fontWeight: '800' }}>{isSignup ? 'Sign In' : 'Sign Up'}</Text>
            </Text>
          </TouchableOpacity> */}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
