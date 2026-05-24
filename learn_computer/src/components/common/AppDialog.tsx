import { Ionicons } from '@expo/vector-icons';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../lib/constants';

type DialogType = 'error' | 'success' | 'info';

type AppDialogProps = {
  visible: boolean;
  type?: DialogType;
  title: string;
  message: string;
  onClose: () => void;
};

const TYPE_CONFIG: Record<DialogType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  error: { icon: 'alert-circle', color: COLORS.danger, bg: '#FEF2F2' },
  success: { icon: 'checkmark-circle', color: COLORS.success, bg: '#ECFDF5' },
  info: { icon: 'information-circle', color: COLORS.primary, bg: COLORS.primaryLight },
};

export function AppDialog({ visible, type = 'info', title, message, onClose }: AppDialogProps) {
  const config = TYPE_CONFIG[type];

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}>
        <View style={{
          width: '100%',
          maxWidth: 340,
          backgroundColor: COLORS.surface,
          borderRadius: 22,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.2,
          shadowRadius: 32,
          elevation: 16,
        }}>
          {/* Icon + Content */}
          <View style={{ padding: 28, alignItems: 'center', gap: 12 }}>
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: config.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name={config.icon} size={28} color={config.color} />
            </View>

            <Text style={{
              fontSize: 17,
              fontWeight: '800',
              color: COLORS.text,
              textAlign: 'center',
            }}>
              {title}
            </Text>

            <Text style={{
              fontSize: 13,
              color: COLORS.muted,
              textAlign: 'center',
              lineHeight: 19,
              fontWeight: '500',
            }}>
              {message}
            </Text>
          </View>

          {/* Divider + Button */}
          <View style={{
            borderTopWidth: 1,
            borderTopColor: COLORS.border,
            padding: 16,
            alignItems: 'center',
          }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={{
                backgroundColor: config.color,
                borderRadius: 12,
                paddingVertical: 11,
                paddingHorizontal: 32,
                minWidth: 120,
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#fff',
                fontSize: 14,
                fontWeight: '800',
              }}>
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
