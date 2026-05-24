import { Text, View } from 'react-native';

type BrandMarkProps = {
  compact?: boolean;
  horizontal?: boolean;
};

export function BrandMark({ compact = false, horizontal = false }: BrandMarkProps) {
  const iconSize = compact ? (horizontal ? 32 : 48) : 72;
  const borderRadius = compact ? (horizontal ? 10 : 16) : 24;
  const fontSize = compact ? (horizontal ? 14 : 18) : 28;
  const titleSize = compact ? (horizontal ? 16 : 20) : 28;

  return (
    <View style={{
      flexDirection: horizontal ? 'row' : 'column',
      alignItems: 'center',
      gap: horizontal ? 10 : (compact ? 8 : 14)
    }}>
      <View style={{
        width: iconSize,
        height: iconSize,
        borderRadius: borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#5b21b6',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        shadowColor: '#5b21b6',
        shadowOffset: { width: 0, height: compact ? 2 : 8 },
        shadowOpacity: 0.3,
        shadowRadius: compact ? 6 : 20,
        elevation: 6,
      }}>
        <Text style={{
          fontSize: fontSize,
          fontWeight: '900',
          color: '#ffffff',
          letterSpacing: -0.5,
        }}>LC</Text>
      </View>
      <View style={{ alignItems: horizontal ? 'flex-start' : 'center' }}>
        <Text style={{
          fontSize: titleSize,
          fontWeight: '800',
          color: '#1e0a3c',
          letterSpacing: -0.6,
        }}>Learn Computer</Text>
        {!compact && !horizontal && (
          <Text style={{
            fontSize: 14,
            fontWeight: '500',
            color: '#7c3aed',
            letterSpacing: 0.1,
          }}>Build skills. Track progress. Stay sharp.</Text>
        )}
      </View>
    </View>
  );
}
