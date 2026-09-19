import type { PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';

import { Theme } from '@/constants/theme';

export function AppThemeProvider({ children }: PropsWithChildren) {
  const { colorScheme } = useColorScheme();
  const theme = colorScheme === 'dark' ? Theme.dark : Theme.light;

  return <View style={[{ flex: 1 }, theme]}>{children}</View>;
}
