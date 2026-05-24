import './global.css';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { AuthScreen } from './src/screens/AuthScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SplashScreen } from './src/screens/SplashScreen';
import {
  clearStoredSession,
  getStoredSession,
  login,
  loginWithGoogle,
  setActiveAccessToken,
  signup,
  type AuthResponse,
} from './src/lib/api';
import { GOOGLE_CLIENT_IDS } from './src/lib/constants';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'login' | 'signup';
type FormState = {
  fullName: string;
  email: string;
  password: string;
};

const initialForm: FormState = {
  fullName: '',
  email: '',
  password: '',
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [mode, setMode] = useState<AuthMode>('login');
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [session, setSession] = useState<AuthResponse | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: GOOGLE_CLIENT_IDS.android,
    iosClientId: GOOGLE_CLIENT_IDS.ios,
  });

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const [storedSession] = await Promise.all([
        getStoredSession(),
        new Promise((resolve) => setTimeout(resolve, 1600)),
      ]);

      if (!mounted) {
        return;
      }

      if (storedSession) {
        setSession(storedSession);
      }

      setShowSplash(false);
    };

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (!response || response.type !== 'success') {
        return;
      }

      const idToken =
        response.params?.id_token ||
        (response.authentication && 'idToken' in response.authentication
          ? response.authentication.idToken
          : undefined);

      if (!idToken) {
        setError('Google sign-in did not return an id token.');
        return;
      }

      try {
        setGoogleLoading(true);
        setError(undefined);

        // Backend verifies Google token; no client-side Firebase auth session required.
        const authPayload = await loginWithGoogle(idToken);
        setSession(authPayload);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Google login failed';
        setError(message);
      } finally {
        setGoogleLoading(false);
      }
    };

    handleGoogleResponse();
  }, [response]);

  const canSubmit = useMemo(() => {
    if (mode === 'signup') {
      return form.fullName.trim().length >= 2 && form.password.length >= 6 && form.email.includes('@');
    }
    return form.password.length >= 6 && form.email.includes('@');
  }, [form, mode]);

  const onSubmit = async () => {
    if (!canSubmit) {
      setError('Please fill valid details before continuing.');
      return;
    }

    try {
      setSubmitting(true);
      setError(undefined);

      if (mode === 'signup') {
        const result = await signup(form.fullName.trim(), form.email.trim().toLowerCase(), form.password);
        setSession(result);
      } else {
        const result = await login(form.email.trim().toLowerCase(), form.password);
        setSession(result);
      }

      setForm(initialForm);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    if (!request) {
      Alert.alert('Google setup required', 'Add valid Google OAuth client IDs before using Google sign-in.');
      return;
    }

    setError(undefined);
    await promptAsync();
  };

  const onLogout = async () => {
    setSession(null);
    setMode('login');
    setForm(initialForm);
    setError(undefined);
    setActiveAccessToken(null);
    await clearStoredSession();
  };

  if (showSplash) {
    return (
      <>
        <SplashScreen />
        <StatusBar style="dark" />
      </>
    );
  }

  if (session) {
    return (
      <>
        <DashboardScreen user={session.user} onLogout={onLogout} />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <>
      <AuthScreen
        mode={mode}
        onModeChange={(nextMode) => {
          setMode(nextMode);
          setError(undefined);
        }}
        form={form}
        onFormChange={(patch) => {
          setForm((current) => ({ ...current, ...patch }));
          setError(undefined);
        }}
        onSubmit={onSubmit}
        onGoogle={onGoogle}
        submitting={submitting}
        googleLoading={googleLoading}
        error={error}
        googleEnabled={Boolean(request)}
      />
      <StatusBar style="dark" />
    </>
  );
}
