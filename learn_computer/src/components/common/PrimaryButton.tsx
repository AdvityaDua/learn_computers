import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'muted' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  tone = 'primary',
  icon,
}: PrimaryButtonProps) {
  const isPrimary = tone === 'primary';
  const isDanger = tone === 'danger';

  const bgColor = isPrimary ? '#5b21b6' : isDanger ? '#fee2e2' : '#ffffff';
  const textColor = isPrimary ? '#ffffff' : isDanger ? '#dc2626' : '#5b21b6';
  const borderColor = isPrimary ? 'transparent' : isDanger ? '#fca5a5' : '#ddd6fe';
  const shadowColor = isPrimary ? '#5b21b6' : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        height: 54,
        borderRadius: 16,
        backgroundColor: bgColor,
        borderWidth: isPrimary ? 0 : 1.5,
        borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled ? 0.55 : pressed ? 0.88 : 1,
        shadowColor,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isPrimary ? 0.28 : 0,
        shadowRadius: 16,
        elevation: isPrimary ? 6 : 0,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : icon ? (
          <Ionicons name={icon} size={18} color={textColor} />
        ) : null}
        <Text style={{
          fontSize: 16,
          fontWeight: '700',
          color: textColor,
          letterSpacing: 0.2,
        }}>
          {loading ? 'Please wait…' : label}
        </Text>
      </View>
    </Pressable>
  );
}
