import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';
import { COLORS } from '../lib/constants';

export function SplashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 24 }}>
      {/* Placeholder logo — square with icon */}
      <View style={{
        width: 90, height: 90, borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
      }}>
        <Ionicons name="desktop-outline" size={44} color="#fff" />
      </View>

      <Text style={{ fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5 }}>Learn Computers</Text>
      <Text style={{ fontSize: 15, color: '#C4B5FD', fontWeight: '600', marginTop: 6 }}>Your interactive learning platform</Text>

      <View style={{ marginTop: 44, alignItems: 'center', gap: 10 }}>
        <ActivityIndicator color="rgba(255,255,255,0.7)" size="small" />
        <Text style={{ fontSize: 13, color: '#DDD6FE', fontWeight: '600' }}>Getting everything ready…</Text>
      </View>
    </View>
  );
}
