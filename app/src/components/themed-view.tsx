import { View, type ViewProps } from 'react-native';

import { ThemeColor } from '@/constants/theme';

export type ThemedViewProps = ViewProps & {
  className?: string;
  lightColor?: string;
  darkColor?: string;
  type?: ThemeColor;
};

const backgroundClasses: Partial<Record<ThemeColor, string>> = {
  background: 'bg-background1',
  background1: 'bg-background1',
  background2: 'bg-background2',
  background3: 'bg-background3',
  backgroundElement: 'bg-background3',
  backgroundSelected: 'bg-backgroundSelected',
};

export function ThemedView({
  className,
  style,
  type = 'background1',
  ...otherProps
}: ThemedViewProps) {
  const themeClassName = backgroundClasses[type] ?? 'bg-background1';

  return (
    <View
      className={[themeClassName, className].filter(Boolean).join(' ')}
      style={style}
      {...otherProps}
    />
  );
}
