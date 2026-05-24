import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

type TextFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  icon?: keyof typeof Ionicons.glyphMap;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  icon,
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureTextEntry ?? false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={{ gap: 8 }}>
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        color: '#3b0764',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
      }}>
        {label}
      </Text>
      <TouchableOpacity
        activeOpacity={1}
        onPress={() => inputRef.current?.focus()}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 52,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: focused ? '#6d28d9' : '#e5e0f5',
          backgroundColor: focused ? '#ffffff' : '#faf8ff',
          paddingHorizontal: 14,
          gap: 10,
        }}
      >
        {icon ? (
          <Ionicons
            name={icon}
            size={18}
            color={focused ? '#6d28d9' : '#9ca3af'}
          />
        ) : null}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1,
            fontSize: 16,
            color: '#1e0a3c',
            fontWeight: '500',
            height: 52,
          }}
          placeholderTextColor="#b0a8c8"
        />
        {secureTextEntry ? (
          <TouchableOpacity
            onPress={() => setHidden(h => !h)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={focused ? '#6d28d9' : '#9ca3af'}
            />
          </TouchableOpacity>
        ) : null}
      </TouchableOpacity>
    </View>
  );
}
