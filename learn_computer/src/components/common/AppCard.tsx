import { ReactNode } from 'react';
import { View } from 'react-native';

type AppCardProps = {
  children: ReactNode;
  padding?: number;
};

export function AppCard({ children, padding = 24 }: AppCardProps) {
  return (
    <View style={{
      borderRadius: 24,
      borderWidth: 1,
      borderColor: '#ede9fe',
      backgroundColor: '#ffffff',
      padding,
      shadowColor: '#4c1d95',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
      elevation: 4,
    }}>
      {children}
    </View>
  );
}
